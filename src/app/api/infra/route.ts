import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NODE_EXPORTER =
    process.env.NODE_EXPORTER_URL || "http://127.0.0.1:9100/metrics";

const UNAVAILABLE_RESPONSE = {
    error: "node-exporter unreachable",
    cpuUsage: null,
    memoryUsage: null,
    diskUsage: null,
    networkRxBytes: null,
    networkTxBytes: null,
    uptimeSeconds: null,
    loadAvg1m: null,
    hostname: null,
    status: "UNAVAILABLE",
};

async function fetchMetrics(): Promise<string> {
    // Pre-check: try a TCP connect first so we fail fast on ECONNREFUSED
    // instead of waiting for the full AbortSignal timeout.
    const url = new URL(NODE_EXPORTER);
    const port = parseInt(url.port) || (url.protocol === "https:" ? 443 : 80);
    const host = url.hostname;

    await new Promise<void>((resolve, reject) => {
        const net = require("net");
        const socket = new net.Socket();
        socket.setTimeout(800);
        socket.once("connect", () => { socket.destroy(); resolve(); });
        socket.once("timeout", () => { socket.destroy(); reject(new Error("TCP_TIMEOUT")); });
        socket.once("error", (err: Error) => reject(err));
        socket.connect(port, host);
    });

    const res = await fetch(NODE_EXPORTER, {
        cache: "no-store",
        signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
}

export async function GET() {
    try {
        const text = await fetchMetrics();
        const lines = text.split("\n");

        // Helper: get the numeric value of a single-line metric
        const getValue = (metric: string) =>
            parseFloat(
                lines.find((l) => l.startsWith(metric))?.split(" ").pop() || "0"
            );

        // Helper: sum all values that match a metric prefix (across labels)
        const sumValues = (metric: string) =>
            lines
                .filter((l) => l.startsWith(metric) && !l.startsWith("#"))
                .reduce((acc, l) => acc + parseFloat(l.split(" ").pop() || "0"), 0);

        // ── MEMORY ──────────────────────────────────────────────────────────
        const memTotal = getValue("node_memory_MemTotal_bytes");
        const memAvailable = getValue("node_memory_MemAvailable_bytes");
        const memoryUsage = memTotal > 0 ? ((memTotal - memAvailable) / memTotal) * 100 : 0;

        // ── DISK ────────────────────────────────────────────────────────────
        // Use the root filesystem (mountpoint="/") when available
        const diskLine = lines.find(
            (l) =>
                l.startsWith("node_filesystem_size_bytes") &&
                l.includes('mountpoint="/"')
        );
        const diskAvailLine = lines.find(
            (l) =>
                l.startsWith("node_filesystem_avail_bytes") &&
                l.includes('mountpoint="/"')
        );

        const diskSize = diskLine
            ? parseFloat(diskLine.split(" ").pop() || "0")
            : getValue("node_filesystem_size_bytes");
        const diskAvail = diskAvailLine
            ? parseFloat(diskAvailLine.split(" ").pop() || "0")
            : getValue("node_filesystem_avail_bytes");

        const diskUsage = diskSize > 0 ? ((diskSize - diskAvail) / diskSize) * 100 : 0;

        // ── CPU (average since boot) ────────────────────────────────────────
        // Sum all cpu mode seconds, then compute 1 − (idle / total)
        const cpuLines = lines.filter(
            (l) => l.startsWith("node_cpu_seconds_total") && !l.startsWith("#")
        );

        let cpuIdle = 0;
        let cpuTotal = 0;

        for (const line of cpuLines) {
            const val = parseFloat(line.split(" ").pop() || "0");
            cpuTotal += val;
            if (line.includes('mode="idle"')) {
                cpuIdle += val;
            }
        }

        const cpuUsage = cpuTotal > 0 ? (1 - cpuIdle / cpuTotal) * 100 : 0;

        // ── NETWORK I/O ─────────────────────────────────────────────────────
        const networkRxBytes = sumValues("node_network_receive_bytes_total");
        const networkTxBytes = sumValues("node_network_transmit_bytes_total");

        // ── UPTIME ──────────────────────────────────────────────────────────
        const nodeTime = getValue("node_time_seconds");
        const bootTime = getValue("node_boot_time_seconds");
        const uptimeSeconds = nodeTime > 0 && bootTime > 0 ? Math.floor(nodeTime - bootTime) : 0;

        // ── LOAD AVERAGE ────────────────────────────────────────────────────
        const loadAvg1m = getValue("node_load1");

        // ── HOSTNAME ────────────────────────────────────────────────────────
        const unameLine = lines.find((l) => l.startsWith("node_uname_info"));
        const hostnameMatch = unameLine?.match(/nodename="([^"]+)"/);
        const hostname = hostnameMatch ? hostnameMatch[1] : "unknown";

        return NextResponse.json({
            cpuUsage: cpuUsage.toFixed(2),
            memoryUsage: memoryUsage.toFixed(2),
            diskUsage: diskUsage.toFixed(2),
            networkRxBytes,
            networkTxBytes,
            uptimeSeconds,
            loadAvg1m,
            hostname,
            status: "OK",
        });
    } catch (err: any) {
        const isNetworkError =
            err?.name === 'TimeoutError' ||
            err?.name === 'AbortError' ||
            err?.message === 'TCP_TIMEOUT' ||
            err?.code === 'ECONNREFUSED' ||
            err?.cause?.code === 'ECONNREFUSED' ||
            err?.code === 'ENOTFOUND';

        if (isNetworkError) {
            return NextResponse.json(UNAVAILABLE_RESPONSE);
        }

        return NextResponse.json(
            { error: "System metrics failed" },
            { status: 500 }
        );
    }
}
