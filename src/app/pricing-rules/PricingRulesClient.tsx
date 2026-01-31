"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
import { getPricingRules, upsertPricingRule, deletePricingRule } from "@/actions/pricing-actions";
import { PricingRule, Client, Partner, PricingType, PricingStep } from "@/types";
import { Search, Plus, Trash2, Loader2 } from "lucide-react";

interface PricingRulesClientProps {
    initialRules: PricingRule[];
    initialClients: Client[];
    initialPartners: Partner[];
}

export default function PricingRulesClient({
    initialRules,
    initialClients,
    initialPartners
}: PricingRulesClientProps) {
    const [rules, setRules] = useState<PricingRule[]>(initialRules);
    // These are static lists for selection, usually don't need re-fetching unless updated elsewhere
    const [clients] = useState<Client[]>(initialClients);
    const [partners] = useState<Partner[]>(initialPartners);

    // Not loading initially
    const [isLoading, setIsLoading] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [scope, setScope] = useState<"GENERIC" | "INDIVIDUAL">("GENERIC");
    const [editingRule, setEditingRule] = useState<Partial<PricingRule> & { clientIds?: string[], partnerIds?: string[] }>({
        type: 'FIXED',
        isDefault: false,
        clientIds: [],
        partnerIds: []
    });

    const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

    // Search states for selection
    const [ruleSearch, setRuleSearch] = useState("");

    const handleAddNew = () => {
        setScope("GENERIC");
        setEditingRule({
            name: "",
            type: 'FIXED',
            isDefault: false,
            clientIds: [],
            partnerIds: []
        });
        setIsEditing(true);
    };

    const handleEdit = (rule: PricingRule) => {
        let parsedSteps = rule.steps;
        if (typeof rule.steps === 'string') {
            try {
                parsedSteps = JSON.parse(rule.steps);
            } catch (e) {
                parsedSteps = [];
            }
        }
        let parsedCostSteps = rule.costSteps;
        if (typeof rule.costSteps === 'string') {
            try {
                parsedCostSteps = JSON.parse(rule.costSteps);
            } catch (e) {
                parsedCostSteps = [];
            }
        }

        const clientIds = rule.clients?.map(c => c.id) || [];
        const partnerIds = rule.partners?.map(p => p.id) || [];

        setScope((clientIds.length > 0 || partnerIds.length > 0) ? "INDIVIDUAL" : "GENERIC");
        setEditingRule({
            ...rule,
            steps: parsedSteps,
            costSteps: parsedCostSteps,
            clientIds,
            partnerIds
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editingRule.name) return;

        setIsLoading(true);
        const ruleToSave = { ...editingRule };
        if (scope === "GENERIC") {
            ruleToSave.clientIds = [];
            ruleToSave.partnerIds = [];
        }

        try {
            await upsertPricingRule(ruleToSave);
            const updatedRules = await getPricingRules();
            setRules(updatedRules as any);
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            alert("保存に失敗しました");
        }
        setIsLoading(false);
    };

    const handleDelete = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setRuleToDelete(id);
    };

    const executeDelete = async () => {
        if (!ruleToDelete) return;
        setIsLoading(true);
        try {
            await deletePricingRule(ruleToDelete);
            const updatedRules = await getPricingRules();
            setRules(updatedRules as any);
        } catch (error) {
            console.error(error);
            alert("削除に失敗しました");
        }
        setIsLoading(false);
        setRuleToDelete(null);
    };

    const addStep = () => {
        const currentSteps = (editingRule.steps as PricingStep[]) || [];
        setEditingRule({
            ...editingRule,
            steps: [...currentSteps, { upTo: 0, price: 0 }]
        });
    };

    const updateStep = (index: number, field: 'upTo' | 'price', value: number) => {
        const steps = [...((editingRule.steps as PricingStep[]) || [])];
        steps[index] = { ...steps[index], [field]: value };
        setEditingRule({ ...editingRule, steps });
    };

    const removeStep = (index: number) => {
        const steps = [...((editingRule.steps as PricingStep[]) || [])];
        steps.splice(index, 1);
        setEditingRule({ ...editingRule, steps });
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight dark:text-zinc-5">料金ルール管理</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">クライアント（売上）またはパートナー（原価）ごとの料金体系を設定します。</p>
                </div>
                <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm dark:bg-blue-600 dark:hover:bg-blue-700">+ ルール追加</Button>
            </header>

            {isEditing && (
                <Card className="mb-8 border-blue-200 bg-blue-50/20 dark:bg-blue-900/10 dark:border-blue-800 shadow-lg">
                    <CardHeader className="bg-white/50 dark:bg-zinc-800/50 border-b dark:border-zinc-700">
                        <CardTitle className="dark:text-zinc-100">{editingRule.id ? "ルール編集" : "新規ルール作成"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="font-bold underline decoration-blue-300 dark:text-zinc-200">ルール名</Label>
                                <Input
                                    value={editingRule.name || ""}
                                    onChange={e => setEditingRule({ ...editingRule, name: e.target.value })}
                                    placeholder="例: 標準撮影費用"
                                    className="bg-white dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold dark:text-zinc-200">説明</Label>
                                <Input
                                    value={editingRule.description || ""}
                                    onChange={e => setEditingRule({ ...editingRule, description: e.target.value })}
                                    placeholder="ルールの詳細説明"
                                    className="bg-white dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700"
                                />
                            </div>
                        </div>

                        {/* Type & Scope Selection */}
                        <div className="grid gap-6 md:grid-cols-2 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border dark:border-zinc-700">
                            <div className="space-y-2">
                                <Label className="font-bold dark:text-zinc-200">料金タイプ</Label>
                                <Select value={editingRule.type} onChange={e => setEditingRule({ ...editingRule, type: e.target.value as PricingType })}>
                                    <option value="FIXED">固定料金</option>
                                    <option value="STEPPED">階段式</option>
                                    <option value="PERFORMANCE">成果報酬</option>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold dark:text-zinc-200">適用範囲</Label>
                                <Select
                                    value={scope}
                                    onChange={e => setScope(e.target.value as "GENERIC" | "INDIVIDUAL")}
                                >
                                    <option value="GENERIC">汎用ルール（全案件・全パートナー）</option>
                                    <option value="INDIVIDUAL">個別指定（特定のクライアント/パートナー）</option>
                                </Select>
                            </div>
                        </div>

                        {/* Individual Selectors */}
                        {scope === "INDIVIDUAL" && (
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="font-bold text-blue-700 dark:text-blue-400">適用先クライアント (売上ルール)</Label>
                                    <SearchableMultiSelect
                                        options={clients.map(c => ({ label: c.name, value: c.id }))}
                                        selected={editingRule.clientIds || []}
                                        onChange={(ids) => setEditingRule({ ...editingRule, clientIds: ids })}
                                        placeholder="クライアントを選択..."
                                        className="bg-white dark:bg-zinc-900"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-purple-700 dark:text-purple-400">適用先パートナー (原価ルール)</Label>
                                    <SearchableMultiSelect
                                        options={partners.map(p => ({ label: p.name, value: p.id }))}
                                        selected={editingRule.partnerIds || []}
                                        onChange={(ids) => setEditingRule({ ...editingRule, partnerIds: ids })}
                                        placeholder="パートナーを選択..."
                                        className="bg-white dark:bg-zinc-900"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4 border p-4 rounded-lg bg-white dark:bg-zinc-900 dark:border-zinc-700 shadow-sm">
                                <h3 className="font-bold text-blue-700 dark:text-blue-400 border-b dark:border-zinc-700 pb-2 flex justify-between items-center">
                                    受注価格設定
                                </h3>
                                <div className="space-y-4">
                                    {editingRule.type === 'FIXED' && (
                                        <div className="space-y-2">
                                            <Label className="dark:text-zinc-200">売上単価 (円)</Label>
                                            <Input type="number" className="dark:bg-zinc-800 dark:text-zinc-100" value={editingRule.fixedPrice || 0} onChange={e => setEditingRule({ ...editingRule, fixedPrice: parseFloat(e.target.value) })} />
                                        </div>
                                    )}
                                    {editingRule.type === 'STEPPED' && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <Label>階段設定 (売上)</Label>
                                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addStep}>+ 追加</Button>
                                            </div>

                                            {((editingRule.steps as PricingStep[])?.length > 0) && (
                                                <div className="flex gap-1 text-xs text-zinc-500 px-1 mb-1 font-bold">
                                                    <span className="w-20 pl-1">基準(分以下)</span>
                                                    <span className="flex-1 ml-6">金額(円)</span>
                                                </div>
                                            )}

                                            {((editingRule.steps as PricingStep[]) || []).map((step, index) => (
                                                <div key={index} className="flex gap-1 items-center">
                                                    <Input placeholder="分" type="number" value={step.upTo} onChange={e => updateStep(index, 'upTo', parseFloat(e.target.value))} className="w-20 h-8 text-xs dark:bg-zinc-800" />
                                                    <Input placeholder="金額" type="number" value={step.price} onChange={e => updateStep(index, 'price', parseFloat(e.target.value))} className="flex-1 h-8 text-xs dark:bg-zinc-800" />
                                                    <Button size="sm" variant="ghost" onClick={() => removeStep(index)}><Trash2 className="w-3 h-3 text-zinc-400 hover:text-red-500" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {editingRule.type === 'LINEAR' && (
                                        <div className="grid gap-2 grid-cols-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs">単価 (円/分)</Label>
                                                <Input type="number" value={editingRule.incrementalUnitPrice || 0} onChange={e => setEditingRule({ ...editingRule, incrementalUnitPrice: parseFloat(e.target.value) })} className="h-8 text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">基準尺 (分)</Label>
                                                <Input type="number" value={editingRule.incrementalUnit || 1} onChange={e => setEditingRule({ ...editingRule, incrementalUnit: parseFloat(e.target.value) })} className="h-8 text-xs" />
                                            </div>
                                        </div>
                                    )}
                                    {editingRule.type === 'PERFORMANCE' && (
                                        <div className="space-y-2">
                                            <Label className="dark:text-zinc-200">売上還元率 (%)</Label>
                                            <Input type="number" className="dark:bg-zinc-800 dark:text-zinc-100" value={editingRule.percentage || 0} onChange={e => setEditingRule({ ...editingRule, percentage: parseFloat(e.target.value) })} />
                                            <p className="text-[10px] text-zinc-500">※ 入力された成果対象額に対してこの％を乗じた金額が請求額になります</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 border p-4 rounded-lg bg-white dark:bg-zinc-900 dark:border-zinc-700 shadow-sm">
                                <h3 className="font-bold text-red-700 dark:text-red-400 border-b dark:border-zinc-700 pb-2 flex justify-between items-center">
                                    発注原価設定
                                </h3>
                                <div className="space-y-4">
                                    {editingRule.type === 'FIXED' && (
                                        <div className="space-y-2">
                                            <Label className="dark:text-zinc-200">原価単価 (円)</Label>
                                            <Input type="number" className="dark:bg-zinc-800 dark:text-zinc-100" value={editingRule.fixedCost || 0} onChange={e => setEditingRule({ ...editingRule, fixedCost: parseFloat(e.target.value) })} />
                                        </div>
                                    )}
                                    {editingRule.type === 'STEPPED' && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <Label>階段設定 (原価)</Label>
                                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                                                    const current = (editingRule.costSteps as any as PricingStep[]) || [];
                                                    setEditingRule({ ...editingRule, costSteps: [...current, { upTo: 0, price: 0 }] as any });
                                                }}>+ 追加</Button>
                                            </div>

                                            {((editingRule.costSteps as any as PricingStep[])?.length > 0) && (
                                                <div className="flex gap-1 text-xs text-zinc-500 px-1 mb-1 font-bold">
                                                    <span className="w-20 pl-1">基準(分以下)</span>
                                                    <span className="flex-1 ml-6">金額(円)</span>
                                                </div>
                                            )}

                                            {((editingRule.costSteps as any as PricingStep[]) || []).map((step, index) => (
                                                <div key={index} className="flex gap-1 items-center">
                                                    <Input placeholder="分" type="number" value={step.upTo} onChange={e => {
                                                        const steps = [...(editingRule.costSteps as any as PricingStep[])];
                                                        steps[index] = { ...steps[index], upTo: parseFloat(e.target.value) };
                                                        setEditingRule({ ...editingRule, costSteps: steps as any });
                                                    }} className="w-20 h-8 text-xs dark:bg-zinc-800" />
                                                    <Input placeholder="金額" type="number" value={step.price} onChange={e => {
                                                        const steps = [...(editingRule.costSteps as any as PricingStep[])];
                                                        steps[index] = { ...steps[index], price: parseFloat(e.target.value) };
                                                        setEditingRule({ ...editingRule, costSteps: steps as any });
                                                    }} className="flex-1 h-8 text-xs dark:bg-zinc-800" />
                                                    <Button size="sm" variant="ghost" onClick={() => {
                                                        const steps = [...(editingRule.costSteps as any as PricingStep[])];
                                                        steps.splice(index, 1);
                                                        setEditingRule({ ...editingRule, costSteps: steps as any });
                                                    }}><Trash2 className="w-3 h-3 text-zinc-400 hover:text-red-500" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {editingRule.type === 'LINEAR' && (
                                        <div className="grid gap-2 grid-cols-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs">原価単価 (円/分)</Label>
                                                <Input type="number" value={editingRule.incrementalCostPrice || 0} onChange={e => setEditingRule({ ...editingRule, incrementalCostPrice: parseFloat(e.target.value) })} className="h-8 text-xs" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">原価基準尺 (分)</Label>
                                                <Input type="number" value={editingRule.incrementalCostUnit || 1} onChange={e => setEditingRule({ ...editingRule, incrementalCostUnit: parseFloat(e.target.value) })} className="h-8 text-xs" />
                                            </div>
                                        </div>
                                    )}
                                    {editingRule.type === 'PERFORMANCE' && (
                                        <div className="space-y-2">
                                            <Label className="dark:text-zinc-200">原価還元率 (%)</Label>
                                            <Input type="number" className="dark:bg-zinc-800 dark:text-zinc-100" value={editingRule.costPercentage || 0} onChange={e => setEditingRule({ ...editingRule, costPercentage: parseFloat(e.target.value) })} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t pt-4">
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>キャンセル</Button>
                            <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm dark:bg-blue-600 dark:hover:bg-blue-700">
                                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 保存中...</> : "保存"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )
            }

            <Card className="shadow-md dark:bg-zinc-900 dark:border-zinc-800">
                <CardHeader className="bg-zinc-50 dark:bg-zinc-800 border-b dark:border-zinc-700">
                    <div className="flex justify-between items-center">
                        <CardTitle className="dark:text-zinc-100">登録済みルール一覧</CardTitle>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">{rules.filter(r => {
                            if (!ruleSearch) return true;
                            const query = ruleSearch.toLowerCase();
                            return r.name?.toLowerCase().includes(query) ||
                                r.description?.toLowerCase().includes(query) ||
                                r.clients?.some((c: any) => c.name?.toLowerCase().includes(query)) ||
                                r.partners?.some((p: any) => p.name?.toLowerCase().includes(query));
                        }).length}件</span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Search Bar */}
                    <div className="p-4 border-b dark:border-zinc-700">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                placeholder="ルール名、クライアント名、パートナー名で検索..."
                                value={ruleSearch}
                                onChange={e => setRuleSearch(e.target.value)}
                                className="pl-10 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                        </div>
                    </div>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-100/50 dark:bg-zinc-900/50">
                                <tr className="border-b dark:border-zinc-700">
                                    <th className="h-12 px-4 font-bold text-zinc-600 dark:text-zinc-400">ルール名</th>
                                    <th className="h-12 px-4 font-bold text-zinc-600 dark:text-zinc-400">タイプ</th>
                                    <th className="h-12 px-4 font-bold text-zinc-600 dark:text-zinc-400">適用対象</th>
                                    <th className="h-12 px-4 font-bold text-zinc-600 dark:text-zinc-400">設定内容</th>
                                    <th className="h-12 px-4 font-bold text-zinc-600 dark:text-zinc-400 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-zinc-700">
                                {rules.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="h-48 text-center align-middle">
                                            <div className="flex flex-col items-center justify-center text-zinc-500">
                                                <Search className="h-8 w-8 mb-2 opacity-20" />
                                                <p className="text-lg font-medium">料金ルールが見つかりません</p>
                                                <p className="text-sm text-zinc-400 mb-4">新しいルールを追加して、料金計算を自動化しましょう。</p>
                                                <Button variant="outline" onClick={handleAddNew} className="dark:bg-zinc-800 dark:text-zinc-100">
                                                    + ルール追加
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    rules.filter(r => {
                                        if (!ruleSearch) return true;
                                        const query = ruleSearch.toLowerCase();
                                        return r.name?.toLowerCase().includes(query) ||
                                            r.description?.toLowerCase().includes(query) ||
                                            r.clients?.some((c: any) => c.name?.toLowerCase().includes(query)) ||
                                            r.partners?.some((p: any) => p.name?.toLowerCase().includes(query));
                                    }).map((rule) => (
                                        <tr
                                            key={rule.id}
                                            className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                            onClick={() => handleEdit(rule)}
                                        >
                                            <td className="p-4">
                                                <div className="font-bold text-zinc-900 dark:text-zinc-100">{rule.name}</div>
                                                {rule.description && <div className="text-xs text-zinc-500 dark:text-zinc-400">{rule.description}</div>}
                                                {rule.isDefault && <span className="inline-block mt-1 text-[10px] bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded font-bold dark:bg-zinc-700 dark:text-zinc-300">DEFAULT</span>}
                                            </td>
                                            <td className="p-4 text-xs">
                                                {rule.type === 'FIXED' && <span className="text-zinc-600 dark:text-zinc-400">固定</span>}
                                                {rule.type === 'STEPPED' && <span className="text-zinc-600 dark:text-zinc-400">階段</span>}
                                                {rule.type === 'PERFORMANCE' && <span className="text-purple-600 dark:text-purple-400 font-bold">成果</span>}
                                                {rule.type === 'LINEAR' && <span className="text-zinc-600 dark:text-zinc-400">従量</span>}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                                                    {rule.clients?.length ? <span>{rule.clients.length} クライアント</span> : null}
                                                    {rule.clients?.length && rule.partners?.length ? <span>・</span> : null}
                                                    {rule.partners?.length ? <span>{rule.partners.length} パートナー</span> : null}
                                                    {!rule.clients?.length && !rule.partners?.length && <span className="italic">汎用</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs font-mono dark:text-zinc-300">
                                                {rule.type === 'FIXED' && <div>売: ¥{rule.fixedPrice?.toLocaleString()} / 原: ¥{rule.fixedCost?.toLocaleString()}</div>}
                                                {rule.type === 'STEPPED' && <div>階段設定あり</div>}
                                                {rule.type === 'PERFORMANCE' && <div>{rule.percentage}% / {rule.costPercentage}%</div>}
                                                {rule.type === 'LINEAR' && <div>¥{rule.incrementalUnitPrice?.toLocaleString()} / {rule.incrementalUnit}分</div>}
                                            </td>
                                            <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)} className="h-8 text-red-500 hover:text-red-700 dark:hover:text-red-400">削除</Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!ruleToDelete} onOpenChange={(open) => !open && setRuleToDelete(null)}>
                <AlertDialogContent className="dark:bg-zinc-900 dark:border-zinc-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-zinc-100">ルールを削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-zinc-400">
                            この操作は取り消せません。このルールは永久に削除されます。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800">削除する</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
