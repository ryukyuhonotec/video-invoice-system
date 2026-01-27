"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { getUnbilledInvoices, createConsolidatedBill } from "@/actions/billing-actions";
import { Invoice } from "@/types";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

export default function BillingDashboard() {
    const router = useRouter();
    const [unbilledInvoices, setUnbilledInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());

    // Group invoices by Client
    const [clients, setClients] = useState<any[]>([]);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [targetClient, setTargetClient] = useState<any>(null);
    const [billSubject, setBillSubject] = useState("");
    const [billDueDate, setBillDueDate] = useState("");
    const [billNotes, setBillNotes] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const load = async () => {
            const data = await getUnbilledInvoices();
            // Filter to only show invoices that have been actually delivered
            const deliveredInvoices = (data as any[]).filter((inv: any) => {
                // Invoice has actual delivery date
                if (inv.actualDeliveryDate) return true;
                // Or any task is marked as delivered
                return inv.items?.some((item: any) =>
                    item.outsources?.some((task: any) =>
                        task.status === '納品済' || task.status === 'Delivered'
                    )
                );
            });
            setUnbilledInvoices(deliveredInvoices as any);

            // Group by client
            const grouped = new Map();
            deliveredInvoices.forEach((inv: any) => {
                if (!grouped.has(inv.clientId)) {
                    grouped.set(inv.clientId, {
                        id: inv.clientId,
                        name: inv.client?.name || "Unknown",
                        invoices: []
                    });
                }
                grouped.get(inv.clientId).invoices.push(inv);
            });
            setClients(Array.from(grouped.values()));
            setIsLoading(false);
        };
        load();
    }, []);

    const toggleSelection = (id: string) => {
        const next = new Set(selectedInvoiceIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedInvoiceIds(next);
    };

    const handleOpenCreateDialog = (client: any) => {
        // Filter selected IDs belonging to this client
        const idsToBill = Array.from(selectedInvoiceIds).filter(id => {
            const inv = unbilledInvoices.find(i => i.id === id);
            return inv?.clientId === client.id;
        });

        if (idsToBill.length === 0) {
            alert("請求する案件を選択してください。");
            return;
        }

        // Check for mixed client selection (should be prevented by UI but safe to check)
        if (selectedInvoiceIds.size !== idsToBill.length) {
            if (!confirm("注意: 選択中の案件の中に、別のクライアントの案件が含まれています。このクライアント分のみで請求書を作成しますか？")) {
                return;
            }
        }

        // Default Subject
        const now = new Date();
        const defaultSubject = `${now.getFullYear()}年${now.getMonth() + 1}月度 ご請求書`;

        // Default Due Date (e.g., next month end)
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0); // Last day of next month
        const defaultDueDate = nextMonth.toISOString().split('T')[0];

        setTargetClient(client);
        setBillSubject(defaultSubject);
        setBillDueDate(defaultDueDate);
        setIsDialogOpen(true);
    };

    const handleExecuteCreateBill = async () => {
        if (!targetClient) return;

        setIsCreating(true);
        const idsToBill = Array.from(selectedInvoiceIds).filter(id => {
            const inv = unbilledInvoices.find(i => i.id === id);
            return inv?.clientId === targetClient.id;
        });

        const issueDate = new Date().toISOString().split("T")[0];

        try {
            const bill = await createConsolidatedBill(
                targetClient.id,
                idsToBill,
                issueDate,
                billDueDate,
                billSubject, // Pass Subject
                billNotes    // Pass Notes
            );
            alert("ご請求書を作成しました！");
            setIsDialogOpen(false);
            router.push(`/bills/${bill.id}/publish`);
        } catch (e) {
            console.error(e);
            alert("エラーが発生しました: " + e);
        } finally {
            setIsCreating(false);
        }
    };

    // Auto-select LAST month's delivered items
    const handleAutoSelectLastMonth = (clientId: string) => {
        const now = new Date();
        now.setMonth(now.getMonth() - 1); // Go to previous month
        const targetMonth = now.getMonth();
        const targetYear = now.getFullYear();

        const idsToSelect = unbilledInvoices
            .filter(inv => {
                if (inv.clientId !== clientId) return false;

                // Check if any outsource task is delivered in TARGET month
                // OR if invoice itself has actualDeliveryDate in TARGET month

                // 1. Invoice Level Check
                if (inv.actualDeliveryDate) {
                    const d = new Date(inv.actualDeliveryDate);
                    if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) return true;
                }

                // 2. Task Level Check
                const hasDeliveredTaskInMonth = inv.items.some(item =>
                    item.outsources?.some(task => {
                        const isDelivered = task.status === '納品済' || task.status === '請求可能' || task.status === 'Delivered';
                        if (!isDelivered) return false;
                        if (!task.deliveryDate) return false;

                        const d = new Date(task.deliveryDate);
                        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
                    })
                );

                return hasDeliveredTaskInMonth;
            })
            .map(inv => inv.id);

        const next = new Set(selectedInvoiceIds);
        idsToSelect.forEach(id => next.add(id));
        setSelectedInvoiceIds(next);
    };

    if (isLoading) return <div className="p-8 dark:text-zinc-400">読み込み中...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-8 dark:text-zinc-100">月次請求管理 (Consolidated Billing)</h1>

            {clients.length === 0 ? (
                <div className="text-center p-12 bg-zinc-50 rounded-lg text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    請求可能な案件（納品済・未請求）はありません。
                </div>
            ) : (
                <div className="grid gap-8">
                    {clients.map(client => (
                        <Card key={client.id} className="border-l-4 border-l-green-500 dark:bg-zinc-900 dark:border-zinc-700">
                            <CardHeader className="bg-zinc-50 flex flex-row justify-between items-center dark:bg-zinc-800">
                                <div>
                                    <CardTitle className="dark:text-zinc-100">{client.name}</CardTitle>
                                    <p className="text-sm text-zinc-500 mt-1 dark:text-zinc-400">未請求案件: {client.invoices.length}件</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAutoSelectLastMonth(client.id)}
                                        className="text-xs border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30"
                                    >
                                        先月分の納品品目を自動選択
                                    </Button>
                                    <Button
                                        onClick={() => handleOpenCreateDialog(client)}
                                        className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
                                    >
                                        <FileText className="mr-2 h-4 w-4" /> 選択した案件でご請求書作成
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                        <tr>
                                            <th className="p-3 w-10"></th>
                                            <th className="p-3">納品日 (実績)</th>
                                            <th className="p-3">案件名</th>
                                            <th className="p-3 text-right">金額 (税込)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-zinc-700">
                                        {client.invoices.map((inv: any) => {
                                            const isDisabled = selectedInvoiceIds.size > 0 && Array.from(selectedInvoiceIds).some(id => {
                                                const other = unbilledInvoices.find(u => u.id === id);
                                                return other?.clientId !== client.id;
                                            });
                                            return (
                                                <tr
                                                    key={inv.id}
                                                    className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer ${isDisabled ? 'opacity-50' : ''}`}
                                                    onClick={() => !isDisabled && toggleSelection(inv.id)}
                                                >
                                                    <td className="p-3">
                                                        <Checkbox
                                                            checked={selectedInvoiceIds.has(inv.id)}
                                                            onCheckedChange={() => toggleSelection(inv.id)}
                                                            disabled={isDisabled}
                                                        />
                                                    </td>
                                                    <td className="p-3 dark:text-zinc-300">
                                                        {inv.actualDeliveryDate ? new Date(inv.actualDeliveryDate).toLocaleDateString() : '納品済'}
                                                    </td>
                                                    <td className="p-3 font-medium dark:text-zinc-200">{inv.items[0]?.name || "名称未設定"} <span className="text-xs text-zinc-400 dark:text-zinc-500">({inv.items.length}品目)</span></td>
                                                    <td className="p-3 text-right font-mono dark:text-zinc-200">¥{inv.totalAmount.toLocaleString()}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="dark:bg-zinc-900 dark:border-zinc-700">
                    <DialogHeader>
                        <DialogTitle className="dark:text-zinc-100">ご請求書発行の確認</DialogTitle>
                        <DialogDescription className="dark:text-zinc-400">
                            以下の内容でご請求書を作成します。内容を確認・編集してください。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label className="dark:text-zinc-300">クライアント</Label>
                            <div className="font-bold dark:text-zinc-100">{targetClient?.name}</div>
                            <div className="text-sm text-muted-foreground dark:text-zinc-400">
                                選択中の案件: {Array.from(selectedInvoiceIds).filter(id => unbilledInvoices.find(i => i.id === id)?.clientId === targetClient?.id).length}件
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="dark:text-zinc-300">ご請求書件名 (Subject)</Label>
                            <Input
                                value={billSubject}
                                onChange={(e) => setBillSubject(e.target.value)}
                                placeholder="YYYY年MM月度 ご請求書"
                                className="dark:bg-zinc-800 dark:text-zinc-100"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="dark:text-zinc-300">お支払い期限 (Payment Due)</Label>
                            <Input
                                type="date"
                                value={billDueDate}
                                onChange={(e) => setBillDueDate(e.target.value)}
                                className="dark:bg-zinc-800 dark:text-zinc-100"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="dark:text-zinc-300">備考 (Remarks)</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"
                                value={billNotes}
                                onChange={(e) => setBillNotes(e.target.value)}
                                placeholder="請求書に記載する備考があれば入力してください"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="dark:border-zinc-600 dark:text-zinc-300">キャンセル</Button>
                        <Button onClick={handleExecuteCreateBill} disabled={isCreating} className="dark:bg-green-700 dark:hover:bg-green-600">
                            {isCreating ? "作成中..." : "請求書を発行する"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
