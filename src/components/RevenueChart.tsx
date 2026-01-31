"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice, Client } from "@/types";

interface RevenueChartProps {
    invoices: Invoice[];
    clients: Client[];
    title?: string;
    showTopN?: number;
}

const COLORS = [
    '#3b82f6', // blue
    '#22c55e', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1', // indigo
];

export default function RevenueChart({ invoices, clients, title = "売上構成", showTopN = 5 }: RevenueChartProps) {
    const chartData = useMemo(() => {
        // Calculate revenue by client
        const revenueByClient: Record<string, { name: string; value: number }> = {};

        invoices.forEach(inv => {
            if (!inv.clientId) return;
            const client = clients.find(c => c.id === inv.clientId);
            if (!client) return;

            const invoiceTotal = inv.totalAmount || 0;

            if (!revenueByClient[inv.clientId]) {
                revenueByClient[inv.clientId] = { name: client.name, value: 0 };
            }
            revenueByClient[inv.clientId].value += invoiceTotal;
        });

        // Sort by value and take top N
        const sorted = Object.values(revenueByClient)
            .filter(d => d.value > 0)
            .sort((a, b) => b.value - a.value);

        if (sorted.length <= showTopN) {
            return sorted;
        }

        // Take top N and combine rest into "その他"
        const topN = sorted.slice(0, showTopN);
        const otherTotal = sorted.slice(showTopN).reduce((sum, d) => sum + d.value, 0);

        if (otherTotal > 0) {
            topN.push({ name: 'その他', value: otherTotal });
        }

        return topN;
    }, [invoices, clients, showTopN]);

    const totalRevenue = chartData.reduce((sum, d) => sum + d.value, 0);

    if (chartData.length === 0) {
        return (
            <Card className="dark:bg-zinc-900 dark:border-zinc-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] flex items-center justify-center text-zinc-500">
                        データがありません
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="dark:bg-zinc-900 dark:border-zinc-800">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{title}</CardTitle>
                <div className="text-2xl font-bold dark:text-zinc-100">
                    ¥{totalRevenue.toLocaleString()}
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                labelLine={false}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => `¥${Number(value || 0).toLocaleString()}`}
                                contentStyle={{
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {/* Top clients list */}
                <div className="mt-4 space-y-2">
                    {chartData.slice(0, showTopN).map((client, i) => (
                        <div key={client.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                />
                                <span className="dark:text-zinc-300">{client.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-medium dark:text-zinc-100">
                                    ¥{client.value.toLocaleString()}
                                </span>
                                <span className="text-xs text-zinc-500">
                                    ({totalRevenue > 0 ? ((client.value / totalRevenue) * 100).toFixed(0) : 0}%)
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
