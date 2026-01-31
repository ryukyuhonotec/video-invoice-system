"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { upsertClient } from "@/actions/pricing-actions";
import { Client, Staff, PricingRule, Partner } from "@/types";
import { Search, Plus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientForm } from "@/components/forms/ClientForm";

interface PaginatedClientsResult {
    clients: Client[];
    total: number;
    page: number;
    totalPages: number;
}

interface ClientsListClientProps {
    paginatedClients: PaginatedClientsResult;
    staffList: Staff[];
    pricingRules: PricingRule[];
    partners: Partner[];
}

export default function ClientsListClient({
    paginatedClients,
    staffList,
    pricingRules,
    partners
}: ClientsListClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingClient, setEditingClient] = useState<Partial<Client> & { partnerIds?: string[] }>({});

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
                updateFilter("search", searchQuery);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, searchParams, updateFilter]);

    const handleAddNew = () => {
        setEditingClient({
            name: "",
            email: "",
            website: "",
            contactPerson: "",
            chatworkGroup: "",
            description: "",
            operationsLeadId: "",
            accountantId: "",
            partnerIds: []
        });
        setIsEditing(true);
    };

    const handleSave = async (data: Partial<Client>) => {
        if (!data.name) return;
        setIsLoading(true);

        try {
            await upsertClient(data);
            router.refresh();
            setIsEditing(false);
        } catch (e) {
            console.error(e);
            alert("保存に失敗しました");
        }
        setIsLoading(false);
    };

    // Helper to get partner names (client-side join for display)
    const getClientPartners = (client: Client) => {
        const partnerNames = new Set<string>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        client.pricingRules?.forEach((rule: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            rule.partners?.forEach((partner: any) => {
                partnerNames.add(partner.name);
            });
        });
        return Array.from(partnerNames);
    };

    const operationsStaff = staffList.filter(s => s.role === "OPERATIONS");
    const accountingStaff = staffList.filter(s => s.role === "ACCOUNTING");

    const clients = paginatedClients.clients;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight dark:text-zinc-100">クライアント管理</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">取引先企業・個人事業主の管理を行います。</p>
                </div>
                <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm dark:bg-blue-600 dark:hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" /> 新規登録
                </Button>
            </header>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="会社名、担当者、メールアドレスで検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    {isPending && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-zinc-400" />}
                </div>
                <div className="w-48">
                    <Select
                        value={searchParams.get("operationsLeadId") || ""}
                        onChange={(e) => updateFilter("operationsLeadId", e.target.value === "ALL" ? "" : e.target.value)}
                        className="dark:bg-zinc-800 dark:text-zinc-100"
                    >
                        <option value="ALL">事業統括：全員</option>
                        {operationsStaff.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </Select>
                </div>
                <div className="w-48">
                    <Select
                        value={searchParams.get("accountantId") || ""}
                        onChange={(e) => updateFilter("accountantId", e.target.value === "ALL" ? "" : e.target.value)}
                        className="dark:bg-zinc-800 dark:text-zinc-100"
                    >
                        <option value="ALL">経理：全員</option>
                        {accountingStaff.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </Select>
                </div>
                <div className="flex items-center space-x-2 bg-white dark:bg-zinc-800 px-3 py-2 rounded-md border dark:border-zinc-700">
                    <Checkbox
                        id="show-archived"
                        checked={searchParams.get("showArchived") === 'true'}
                        onCheckedChange={(checked) => updateFilter("showArchived", checked ? 'true' : null)}
                    />
                    <label
                        htmlFor="show-archived"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-zinc-300 cursor-pointer select-none"
                    >
                        アーカイブ済みを表示
                    </label>
                </div>
            </div>

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingClient.id ? "クライアント編集" : "新規クライアント登録"}</DialogTitle>
                    </DialogHeader>
                    <ClientForm
                        initialData={editingClient}
                        staffList={staffList}
                        partners={partners}
                        onSave={handleSave}
                        onCancel={() => setIsEditing(false)}
                        isLoading={isLoading}
                        pricingRules={pricingRules}
                    />
                </DialogContent>
            </Dialog>

            <Card className="dark:bg-zinc-900 dark:border-zinc-800 shadow-md">
                <CardHeader>
                    <CardTitle className="dark:text-zinc-100 flex justify-between items-center">
                        <span>登録済みクライアント一覧</span>
                        <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
                            {paginatedClients.total.toLocaleString()}件
                            (Page {paginatedClients.page}/{paginatedClients.totalPages})
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {clients.length === 0 ? (
                        <div className="dark:text-zinc-400 text-center py-8">該当するクライアントはありません</div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                                    <tr className="border-b transition-colors dark:border-zinc-700">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400">会社名</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400">担当者</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400">事業統括/経理</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400">担当パートナー</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400">設定ルール</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {clients.map((client) => {
                                        const clientPartners = getClientPartners(client);
                                        return (
                                            <tr
                                                key={client.id}
                                                className="border-b transition-colors hover:bg-blue-50 cursor-pointer dark:border-zinc-700 dark:hover:bg-blue-900/30"
                                                onClick={() => router.push(`/clients/${client.id}`)}
                                            >
                                                <td className="p-4 align-middle">
                                                    <div className="flex items-center gap-1">
                                                        {client.chatworkGroup ? (
                                                            <a
                                                                href={client.chatworkGroup}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-blue-600 font-bold dark:text-blue-400 hover:underline flex items-center gap-1 group"
                                                            >
                                                                {client.name}
                                                                <span className="transition-opacity">↗</span>
                                                            </a>
                                                        ) : (
                                                            <span className="font-bold text-zinc-900 dark:text-zinc-100">{client.name}</span>
                                                        )}
                                                        {client.isArchived && (
                                                            <span className="text-[10px] bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300">
                                                                Archived
                                                            </span>
                                                        )}
                                                    </div>
                                                    {client.website && (
                                                        <span className="text-xs text-zinc-500 dark:text-zinc-500">
                                                            {client.website}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle dark:text-zinc-300">{client.contactPerson || "-"}</td>
                                                <td className="p-4 align-middle space-y-1">
                                                    {client.operationsLead && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] bg-cyan-100 text-cyan-700 px-1.5 rounded dark:bg-cyan-900/40 dark:text-cyan-300">統括</span>
                                                            <span className="text-xs dark:text-zinc-300">{client.operationsLead.name}</span>
                                                        </div>
                                                    )}
                                                    {client.accountant && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 rounded dark:bg-pink-900/40 dark:text-pink-300">経理</span>
                                                            <span className="text-xs dark:text-zinc-300">{client.accountant.name}</span>
                                                        </div>
                                                    )}
                                                    {!client.operationsLead && !client.accountant && <span className="dark:text-zinc-500">-</span>}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {clientPartners.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {clientPartners.slice(0, 3).map((name, idx) => (
                                                                <span key={idx} className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded dark:bg-green-900/40 dark:text-green-300">
                                                                    {name}
                                                                </span>
                                                            ))}
                                                            {clientPartners.length > 3 && (
                                                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">+{clientPartners.length - 3}</span>
                                                            )}
                                                        </div>
                                                    ) : <span className="dark:text-zinc-500">-</span>}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {client.pricingRules && client.pricingRules.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                            {client.pricingRules.slice(0, 2).map((r: any) => (
                                                                <span key={r.id} className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded dark:bg-amber-900/40 dark:text-amber-300">
                                                                    {r.name}
                                                                </span>
                                                            ))}
                                                            {client.pricingRules.length > 2 && (
                                                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">+{client.pricingRules.length - 2}</span>
                                                            )}
                                                        </div>
                                                    ) : <span className="dark:text-zinc-500">-</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {paginatedClients.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-4 border-t dark:border-zinc-700 mt-4">
                            <div className="flex-1 text-sm text-zinc-500 dark:text-zinc-400">
                                {paginatedClients.total} 件中 {(paginatedClients.page - 1) * 20 + 1} - {Math.min(paginatedClients.page * 20, paginatedClients.total)} 件を表示
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateFilter("page", (paginatedClients.page - 1).toString())}
                                    disabled={paginatedClients.page <= 1}
                                    className="dark:bg-zinc-800 dark:border-zinc-700"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    前へ
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateFilter("page", (paginatedClients.page + 1).toString())}
                                    disabled={paginatedClients.page >= paginatedClients.totalPages}
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
        </div >
    );
}
