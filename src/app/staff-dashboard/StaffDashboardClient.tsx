"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { upsertStaff, getStaff, addClientContact, getClientContactHistory, deleteStaff } from "@/actions/pricing-actions";
import { Staff } from "@/types";
import { Users, TrendingUp, Building2, ChevronLeft, ChevronRight, Percent, Phone, Calendar, MessageSquare, PenSquare, ShieldCheck, Calculator, Trash2 } from "lucide-react";
import RevenueChart from "@/components/RevenueChart";

interface ClientStats {
    id: string;
    name: string;
    contactPerson?: string;
    lastInvoiceDate?: string | Date;
    lastContactDate?: string | Date;
}

interface RevenueStats {
    clientId: string;
    clientName: string;
    count: number;
    revenue: number;
    cost: number;
}

interface StaffStats {
    summary: {
        activeClients: number;
        inactiveClients: number;
        activeInvoices: number;
        monthlyRevenue: number;
        monthlyCost: number;
        monthlyProfit: number;
        monthlyMargin: number;
    };
    revenueByClient: RevenueStats[];
    activeClientsList: ClientStats[];
    inactiveClientsList: ClientStats[];
    allTime: {
        revenue: number;
        profit: number;
        invoiceCount: number;
    };
}

interface StaffDashboardClientProps {
    initialStaff: Staff[];
    initialStats: StaffStats | null;
    currentUserRole: string;
    currentYear: number;
    currentMonth: number;
}

