"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Invoice, Client, Partner, Supervisor } from "@/types";

interface DashboardProps {
    initialInvoices: Invoice[];
    initialClients: Client[];
    initialPartners: Partner[];
    initialSupervisors: Supervisor[];
}

export default function Dashboard({
    initialInvoices,
    initialClients,
    initialPartners,
    initialSupervisors
}: DashboardProps) {
    const [filterClient, setFilterClient] = useState("");
    const [filterSupervisor, setFilterSupervisor] = useState("");
    const [filterPartner, setFilterPartner] = useState("");

    // Flatten invoices to items for "Production Management" view
    const allItems = useMemo(() => {
        return initialInvoices.flatMap(inv =>
            inv.items.map(item => ({
                ...item,
                invoiceId: inv.id,
                clientName: initialClients.find(c => c.id === inv.clientId)?.name || "Unknown",
                supervisorName: initialSupervisors.find(s => s.id === inv.supervisorId)?.name || "-",
                partnerName: item.outsources && item.outsources.length > 0
                    ? item.outsources.map(o => initialPartners.find(p => p.id === o.partnerId)?.name || "Unknown").join(", ")
                    : "未定",
                issueDate: inv.issueDate,
                communicationChannel: inv.communicationChannel
            }))
        );
    }, [initialInvoices, initialClients, initialPartners, initialSupervisors]);

    // Filter items
    const filteredItems = useMemo(() => {
        return allItems.filter(item => {
            let match = true;
            if (filterClient) {
                const inv = initialInvoices.find(i => i.id === item.invoiceId);
                if (inv?.clientId !== filterClient) match = false;
            }
            if (filterSupervisor) {
                const inv = initialInvoices.find(i => i.id === item.invoiceId);
                if (inv?.supervisorId !== filterSupervisor) match = false;
            }
            if (filterPartner) {
                if (!item.outsources?.some(o => o.partnerId === filterPartner)) match = false;
            }
            return match;
        });
    }, [allItems, filterClient, filterSupervisor, filterPartner, initialInvoices]);

    return (
        <>
            {/* Filters */}
            <Card className="mb-8 border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="pb-3 bg-zinc-50/50">
                    <CardTitle className="text-base font-bold text-zinc-700">絞り込み検索 (Filters)</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4 p-4">
                    <Select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="bg-white">
                        <option value="">全てのクライアント</option>
                        {initialClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                    <Select value={filterSupervisor} onChange={(e) => setFilterSupervisor(e.target.value)} className="bg-white">
                        <option value="">全ての統括者</option>
                        {initialSupervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                    <Select value={filterPartner} onChange={(e) => setFilterPartner(e.target.value)} className="bg-white">
                        <option value="">全ての担当パートナー</option>
                        {initialPartners.map(p => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
                    </Select>
                    <Button variant="ghost" onClick={() => {
                        setFilterClient("");
                        setFilterSupervisor("");
                        setFilterPartner("");
                    }} className="text-zinc-500 hover:text-blue-600">条件クリア</Button>
                </CardContent>
            </Card>

            <Card className="shadow-md">
                <CardHeader className="border-b">
                    <CardTitle className="text-xl font-bold">制作進行状況 一覧</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="bg-zinc-800 text-white">
                                <tr>
                                    <th className="h-12 px-4 align-middle font-bold w-[120px]">納期 (Due)</th>
                                    <th className="h-12 px-4 align-middle font-bold text-blue-200">品目名</th>
                                    <th className="h-12 px-4 align-middle font-bold">クライアント</th>
                                    <th className="h-12 px-4 align-middle font-bold w-[110px]">ステータス</th>
                                    <th className="h-12 px-4 align-middle font-bold">統括 (Sup)</th>
                                    <th className="h-12 px-4 align-middle font-bold">制作パートナー</th>
                                    <th className="h-12 px-4 align-middle font-bold text-right">受注額</th>
                                    <th className="h-12 px-4 align-middle font-bold text-right text-green-400">粗利</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0 bg-white">
                                {filteredItems.length === 0 ? (
                                    <tr><td colSpan={8} className="p-8 text-center text-zinc-400 italic">該当する案件はありません</td></tr>
                                ) : filteredItems.map((item) => {
                                    const cost = (item.outsources || []).reduce((sum, o) => sum + (o.amount || 0), 0);
                                    const profit = (item.amount || 0) - cost;
                                    const margin = item.amount && item.amount > 0 ? (profit / item.amount) * 100 : 0;

                                    return (
                                        <tr key={item.id} className="border-b transition-colors hover:bg-blue-50/50">
                                            <td className="p-4 align-middle font-mono text-xs">
                                                {item.deliveryDate ? item.deliveryDate.split('T')[0] : "-"}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <Link href={`/invoices/${item.invoiceId}`} className="hover:underline text-blue-600 font-bold block">
                                                    {item.name}
                                                </Link>
                                            </td>
                                            <td className="p-4 align-middle text-zinc-700 font-medium">{item.clientName}</td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase
                                                    ${item.productionStatus === 'Delivered' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                        item.productionStatus === 'Review' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                                            item.productionStatus === 'In Progress' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                                                'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}>
                                                    {item.productionStatus}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-xs text-zinc-500">{item.supervisorName}</td>
                                            <td className="p-4 align-middle">
                                                <div className="text-[10px] leading-tight text-zinc-600">
                                                    {item.partnerName}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-right font-mono font-bold text-zinc-900">
                                                ¥{item.amount?.toLocaleString()}
                                            </td>
                                            <td className="p-4 align-middle text-right font-mono text-xs">
                                                <div className={`font-bold ${margin > 30 ? 'text-green-600' : 'text-orange-600'}`}>
                                                    ¥{profit.toLocaleString()}
                                                </div>
                                                <div className="text-[9px] text-zinc-400">({margin.toFixed(0)}%)</div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
