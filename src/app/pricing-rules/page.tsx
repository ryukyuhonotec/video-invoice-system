"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getPricingRules, upsertPricingRule, deletePricingRule, getClients, getPartners } from "@/actions/pricing-actions";
import { PricingRule, Client, Partner, PricingType, PricingStep } from "@/types";
import { Search, Plus } from "lucide-react";

export default function PricingRulesPage() {
    const [rules, setRules] = useState<PricingRule[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isClientListOpen, setIsClientListOpen] = useState(false);
    const [isPartnerListOpen, setIsPartnerListOpen] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editingRule, setEditingRule] = useState<Partial<PricingRule> & { clientIds?: string[], partnerIds?: string[] }>({
        type: 'FIXED',
        isDefault: false,
        clientIds: [],
        partnerIds: []
    });

    // Search states for selection
    const [clientSearch, setClientSearch] = useState("");
    const [partnerSearch, setPartnerSearch] = useState("");
    const [ruleSearch, setRuleSearch] = useState("");

    useEffect(() => {
        const loadData = async () => {
            const [rulesData, clientsData, partnersData] = await Promise.all([
                getPricingRules(),
                getClients(),
                getPartners()
            ]);
            setRules(rulesData as any);
            setClients(clientsData as any);
            setPartners(partnersData as any);
            setIsLoading(false);
        };
        loadData();
    }, []);

    const handleAddNew = () => {
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

        setEditingRule({
            ...rule,
            steps: parsedSteps,
            costSteps: parsedCostSteps,
            clientIds: rule.clients?.map(c => c.id) || [],
            partnerIds: rule.partners?.map(p => p.id) || []
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editingRule.name) return;

        setIsLoading(true);
        await upsertPricingRule(editingRule);
        const updatedRules = await getPricingRules();
        setRules(updatedRules as any);
        setIsEditing(false);
        setIsLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('このルールを削除してもよろしいですか?')) {
            setIsLoading(true);
            await deletePricingRule(id);
            const updatedRules = await getPricingRules();
            setRules(updatedRules as any);
            setIsLoading(false);
        }
    };

    const toggleClientId = (id: string) => {
        const current = editingRule.clientIds || [];
        if (current.includes(id)) {
            setEditingRule({ ...editingRule, clientIds: current.filter(cid => cid !== id) });
        } else {
            setEditingRule({ ...editingRule, clientIds: [...current, id] });
        }
    };

    const togglePartnerId = (id: string) => {
        const current = editingRule.partnerIds || [];
        if (current.includes(id)) {
            setEditingRule({ ...editingRule, partnerIds: current.filter(pid => pid !== id) });
        } else {
            setEditingRule({ ...editingRule, partnerIds: [...current, id] });
        }
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

    if (isLoading && rules.length === 0) {
        return <div className="container mx-auto p-4 md:p-8">読み込み中...</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight dark:text-zinc-50">料金ルール管理</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">クライアント（売上）またはパートナー（原価）ごとの料金体系を設定します。</p>
                </div>
                <Button onClick={handleAddNew}>+ ルール追加</Button>
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

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2 relative">
                                <Label className="font-bold text-blue-700 dark:text-blue-400">適用先クライアント (売上ルール)</Label>
                                <div className="border rounded-md bg-white dark:bg-zinc-900 dark:border-zinc-700 shadow-inner">
                                    <div className="p-3 border-b dark:border-zinc-700 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800" onClick={() => setIsClientListOpen(!isClientListOpen)}>
                                        <span className={`text-sm font-bold ${editingRule.clientIds?.length ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                            {editingRule.clientIds?.length ? `${editingRule.clientIds.length}社 選択中` : "選択してください"}
                                        </span>
                                        <Button size="sm" variant="ghost" className="h-6 text-xs text-blue-500">{isClientListOpen ? "閉じる" : "開く"}</Button>
                                    </div>
                                    {isClientListOpen && (
                                        <div className="p-2">
                                            <Input className="h-9 mb-2 dark:bg-zinc-800 dark:text-zinc-100" placeholder="検索..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
                                            <div className="max-h-48 overflow-y-auto p-1 space-y-1 bg-zinc-50 dark:bg-zinc-900">
                                                {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                                                    <div key={c.id} className={`flex items-center gap-2 p-2 rounded border transition-colors cursor-pointer ${editingRule.clientIds?.includes(c.id) ? 'bg-blue-100 border-blue-400 text-blue-900 shadow-sm dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700' : 'bg-white border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-700 dark:text-zinc-300'}`} onClick={() => toggleClientId(c.id)}>
                                                        <input type="checkbox" checked={editingRule.clientIds?.includes(c.id)} onChange={() => { }} className="h-4 w-4 rounded border-zinc-300 text-blue-600" />
                                                        <span className="text-sm font-medium">{c.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2 relative">
                                <Label className="font-bold text-purple-700 dark:text-purple-400">適用先パートナー (原価ルール)</Label>
                                <div className="border rounded-md bg-white dark:bg-zinc-900 dark:border-zinc-700 shadow-inner">
                                    <div className="p-3 border-b dark:border-zinc-700 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800" onClick={() => setIsPartnerListOpen(!isPartnerListOpen)}>
                                        <span className={`text-sm font-bold ${editingRule.partnerIds?.length ? 'text-purple-700 dark:text-purple-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                            {editingRule.partnerIds?.length ? `${editingRule.partnerIds.length}名 選択中` : "選択してください"}
                                        </span>
                                        <Button size="sm" variant="ghost" className="h-6 text-xs text-blue-500">{isPartnerListOpen ? "閉じる" : "開く"}</Button>
                                    </div>
                                    {isPartnerListOpen && (
                                        <div className="p-2">
                                            <Input className="h-9 mb-2 dark:bg-zinc-800 dark:text-zinc-100" placeholder="検索..." value={partnerSearch} onChange={e => setPartnerSearch(e.target.value)} />
                                            <div className="max-h-48 overflow-y-auto p-1 space-y-1 bg-zinc-50 dark:bg-zinc-900">
                                                {partners.filter(p => p.name.toLowerCase().includes(partnerSearch.toLowerCase())).map(p => (
                                                    <div key={p.id} className={`flex items-center gap-2 p-2 rounded border transition-colors cursor-pointer ${editingRule.partnerIds?.includes(p.id) ? 'bg-purple-100 border-purple-400 text-purple-900 shadow-sm dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700' : 'bg-white border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-700 dark:text-zinc-300'}`} onClick={() => togglePartnerId(p.id)}>
                                                        <input type="checkbox" checked={editingRule.partnerIds?.includes(p.id)} onChange={() => { }} className="h-4 w-4 rounded border-zinc-300 text-purple-600" />
                                                        <span className="text-sm font-medium">{p.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4 border p-4 rounded-lg bg-white dark:bg-zinc-900 dark:border-zinc-700 shadow-sm">
                                <h3 className="font-bold text-blue-700 dark:text-blue-400 border-b dark:border-zinc-700 pb-2 flex justify-between items-center">
                                    受注価格設定 (Revenue)
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="dark:text-zinc-200">料金タイプ</Label>
                                        <Select value={editingRule.type} onChange={e => setEditingRule({ ...editingRule, type: e.target.value as PricingType })}>
                                            <option value="FIXED">固定料金</option>
                                            <option value="STEPPED">階段式 (尺に応じる)</option>
                                            <option value="LINEAR">従量課金 (尺に比例)</option>
                                        </Select>
                                    </div>
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
                                            {((editingRule.steps as PricingStep[]) || []).map((step, index) => (
                                                <div key={index} className="flex gap-1 items-center">
                                                    <Input type="number" value={step.upTo} onChange={e => updateStep(index, 'upTo', parseFloat(e.target.value))} className="w-20 h-8 text-xs" />
                                                    <span className="text-[10px]">分迄</span>
                                                    <Input type="number" value={step.price} onChange={e => updateStep(index, 'price', parseFloat(e.target.value))} className="flex-1 h-8 text-xs" />
                                                    <Button size="sm" variant="ghost" onClick={() => removeStep(index)}>×</Button>
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
                                </div>
                            </div>

                            <div className="space-y-4 border p-4 rounded-lg bg-white dark:bg-zinc-900 dark:border-zinc-700 shadow-sm">
                                <h3 className="font-bold text-red-700 dark:text-red-400 border-b dark:border-zinc-700 pb-2 flex justify-between items-center">
                                    発注原価設定 (Cost)
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
                                            {((editingRule.costSteps as any as PricingStep[]) || []).map((step, index) => (
                                                <div key={index} className="flex gap-1 items-center">
                                                    <Input type="number" value={step.upTo} onChange={e => {
                                                        const steps = [...(editingRule.costSteps as any as PricingStep[])];
                                                        steps[index] = { ...steps[index], upTo: parseFloat(e.target.value) };
                                                        setEditingRule({ ...editingRule, costSteps: steps as any });
                                                    }} className="w-20 h-8 text-xs" />
                                                    <span className="text-[10px]">分迄</span>
                                                    <Input type="number" value={step.price} onChange={e => {
                                                        const steps = [...(editingRule.costSteps as any as PricingStep[])];
                                                        steps[index] = { ...steps[index], price: parseFloat(e.target.value) };
                                                        setEditingRule({ ...editingRule, costSteps: steps as any });
                                                    }} className="flex-1 h-8 text-xs" />
                                                    <Button size="sm" variant="ghost" onClick={() => {
                                                        const steps = [...(editingRule.costSteps as any as PricingStep[])];
                                                        steps.splice(index, 1);
                                                        setEditingRule({ ...editingRule, costSteps: steps as any });
                                                    }}>×</Button>
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
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="isDefault" checked={editingRule.isDefault || false} onChange={e => setEditingRule({ ...editingRule, isDefault: e.target.checked })} />
                            <Label htmlFor="isDefault" className="dark:text-zinc-200">デフォルトルールとして設定</Label>
                        </div>

                        <div className="flex justify-end gap-2 border-t pt-4">
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>キャンセル</Button>
                            <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                                {isLoading ? "保存中..." : "保存"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

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
                                {rules.filter(r => {
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
                                            {rule.type === 'LINEAR' && <div>¥{rule.incrementalUnitPrice?.toLocaleString()} / {rule.incrementalUnit}分</div>}
                                        </td>
                                        <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)} className="h-8 text-red-500 hover:text-red-700 dark:hover:text-red-400">削除</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
