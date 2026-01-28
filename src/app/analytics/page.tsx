"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getClients, getInvoices } from "@/actions/pricing-actions";
import { TrendingUp, ChevronLeft, ChevronRight, Percent, Filter } from "lucide-react";
import { Select } from "@/components/ui/select";
import RevenueChart from "@/components/RevenueChart";
import MonthlyTrendChart from "@/components/MonthlyTrendChart";
import { Invoice, Client } from "@/types";

export default function AnalyticsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    // Month navigation
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [topN, setTopN] = useState("5");

    useEffect(() => {
        const load = async () => {
            const [invoiceData, clientData] = await Promise.all([
                getInvoices(),
                getClients()
            ]);
            setInvoices(invoiceData as any);
            setClients(clientData as any);
            setIsLoading(false);
        };
        load();
    }, []);

    const goToPreviousMonth = () => {
        if (selectedMonth === 0) {
            setSelectedYear(selectedYear - 1);
            setSelectedMonth(11);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedYear(selectedYear + 1);
            setSelectedMonth(0);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            if (!inv.issueDate) return false;
            const date = new Date(inv.issueDate);
            return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
        });
    }, [invoices, selectedYear, selectedMonth]);

    // Calculate totals including costs
    const totals = useMemo(() => {
        let totalRevenue = 0;
        let totalCost = 0;

        filteredInvoices.forEach(inv => {
            totalRevenue += inv.totalAmount || 0;
            // Calculate cost from outsources
            inv.items?.forEach((item: any) => {
                (item.outsources || []).forEach((task: any) => {
                    totalCost += task.amount || 0;
                });
            });
        });

        const profit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

        return { totalRevenue, totalCost, profit, profitMargin };
    }, [filteredInvoices]);

    // Calculate by client with costs
    const revenueByClient = useMemo(() => {
        const byClient: { [key: string]: { clientId: string; clientName: string; revenue: number; cost: number; count: number } } = {};

        filteredInvoices.forEach(inv => {
            const client = clients.find(c => c.id === inv.clientId);
            if (!client) return;

            if (!byClient[client.id]) {
                byClient[client.id] = { clientId: client.id, clientName: client.name, revenue: 0, cost: 0, count: 0 };
            }
            byClient[client.id].revenue += inv.totalAmount || 0;
            byClient[client.id].count += 1;
            // Add costs
            inv.items?.forEach((item: any) => {
                (item.outsources || []).forEach((task: any) => {
                    byClient[client.id].cost += task.amount || 0;
                });
            });
        });
        return Object.values(byClient).sort((a, b) => b.revenue - a.revenue);
    }, [filteredInvoices, clients]);

    // Calculate Monthly Trend for the selected year
    const monthlyTrend = useMemo(() => {
        const trend = Array.from({ length: 12 }, (_, i) => ({ month: i, revenue: 0, cost: 0, profit: 0 }));

        invoices.forEach(inv => {
            if (!inv.issueDate) return;
            const date = new Date(inv.issueDate);
            if (date.getFullYear() !== selectedYear) return;

            const month = date.getMonth();
            const revenue = inv.totalAmount || 0;
            let cost = 0;
            inv.items?.forEach((item: any) => {
                (item.outsources || []).forEach((task: any) => {
                    cost += task.amount || 0;
                });
            });

            trend[month].revenue += revenue;
            trend[month].cost += cost;
            trend[month].profit += (revenue - cost);
        });

        return trend;
    }, [invoices, selectedYear]);

    if (isLoading) return <div className="p-8">読み込み中...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-[1600px]">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">売上分析</h1>
                    <p className="text-zinc-500 mt-1">会社全体の売上状況・利益率を確認できます。</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-bold text-lg px-4">
                        {selectedYear}年{selectedMonth + 1}月
                    </span>
                    <Button variant="outline" size="sm" onClick={goToNextMonth}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedYear(now.getFullYear()); setSelectedMonth(now.getMonth()); }}
                        className="text-xs"
                    >
                        今月
                    </Button>
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-end mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <Filter className="w-3 h-3" /> 表示件数:
                    </span>
                    <select
                        value={topN}
                        onChange={(e) => setTopN(e.target.value)}
                        className="w-[100px] h-8 text-xs bg-white dark:bg-zinc-800 dark:border-zinc-700"
                    >
                        <option value="5">TOP 5</option>
                        <option value="10">TOP 10</option>
                        <option value="20">TOP 20</option>
                        <option value="100">全て表示</option>
                    </select>
                </div>
            </div >

            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="dark:bg-zinc-900 dark:border-zinc-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-100 rounded dark:bg-zinc-800">
                                    <TrendingUp className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                </div>
                                <div>
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">当月売上</div>
                                    <div className="text-2xl font-bold dark:text-zinc-100">¥{totals.totalRevenue.toLocaleString()}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="dark:bg-zinc-900 dark:border-zinc-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-100 rounded dark:bg-zinc-800">
                                    <TrendingUp className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                </div>
                                <div>
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">当月粗利</div>
                                    <div className={`text-2xl font-bold ${totals.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        ¥{totals.profit.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="dark:bg-zinc-900 dark:border-zinc-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-100 rounded dark:bg-zinc-800">
                                    <Percent className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                </div>
                                <div>
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">利益率</div>
                                    <div className={`text-2xl font-bold ${totals.profitMargin >= 30 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                        {totals.profitMargin.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RevenueChart
                        invoices={filteredInvoices as any}
                        clients={clients as any}
                        title={`${selectedYear}年${selectedMonth + 1}月 売上構成（上位${topN}社）`}
                        showTopN={parseInt(topN)}
                    />
                    <MonthlyTrendChart data={monthlyTrend} year={selectedYear} />
                </div>

                {/* Detailed Client Table */}
                <Card className="dark:bg-zinc-900 dark:border-zinc-800">
                    <CardHeader className="bg-zinc-50 dark:bg-zinc-800 border-b dark:border-zinc-700 py-3">
                        <CardTitle className="text-base font-medium dark:text-zinc-100">クライアント別詳細 ({selectedYear}年{selectedMonth + 1}月)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {revenueByClient.length === 0 ? (
                            <div className="p-8 text-center text-zinc-400 dark:text-zinc-500">
                                当月の売上データはありません。
                            </div>
                        ) : (
                            <div className="relative w-full overflow-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-zinc-50 dark:bg-zinc-800">
                                        <tr className="border-b dark:border-zinc-700">
                                            <th className="p-4 text-left font-medium text-zinc-600 dark:text-zinc-400">クライアント</th>
                                            <th className="p-4 text-right font-medium text-zinc-600 dark:text-zinc-400">案件数</th>
                                            <th className="p-4 text-right font-medium text-zinc-600 dark:text-zinc-400">売上</th>
                                            <th className="p-4 text-right font-medium text-zinc-600 dark:text-zinc-400">原価</th>
                                            <th className="p-4 text-right font-medium text-zinc-600 dark:text-zinc-400">粗利</th>
                                            <th className="p-4 text-right font-medium text-zinc-600 dark:text-zinc-400">利益率</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-zinc-700">
                                        {revenueByClient.map((item) => {
                                            const profit = item.revenue - item.cost;
                                            const margin = item.revenue > 0 ? (profit / item.revenue) * 100 : 0;
                                            return (
                                                <tr key={item.clientId} className="hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                                                    <td className="p-4 font-medium dark:text-zinc-200">{item.clientName}</td>
                                                    <td className="p-4 text-right dark:text-zinc-300">{item.count}件</td>
                                                    <td className="p-4 text-right font-mono dark:text-zinc-200">¥{item.revenue.toLocaleString()}</td>
                                                    <td className="p-4 text-right font-mono text-zinc-500 dark:text-zinc-400">¥{item.cost.toLocaleString()}</td>
                                                    <td className={`p-4 text-right font-mono font-bold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        ¥{profit.toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <span className={`text-sm ${margin >= 30 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                                            {margin.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-zinc-100 dark:bg-zinc-800">
                                        <tr>
                                            <td className="p-4 font-bold dark:text-zinc-200">合計</td>
                                            <td className="p-4 text-right font-bold dark:text-zinc-300">{filteredInvoices.length}件</td>
                                            <td className="p-4 text-right font-mono font-bold dark:text-zinc-200">¥{totals.totalRevenue.toLocaleString()}</td>
                                            <td className="p-4 text-right font-mono text-zinc-500 dark:text-zinc-400">¥{totals.totalCost.toLocaleString()}</td>
                                            <td className={`p-4 text-right font-mono font-bold ${totals.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                ¥{totals.profit.toLocaleString()}
                                            </td>
                                            <td className={`p-4 text-right font-bold ${totals.profitMargin >= 30 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                                {totals.profitMargin.toFixed(1)}%
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
