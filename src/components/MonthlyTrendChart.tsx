"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface MonthlyTrendChartProps {
    data: {
        month: number // 0-11
        revenue: number
        cost: number
        profit: number
    }[]
    year: number
}

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export default function MonthlyTrendChart({ data, year }: MonthlyTrendChartProps) {
    // Fill in missing months with 0
    const chartData = MONTHS.map((label, index) => {
        const monthData = data.find(d => d.month === index);
        return {
            name: label,
            revenue: monthData?.revenue || 0,
            cost: monthData?.cost || 0,
            profit: monthData?.profit || 0
        };
    });

    return (
        <Card className="dark:bg-zinc-900 dark:border-zinc-800">
            <CardHeader>
                <CardTitle className="dark:text-zinc-100">売上・原価推移 ({year}年)</CardTitle>
                <CardDescription>月ごとの売上、原価、粗利の推移を表示します。</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-zinc-200 dark:stroke-zinc-700" />
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 12 }}
                                className="text-zinc-500 dark:text-zinc-400"
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                                tick={{ fontSize: 12 }}
                                className="text-zinc-500 dark:text-zinc-400"
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: '8px',
                                    border: '1px solid #e4e4e7',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    color: '#000'
                                }}
                                formatter={(value: any, name: any) => {
                                    const label = name === "revenue" ? "売上" : name === "cost" ? "原価" : "粗利";
                                    return [`¥${(value || 0).toLocaleString()}`, label];
                                }}
                            />
                            {/* Revenue Bar */}
                            <Bar dataKey="revenue" stackId="a" fill="#2563eb" radius={[0, 0, 4, 4]} name="売上" />
                            {/* Cost Bar (Stacked on top visually? No, usually Cost is part of Revenue or separate. Let's do unstacked for clarity or stacked if "Expense + Profit = Revenue") 
                                Actually, usually we want to compare Revenue vs Cost. Or Stack Cost + Profit = Revenue.
                                Let's try Cost + Profit = Revenue stack.
                            */}
                            <Bar dataKey="cost" stackId="stack" fill="#f97316" radius={[0, 0, 0, 0]} name="原価" />
                            <Bar dataKey="profit" stackId="stack" fill="#22c55e" radius={[4, 4, 0, 0]} name="粗利" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
