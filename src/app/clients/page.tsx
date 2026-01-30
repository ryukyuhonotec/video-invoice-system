"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getClients, upsertClient, getStaff, getPricingRules, getPartners } from "@/actions/pricing-actions";
import { Client, Staff, PricingRule, Partner } from "@/types";
import { Search, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientForm } from "@/components/forms/ClientForm";

export default function ClientsPage() {
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingClient, setEditingClient] = useState<Partial<Client> & { partnerIds?: string[] }>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedOpsId, setSelectedOpsId] = useState<string>("ALL");
    const [selectedAccId, setSelectedAccId] = useState<string>("ALL");
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const [clientsData, staffData, rulesData, partnersData] = await Promise.all([
                getClients(),
                getStaff(),
                getPricingRules(),
                getPartners()
            ]);
            setClients(clientsData as any);
            setStaffList(staffData as any);
            setPricingRules(rulesData as any);
            setPartners(partnersData as any);
            setIsLoading(false);
        };
        loadData();
    }, []);

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

        await upsertClient(data);
        const updated = await getClients();
        setClients(updated as any);

        setIsEditing(false);
        setIsLoading(false);
    };

    // Filter clients based on search query and selected partner
    const filteredClients = useMemo(() => {
        let result = clients.filter(c => showArchived ? true : !c.isArchived);

        // Ops Staff Filter
        if (selectedOpsId && selectedOpsId !== "ALL") {
            result = result.filter(c => c.operationsLeadId === selectedOpsId);
        }

        // Accounting Staff Filter
        if (selectedAccId && selectedAccId !== "ALL") {
            result = result.filter(c => c.accountantId === selectedAccId);
        }

        // Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.name?.toLowerCase().includes(query) ||
                c.contactPerson?.toLowerCase().includes(query) ||
                c.email?.toLowerCase().includes(query) ||
                c.operationsLead?.name?.toLowerCase().includes(query) ||
                c.accountant?.name?.toLowerCase().includes(query)
            );
        }

        return result;
    }, [clients, searchQuery, selectedOpsId, selectedAccId]);

    // Get partners associated with each client through pricing rules
    const getClientPartners = (client: Client) => {
        const partnerNames = new Set<string>();
        client.pricingRules?.forEach((rule: any) => {
            rule.partners?.forEach((partner: any) => {
                partnerNames.add(partner.name);
            });
        });
        return Array.from(partnerNames);
    };

    const operationsStaff = staffList.filter(s => s.role === "OPERATIONS");
    const accountingStaff = staffList.filter(s => s.role === "ACCOUNTING");

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
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="会社名、担当者、メールアドレスで検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                </div>
                <div className="w-48">
                    <Select
                        value={selectedOpsId}
                        onChange={(e) => setSelectedOpsId(e.target.value)}
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
                        value={selectedAccId}
                        onChange={(e) => setSelectedAccId(e.target.value)}
                        className="dark:bg-zinc-800 dark:text-zinc-100"
                    >
                        <option value="ALL">経理：全員</option>
                        {accountingStaff.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </Select>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="show-archived"
                        checked={showArchived}
                        onCheckedChange={(checked) => setShowArchived(checked as boolean)}
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

            <Card className="dark:bg-zinc-900 dark:border-zinc-800">
                <CardHeader>
                    <CardTitle className="dark:text-zinc-100 flex justify-between items-center">
                        <span>登録済みクライアント一覧</span>
                        <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">{filteredClients.length}件</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading && clients.length === 0 ? (
                        <div className="dark:text-zinc-400">読み込み中...</div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b dark:border-zinc-700">
                                    <tr className="border-b transition-colors hover:bg-muted/50 dark:border-zinc-700">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400">会社名</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400">担当者</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400">事業統括/経理</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400">担当パートナー</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400">設定ルール</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {filteredClients.map((client) => {
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
                </CardContent>
            </Card>
        </div >
    );
}
