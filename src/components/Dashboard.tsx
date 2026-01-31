"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
// import Link from "next/link"; // Removed unused
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Client, Partner, Staff } from "@/types";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useTransition, useState, useEffect } from "react";

interface TaskView {
    id: string; // Outsource ID
    invoiceId: string; // Invoice ID (for linking)
    itemId: string;
    itemName: string;
    taskName: string;
    clientName: string;
    clientId: string;
    supervisorName: string; // Staff (Invoice owner)
    staffId: string | null;
    partnerName: string;
    partnerId: string | null;
    partnerChatworkUrl?: string | null;
    operationsLeadName: string;
    operationsLeadId?: string | null;
    accountantName: string;
    accountantId?: string | null;
    deliveryDate: Date | null;
    status: string;
    revenueAmount: number;
    costAmount: number;
    duration?: string | null;
    issueDate: Date | null;
    requestUrl?: string | null;
}

interface PaginatedResult {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tasks: any[]; // Raw Prisma Output
    total: number;
    page: number;
    totalPages: number;
}

interface DashboardProps {
    paginatedTasks: PaginatedResult;
    initialClients: Client[];
    initialPartners: Partner[];
    initialStaff: Staff[];
}

export default function Dashboard({
    paginatedTasks,
    initialClients,
    initialPartners,
    initialStaff
}: DashboardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Local state for debounced search
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search")?.toString() || "");

    const updateFilter = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        // Reset page on filter change
        if (key !== "page") {
            params.set("page", "1");
        }

        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== (searchParams.get("search") || "")) {
                const params = new URLSearchParams(searchParams.toString());
                if (searchQuery) {
                    params.set("search", searchQuery);
                } else {
                    params.delete("search");
                }
                params.set("page", "1");

                startTransition(() => {
                    router.replace(`${pathname}?${params.toString()}`);
                });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, searchParams, pathname, router]); // Added router, pathname

    // Helper to format tasks from raw Prisma data to TaskView
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tasks: TaskView[] = paginatedTasks.tasks.map((task: any) => {
        const invoiceItem = task.invoiceItem;
        const invoice = invoiceItem?.invoice;
        const client = invoice?.client;
        const staff = invoice?.staff;
        const pricingRule = task.pricingRule;
        const partner = task.partner;

        return {
            id: task.id,
            invoiceId: invoice?.id || "",
            itemId: invoiceItem?.id || "",
            itemName: invoiceItem?.name || "名称未設定",
            taskName: pricingRule?.name || task.description || "担当領域未設定",
            clientName: client?.name || "Unknown",
            clientId: invoice?.clientId || "",
            supervisorName: staff?.name || "-",
            staffId: invoice?.staffId,
            partnerName: partner?.name || "未定",
            partnerId: task.partnerId,
            partnerChatworkUrl: partner?.chatworkGroup ? `https://chatwork.com/#!rid${partner.chatworkGroup}` : null,
            operationsLeadName: client?.operationsLead?.name || "-",
            operationsLeadId: client?.operationsLeadId,
            accountantName: client?.accountant?.name || "-",
            accountantId: client?.accountantId,
            deliveryDate: task.deliveryDate ? new Date(task.deliveryDate) : null,
            status: task.status,
            revenueAmount: task.revenueAmount || 0,
            costAmount: task.costAmount || 0,
            duration: task.duration,
            issueDate: invoice?.issueDate ? new Date(invoice.issueDate) : null,
            requestUrl: invoice?.requestUrl
        };
    });

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

    const formatDate = (dateStr: Date | null) => {
        if (!dateStr) return "-";
        return `${dateStr.getMonth() + 1}/${dateStr.getDate()}`;
    };

    const statuses = ["受注前", "制作中", "確認中", "納品済", "請求済", "入金済み", "完了", "失注"];

    return (
        <>
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
                                {isPending && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-zinc-400" />}
                            </div>
                        </div>
                        <Select
                            value={searchParams.get("clientId") || ""}
                            onChange={e => updateFilter("clientId", e.target.value)}
                            className="dark:bg-zinc-800 dark:text-zinc-100"
                        >
                            <option value="">クライアント: 全て</option>
                            {initialClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                        <Select
                            value={searchParams.get("partnerId") || ""}
                            onChange={e => updateFilter("partnerId", e.target.value)}
                            className="dark:bg-zinc-800 dark:text-zinc-100"
                        >
                            <option value="">パートナー: 全て</option>
                            {initialPartners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Select>
                        <Select
                            value={searchParams.get("staffId") || ""}
                            onChange={e => updateFilter("staffId", e.target.value)}
                            className="dark:bg-zinc-800 dark:text-zinc-100"
                        >
                            <option value="">担当者: 全て</option>
                            {initialStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                        <Select
                            value={searchParams.get("status") || ""}
                            onChange={e => updateFilter("status", e.target.value)}
                            className="dark:bg-zinc-800 dark:text-zinc-100"
                        >
                            <option value="">ステータス: 全て</option>
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="showCompleted"
                                checked={searchParams.get("showCompleted") === 'true'}
                                onCheckedChange={(checked) => updateFilter("showCompleted", checked ? 'true' : null)}
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
                        </CardTitle>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">{paginatedTasks.total.toLocaleString()}件 (Page {paginatedTasks.page}/{paginatedTasks.totalPages})</span>
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
                                {tasks.length === 0 ? (
                                    <tr><td colSpan={10} className="p-8 text-center text-zinc-400 italic dark:text-zinc-500">該当するタスクはありません</td></tr>
                                ) : tasks.map((task) => {
                                    const profit = (task.revenueAmount || 0) - (task.costAmount || 0);
                                    const margin = task.revenueAmount > 0 ? (profit / task.revenueAmount) * 100 : 0;
                                    const isOverdue = task.deliveryDate && task.deliveryDate < new Date() && !['納品済', '請求済', '入金済み', '完了', '失注'].includes(task.status);

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

                    {paginatedTasks.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-4 border-t dark:border-zinc-700">
                            <div className="flex-1 text-sm text-zinc-500 dark:text-zinc-400">
                                {paginatedTasks.total} 件中 {(paginatedTasks.page - 1) * 50 + 1} - {Math.min(paginatedTasks.page * 50, paginatedTasks.total)} 件を表示
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateFilter("page", (paginatedTasks.page - 1).toString())}
                                    disabled={paginatedTasks.page <= 1}
                                    className="dark:bg-zinc-800 dark:border-zinc-700"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    前へ
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateFilter("page", (paginatedTasks.page + 1).toString())}
                                    disabled={paginatedTasks.page >= paginatedTasks.totalPages}
                                    className="dark:bg-zinc-800 dark:border-zinc-700"
                                >
                                    次へ
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
