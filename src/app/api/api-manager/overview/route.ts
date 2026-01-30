import { NextResponse } from 'next/server';
import { store } from '@/server/api-manager/store';

export async function GET() {
    const totalApis = store.apis.length;
    const totalConsumers = store.consumers.length;
    const totalRequests = store.analytics.reduce((acc, curr) => acc + curr.requests, 0);
    const avgLatency = store.analytics.length
        ? Math.round(store.analytics.reduce((acc, curr) => acc + curr.latencyAvg, 0) / store.analytics.length)
        : 0;

    // Mock error rate calculation
    const totalErrors = store.analytics.reduce((acc, curr) => acc + curr.errors_4xx + curr.errors_5xx, 0);
    const errorRate = totalRequests ? ((totalErrors / totalRequests) * 100).toFixed(2) : 0;

    return NextResponse.json({
        totalApis,
        totalConsumers,
        totalRequests,
        avgLatency,
        errorRate: `${errorRate}%`,
        uptime: '99.99%',
        topApis: store.apis.slice(0, 5),
        recentLogs: store.logs.slice(0, 5),
        analyticsSeries: store.analytics
    });
}
