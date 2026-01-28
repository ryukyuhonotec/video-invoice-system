"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
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
import { getPartnerRoles, getPartners, upsertPartner, deletePartnerRole, getClients, addPartnerRole, getPaginatedPartners } from "@/actions/pricing-actions";
import { Partner, PartnerRole } from "@/types";
import { Search, Plus, Archive, AlertCircle, ExternalLink, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

export default function PartnersPage() {
    return (
        <Suspense fallback={<div className="container mx-auto p-8 dark:text-zinc-400">読み込み中...</div>}>
            <PartnersPageContent />
        </Suspense>
    );
}

function PartnersPageContent() {
    const router = useRouter();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [roles, setRoles] = useState<PartnerRole[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partial<Partner> & { clientIds?: string[] }>({});

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 20;

    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [showArchived, setShowArchived] = useState(false);
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");

    const [newRoleName, setNewRoleName] = useState("");
    const [isAddingRole, setIsAddingRole] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

    const searchParams = useSearchParams();

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1); // Reset page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedRoleFilter, showArchived]);

    const fetchPartners = async () => {
        setIsLoading(true);
        try {
            const [pData, rData, cData] = await Promise.all([
                getPaginatedPartners(currentPage, ITEMS_PER_PAGE, debouncedSearch, selectedRoleFilter, showArchived),
                getPartnerRoles(),
                getClients()
            ]);

            setPartners(pData.partners as any);
            setTotalItems(pData.total);
            setTotalPages(pData.totalPages);

            setRoles(rData as any);
            setClients(cData as any);
        } catch (error) {
            console.error("Failed to load partners:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPartners();
        // Handle edit param logic is moved to check after fetch or separate effect?
        // Ideally we handle 'edit' param by fetching that specific partner if not in list.
        // But for simplicity, we ignore deep linking to edit page if not on first page for now, 
        // OR we just remove the auto-edit from URL feature if it complicates pagination.
        // Given 'edit' param logic was simple, let's keep it but it might fail if partner is on page 2.
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
    }, [searchParams, partners]);

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

    const handleSave = async () => {
        if (!editingPartner.name) return;
        setIsLoading(true);

        await upsertPartner(editingPartner);
        // Refresh Current Page
        await fetchPartners();

        setIsEditing(false);
        setIsLoading(false);
    };

    const handleAddRole = async () => {
        if (!newRoleName) return;
        setIsAddingRole(true);
        const res = await addPartnerRole(newRoleName);
        if (res?.success) {
            const rData = await getPartnerRoles();
            setRoles(rData as any);

            // Auto-select the new role (Fix #8)
            const currentRoles = (editingPartner.role || "").split(",").filter(r => r.trim() !== "");
            if (!currentRoles.includes(newRoleName)) {
                const newRoles = [...currentRoles, newRoleName];
                setEditingPartner(prev => ({ ...prev, role: newRoles.join(",") }));
            }

            setNewRoleName("");
        } else {
            alert("役割の追加に失敗しました");
        }
        setIsAddingRole(false);
    };

    const handleDeleteRole = (id: string, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setRoleToDelete(id);
    };

    const executeDeleteRole = async () => {
        if (!roleToDelete) return;

        const res = await deletePartnerRole(roleToDelete);
        if (res?.success) {
            const rData = await getPartnerRoles();
            setRoles(rData as any);
        } else {
            alert("役割の削除に失敗しました");
        }
        setRoleToDelete(null);
    };

    const toggleRole = (roleName: string, isChecked: boolean) => {
        const currentRoles = (editingPartner.role || "").split(",").filter(r => r.trim() !== "");
        let newRoles = [];
        if (isChecked) {
            newRoles = [...currentRoles, roleName];
        } else {
            newRoles = currentRoles.filter(r => r !== roleName);
        }
        setEditingPartner({ ...editingPartner, role: newRoles.join(",") });
    };

    const toggleClient = (clientId: string, isChecked: boolean) => {
        const currentIds = editingPartner.clientIds || [];
        let newIds = [];
        if (isChecked) {
            newIds = [...currentIds, clientId];
        } else {
            newIds = currentIds.filter(id => id !== clientId);
        }
        setEditingPartner({ ...editingPartner, clientIds: newIds });
    };

    // Filter partners is now effectively a pass-through since server does filtered
    const filteredPartners = partners;

    // Derive available roles from both Master Data and Usage (Fix #3)
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

            {isEditing && (
                <Card className="mb-8 border-blue-200 bg-blue-50/20 dark:bg-blue-900/10 dark:border-blue-800">
                    <CardHeader>
                        <CardTitle className="dark:text-zinc-100">{editingPartner.id ? "パートナー編集" : "新規パートナー登録"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="dark:text-zinc-300">氏名</Label>
                                <Input
                                    value={editingPartner.name || ""}
                                    onChange={e => setEditingPartner({ ...editingPartner, name: e.target.value })}
                                    placeholder="山田 太郎"
                                    className="dark:bg-zinc-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="dark:text-zinc-300">役割（複数選択可）</Label>
                                <div className="p-3 border rounded-md dark:border-zinc-700 space-y-3 bg-zinc-50 dark:bg-zinc-800/50 max-h-48 overflow-y-auto">
                                    <div className="grid grid-cols-2 gap-2">
                                        {roles.map(role => (
                                            <div key={role.id} className="flex items-center justify-between space-x-2 group">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`role-${role.id}`}
                                                        checked={(editingPartner.role || "").split(",").includes(role.name)}
                                                        onCheckedChange={(checked) => toggleRole(role.name, checked as boolean)}
                                                    />
                                                    <label
                                                        htmlFor={`role-${role.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-zinc-300 cursor-pointer"
                                                    >
                                                        {role.name}
                                                    </label>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => handleDeleteRole(role.id, e)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Add New Role */}
                                <div className="flex gap-2 pt-1">
                                    <Input
                                        value={newRoleName}
                                        onChange={(e) => setNewRoleName(e.target.value)}
                                        placeholder="新しい役割名"
                                        className="h-8 text-sm dark:bg-zinc-800"
                                    />
                                    <Button size="sm" variant="outline" onClick={handleAddRole} disabled={!newRoleName || isAddingRole} className="h-8">
                                        <Plus className="w-3 h-3 mr-1" /> 追加
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="dark:text-zinc-300">メールアドレス</Label>
                                <Input
                                    value={editingPartner.email || ""}
                                    onChange={e => setEditingPartner({ ...editingPartner, email: e.target.value })}
                                    placeholder="example@email.com"
                                    className="dark:bg-zinc-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="dark:text-zinc-300">Chatwork グループURL</Label>
                                <Input
                                    value={editingPartner.chatworkGroup || ""}
                                    onChange={e => setEditingPartner({ ...editingPartner, chatworkGroup: e.target.value })}
                                    placeholder="https://www.chatwork.com/g/..."
                                    className="dark:bg-zinc-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="dark:text-zinc-300">担当クライアント</Label>
                                <SearchableMultiSelect
                                    options={clients.map(c => ({ label: c.name, value: c.id }))}
                                    selected={editingPartner.clientIds || []}
                                    onChange={(ids) => setEditingPartner({ ...editingPartner, clientIds: ids })}
                                    placeholder="クライアントを選択..."
                                    className="dark:bg-zinc-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="dark:text-zinc-300">アーカイブ設定</Label>
                                <div className="flex items-center space-x-2 border p-3 rounded-md dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                                    <Checkbox
                                        id="archive-partner"
                                        checked={editingPartner.isArchived || false}
                                        onCheckedChange={(checked) => setEditingPartner({ ...editingPartner, isArchived: checked as boolean })}
                                    />
                                    <label
                                        htmlFor="archive-partner"
                                        className="text-sm font-medium leading-none dark:text-zinc-300 cursor-pointer"
                                    >
                                        このパートナーをアーカイブする（一覧に表示しない）
                                    </label>
                                </div>
                            </div>

                            {/* Contract Status */}
                            <div className="space-y-2">
                                <Label className="dark:text-zinc-300">契約状況</Label>
                                <div className="flex items-center space-x-2 border p-3 rounded-md dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                                    <Checkbox
                                        id="contract-signed"
                                        checked={editingPartner.contractSigned || false}
                                        onCheckedChange={(checked) => setEditingPartner({ ...editingPartner, contractSigned: checked as boolean })}
                                    />
                                    <label
                                        htmlFor="contract-signed"
                                        className="text-sm font-medium leading-none dark:text-zinc-300 cursor-pointer"
                                    >
                                        契約締結済み
                                    </label>
                                </div>
                                {editingPartner.contractSigned && (
                                    <Input
                                        value={editingPartner.contractUrl || ""}
                                        onChange={e => setEditingPartner({ ...editingPartner, contractUrl: e.target.value })}
                                        placeholder="契約書リンク (URL)"
                                        className="dark:bg-zinc-800 mt-2"
                                    />
                                )}
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label className="dark:text-zinc-300">備考</Label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"
                                    value={editingPartner.description || ""}
                                    onChange={e => setEditingPartner({ ...editingPartner, description: e.target.value })}
                                    placeholder="備考情報..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>キャンセル</Button>
                            <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm dark:bg-blue-600 dark:hover:bg-blue-700">
                                {isLoading ? "保存中..." : "保存"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

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
                                    {partners.map((p) => {
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
                                                    {p.email ? <div>📧 {p.email}</div> : "-"}
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
                                    })}
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
                            この役割を削除してもよろしいですか？この操作は取り消せません。
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
