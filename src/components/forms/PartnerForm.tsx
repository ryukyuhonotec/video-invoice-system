
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { Partner, PartnerRole, Client } from "@/types";
import { Trash2, Plus } from "lucide-react";

interface PartnerFormProps {
    initialData: Partial<Partner>;
    roles: PartnerRole[];
    clients: Client[];
    onSave: (data: Partial<Partner>) => Promise<void>;
    onCancel: () => void;
    onAddRole: (name: string) => Promise<boolean>;
    onDeleteRole: (id: string) => Promise<boolean>;

    isLoading: boolean;
    pricingRules?: any[]; // Passed from parent
}

export function PartnerForm({ initialData, roles, clients, onSave, onCancel, onAddRole, onDeleteRole, isLoading, ...props }: PartnerFormProps) {
    const [formData, setFormData] = useState<Partial<Partner> & { clientIds?: string[], pricingRuleIds?: string[] }>(initialData);
    const [newRoleName, setNewRoleName] = useState("");
    const [isAddingRole, setIsAddingRole] = useState(false);

    useEffect(() => {
        setFormData(initialData);
    }, [initialData]);

    const handleChange = (field: keyof Partner | "clientIds" | "pricingRuleIds", value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleRole = (roleName: string, isChecked: boolean) => {
        const currentRoles = (formData.role || "").split(",").filter(r => r.trim() !== "");
        let newRoles = [];
        if (isChecked) {
            newRoles = [...currentRoles, roleName];
        } else {
            newRoles = currentRoles.filter(r => r !== roleName);
        }
        handleChange("role", newRoles.join(","));
    };

    const handleAddRoleClick = async () => {
        if (!newRoleName) return;
        setIsAddingRole(true);
        const success = await onAddRole(newRoleName);
        if (success) {
            // Auto-select
            const currentRoles = (formData.role || "").split(",").filter(r => r.trim() !== "");
            if (!currentRoles.includes(newRoleName)) {
                handleChange("role", [...currentRoles, newRoleName].join(","));
            }
            setNewRoleName("");
        }
        setIsAddingRole(false);
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label className="dark:text-zinc-300">氏名 <span className="text-red-500">*</span></Label>
                    <Input
                        value={formData.name || ""}
                        onChange={e => handleChange("name", e.target.value)}
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
                                            checked={(formData.role || "").split(",").includes(role.name)}
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
                                        onClick={() => onDeleteRole(role.id)}
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
                        <Button size="sm" type="button" variant="outline" onClick={handleAddRoleClick} disabled={!newRoleName || isAddingRole} className="h-8">
                            <Plus className="w-3 h-3 mr-1" /> 追加
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="dark:text-zinc-300">メールアドレス</Label>
                    <Input
                        value={formData.email || ""}
                        onChange={e => handleChange("email", e.target.value)}
                        placeholder="example@email.com"
                        className="dark:bg-zinc-800"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="dark:text-zinc-300">Chatwork グループURL</Label>
                    <Input
                        value={formData.chatworkGroup || ""}
                        onChange={e => handleChange("chatworkGroup", e.target.value)}
                        placeholder="https://www.chatwork.com/g/..."
                        className="dark:bg-zinc-800"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="dark:text-zinc-300">担当クライアント</Label>
                    <SearchableMultiSelect
                        options={clients.map(c => ({ label: c.name, value: c.id }))}
                        selected={formData.clientIds || []}
                        onChange={(ids) => handleChange("clientIds", ids)}
                        placeholder="クライアントを選択..."
                        className="dark:bg-zinc-800"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="dark:text-zinc-300">適用料金ルール</Label>
                    <SearchableMultiSelect
                        options={(props.pricingRules || []).map(r => ({ label: r.name, value: r.id }))}
                        selected={formData.pricingRuleIds || []}
                        onChange={(ids) => handleChange("pricingRuleIds", ids)}
                        placeholder="料金ルールを選択..."
                        className="dark:bg-zinc-800"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        ※ リストにないルールは「ルール管理」ページで作成してください。
                    </p>
                </div>
                <div className="space-y-2">
                    <Label className="dark:text-zinc-300">アーカイブ設定</Label>
                    <div className="flex items-center space-x-2 border p-3 rounded-md dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                        <Checkbox
                            id="archive-partner"
                            checked={formData.isArchived || false}
                            onCheckedChange={(checked) => handleChange("isArchived", checked as boolean)}
                        />
                        <label
                            htmlFor="archive-partner"
                            className="text-sm font-medium leading-none dark:text-zinc-300 cursor-pointer"
                        >
                            このパートナーをアーカイブする
                        </label>
                    </div>
                </div>

                {/* Contract Status */}
                <div className="space-y-2">
                    <Label className="dark:text-zinc-300">契約状況</Label>
                    <div className="flex items-center space-x-2 border p-3 rounded-md dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                        <Checkbox
                            id="contract-signed"
                            checked={formData.contractSigned || false}
                            onCheckedChange={(checked) => handleChange("contractSigned", checked as boolean)}
                        />
                        <label
                            htmlFor="contract-signed"
                            className="text-sm font-medium leading-none dark:text-zinc-300 cursor-pointer"
                        >
                            契約締結済み
                        </label>
                    </div>
                    {formData.contractSigned && (
                        <Input
                            value={formData.contractUrl || ""}
                            onChange={e => handleChange("contractUrl", e.target.value)}
                            placeholder="契約書リンク (URL)"
                            className="dark:bg-zinc-800 mt-2"
                        />
                    )}
                </div>

                <div className="col-span-2 space-y-2">
                    <Label className="dark:text-zinc-300">備考</Label>
                    <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"
                        value={formData.description || ""}
                        onChange={e => handleChange("description", e.target.value)}
                        placeholder="備考情報..."
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onCancel}>キャンセル</Button>
                <Button onClick={() => onSave(formData)} disabled={isLoading || !formData.name} className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm dark:bg-blue-600 dark:hover:bg-blue-700">
                    {isLoading ? "保存中..." : "保存"}
                </Button>
            </div>
        </div>
    );
}
