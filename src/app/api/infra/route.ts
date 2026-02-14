import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NODE_EXPORTER =
    process.env.NODE_EXPORTER_URL || "http://127.0.0.1:9100/metrics";

export async function GET() {
    try {
        const res = await fetch(NODE_EXPORTER, { cache: "no-store" });

        if (!res.ok) {
            return NextResponse.json(
                { error: "Cannot connect to node-exporter" },
                { status: 500 }
            );
        }

        const text = await res.text();
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
    } catch (err) {
        return NextResponse.json(
            { error: "System metrics failed" },
            { status: 500 }
        );
    }
}
