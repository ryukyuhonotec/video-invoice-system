"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getPartnerRoles, upsertPartner, deletePartnerRole, getClients, addPartnerRole, getPaginatedPartners, getPricingRules } from "@/actions/pricing-actions";
import { Partner, PartnerRole } from "@/types";
import { Search, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PartnerForm } from "@/components/forms/PartnerForm";

interface PartnersListClientProps {
    initialPartnersData: {
        partners: Partner[];
        total: number;
        totalPages: number;
    };
    initialRoles: PartnerRole[];
    initialClients: any[];
    initialPricingRules: any[];
}

export default function PartnersListClient({
    initialPartnersData,
    initialRoles,
    initialClients,
    initialPricingRules
}: PartnersListClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [partners, setPartners] = useState<Partner[]>(initialPartnersData.partners);
    const [roles, setRoles] = useState<PartnerRole[]>(initialRoles);
    const [clients, setClients] = useState<any[]>(initialClients);
    const [pricingRules, setPricingRules] = useState<any[]>(initialPricingRules);

    // We already have initial data, so not loading initially
    const [isLoading, setIsLoading] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partial<Partner> & { clientIds?: string[] }>({});

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(initialPartnersData.totalPages);
    const [totalItems, setTotalItems] = useState(initialPartnersData.total);
    const ITEMS_PER_PAGE = 20;

    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [showArchived, setShowArchived] = useState(false);
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");

    const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
    const [roleDeleteCount, setRoleDeleteCount] = useState<number>(0);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== debouncedSearch) {
                setDebouncedSearch(searchQuery);
                setCurrentPage(1); // Reset page on search
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, debouncedSearch]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedRoleFilter, showArchived]);

    const fetchPartners = async () => {
        setIsLoading(true);
        try {
            // Only fetch filtered/paginated partners, master data is static or updated on mutation
            const pData = await getPaginatedPartners(currentPage, ITEMS_PER_PAGE, debouncedSearch, selectedRoleFilter, showArchived);
            setPartners(pData.partners as any);
            setTotalItems(pData.total);
            setTotalPages(pData.totalPages);
        } catch (error) {
            console.error("Failed to load partners:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Trigger fetch when params change, BUT skip initial load if params match initial defaults
    // Actually, simple solution: useEffect with dependency.
    // However, initial render ALREADY has data. 
    // If I add useEffect, it might fetch again immediately if dependencies change or just on mount.
    // To avoid double fetch on mount:
    // We can use a ref to track if it's first mount.

    // But wait, if `debouncedSearch` is empty, `currentPage` is 1, `selectedRoleFilter` is ALL...
    // That matches initial props.
    // So we can check if current state differs from initial defaults?
    // OR just let it fetch? It's client-side now, so user sees the initial data immediately. 
    // A background re-fetch is okay but wasteful.

    const [isFirstRender, setIsFirstRender] = useState(true);

    useEffect(() => {
        if (isFirstRender) {
            setIsFirstRender(false);
            return;
        }
        fetchPartners();
    }, [currentPage, debouncedSearch, selectedRoleFilter, showArchived]);

    // Check URL edit param once on mount (or when partners loaded)
    useEffect(() => {
        const editId = searchParams.get('edit');
        if (editId && partners.length > 0) {
            const target = partners.find(p => p.id === editId);
            if (target) {
                setEditingPartner({
                    ...target,
                    clientIds: target.clients?.map((c: any) => c.id) || []
                });
                setIsEditing(true);
                router.replace('/partners');
            }
        }
    }, [searchParams, partners]); // Logic kept, though partners might change.

    const handleAddNew = () => {
        setEditingPartner({
            name: "",
            role: "運用者",
            email: "",
            chatworkGroup: "",
            description: "",
            clientIds: []
        });
        setIsEditing(true);
    };

    const handleSave = async (data: Partial<Partner>) => {
        if (!data.name) return;
        setIsLoading(true);

        await upsertPartner(data);
        // Refresh Current Page
        await fetchPartners();

        setIsEditing(false);
        setIsLoading(false);
    };

    const handleAddRoleWrapper = async (name: string) => {
        const res = await addPartnerRole(name);
        if (res?.success) {
            const rData = await getPartnerRoles();
            setRoles(rData as any);
            return true;
        } else {
            alert("役割の追加に失敗しました");
            return false;
        }
    };

    const handleDeleteRole = (id: string, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const role = roles.find(r => r.id === id);
        if (role) {
            const count = partners.filter(p => (p.role || "").split(',').map(r => r.trim()).includes(role.name)).length;
            setRoleDeleteCount(count);
        } else {
            setRoleDeleteCount(0);
        }
        setRoleToDelete(id);
    };

    const requestDeleteRole = async (id: string) => {
        handleDeleteRole(id);
        return true;
    };

    const executeDeleteRole = async () => {
        if (!roleToDelete) return;

        const res = await deletePartnerRole(roleToDelete);
        if (res?.success) {
            const rData = await getPartnerRoles();
            setRoles(rData as any);
            // Refresh partners list as some might have had roles removed
            await fetchPartners();
        } else {
            alert("役割の削除に失敗しました");
        }
        setRoleToDelete(null);
    };

    // Derive available roles from both Master Data and Usage
    const availableRoles = useMemo(() => {
        const roleSet = new Set(roles.map(r => r.name));
        partners.forEach(p => {
            if (p.role) {
                p.role.split(',').forEach(r => {
                    const trimmed = r.trim();
                    if (trimmed) roleSet.add(trimmed);
                });
            }
        });
        return Array.from(roleSet).sort();
    }, [roles, partners]);

    // Get clients associated with each partner through pricing rules
    const getPartnerClients = (partner: Partner) => {
        const clientNames = new Set<string>();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        partner.pricingRules?.forEach((rule: any) => {
            rule.clients?.forEach((client: any) => {
                // Check if client is active (has invoice within 3 months)
                const lastInvoice = client.invoices?.[0];
                const lastActivityDate = lastInvoice?.issueDate ? new Date(lastInvoice.issueDate) : null;

                if (lastActivityDate && lastActivityDate >= threeMonthsAgo) {
                    clientNames.add(client.name);
                }
            });
        });
        return Array.from(clientNames);
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight dark:text-zinc-100">パートナー管理</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">制作スタッフ（カメラマン、エディター等）の管理を行います。</p>
                </div>
                <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm dark:bg-blue-600 dark:hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" /> パートナー登録
                </Button>
            </header>

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPartner.id ? "パートナー編集" : "新規パートナー登録"}</DialogTitle>
                    </DialogHeader>
                    <PartnerForm
                        initialData={editingPartner}
                        roles={roles}
                        clients={clients}
                        onSave={handleSave}
                        onCancel={() => setIsEditing(false)}
                        onAddRole={handleAddRoleWrapper}
                        onDeleteRole={requestDeleteRole}
                        isLoading={isLoading}
                        pricingRules={pricingRules}
                    />
                </DialogContent>
            </Dialog>

            <div className="flex items-center gap-4 w-full mb-6">
                <div className="relative max-w-md flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="パートナー名で検索..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                </div>
                <div className="w-48">
                    <Select
                        value={selectedRoleFilter}
                        onChange={(e) => setSelectedRoleFilter(e.target.value)}
                        className="dark:bg-zinc-800 dark:text-zinc-100"
                    >
                        <option value="ALL">役割：すべて</option>
                        {availableRoles.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="show-archived"
                        checked={showArchived}
                        onCheckedChange={(checked) => setShowArchived(checked as boolean)}
                    />
                    <label
                        htmlFor="show-archived"
                        className="text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer select-none"
                    >
                        アーカイブ済みを表示
                    </label>
                </div>
            </div>


            <Card className="dark:bg-zinc-900 dark:border-zinc-800">
                <CardHeader>
                    <CardTitle className="dark:text-zinc-100 flex justify-between items-center">
                        <span>パートナー一覧 {showArchived && <span className="text-sm font-normal text-zinc-500">(アーカイブ含む)</span>}</span>
                        <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">全 {totalItems} 件</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading && partners.length === 0 ? (
                        <div className="p-8 text-center dark:text-zinc-400">読み込み中...</div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                                    <tr className="border-b transition-colors hover:bg-muted/50 dark:border-zinc-700">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400">氏名</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400">役割</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400">連絡先</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400">担当クライアント</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400">原価ルール</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0 p-0">
                                    {partners.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="h-48 text-center align-middle">
                                                <div className="flex flex-col items-center justify-center text-zinc-500">
                                                    <Search className="h-8 w-8 mb-2 opacity-20" />
                                                    <p className="text-lg font-medium">パートナーが見つかりません</p>
                                                    <p className="text-sm text-zinc-400 mb-4">条件を変更するか、新しいパートナーを登録してください。</p>
                                                    <Button variant="outline" onClick={handleAddNew} className="dark:bg-zinc-800 dark:text-zinc-100">
                                                        <Plus className="mr-2 h-4 w-4" /> パートナー登録
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        partners.map((p) => {
                                            const partnerClients = getPartnerClients(p);
                                            return (
                                                <tr
                                                    key={p.id}
                                                    className="border-b transition-colors hover:bg-blue-50 cursor-pointer dark:border-zinc-700 dark:hover:bg-blue-900/30"
                                                    onClick={() => router.push(`/partners/${p.id}`)}
                                                >
                                                    <td className="p-4 align-middle">
                                                        <div className="flex items-center gap-1">
                                                            {p.chatworkGroup ? (
                                                                <a
                                                                    href={p.chatworkGroup}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-blue-600 font-bold dark:text-blue-400 hover:underline flex items-center gap-1 group"
                                                                >
                                                                    {p.name}
                                                                    <span className="transition-opacity">↗</span>
                                                                </a>
                                                            ) : (
                                                                <span className="font-bold text-zinc-900 dark:text-zinc-100">{p.name}</span>
                                                            )}
                                                            {p.isArchived && (
                                                                <span className="text-[10px] bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300">
                                                                    Archived
                                                                </span>
                                                            )}
                                                        </div>
                                                        {p.position && <span className="text-xs text-zinc-500 dark:text-zinc-500">{p.position}</span>}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                                                        ${p.role === 'ディレクター' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' :
                                                                p.role === 'カメラマン' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                                                                    p.role === 'エディター' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                                                                        'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                                                            {p.role}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle text-xs text-muted-foreground dark:text-zinc-400">
                                                        {p.email ? (
                                                            <a href={`mailto:${p.email}`} className="flex items-center gap-1 hover:text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                                                                <span>📧</span> {p.email}
                                                            </a>
                                                        ) : "-"}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        {partnerClients.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {partnerClients.slice(0, 3).map((name, idx) => (
                                                                    <span key={idx} className="text-[10px] bg-cyan-100 text-cyan-700 px-1.5 rounded dark:bg-cyan-900/40 dark:text-cyan-300">
                                                                        {name}
                                                                    </span>
                                                                ))}
                                                                {partnerClients.length > 3 && (
                                                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">+{partnerClients.length - 3}</span>
                                                                )}
                                                            </div>
                                                        ) : <span className="dark:text-zinc-500">-</span>}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        {p.pricingRules && p.pricingRules.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {p.pricingRules.slice(0, 2).map((r: any) => (
                                                                    <span key={r.id} className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded dark:bg-amber-900/40 dark:text-amber-300">
                                                                        {r.name}
                                                                    </span>
                                                                ))}
                                                                {p.pricingRules.length > 2 && (
                                                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">+{p.pricingRules.length - 2}</span>
                                                                )}
                                                            </div>
                                                        ) : <span className="dark:text-zinc-500">-</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between border-t p-4 dark:border-zinc-700">
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                            {totalItems > 0 ? (
                                <>
                                    {totalItems} 件中 {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} 件を表示
                                </>
                            ) : "0 件"}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1 || isLoading}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm dark:text-zinc-300 min-w-[3rem] text-center">
                                Page {currentPage} / {Math.max(totalPages, 1)}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || isLoading}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            {/* Role Deletion Alert Dialog */}
            <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>役割の削除</AlertDialogTitle>
                        <AlertDialogDescription>
                            {roleDeleteCount > 0 ? (
                                <span className="text-red-600 font-bold block">
                                    この役割は現在 {roleDeleteCount} 名のパートナーに割り当てられています。<br />
                                    削除すると、これらのパートナーから役割が解除されます。<br />
                                    本当に削除してもよろしいですか？
                                </span>
                            ) : (
                                "この役割を削除してもよろしいですか？この操作は取り消せません。"
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDeleteRole} className="bg-red-600 hover:bg-red-700">削除する</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
