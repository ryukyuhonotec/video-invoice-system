"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, FileText, Search } from "lucide-react";
import { Invoice, Client, Partner, Staff } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";

interface DashboardProps {
    initialInvoices: Invoice[];
    initialClients: Client[];
    initialPartners: Partner[];
    initialStaff: Staff[];
}

export default function Dashboard({
    initialInvoices,
    initialClients,
    initialPartners,
    initialStaff
}: DashboardProps) {
    // 1. State Definitions
    const [filterClient, setFilterClient] = useState("");
    const [filterStaff, setFilterStaff] = useState("");
    const [filterPartner, setFilterPartner] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [showCompleted, setShowCompleted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // 2. Data Flattening and Sorting
    const allTasks = useMemo(() => {
        const tasks: any[] = [];
        initialInvoices.forEach(inv => {
            const client = initialClients.find(c => c.id === inv.clientId);
            const supervisor = initialStaff.find(s => s.id === inv.staffId);

            // Get operations lead and accountant from client
            const operationsLead = client?.operationsLeadId
                ? initialStaff.find(s => s.id === client.operationsLeadId)
                : null;
            const accountant = client?.accountantId
                ? initialStaff.find(s => s.id === client.accountantId)
                : null;

            inv.items.forEach(item => {
                (item.outsources || []).forEach(task => {
                    const partner = initialPartners.find(p => p.id === task.partnerId);

                    const statusMap: Record<string, string> = {
                        "DRAFT": "受注前",
                        "IN_PROGRESS": "制作中",
                        "PENDING": "確認中",
                        "DELIVERED": "納品済",
                        "BILLED": "請求済",
                        "PAID": "入金済み",
                        "SENT": "送付済",
                        "COMPLETED": "完了",
                        "LOST": "失注"
                    };
                    const statusLabel = statusMap[task.status] || task.status || item.productionStatus || "受注前";

                    tasks.push({
                        id: task.id,
                        invoiceId: inv.id,
                        itemId: item.id,
                        itemName: item.name || "名称未設定",
                        pricingRuleId: task.pricingRuleId,
                        taskName: task.pricingRule?.name || "担当領域未設定",
                        clientName: client?.name || "Unknown",
                        clientId: inv.clientId,
                        supervisorName: supervisor?.name || "-",
                        staffId: inv.staffId,
                        partnerName: partner?.name || "未定",
                        partnerId: task.partnerId,
                        partnerChatworkUrl: partner?.chatworkGroup ? `https://chatwork.com/#!rid${partner.chatworkGroup}` : null,
                        operationsLeadName: operationsLead?.name || "-",
                        operationsLeadId: client?.operationsLeadId,
                        accountantName: accountant?.name || "-",
                        accountantId: client?.accountantId,
                        deliveryDate: task.deliveryDate,
                        status: statusLabel,
                        revenueAmount: task.revenueAmount || 0,
                        costAmount: task.costAmount || 0,
                        duration: item.duration,
                        issueDate: inv.issueDate,
                        requestUrl: inv.requestUrl // Add requestUrl
                    });
                });

                // If no tasks, still show the item
                if (!item.outsources || item.outsources.length === 0) {
                    tasks.push({
                        id: item.id,
                        invoiceId: inv.id,
                        itemId: item.id,
                        itemName: item.name || "名称未設定",
                        taskName: "-",
                        clientName: client?.name || "Unknown",
                        clientId: inv.clientId,
                        supervisorName: supervisor?.name || "-",
                        staffId: inv.staffId,
                        partnerName: "未定",
                        partnerId: null,
                        operationsLeadName: operationsLead?.name || "-",
                        operationsLeadId: client?.operationsLeadId,
                        accountantName: accountant?.name || "-",
                        accountantId: client?.accountantId,
                        deliveryDate: null,
                        status: item.productionStatus || "受注前",
                        revenueAmount: item.amount || 0,
                        costAmount: 0,
                        duration: item.duration,
                        issueDate: inv.issueDate,
                        requestUrl: inv.requestUrl // Add requestUrl
                    });
                }
            });
        });

        // Sort by delivery date (earliest first), then by issue date
        return tasks.sort((a, b) => {
            if (a.deliveryDate && b.deliveryDate) {
                return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
            }
            if (a.deliveryDate) return -1;
            if (b.deliveryDate) return 1;
            return new Date(b.issueDate || 0).getTime() - new Date(a.issueDate || 0).getTime();
        });
    }, [initialInvoices, initialClients, initialPartners, initialStaff]);

    // 3. Filtering Logic
    const filteredTasks = useMemo(() => {
        return allTasks.filter(task => {
            // Status filter
            if (filterStatus && task.status !== filterStatus) return false;

            // Hide completed unless toggled
            if (!showCompleted && !filterStatus) {
                const completedStatuses = ["納品済", "請求済", "入金済み"];
                if (completedStatuses.includes(task.status)) return false;
            }

            // Client filter
            if (filterClient && task.clientId !== filterClient) return false;

            // Staff filter
            if (filterStaff && task.staffId !== filterStaff) return false;

            // Partner filter
            if (filterPartner && task.partnerId !== filterPartner) return false;

            // Search query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesItemName = task.itemName?.toLowerCase().includes(query);
                const matchesClient = task.clientName?.toLowerCase().includes(query);
                const matchesPartner = task.partnerName?.toLowerCase().includes(query);
                const matchesTaskName = task.taskName?.toLowerCase().includes(query);
                if (!matchesItemName && !matchesClient && !matchesPartner && !matchesTaskName) return false;
            }

            return true;
        });
    }, [allTasks, filterClient, filterStaff, filterPartner, filterStatus, showCompleted, searchQuery]);

    // 4. Status badge styling
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "受注前": return "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600";
            case "制作中":
            case "進行中": return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700";
            case "確認中": return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700";
            case "納品済": return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700";
            case "請求済": return "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700";
            case "送付済": return "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-700";
            case "完了": return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/40 dark:text-gray-300 dark:border-gray-700";
            case "失注": return "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700";
            case "入金済み": return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700";
            default: return "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600";
        }
    };

    // 5. Date formatting
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    };

    // Get unique statuses
    const statuses = Array.from(new Set(allTasks.map(t => t.status))).sort();

    return (
        <>
            {/* Summary Stats - Only 制作中 and 確認中 */}
            <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
                <Card>
                    <CardContent className="pt-4 text-center">
                        <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{allTasks.filter(t => t.status === "制作中").length}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">制作中</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 text-center">
                        <div className="text-3xl font-black text-yellow-600 dark:text-yellow-400">{allTasks.filter(t => t.status === "確認中").length}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">確認中</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6 shadow-sm">
                <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                <Input
                                    placeholder="品目名、クライアント、パートナーで検索..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-10 dark:bg-zinc-800 dark:text-zinc-100"
                                />
                            </div>
                        </div>
                        <Select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="dark:bg-zinc-800 dark:text-zinc-100">
                            <option value="">クライアント: 全て</option>
                            {initialClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                        <Select value={filterPartner} onChange={e => setFilterPartner(e.target.value)} className="dark:bg-zinc-800 dark:text-zinc-100">
                            <option value="">パートナー: 全て</option>
                            {initialPartners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Select>
                        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="dark:bg-zinc-800 dark:text-zinc-100">
                            <option value="">ステータス: 全て</option>
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="showCompleted"
                                checked={showCompleted}
                                onCheckedChange={(checked) => setShowCompleted(!!checked)}
                            />
                            <label htmlFor="showCompleted" className="text-sm text-zinc-700 cursor-pointer select-none dark:text-zinc-300">
                                完了済みも表示
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-md">
                <CardHeader className="border-b dark:border-zinc-700">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl font-bold dark:text-zinc-100">
                            進行管理一覧（タスク単位）
                            {!showCompleted && !filterStatus && <span className="text-sm font-normal text-zinc-500 ml-2 dark:text-zinc-400">※進行中のみ表示</span>}
                        </CardTitle>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">{filteredTasks.length}件</span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left dark:text-zinc-300">
                            <thead className="bg-zinc-800 text-white border-b dark:border-zinc-700 sticky top-0 z-20 shadow-sm">
                                <tr>
                                    <th className="h-12 px-4 align-middle font-bold w-[80px]">納期</th>
                                    <th className="h-12 px-4 align-middle font-bold">品目名</th>
                                    <th className="h-12 px-4 align-middle font-bold">クライアント</th>
                                    <th className="h-12 px-4 align-middle font-bold w-[90px] whitespace-nowrap">ステータス</th>
                                    <th className="h-12 px-3 align-middle font-bold w-[80px]">事業統括</th>
                                    <th className="h-12 px-3 align-middle font-bold w-[80px]">経理</th>
                                    <th className="h-12 px-4 align-middle font-bold">パートナー</th>
                                    <th className="h-12 px-4 align-middle font-bold w-[140px]">担当領域</th>
                                    <th className="h-12 px-4 align-middle font-bold text-right w-[100px]">請求額</th>
                                    <th className="h-12 px-4 align-middle font-bold text-right w-[100px]">粗利</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0 bg-white dark:bg-zinc-900">
                                {filteredTasks.length === 0 ? (
                                    <tr><td colSpan={10} className="p-8 text-center text-zinc-400 italic dark:text-zinc-500">該当するタスクはありません</td></tr>
                                ) : filteredTasks.map((task) => {
                                    const profit = (task.revenueAmount || 0) - (task.costAmount || 0);
                                    const margin = task.revenueAmount > 0 ? (profit / task.revenueAmount) * 100 : 0;
                                    const isOverdue = task.deliveryDate && new Date(task.deliveryDate) < new Date() && !['納品済', '請求済', '入金済み'].includes(task.status);

                                    return (
                                        <tr
                                            key={task.id}
                                            className={`border-b transition-colors dark:border-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer ${isOverdue ? 'bg-red-50 dark:bg-red-900/30' : ''}`}
                                            onClick={() => window.location.href = `/invoices/${task.invoiceId}`}
                                        >
                                            <td className={`p-4 align-middle font-mono text-xs font-bold ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                                                {formatDate(task.deliveryDate)}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {task.requestUrl ? (
                                                    <a
                                                        href={task.requestUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 font-bold dark:text-blue-400 hover:underline flex items-center gap-1 group"
                                                        onClick={(e) => e.stopPropagation()} // Prevent row click
                                                    >
                                                        {task.itemName}
                                                        <span className="transition-opacity">↗</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-zinc-700 font-bold dark:text-zinc-300">
                                                        {task.itemName}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle text-zinc-700 font-medium dark:text-zinc-300">{task.clientName}</td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase border ${getStatusBadge(task.status)}`}>
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 align-middle">
                                                <span className="text-xs dark:text-zinc-300">{task.operationsLeadName}</span>
                                            </td>
                                            <td className="px-3 py-4 align-middle">
                                                <span className="text-xs dark:text-zinc-300">{task.accountantName}</span>
                                            </td>
                                            <td className="p-4 align-middle text-xs text-zinc-600 dark:text-zinc-400">
                                                {task.partnerChatworkUrl ? (
                                                    <a
                                                        href={task.partnerChatworkUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 font-bold dark:text-blue-400 hover:underline flex items-center gap-1 group"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {task.partnerName}
                                                        <span className="transition-opacity">↗</span>
                                                    </a>
                                                ) : (
                                                    task.partnerName
                                                )}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                    {task.taskName}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                                ¥{task.revenueAmount?.toLocaleString()}
                                            </td>
                                            <td className="p-4 align-middle text-right font-mono text-xs">
                                                <div className={`font-bold ${margin > 30 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                                    ¥{profit.toLocaleString()}
                                                </div>
                                                <div className="text-[9px] text-zinc-400 dark:text-zinc-500">({margin.toFixed(0)}%)</div>
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
