"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getPricingRules, upsertPricingRule, deletePricingRule, getClients, getPartners } from "@/actions/pricing-actions";
import { PricingRule, Client, Partner, PricingType, PricingStep } from "@/types";

export default function PricingRulesPage() {
    const [rules, setRules] = useState<PricingRule[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editingRule, setEditingRule] = useState<Partial<PricingRule> & { clientIds?: string[], partnerIds?: string[] }>({
        type: 'FIXED',
        isDefault: false,
        clientIds: [],
        partnerIds: []
    });

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

        setEditingRule({
            ...rule,
            steps: parsedSteps,
            clientIds: rule.clients?.map(c => c.id) || [],
            partnerIds: rule.partners?.map(p => p.id) || []
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editingRule.name) return;

        setIsLoading(true);
        // Prepare data for server action
        const dataToSave = {
            ...editingRule,
            // Prisma upsert needs clientIds/partnerIds for the server action we wrote
        };

        await upsertPricingRule(dataToSave);
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
                    <h1 className="text-3xl font-bold tracking-tight">料金ルール管理</h1>
                    <p className="text-zinc-500">クライアント（売上）またはパートナー（原価）ごとの料金体系を設定します。</p>
                </div>
                <Button onClick={handleAddNew}>+ ルール追加</Button>
            </header>

            {isEditing && (
                <Card className="mb-8 border-blue-200 bg-blue-50/20">
                    <CardHeader>
                        <CardTitle>{editingRule.id ? "ルール編集" : "新規ルール作成"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>ルール名</Label>
                                <Input
                                    value={editingRule.name || ""}
                                    onChange={e => setEditingRule({ ...editingRule, name: e.target.value })}
                                    placeholder="例: 標準撮影費用"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>説明</Label>
                                <Input
                                    value={editingRule.description || ""}
                                    onChange={e => setEditingRule({ ...editingRule, description: e.target.value })}
                                    placeholder="ルールの詳細説明"
                                />
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>適用先クライアント (売上ルール・複数可)</Label>
                                <div className="border rounded-md p-3 bg-white max-h-40 overflow-y-auto space-y-2">
                                    {clients.length === 0 && <p className="text-xs text-zinc-400">登録されたクライアントがありません</p>}
                                    {clients.map(c => (
                                        <div key={c.id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`c-${c.id}`}
                                                checked={editingRule.clientIds?.includes(c.id)}
                                                onChange={() => toggleClientId(c.id)}
                                            />
                                            <label htmlFor={`c-${c.id}`} className="text-sm cursor-pointer">{c.name}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>適用先パートナー (原価ルール・複数可)</Label>
                                <div className="border rounded-md p-3 bg-white max-h-40 overflow-y-auto space-y-2">
                                    {partners.length === 0 && <p className="text-xs text-zinc-400">登録されたパートナーがありません</p>}
                                    {partners.map(p => (
                                        <div key={p.id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`p-${p.id}`}
                                                checked={editingRule.partnerIds?.includes(p.id)}
                                                onChange={() => togglePartnerId(p.id)}
                                            />
                                            <label htmlFor={`p-${p.id}`} className="text-sm cursor-pointer">{p.name}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>料金タイプ</Label>
                            <Select
                                value={editingRule.type}
                                onChange={e => setEditingRule({ ...editingRule, type: e.target.value as PricingType })}
                            >
                                <option value="FIXED">固定料金</option>
                                <option value="STEPPED">階段式 (尺に応じて段階的)</option>
                                <option value="LINEAR">従量課金 (尺に比例)</option>
                            </Select>
                        </div>

                        {editingRule.type === 'FIXED' && (
                            <div className="space-y-2">
                                <Label>単価 (円)</Label>
                                <Input
                                    type="number"
                                    value={editingRule.fixedPrice || 0}
                                    onChange={e => setEditingRule({ ...editingRule, fixedPrice: parseFloat(e.target.value) })}
                                    placeholder="10000"
                                />
                            </div>
                        )}

                        {editingRule.type === 'STEPPED' && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>階段設定</Label>
                                    <Button size="sm" variant="outline" onClick={addStep}>+ 段階追加</Button>
                                </div>
                                {((editingRule.steps as PricingStep[]) || []).map((step, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <Input
                                            type="number"
                                            value={step.upTo}
                                            onChange={e => updateStep(index, 'upTo', parseFloat(e.target.value))}
                                            placeholder="尺 (分)"
                                            className="w-32"
                                        />
                                        <span>分まで</span>
                                        <Input
                                            type="number"
                                            value={step.price}
                                            onChange={e => updateStep(index, 'price', parseFloat(e.target.value))}
                                            placeholder="料金 (円)"
                                            className="flex-1"
                                        />
                                        <Button size="sm" variant="ghost" onClick={() => removeStep(index)}>削除</Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {editingRule.type === 'LINEAR' && (
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>基準尺 (分)</Label>
                                    <Input
                                        type="number"
                                        value={editingRule.incrementalUnit || 1}
                                        onChange={e => setEditingRule({ ...editingRule, incrementalUnit: parseFloat(e.target.value) })}
                                        placeholder="1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>単価 (円/分)</Label>
                                    <Input
                                        type="number"
                                        value={editingRule.incrementalUnitPrice || 0}
                                        onChange={e => setEditingRule({ ...editingRule, incrementalUnitPrice: parseFloat(e.target.value) })}
                                        placeholder="5000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>適用開始尺 (分)</Label>
                                    <Input
                                        type="number"
                                        value={editingRule.incrementThreshold || 0}
                                        onChange={e => setEditingRule({ ...editingRule, incrementThreshold: parseFloat(e.target.value) })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isDefault"
                                checked={editingRule.isDefault || false}
                                onChange={e => setEditingRule({ ...editingRule, isDefault: e.target.checked })}
                            />
                            <Label htmlFor="isDefault">デフォルトルールとして設定</Label>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>キャンセル</Button>
                            <Button onClick={handleSave} disabled={isLoading}>
                                {isLoading ? "保存中..." : "保存"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>登録済みルール一覧</CardTitle>
                </CardHeader>
                <CardContent>
                    {rules.length === 0 ? (
                        <p className="text-center text-zinc-500 py-8">ルールが登録されていません。「+ ルール追加」から作成してください。</p>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">ルール名</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">タイプ</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">適用対象</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">設定内容</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {rules.map((rule) => {
                                        const clientsCount = rule.clients?.length || 0;
                                        const partnersCount = rule.partners?.length || 0;
                                        return (
                                            <tr key={rule.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle">
                                                    <div className="font-bold">{rule.name}</div>
                                                    {rule.description && <div className="text-xs text-muted-foreground">{rule.description}</div>}
                                                    {rule.isDefault && <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">デフォルト</span>}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {rule.type === 'FIXED' && '固定料金'}
                                                    {rule.type === 'STEPPED' && '階段式'}
                                                    {rule.type === 'LINEAR' && '従量課金'}
                                                </td>
                                                <td className="p-4 align-middle max-w-[200px]">
                                                    <div className="flex flex-wrap gap-1">
                                                        {clientsCount > 0 && (
                                                            <span className="text-blue-600 text-[10px] bg-blue-50 px-1 rounded">🏢 {clientsCount}社</span>
                                                        )}
                                                        {partnersCount > 0 && (
                                                            <span className="text-purple-600 text-[10px] bg-purple-50 px-1 rounded">👥 {partnersCount}名</span>
                                                        )}
                                                        {clientsCount === 0 && partnersCount === 0 && (
                                                            <span className="text-zinc-500 text-[10px] bg-zinc-50 px-1 rounded">全般</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-400 mt-1 truncate">
                                                        {[...(rule.clients || []).map(c => c.name), ...(rule.partners || []).map(p => p.name)].join(', ')}
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle text-sm">
                                                    {rule.type === 'FIXED' && `¥${rule.fixedPrice?.toLocaleString()}`}
                                                    {rule.type === 'STEPPED' && `${(typeof rule.steps === 'string' ? JSON.parse(rule.steps) : (rule.steps || [])).length || 0}段階設定`}
                                                    {rule.type === 'LINEAR' && `¥${rule.incrementalUnitPrice?.toLocaleString()}/${rule.incrementalUnit}分`}
                                                </td>
                                                <td className="p-4 align-middle text-right space-x-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleEdit(rule)}>編集</Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)}>削除</Button>
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
        </div>
    );
}