export default function StaffDashboardClient({
    initialStaff,
    initialStats,
    currentUserRole,
    currentYear,
    currentMonth
}: StaffDashboardClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const staffIdFromUrl = searchParams.get("staffId");

    const [staff, setStaff] = useState<Staff[]>(initialStaff);
    // Stats are now direct from props
    const stats = initialStats;

    // We still need selectedStaffId logic
    const [selectedStaffId, setSelectedStaffId] = useState<string>("");

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Partial<Staff>>({});
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

    // Sort staff for display: Operations first
    const sortedStaff = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [...staff].sort((a: any, b: any) => {
            if (a.role === b.role) return a.name.localeCompare(b.name);
            return a.role === 'OPERATIONS' ? -1 : 1;
        });
    }, [staff]);

    useEffect(() => {
        // Use URL param if provided, otherwise select current user if possible or first staff
        if (staffIdFromUrl) {
            if (selectedStaffId !== staffIdFromUrl) {
                // eslint-disable-next-line
                setSelectedStaffId(staffIdFromUrl);
            }
        } else {
            if (currentUserRole !== 'OWNER' && sortedStaff.length > 0) {
                // Logic to auto-select?
            } else if (sortedStaff.length > 0 && !selectedStaffId) {
                setSelectedStaffId(sortedStaff[0].id);
            }
        }
    }, [staffIdFromUrl, sortedStaff, currentUserRole, selectedStaffId]);

    // Handle staff update
    const handleSaveStaff = async () => {
        if (!editingStaff.name) return;
        setIsSaving(true);
        try {
            await upsertStaff(editingStaff);
            // Refresh data locally
            const updated = await getStaff();
            setStaff(updated as Staff[]); // Logic will resort via useMemo
            setEditDialogOpen(false);
        } catch (error) {
            console.error("Failed to update staff", error);
            alert("更新に失敗しました");
        }
        setIsSaving(false);
    };

    const handleDeleteStaff = async () => {
        if (!editingStaff.id) return;
        if (!confirm("本当にこのスタッフを削除しますか？")) return;
        setIsSaving(true);
        try {
            await deleteStaff(editingStaff.id);
            setEditDialogOpen(false);
            window.location.reload();
        } catch (error) {
            console.error("Failed to delete staff", error);
            alert("削除に失敗しました（オーナー権限が必要です）");
        }
        setIsSaving(false);
    };

    // Month navigation handlers - Update URL to trigger server fetch
    const goToPreviousMonth = () => {
        let y = currentYear;
        let m = currentMonth - 1;
        if (m < 0) { y -= 1; m = 11; }
        const params = new URLSearchParams();
        params.set("year", y.toString());
        params.set("month", m.toString());
        if (selectedStaffId) params.set("staffId", selectedStaffId);
        router.push(`/staff-dashboard?${params.toString()}`);
    };

    const goToNextMonth = () => {
        let y = currentYear;
        let m = currentMonth + 1;
        if (m > 11) { y += 1; m = 0; }
        const params = new URLSearchParams();
        params.set("year", y.toString());
        params.set("month", m.toString());
        if (selectedStaffId) params.set("staffId", selectedStaffId);
        router.push(`/staff-dashboard?${params.toString()}`);
    };

    const goToThisMonth = () => {
        const now = new Date();
        const params = new URLSearchParams();
        params.set("year", now.getFullYear().toString());
        params.set("month", now.getMonth().toString());
        if (selectedStaffId) params.set("staffId", selectedStaffId);
        router.push(`/staff-dashboard?${params.toString()}`);
    };

    const handleSaveContact = async () => {
        if (!contactClientId || !contactDate) return;
        setIsSubmitting(true);
        try {
            await addClientContact({
                clientId: contactClientId,
                contactDate: new Date(contactDate),
                note: contactNote,
                nextContactDate: nextContactDate ? new Date(nextContactDate) : undefined,
                createTask: createTaskFromContact,
                createdBy: currentUserRole
            });
            setContactDialogOpen(false);
            router.refresh();
        } catch (e) {
            console.error(e);
            alert("保存に失敗しました");
        }
        setIsSubmitting(false);
    };

    const selectedStaff = staff.find(s => s.id === selectedStaffId);
    const isAccounting = selectedStaff?.role === 'ACCOUNTING';

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
                                const params = new URLSearchParams(searchParams.toString());
                                params.set("staffId", e.target.value);
                                router.push(`/staff-dashboard?${params.toString()}`);
                            }}
                            className="w-48 dark:bg-zinc-800 dark:text-zinc-100"
                        >
                            {staff.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.role === 'OPERATIONS' ? '統括: ' : '経理: '}{s.name}
                                </option>
                            ))}
                        </Select>
                        {currentUserRole === 'OWNER' && (
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
                        )}
                    </div>
                </div>

                {!isAccounting && (
                    <div className="flex items-center gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="dark:bg-zinc-800 dark:border-zinc-700">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="font-bold text-lg dark:text-zinc-100 px-4">
                            {currentYear}年{currentMonth + 1}月
                        </span>
                        <Button variant="outline" size="sm" onClick={goToNextMonth} className="dark:bg-zinc-800 dark:border-zinc-700">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToThisMonth}
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
                    ) : !stats ? (
                        <div className="text-center p-12 text-zinc-500">
                            データを読み込み中、またはデータがありません。
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                                <Card className="dark:bg-zinc-900 dark:border-zinc-800 border-green-200 dark:border-green-800/50">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 rounded dark:bg-green-900/30">
                                                <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-zinc-500 dark:text-zinc-400">アクティブ</div>
                                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.summary.activeClients}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="dark:bg-zinc-900 dark:border-zinc-800 border-orange-200 dark:border-orange-800/50">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-100 rounded dark:bg-orange-900/30">
                                                <Building2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-zinc-500 dark:text-zinc-400">掘り起こし</div>
                                                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.summary.inactiveClients}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="dark:bg-zinc-900 dark:border-zinc-800 border-blue-200 dark:border-blue-800/50">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 rounded dark:bg-blue-900/30">
                                                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-zinc-500 dark:text-zinc-400">進行中案件</div>
                                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    {stats.summary.activeInvoices}
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
                                                <div className="text-2xl font-bold dark:text-zinc-100">¥{stats.summary.monthlyRevenue.toLocaleString()}</div>
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
                                                <div className={`text-2xl font-bold ${stats.summary.monthlyProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    ¥{stats.summary.monthlyProfit.toLocaleString()}
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
                                                <div className={`text-2xl font-bold ${stats.summary.monthlyMargin >= 30 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                                    {stats.summary.monthlyMargin.toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="mb-8">
                                <RevenueChart
                                    title={`売上構成 (${currentYear}年${currentMonth + 1}月)`}
                                    showTopN={5}
                                    preCalculatedData={stats.revenueByClient.map((item: RevenueStats) => ({ name: item.clientName, value: item.revenue }))}
                                />
                            </div>

                            <Card className="mb-8 dark:bg-zinc-900 dark:border-zinc-800">
                                <CardHeader className="border-b dark:border-zinc-700">
                                    <CardTitle className="dark:text-zinc-100">クライアント別売上 ({currentYear}年{currentMonth + 1}月)</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {stats.revenueByClient.length === 0 ? (
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
                                                {stats.revenueByClient.map((item: RevenueStats) => {
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
                                                            <td className="p-4 text-right font-bold dark:text-zinc-300">¥{item.revenue.toLocaleString()}</td>
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
                                                    <td className="p-4 text-right font-bold dark:text-zinc-300">{stats.revenueByClient.reduce((acc, item) => acc + item.count, 0)}件</td>
                                                    <td className="p-4 text-right font-mono font-bold dark:text-zinc-200">¥{stats.summary.monthlyRevenue.toLocaleString()}</td>
                                                    <td className="p-4 text-right font-mono text-zinc-500 dark:text-zinc-400">¥{stats.summary.monthlyCost.toLocaleString()}</td>
                                                    <td className={`p-4 text-right font-mono font-bold ${stats.summary.monthlyProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        ¥{stats.summary.monthlyProfit.toLocaleString()}
                                                    </td>
                                                    <td className={`p-4 text-right font-bold ${stats.summary.monthlyMargin >= 30 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                                        {stats.summary.monthlyMargin.toFixed(1)}%
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="mb-8 dark:bg-zinc-900 dark:border-zinc-800">
                                <CardHeader className="border-b dark:border-zinc-700">
                                    <CardTitle className="dark:text-zinc-100">
                                        担当クライアント（アクティブ）
                                        <span className="ml-2 text-sm font-normal text-zinc-500">直近3ヶ月以内に案件あり</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {stats.activeClientsList.length === 0 ? (
                                        <div className="p-8 text-center text-zinc-400 dark:text-zinc-500">
                                            アクティブなクライアントがありません。
                                        </div>
                                    ) : (
                                        <div className="divide-y dark:divide-zinc-700">
                                            {stats.activeClientsList.map((client: ClientStats) => (
                                                <Link key={client.id} href={`/clients/${client.id}`} className="block">
                                                    <div className="p-4 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex justify-between items-center">
                                                        <div>
                                                            <div className="font-medium dark:text-zinc-200">{client.name}</div>
                                                            {client.contactPerson && (
                                                                <div className="text-xs text-zinc-500 dark:text-zinc-400">担当: {client.contactPerson}</div>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                            最終案件: {client.lastInvoiceDate ? new Date(client.lastInvoiceDate).toLocaleDateString() : '不明'}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {stats.inactiveClientsList.length > 0 && (
                                <Card className="dark:bg-zinc-900 dark:border-zinc-800 border-orange-200 dark:border-orange-900/50">
                                    <CardHeader className="border-b dark:border-zinc-700 bg-orange-50 dark:bg-orange-900/20">
                                        <CardTitle className="dark:text-zinc-100 text-orange-700 dark:text-orange-400">
                                            掘り起こしクライアント
                                            <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">3ヶ月以上案件なし・連絡リスト</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y dark:divide-zinc-700">
                                            {stats.inactiveClientsList.map((client: ClientStats) => {
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
                                                                最終案件: {client.lastInvoiceDate ? new Date(client.lastInvoiceDate).toLocaleDateString() : 'なし'}
                                                            </div>
                                                        </div>
                                                        <div className="text-right text-xs">
                                                            <div className="text-zinc-500 dark:text-zinc-400">最終連絡日</div>
                                                            <div className="font-medium dark:text-zinc-300">
                                                                {client.lastContactDate
                                                                    ? new Date(client.lastContactDate).toLocaleDateString()
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
                                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value as Staff['role'] })}
                                >
                                    <option value="OPERATIONS">事業統括</option>
                                    <option value="ACCOUNTING">経理</option>
                                </Select>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                        {currentUserRole === 'OWNER' && (
                            <Button variant="destructive" onClick={handleDeleteStaff} disabled={isSaving}>
                                <Trash2 className="w-4 h-4 mr-1" />
                                削除
                            </Button>
                        )}
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>キャンセル</Button>
                            <Button onClick={handleSaveStaff} disabled={isSaving}>
                                {isSaving ? "保存中..." : "保存"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
                        <div className="mt-6 border-t pt-4 dark:border-zinc-700">
                            <Label className="mb-2 block dark:text-zinc-400">過去の連絡履歴</Label>
                            {contactHistory.length === 0 ? (
                                <p className="text-sm text-zinc-400 dark:text-zinc-500">履歴はありません</p>
                            ) : (
                                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                                    {contactHistory.map((h) => (
                                        <div key={h.id} className="text-sm border-l-2 border-zinc-200 pl-3 dark:border-zinc-700">
                                            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                                                {new Date(h.contactDate).toLocaleDateString()}
                                                {h.nextContactDate && (
                                                    <span className="ml-2 text-orange-500">
                                                        (次回予定: {new Date(h.nextContactDate).toLocaleDateString()})
                                                    </span>
                                                )}
                                            </div>
                                            <div className="whitespace-pre-wrap dark:text-zinc-300">{h.note}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setContactDialogOpen(false)} className="dark:text-zinc-400">
                            キャンセル
                        </Button>
                        <Button
                            onClick={handleSaveContact}
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isSubmitting ? "保存中..." : "保存"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
