"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getStaff, getClients, getInvoices } from "@/actions/pricing-actions";
import { createStaffInvitation, getStaffInvitations, deleteInvitation } from "@/actions/invitation-actions";
import { Staff, Client, Invoice } from "@/types";
import { ShieldCheck, Calculator, Link2, Copy, Building2, TrendingUp, Clock, Crown, Trash2 } from "lucide-react";

interface StaffListClientProps {
    initialStaffList: Staff[];
    initialClients: Client[];
    initialInvoices: Invoice[];
    initialInvitations: any[];
}

export default function StaffListClient({
    initialStaffList,
    initialClients,
    initialInvoices,
    initialInvitations
}: StaffListClientProps) {
    const [staffList, setStaffList] = useState<Staff[]>(initialStaffList);
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
    const [invitations, setInvitations] = useState<any[]>(initialInvitations);
    const [isLoading, setIsLoading] = useState(false);

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [newInviteRole, setNewInviteRole] = useState<"OPERATIONS" | "ACCOUNTING">("OPERATIONS");
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        // We re-fetch mostly invitations and maybe staff list if someone joined?
        // But for "Create Invite", we mostly need updated invitations.
        // Re-fetching everything ensures consistency.
        const [staffData, clientData, invoiceData, inviteData] = await Promise.all([
            getStaff(),
            getClients(),
            getInvoices(),
            getStaffInvitations()
        ]);
        setStaffList(staffData as any);
        setClients(clientData as any);
        setInvoices(invoiceData as any);
        setInvitations(inviteData as any);
        setIsLoading(false);
    };

    // Calculate stats for each operations staff
    const threeMonthsAgo = useMemo(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 3);
        return date;
    }, []);

    const getStaffStats = (staffId: string) => {
        const assignedClients = clients.filter(c => c.operationsLeadId === staffId);
        const activeClients = assignedClients.filter(client => {
            const clientInvoices = invoices.filter(inv => inv.clientId === client.id && inv.issueDate);
            if (clientInvoices.length === 0) return false;
            const latest = clientInvoices.reduce((max, inv) => {
                const d = new Date(inv.issueDate!);
                return d > max ? d : max;
            }, new Date(0));
            return latest >= threeMonthsAgo;
        });
        const inactiveClients = assignedClients.length - activeClients.length;
        const activeInvoices = invoices.filter(inv => {
            const client = clients.find(c => c.id === inv.clientId);
            if (client?.operationsLeadId !== staffId) return false;
            const status = inv.status as string;
            return status === '進行中' || status === '受注前';
        });
        return {
            totalClients: assignedClients.length,
            activeClients: activeClients.length,
            inactiveClients,
            activeInvoices: activeInvoices.length
        };
    };

    const handleCreateInvite = async () => {
        try {
            const result = await createStaffInvitation({
                staffRole: newInviteRole
            });
            const link = `${window.location.origin}/invite/${result.token}`;
            setGeneratedLink(link);
            await loadData();
        } catch (err: any) {
            console.error("Invite creation failed:", err);
            alert("招待リンクの作成に失敗しました: " + (err.message || "Unknown error"));
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("コピーしました");
    };

    const handleDeleteInvitation = async (id: string) => {
        if (confirm("この招待リンクを削除しますか？")) {
            await deleteInvitation(id);
            await loadData();
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">事業統括・経理管理</h1>
                    <p className="text-zinc-500">スタッフの招待・管理を行います。招待リンクで登録してもらいます。</p>
                </div>
                <Button onClick={() => { setShowInviteModal(true); setGeneratedLink(null); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm dark:bg-blue-600 dark:hover:bg-blue-700">
                    <Link2 className="mr-2 h-4 w-4" /> 招待リンク発行
                </Button>
            </header>

            {/* Invite Modal */}
            {showInviteModal && (
                <Card className="mb-8 border-green-200 bg-green-50/20 dark:bg-green-900/10 dark:border-green-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Link2 className="h-5 w-5 text-green-600" />
                            招待リンク発行
                        </CardTitle>
                        <CardDescription>役割を選択してリンクを発行。登録者が名前とメールアドレスを入力します。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!generatedLink ? (
                            <>
                                <div className="space-y-2 max-w-xs">
                                    <Label>役割</Label>
                                    <Select
                                        value={newInviteRole}
                                        onChange={e => setNewInviteRole(e.target.value as any)}
                                    >
                                        <option value="OPERATIONS">事業統括</option>
                                        <option value="ACCOUNTING">経理</option>
                                    </Select>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" onClick={() => setShowInviteModal(false)}>キャンセル</Button>
                                    <Button onClick={handleCreateInvite} className="bg-green-600 hover:bg-green-700">
                                        リンクを発行
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border">
                                    <Label className="text-xs text-zinc-500">招待リンク</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Input value={generatedLink} readOnly className="font-mono text-sm" />
                                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(generatedLink)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-2">このリンクを登録者に共有してください。有効期限: 7日間</p>
                                </div>
                                <div className="flex justify-end">
                                    <Button variant="ghost" onClick={() => setShowInviteModal(false)}>閉じる</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Pending Invitations */}
            {invitations.filter(i => !i.usedAt && new Date(i.expiresAt) > new Date()).length > 0 && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-base">発行中の招待リンク</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {invitations
                                .filter(i => !i.usedAt && new Date(i.expiresAt) > new Date())
                                .map(inv => (
                                    <div key={inv.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 text-xs rounded ${inv.staffRole === 'OPERATIONS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {inv.staffRole === 'OPERATIONS' ? '事業統括' : '経理'}
                                            </span>
                                            <span className="text-xs text-zinc-500">
                                                期限: {new Date(inv.expiresAt).toLocaleDateString('ja-JP')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`${window.location.origin}/invite/${inv.token}`)}>
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteInvitation(inv.id)}>
                                                <Trash2 className="h-3 w-3 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>登録済みスタッフ一覧</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading && staffList.length === 0 ? (
                        <div className="text-center py-8 dark:text-zinc-400">読み込み中...</div>
                    ) : staffList.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">登録されたスタッフがいません。</div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b dark:border-zinc-700">
                                    <tr className="border-b transition-colors hover:bg-muted/50 dark:border-zinc-700">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400 text-left">役割</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400 text-left">氏名</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400 text-left">メール</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400 text-center">
                                            <span className="flex items-center justify-center gap-1"><Building2 className="h-3 w-3" />クライアント</span>
                                        </th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400 text-center">
                                            <span className="flex items-center justify-center gap-1"><Clock className="h-3 w-3" />掘り起こし</span>
                                        </th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400 text-center">
                                            <span className="flex items-center justify-center gap-1"><TrendingUp className="h-3 w-3" />進行中</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {staffList
                                        .sort((a, b) => {
                                            if (a.role === b.role) return a.name.localeCompare(b.name);
                                            if (a.role === 'OWNER') return -1;
                                            if (b.role === 'OWNER') return 1;
                                            return a.role === 'OPERATIONS' ? -1 : 1;
                                        })
                                        .map((s) => {
                                            const stats = (s.role === 'OPERATIONS' || s.role === 'OWNER') ? getStaffStats(s.id) : null;
                                            return (
                                                <tr
                                                    key={s.id}
                                                    className="border-b transition-colors hover:bg-blue-50 cursor-pointer dark:border-zinc-700 dark:hover:bg-blue-900/30"
                                                    onClick={() => window.location.href = `/staff-dashboard?staffId=${s.id}`}
                                                >
                                                    <td className="p-4 align-middle">
                                                        {s.role === 'OWNER' ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                                                                <Crown className="h-3 w-3" /> オーナー / 事業統括
                                                            </span>
                                                        ) : s.role === 'OPERATIONS' ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                                                <ShieldCheck className="h-3 w-3" /> 事業統括
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                                                                <Calculator className="h-3 w-3" /> 経理
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 align-middle font-medium dark:text-zinc-200">{s.name}</td>
                                                    <td className="p-4 align-middle dark:text-zinc-300">{s.email || "-"}</td>
                                                    <td className="p-4 align-middle text-center">
                                                        {stats ? (
                                                            <span className="font-medium">{stats.totalClients}</span>
                                                        ) : "-"}
                                                    </td>
                                                    <td className="p-4 align-middle text-center">
                                                        {stats ? (
                                                            <span className={`font-medium ${stats.inactiveClients > 0 ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                                                                {stats.inactiveClients}
                                                            </span>
                                                        ) : "-"}
                                                    </td>
                                                    <td className="p-4 align-middle text-center">
                                                        {stats ? (
                                                            <span className={`font-medium ${stats.activeInvoices > 0 ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                                                {stats.activeInvoices}
                                                            </span>
                                                        ) : "-"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
