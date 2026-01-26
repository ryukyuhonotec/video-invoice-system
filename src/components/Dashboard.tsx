
"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MOCK_INVOICES, MOCK_CLIENTS, MOCK_PARTNERS, MOCK_SUPERVISORS } from "@/data/mock";

export default function Dashboard() {
    const [filterClient, setFilterClient] = useState("");
    const [filterSupervisor, setFilterSupervisor] = useState("");
    const [filterPartner, setFilterPartner] = useState("");

    // Flatten invoices to items for "Production Management" view
    const allItems = MOCK_INVOICES.flatMap(inv =>
        inv.items.map(item => ({
            ...item,
            invoiceId: inv.id, // Explicitly overwrite to ensure it's present
            clientName: MOCK_CLIENTS.find(c => c.id === inv.clientId)?.name || "Unknown",
            supervisorName: MOCK_SUPERVISORS.find(s => s.id === inv.supervisorId)?.name || "-",
            partnerName: item.outsources && item.outsources.length > 0
                ? item.outsources.map(o => MOCK_PARTNERS.find(p => p.id === o.partnerId)?.name || "Unknown").join(", ")
                : "未定",
            issueDate: inv.issueDate,
            communicationChannel: inv.communicationChannel
        }))
    );

    // Filter items
    const filteredItems = allItems.filter(item => {
        // 1. Status Filter (Show only active projects for now, or all?)
        // User said "Review in progress projects", so let's check productionStatus
        if (item.productionStatus === 'Delivered') return true; // Show all for now, maybe filter later

        let match = true;
        if (filterClient) {
            if (MOCK_INVOICES.find(i => i.id === item.invoiceId)?.clientId !== filterClient) match = false;
        }
        if (filterSupervisor) {
            // Check invoice level or item level supervisor
            const inv = MOCK_INVOICES.find(i => i.id === item.invoiceId);
            const sId = inv?.supervisorId;
            if (sId !== filterSupervisor) match = false;
        }
        if (filterPartner) {
            if (!item.outsources?.some(o => o.partnerId === filterPartner)) match = false;
        }
        return match;
    });

    return (
        <>
            {/* Filters */}
            <Card className="mb-8">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">絞り込み検索 (Filters)</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                    <Select value={filterClient} onChange={(e) => setFilterClient(e.target.value)}>
                        <option value="">全てのクライアント</option>
                        {MOCK_CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                    <Select value={filterSupervisor} onChange={(e) => setFilterSupervisor(e.target.value)}>
                        <option value="">全ての統括 (Supervisor)</option>
                        {MOCK_SUPERVISORS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                    <Select value={filterPartner} onChange={(e) => setFilterPartner(e.target.value)}>
                        <option value="">全ての担当 (Creator)</option>
                        {MOCK_PARTNERS.map(p => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
                    </Select>
                    <Button variant="ghost" onClick={() => {
                        setFilterClient("");
                        setFilterSupervisor("");
                        setFilterPartner("");
                    }}>条件クリア</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>進行中・制作案件一覧 (Production List)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[100px]">納期</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">案件・品目名</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">クライアント</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[100px]">連絡</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[120px]">ステータス</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">統括 (Sup)</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">担当 (Creator)</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">見積金額</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {filteredItems.length === 0 ? (
                                    <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">該当する案件はありません</td></tr>
                                ) : filteredItems.map((item) => (
                                    <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-mono">{item.deliveryDate || "-"}</td>
                                        <td className="p-4 align-middle font-medium">
                                            <Link href={`/invoices/${item.invoiceId}`} className="hover:underline text-blue-600 block">
                                                {item.name}
                                            </Link>
                                        </td>
                                        <td className="p-4 align-middle">{item.clientName}</td>
                                        <td className="p-4 align-middle">
                                            {item.communicationChannel ? (
                                                <a href={item.communicationChannel} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 underline text-xs">
                                                    Open Chat
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                          ${item.productionStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                    item.productionStatus === 'Review' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-blue-50 text-blue-700'}`}>
                                                {item.productionStatus}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle text-zinc-600">{item.supervisorName}</td>
                                        <td className="p-4 align-middle text-zinc-600">{item.partnerName}</td>
                                        <td className="p-4 align-middle text-right">¥{item.amount?.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
