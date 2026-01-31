"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { upsertStaff, getStaff, getClients, getInvoices, addClientContact, getClientContactHistory } from "@/actions/pricing-actions";
import { Staff, Client, Invoice } from "@/types";
import { Users, TrendingUp, Building2, ChevronLeft, ChevronRight, Percent, Phone, Calendar, MessageSquare, PenSquare, ShieldCheck, Calculator } from "lucide-react";
import { useRouter } from "next/navigation";
import RevenueChart from "@/components/RevenueChart";

export default function StaffDashboardPage() {
    return (
        <Suspense fallback={<div className="container mx-auto p-8 dark:text-zinc-400">読み込み中...</div>}>
            <StaffDashboardContent />
        </Suspense>
    );
}

function StaffDashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const staffIdFromUrl = searchParams.get("staffId");

    const [staff, setStaff] = useState<Staff[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    // Contact dialog state
    const [contactDialogOpen, setContactDialogOpen] = useState(false);
    const [contactClientId, setContactClientId] = useState<string>("");
    const [contactClientName, setContactClientName] = useState<string>("");
    const [contactDate, setContactDate] = useState(new Date().toISOString().split("T")[0]);
    const [contactNote, setContactNote] = useState("");
    const [nextContactDate, setNextContactDate] = useState("");
    const [createTaskFromContact, setCreateTaskFromContact] = useState(false);
    const [contactHistory, setContactHistory] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Month navigation
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

    useEffect(() => {
        const loadData = async () => {
            const [staffData, clientsData, invoicesData] = await Promise.all([
                getStaff(),
                getClients(),
                getInvoices()
            ]);
            setStaff(staffData as any);
            setClients(clientsData as any);
            setInvoices(invoicesData as any);

            // Sort staff for display: Operations first
            const sortedStaff = (staffData as any).sort((a: any, b: any) => {
                if (a.role === b.role) return a.name.localeCompare(b.name);
                return a.role === 'OPERATIONS' ? -1 : 1;
            });
            setStaff(sortedStaff);

            // Use URL param if provided, otherwise auto-select first staff
            if (staffIdFromUrl) {
                setSelectedStaffId(staffIdFromUrl);
            } else {
                if (sortedStaff.length > 0) {
                    setSelectedStaffId(sortedStaff[0].id);
                }
            }
            setIsLoading(false);
        };
        loadData();
    }, [staffIdFromUrl]);

    // Handle staff update
    const handleSaveStaff = async () => {
        if (!editingStaff.name) return;
        setIsSaving(true);
        try {
            await upsertStaff(editingStaff);

            // Refresh data locally
            const updated = await getStaff();
            const sortedStaff = (updated as any).sort((a: any, b: any) => {
                if (a.role === b.role) return a.name.localeCompare(b.name);
                return a.role === 'OPERATIONS' ? -1 : 1;
            });
            setStaff(sortedStaff);
            setEditDialogOpen(false);

            // If the edited staff is the currently selected one, force re-render/update
            if (editingStaff.id === selectedStaffId) {
                // The state update of 'staff' will trigger re-renders where necessary
            }
        } catch (error) {
            console.error("Failed to update staff", error);
            alert("更新に失敗しました");
        }
        setIsSaving(false);
    };

    // Month navigation handlers
    const goToPreviousMonth = () => {
        if (selectedMonth === 0) {
            setSelectedYear(y => y - 1);
            setSelectedMonth(11);
        } else {
            setSelectedMonth(m => m - 1);
        }
    };

    const goToNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedYear(y => y + 1);
            setSelectedMonth(0);
        } else {
            setSelectedMonth(m => m + 1);
        }
    };

    const selectedStaff = staff.find(s => s.id === selectedStaffId);
    const isAccounting = selectedStaff?.role === 'ACCOUNTING';

    // Get clients assigned to selected staff (only for Ops logic)
    const assignedClients = useMemo(() => {
        if (!selectedStaffId || isAccounting) return [];
        return clients.filter(c => c.operationsLeadId === selectedStaffId);
    }, [clients, selectedStaffId]);

    // Check if client has activity in the last 3 months (invoices with issueDate)
    const threeMonthsAgo = useMemo(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 3);
        return date;
    }, []);

    const getLastActivityDate = (clientId: string) => {
        const clientInvoices = invoices.filter(inv => inv.clientId === clientId && inv.issueDate);
        if (clientInvoices.length === 0) return null;
        return clientInvoices.reduce((latest, inv) => {
            const invDate = new Date(inv.issueDate!);
            return invDate > latest ? invDate : latest;
        }, new Date(0));
    };

    // Separate active and inactive (needs reengagement) clients
    const { activeClients, inactiveClients } = useMemo(() => {
        const active: Client[] = [];
        const inactive: Client[] = [];
        assignedClients.forEach(client => {
            const lastActivity = getLastActivityDate(client.id);
            if (lastActivity && lastActivity >= threeMonthsAgo) {
                active.push(client);
            } else {
                inactive.push(client);
            }
        });
        return { activeClients: active, inactiveClients: inactive };
    }, [assignedClients, invoices, threeMonthsAgo]);

    // Filter invoices for selected month
    const monthlyInvoices = useMemo(() => {
        if (isAccounting) return [];
        return invoices.filter(inv => {
            if (!inv.issueDate) return false;
            const d = new Date(inv.issueDate);
            // Filter by selected staff's assigned clients
            const client = clients.find(c => c.id === inv.clientId);
            if (client?.operationsLeadId !== selectedStaffId) return false;

            return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
        });
    }, [invoices, selectedYear, selectedMonth, selectedStaffId, clients, isAccounting]);

    // Calculate totals including costs (sum from items outsources)
    const totals = useMemo(() => {
        let totalRevenue = 0;
        let totalCost = 0;

        monthlyInvoices.forEach(inv => {
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
    }, [monthlyInvoices]);

    // Calculate by client with costs
    const revenueByClient = useMemo(() => {
        const byClient: { [key: string]: { clientId: string; clientName: string; revenue: number; cost: number; count: number } } = {};
        monthlyInvoices.forEach(inv => {
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
    }, [monthlyInvoices, clients]);

    // All-time totals for this staff
    const allTimeTotals = useMemo(() => {
        if (!selectedStaffId) return { revenue: 0, cost: 0, profit: 0, invoiceCount: 0 };
        const clientIds = assignedClients.map(c => c.id);
        let revenue = 0;
        let cost = 0;
        let invoiceCount = 0;

        invoices.filter(inv => clientIds.includes(inv.clientId || "")).forEach(inv => {
            revenue += inv.totalAmount || 0;
            invoiceCount++;
            inv.items?.forEach((item: any) => {
                (item.outsources || []).forEach((task: any) => {
                    cost += task.amount || 0;
                });
            });
        });

        return { revenue, cost, profit: revenue - cost, invoiceCount };
    }, [invoices, assignedClients, selectedStaffId]);

    if (isLoading) {
        return <div className="container mx-auto p-8 dark:text-zinc-400">読み込み中...</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight dark:text-zinc-100 flex items-center gap-2">
                            {selectedStaff ? (
                                selectedStaff.role === 'OPERATIONS' ? (
                                    <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                ) : (
                                    <Calculator className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                )
                            ) : null}
                            {selectedStaff?.name || "ダッシュボード"}
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                            {isAccounting ? "経理・管理業務担当" : "担当クライアントの売上・利益状況を確認できます。"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select
                            value={selectedStaffId}
                            onChange={e => {
                                setSelectedStaffId(e.target.value);
                                router.push(`/staff-dashboard?staffId=${e.target.value}`);
                            }}
                            className="w-48 dark:bg-zinc-800 dark:text-zinc-100"
                        >
                            {staff.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.role === 'OPERATIONS' ? '統括: ' : '経理: '}{s.name}
                                </option>
                            ))}
                        </Select>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setEditingStaff(selectedStaff || {});
                                setEditDialogOpen(true);
                            }}
                            className="dark:bg-zinc-800 dark:border-zinc-700"
                        >
                            <PenSquare className="w-4 h-4 mr-2" />
                            情報編集
                        </Button>
                    </div>
                </div>

                {/* Month Navigation - Hide for Accounting */}
                {!isAccounting && (
                    <div className="flex items-center gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="dark:bg-zinc-800 dark:border-zinc-700">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="font-bold text-lg dark:text-zinc-100 px-4">
                            {selectedYear}年{selectedMonth + 1}月
                        </span>
                        <Button variant="outline" size="sm" onClick={goToNextMonth} className="dark:bg-zinc-800 dark:border-zinc-700">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedYear(now.getFullYear()); setSelectedMonth(now.getMonth()); }}
                            className="text-xs dark:text-zinc-400"
                        >
                            今月に戻る
                        </Button>
                    </div>
                )}
            </header>

            {isAccounting ? (
                <Card className="mb-8 dark:bg-zinc-900 dark:border-zinc-800">
                    <CardHeader>
                        <CardTitle className="dark:text-zinc-100">担当業務</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-zinc-500 dark:text-zinc-400">
                            経理担当者としての業務を行います。現在このダッシュボードには特定のメトリクスは表示されません。
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {!selectedStaffId ? (
                        <div className="text-center p-12 bg-zinc-50 rounded-lg text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            事業統括を選択してください。
                        </div>
                    ) : (
                        <>
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                                {/* Active Clients */}
                                <Card className="dark:bg-zinc-900 dark:border-zinc-800 border-green-200 dark:border-green-800/50">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 rounded dark:bg-green-900/30">
                                                <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-zinc-500 dark:text-zinc-400">アクティブ</div>
                                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeClients.length}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Inactive Clients */}
                                <Card className="dark:bg-zinc-900 dark:border-zinc-800 border-orange-200 dark:border-orange-800/50">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-100 rounded dark:bg-orange-900/30">
                                                <Building2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-zinc-500 dark:text-zinc-400">掘り起こし</div>
                                                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{inactiveClients.length}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* In-Progress Tasks - count invoices with status not 納品済/失注 */}
                                <Card className="dark:bg-zinc-900 dark:border-zinc-800 border-blue-200 dark:border-blue-800/50">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 rounded dark:bg-blue-900/30">
                                                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-zinc-500 dark:text-zinc-400">進行中案件</div>
                                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    {invoices.filter(inv => {
                                                        const client = clients.find(c => c.id === inv.clientId);
                                                        if (client?.operationsLeadId !== selectedStaffId) return false;
                                                        const status = inv.status as string;
                                                        return status === '進行中' || status === '受注前';
                                                    }).length}
                                                </div>
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

                            {/* All-time Stats */}
                            <Card className="mb-8 dark:bg-zinc-900 dark:border-zinc-800">
                                <CardHeader className="py-3 border-b dark:border-zinc-700">
                                    <CardTitle className="text-sm font-normal text-zinc-500 dark:text-zinc-400">累計実績</CardTitle>
                                </CardHeader>
                                <CardContent className="py-3">
                                    <div className="flex flex-wrap gap-6 text-sm">
                                        <div>
                                            <span className="text-zinc-500 dark:text-zinc-400">累計売上: </span>
                                            <span className="font-bold dark:text-zinc-100">¥{allTimeTotals.revenue.toLocaleString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-500 dark:text-zinc-400">累計粗利: </span>
                                            <span className={`font-bold ${allTimeTotals.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                ¥{allTimeTotals.profit.toLocaleString()}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-500 dark:text-zinc-400">案件数: </span>
                                            <span className="font-bold dark:text-zinc-100">{allTimeTotals.invoiceCount}件</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Revenue Pie Chart */}
                            <div className="mb-8">
                                <RevenueChart
                                    invoices={invoices.filter(inv => {
                                        const client = clients.find(c => c.id === inv.clientId);
                                        if (client?.operationsLeadId !== selectedStaffId) return false;
                                        if (!inv.issueDate) return false;
                                        const date = new Date(inv.issueDate);
                                        return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
                                    })}
                                    clients={clients}
                                    title={`売上構成 (${selectedYear}年${selectedMonth + 1}月)`}
                                    showTopN={5}
                                />
                            </div>

                            {/* Revenue by Client */}
                            <Card className="mb-8 dark:bg-zinc-900 dark:border-zinc-800">
                                <CardHeader className="border-b dark:border-zinc-700">
                                    <CardTitle className="dark:text-zinc-100">クライアント別売上 ({selectedYear}年{selectedMonth + 1}月)</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {revenueByClient.length === 0 ? (
                                        <div className="p-8 text-center text-zinc-400 dark:text-zinc-500">
                                            当月の売上データはありません。
                                        </div>
                                    ) : (
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
                                                            <td className="p-4">
                                                                <Link href={`/clients/${item.clientId}`} className="font-medium hover:underline dark:text-zinc-200">
                                                                    {item.clientName}
                                                                </Link>
                                                            </td>
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
                                                    <td className="p-4 text-right font-bold dark:text-zinc-300">{monthlyInvoices.length}件</td>
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
                                    )}
                                </CardContent>
                            </Card>

                            {/* Active Clients List */}
                            <Card className="mb-8 dark:bg-zinc-900 dark:border-zinc-800">
                                <CardHeader className="border-b dark:border-zinc-700">
                                    <CardTitle className="dark:text-zinc-100">
                                        担当クライアント（アクティブ）
                                        <span className="ml-2 text-sm font-normal text-zinc-500">直近3ヶ月以内に案件あり</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {activeClients.length === 0 ? (
                                        <div className="p-8 text-center text-zinc-400 dark:text-zinc-500">
                                            アクティブなクライアントがありません。
                                        </div>
                                    ) : (
                                        <div className="divide-y dark:divide-zinc-700">
                                            {activeClients.map(client => (
                                                <Link key={client.id} href={`/clients/${client.id}`} className="block">
                                                    <div className="p-4 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex justify-between items-center">
                                                        <div>
                                                            <div className="font-medium dark:text-zinc-200">{client.name}</div>
                                                            {client.contactPerson && (
                                                                <div className="text-xs text-zinc-500 dark:text-zinc-400">担当: {client.contactPerson}</div>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                            最終案件: {getLastActivityDate(client.id)?.toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Inactive Clients (Reengagement) List */}
                            {inactiveClients.length > 0 && (
                                <Card className="dark:bg-zinc-900 dark:border-zinc-800 border-orange-200 dark:border-orange-900/50">
                                    <CardHeader className="border-b dark:border-zinc-700 bg-orange-50 dark:bg-orange-900/20">
                                        <CardTitle className="dark:text-zinc-100 text-orange-700 dark:text-orange-400">
                                            掘り起こしクライアント
                                            <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">3ヶ月以上案件なし・連絡リスト</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y dark:divide-zinc-700">
                                            {inactiveClients.map(client => {
                                                const lastActivity = getLastActivityDate(client.id);
                                                return (
                                                    <div
                                                        key={client.id}
                                                        className="p-4 flex justify-between items-center gap-4 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors cursor-pointer"
                                                        onClick={() => window.location.href = `/clients/${client.id}`}
                                                    >
                                                        <div className="flex-1">
                                                            <div className="font-medium dark:text-zinc-200">{client.name}</div>
                                                            {client.contactPerson && (
                                                                <div className="text-xs text-zinc-500 dark:text-zinc-400">担当: {client.contactPerson}</div>
                                                            )}
                                                            <div className="text-xs text-orange-600 dark:text-orange-400">
                                                                最終案件: {lastActivity ? lastActivity.toLocaleDateString() : 'なし'}
                                                            </div>
                                                        </div>
                                                        <div className="text-right text-xs">
                                                            <div className="text-zinc-500 dark:text-zinc-400">最終連絡日</div>
                                                            <div className="font-medium dark:text-zinc-300">
                                                                {(client as any).lastContactDate
                                                                    ? new Date((client as any).lastContactDate).toLocaleDateString()
                                                                    : '-'}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-xs border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/30"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setContactClientId(client.id);
                                                                setContactClientName(client.name);
                                                                setContactDate(new Date().toISOString().split("T")[0]);
                                                                setContactNote("");
                                                                setNextContactDate("");
                                                                setCreateTaskFromContact(false);
                                                                getClientContactHistory(client.id).then(setContactHistory);
                                                                setContactDialogOpen(true);
                                                            }}
                                                        >
                                                            <Phone className="mr-1 h-3 w-3" />
                                                            連絡を記録
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )
                    }
                </>
            )}

            {/* Edit Staff Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>スタッフ情報編集</DialogTitle>
                        <DialogDescription>
                            スタッフ情報を更新します。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">氏名</Label>
                            <Input
                                id="name"
                                value={editingStaff.name || ''}
                                onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">メールアドレス</Label>
                            <Input
                                id="email"
                                value={editingStaff.email || ''}
                                readOnly
                                className="bg-zinc-100 text-zinc-500 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">役割</Label>
                            {editingStaff.role === 'OWNER' ? (
                                <div className="flex items-center h-10 px-3 rounded-md border border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
                                    <span className="text-sm">オーナー / 事業統括</span>
                                </div>
                            ) : (
                                <Select
                                    value={editingStaff.role || 'OPERATIONS'}
                                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                                >
                                    <option value="OPERATIONS">事業統括</option>
                                    <option value="ACCOUNTING">経理</option>
                                </Select>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>キャンセル</Button>
                        <Button onClick={handleSaveStaff} disabled={isSaving}>
                            {isSaving ? "保存中..." : "保存"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Contact Dialog */}
            <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                <DialogContent className="dark:bg-zinc-900 dark:border-zinc-700 max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="dark:text-zinc-100 flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            {contactClientName} への連絡を記録
                        </DialogTitle>
                        <DialogDescription className="dark:text-zinc-400">
                            連絡した日付やメモを記録できます。次回連絡予定を設定するとタスクとして進行管理に追加できます。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label className="dark:text-zinc-300 flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                連絡日
                            </Label>
                            <Input
                                type="date"
                                value={contactDate}
                                onChange={(e) => setContactDate(e.target.value)}
                                className="dark:bg-zinc-800 dark:text-zinc-100"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="dark:text-zinc-300 flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                連絡内容・メモ
                            </Label>
                            <textarea
                                value={contactNote}
                                onChange={(e) => setContactNote(e.target.value)}
                                placeholder="話した内容や次のアクションなど..."
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"
                            />
                        </div>
                        <div className="border-t pt-4 dark:border-zinc-700">
                            <div className="space-y-2">
                                <Label className="dark:text-zinc-300">次回連絡予定（任意）</Label>
                                <Input
                                    type="date"
                                    value={nextContactDate}
                                    onChange={(e) => setNextContactDate(e.target.value)}
                                    className="dark:bg-zinc-800 dark:text-zinc-100"
                                />
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                                <input
                                    type="checkbox"
                                    id="createTask"
                                    checked={createTaskFromContact}
                                    onChange={(e) => setCreateTaskFromContact(e.target.checked)}
                                    disabled={!nextContactDate}
                                    className="rounded"
                                />
                                <Label htmlFor="createTask" className="text-sm dark:text-zinc-400">
                                    進行管理にタスクを追加する
                                </Label>
                            </div>
                            {!nextContactDate && createTaskFromContact === false && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                                    ※次回連絡予定を設定するとタスク追加オプションが有効になります
                                </p>
                            )}
                        </div>

                        {/* Contact History */}
                        {contactHistory.length > 0 && (
                            <div className="border-t pt-4 dark:border-zinc-700">
                                <Label className="dark:text-zinc-300 text-sm mb-2 block">過去の連絡履歴</Label>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {contactHistory.map((h, idx) => (
                                        <div key={idx} className="text-xs bg-zinc-100 dark:bg-zinc-800 p-2 rounded">
                                            <div className="font-medium dark:text-zinc-300">
                                                {new Date(h.contactDate).toLocaleDateString()}
                                            </div>
                                            {h.note && <div className="text-zinc-600 dark:text-zinc-400">{h.note}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setContactDialogOpen(false)}>
                            キャンセル
                        </Button>
                        <Button
                            onClick={async () => {
                                setIsSubmitting(true);
                                await addClientContact({
                                    clientId: contactClientId,
                                    contactDate: new Date(contactDate),
                                    note: contactNote || undefined,
                                    nextContactDate: nextContactDate ? new Date(nextContactDate) : undefined,
                                    createTask: createTaskFromContact,
                                    createdBy: selectedStaffId || undefined,
                                });
                                setIsSubmitting(false);
                                setContactDialogOpen(false);
                                window.location.reload();
                            }}
                            disabled={isSubmitting}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {isSubmitting ? "記録中..." : "連絡を記録"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
