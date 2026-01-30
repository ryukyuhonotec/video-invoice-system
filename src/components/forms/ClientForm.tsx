
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { Client, Staff, Partner } from "@/types";

interface ClientFormProps {
    initialData: Partial<Client>;
    staffList: Staff[];
    partners: Partner[];
    pricingRules?: any[]; // Passed from parent
    onSave: (data: Partial<Client>) => Promise<void>;
    onCancel: () => void;
    isLoading: boolean;
}

export function ClientForm({ initialData, staffList, partners, onSave, onCancel, isLoading, ...props }: ClientFormProps) {
    const [formData, setFormData] = useState<Partial<Client> & { partnerIds?: string[], pricingRuleIds?: string[] }>(initialData);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setFormData(initialData);
    }, [initialData]);

    const handleChange = (field: keyof Client | "partnerIds" | "pricingRuleIds", value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setTouched({ ...touched, operationsLeadId: true });

        // Validation
        if (!formData.name) return;
        if (!formData.operationsLeadId) {
            // Error handling is done via UI feedback, but we stop here
            return;
        }

        await onSave(formData);
    };

    const operationsStaff = staffList.filter(s => s.role === "OPERATIONS");
    const accountingStaff = staffList.filter(s => s.role === "ACCOUNTING");

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label className="dark:text-zinc-300">会社名・屋号 <span className="text-red-500">*</span></Label>
                    <Input
                        value={formData.name || ""}
                        onChange={e => handleChange("name", e.target.value)}
                        placeholder="株式会社〇〇"
                        className="dark:bg-zinc-800"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="dark:text-zinc-300">担当者名</Label>
                    <Input
                        value={formData.contactPerson || ""}
                        onChange={e => handleChange("contactPerson", e.target.value)}
                        placeholder="山田 太郎"
                        className="dark:bg-zinc-800"
                    />
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
                    <Label className="dark:text-zinc-300">Webサイト</Label>
                    <Input
                        value={formData.website || ""}
                        onChange={e => handleChange("website", e.target.value)}
                        className="dark:bg-zinc-800"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="dark:text-zinc-300">SNS / YouTube</Label>
                    <Input
                        value={formData.sns1 || ""}
                        onChange={e => handleChange("sns1", e.target.value)}
                        placeholder="SNS 1"
                        className="dark:bg-zinc-800 mb-2"
                    />
                    <Input
                        value={formData.sns2 || ""}
                        onChange={e => handleChange("sns2", e.target.value)}
                        placeholder="SNS 2"
                        className="dark:bg-zinc-800 mb-2"
                    />
                    <Input
                        value={formData.sns3 || ""}
                        onChange={e => handleChange("sns3", e.target.value)}
                        placeholder="SNS 3"
                        className="dark:bg-zinc-800"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="dark:text-zinc-300">事業統括</Label>
                    <Select
                        value={formData.operationsLeadId || ""}
                        onChange={e => handleChange("operationsLeadId", e.target.value)}
                        className="dark:bg-zinc-800"
                    >
                        <option value="">選択...</option>
                        {operationsStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                    {touched.operationsLeadId && !formData.operationsLeadId && (
                        <p className="text-sm text-red-500">事業統括を選択してください</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label className="dark:text-zinc-300">経理担当</Label>
                    <Select
                        value={formData.accountantId || ""}
                        onChange={e => handleChange("accountantId", e.target.value)}
                        className="dark:bg-zinc-800"
                    >
                        <option value="">選択...</option>
                        {accountingStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="dark:text-zinc-300">Chatwork グループURL</Label>
                    <Input
                        value={formData.chatworkGroup || ""}
                        onChange={e => handleChange("chatworkGroup", e.target.value)}
                        placeholder="https://www.chatwork.com/..."
                        className="dark:bg-zinc-800"
                    />
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
                <div className="col-span-2 space-y-2">
                    <Label className="dark:text-zinc-300">アーカイブ設定</Label>
                    <div className="flex items-center space-x-2 border p-3 rounded-md dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                        <Checkbox
                            id="archive-client"
                            checked={formData.isArchived || false}
                            onCheckedChange={(checked) => handleChange("isArchived", checked as boolean)}
                        />
                        <label
                            htmlFor="archive-client"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-zinc-300 cursor-pointer"
                        >
                            このクライアントをアーカイブする
                        </label>
                    </div>
                </div>

                <div className="col-span-2 space-y-2">
                    <Label className="dark:text-zinc-300">担当パートナー</Label>
                    <SearchableMultiSelect
                        options={partners.map(p => ({ label: p.name, value: p.id }))}
                        selected={formData.partnerIds || []}
                        onChange={(ids) => handleChange("partnerIds", ids)}
                        placeholder="パートナーを選択..."
                        className="dark:bg-zinc-800"
                    />
                </div>

                <div className="col-span-2 space-y-2">
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

                {/* Contract Status */}
                <div className="col-span-2 space-y-2">
                    <Label className="dark:text-zinc-300">契約状況</Label>
                    <div className="flex items-center space-x-2 border p-3 rounded-md dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                        <Checkbox
                            id="contract-signed-client"
                            checked={formData.contractSigned || false}
                            onCheckedChange={(checked) => handleChange("contractSigned", checked as boolean)}
                        />
                        <label
                            htmlFor="contract-signed-client"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-zinc-300 cursor-pointer"
                        >
                            契約締結済み
                        </label>
                    </div>
                    {formData.contractSigned && (
                        <Input
                            value={formData.contractUrl || ""}
                            onChange={e => handleChange("contractUrl", e.target.value)}
                            placeholder="契約書リンク (URL)"
                            className="dark:bg-zinc-800"
                        />
                    )}
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={onCancel}>キャンセル</Button>
                <Button onClick={handleSave} disabled={isLoading || !formData.name} className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm dark:bg-blue-600 dark:hover:bg-blue-700">
                    {isLoading ? "保存中..." : "保存"}
                </Button>
            </div>
        </div>
    );
}
