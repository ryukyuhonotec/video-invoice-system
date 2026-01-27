"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBills, updateBillStatus } from "@/actions/billing-actions";
import { FileText, CheckCircle, ExternalLink } from "lucide-react";

export default function BillsPage() {
    const [bills, setBills] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterClient, setFilterClient] = useState("");
    const [filterMonth, setFilterMonth] = useState(""); // YYYY-MM

    const loadBills = async () => {
        try {
            const data = await getBills();
            setBills(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBills();
    }, []);

    const handleMarkAsPaid = async (id: string, currentStatus: string) => {
        if (!confirm("この請求書を入金済みにしますか？\n（関連する案件やタスクのステータスも「入金済み」に更新されます）")) return;

        try {
            await updateBillStatus(id, "PAID");
            alert("ステータスを更新しました");
            loadBills(); // Reload
        } catch (e) {
            console.error(e);
            alert("更新に失敗しました");
        }
    };

    // Filter Logic
    const filteredBills = bills.filter(bill => {
        if (filterClient && bill.clientId !== filterClient) return false;
        if (filterMonth) {
            const billDate = new Date(bill.issueDate);
            const billMonth = `${billDate.getFullYear()}-${String(billDate.getMonth() + 1).padStart(2, '0')}`;
            if (billMonth !== filterMonth) return false;
        }
        return true;
    });

    // Extract unique clients and months for options
    const uniqueClients = Array.from(new Set(bills.map(b => JSON.stringify({ id: b.client.id, name: b.client.name }))))
        .map(s => JSON.parse(s as string))
        .sort((a, b) => a.name.localeCompare(b.name));

    const uniqueMonths = Array.from(new Set(bills.map(b => {
        const d = new Date(b.issueDate);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }))).sort().reverse();

    if (isLoading) return <div className="p-8 text-center text-zinc-500">読み込み中...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">請求書管理</h1>
                    <p className="text-zinc-500 mt-2 dark:text-zinc-400">発行済み請求書の入金管理を行います。</p>
                </div>
                <Link href="/billing">
                    <Button variant="outline" className="flex items-center gap-2 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700">
                        <FileText className="w-4 h-4" /> 月次請求作成へ戻る
                    </Button>
                </Link>
            </header>

            <Card className="shadow-md dark:bg-zinc-900 dark:border-zinc-800">
                <CardHeader className="border-b bg-zinc-50/50 flex flex-row items-center justify-between pb-4 dark:bg-zinc-800/50 dark:border-zinc-700">
                    <CardTitle className="text-xl dark:text-zinc-100">発行済み請求書一覧</CardTitle>
                    <div className="flex gap-4">
                        <select
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                        >
                            <option value="">全ての月</option>
                            {uniqueMonths.map(m => (
                                <option key={m} value={m}>{m}月分</option>
                            ))}
                        </select>
                        <select
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"
                            value={filterClient}
                            onChange={(e) => setFilterClient(e.target.value)}
                        >
                            <option value="">全てのクライアント</option>
                            {uniqueClients.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <Button
                            variant="ghost"
                            onClick={() => { setFilterMonth(""); setFilterClient(""); }}
                            className="text-zinc-500 dark:text-zinc-400 dark:hover:text-zinc-300"
                        >
                            リセット
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left dark:text-zinc-300">
                            <thead className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                <tr>
                                    <th className="h-10 px-4 align-middle font-bold">発行日</th>
                                    <th className="h-10 px-4 align-middle font-bold">クライアント</th>
                                    <th className="h-10 px-4 align-middle font-bold">件名</th>
                                    <th className="h-10 px-4 align-middle font-bold text-right">請求金額</th>
                                    <th className="h-10 px-4 align-middle font-bold w-[120px] text-center">ステータス</th>
                                    <th className="h-10 px-4 align-middle font-bold w-[260px] text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0 bg-white dark:bg-zinc-900">
                                {filteredBills.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-zinc-400 dark:text-zinc-500">請求書はありません</td></tr>
                                ) : filteredBills.map((bill) => (
                                    <tr key={bill.id} className="border-b hover:bg-zinc-50 transition-colors dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                                        <td className="p-4 align-middle font-mono text-zinc-600 dark:text-zinc-400">
                                            {new Date(bill.issueDate).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 align-middle font-medium dark:text-zinc-200">
                                            {bill.client.name}
                                        </td>
                                        <td className="p-4 align-middle text-zinc-600 truncate max-w-[200px] dark:text-zinc-400">
                                            {bill.subject || "-"}
                                        </td>
                                        <td className="p-4 align-middle text-right font-mono font-bold text-lg dark:text-zinc-100">
                                            ¥{bill.totalAmount.toLocaleString()}
                                        </td>
                                        <td className="p-4 align-middle text-center">
                                            {bill.status === "PAID" ? (
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 border border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800">
                                                    入金済み
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800">
                                                    請求済み
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/bills/${bill.id}/publish`} target="_blank">
                                                    <Button size="sm" variant="outline" className="text-zinc-600 bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700">
                                                        <ExternalLink className="h-4 w-4 mr-2" />
                                                        請求書を表示
                                                    </Button>
                                                </Link>
                                                {bill.status !== "PAID" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-green-200 text-green-600 bg-green-50/50 hover:bg-green-100 hover:text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                                                        onClick={() => handleMarkAsPaid(bill.id, bill.status)}
                                                    >
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        入金済にする
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
