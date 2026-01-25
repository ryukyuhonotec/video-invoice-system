"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getClients, getPartners, getPricingRules, upsertInvoice } from "@/actions/pricing-actions";
import { calculatePrice } from "@/lib/pricing";
import { Invoice, InvoiceItem, Client, Partner, PricingRule, Outsource } from "@/types";
import { PlusCircle, Trash2, Save, Users, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

interface InvoiceFormProps {
    initialData?: Invoice;
    isEditing?: boolean;
}

export default function InvoiceForm({ initialData, isEditing = false }: InvoiceFormProps) {
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedClientId, setSelectedClientId] = useState(initialData?.clientId || "");
    const [selectedSupervisorId, setSelectedSupervisorId] = useState(initialData?.supervisorId || "");
    const [communicationChannel, setCommunicationChannel] = useState(initialData?.communicationChannel || "");
    const [invoiceDate, setInvoiceDate] = useState(initialData?.issueDate || new Date().toISOString().split('T')[0]);

    const [items, setItems] = useState<Partial<InvoiceItem>[]>(
        initialData?.items || [{ id: Math.random().toString(), quantity: 1, duration: 0, productionStatus: 'Pre-Order', outsources: [] }]
    );

    useEffect(() => {
        const loadData = async () => {
            const [cData, pData, rData] = await Promise.all([
                getClients(),
                getPartners(),
                getPricingRules()
            ]);
            setClients(cData as any);
            setPartners(pData as any);
            setPricingRules(rData as any);
            setIsLoading(false);
        };
        loadData();
    }, []);

    // Derived: Selected client rules + generic rules
    const availableRules = useMemo(() => {
        return pricingRules.filter(r =>
            (r.clients?.some(c => c.id === selectedClientId) || (!r.clients?.length && r.isDefault))
        );
    }, [pricingRules, selectedClientId]);

    const handleAddItem = () => {
        setItems([...items, { id: Math.random().toString(), quantity: 1, duration: 0, productionStatus: 'Pre-Order', outsources: [] }]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const addOutsource = (index: number) => {
        const newItems = [...items];
        const item = { ...newItems[index] };
        const currentOutsources = item.outsources || [];
        item.outsources = [...currentOutsources, { id: `new-${Date.now()}`, partnerId: "", amount: 0, status: "Pending" } as any];
        newItems[index] = item;
        setItems(newItems);
    };

    const removeOutsource = (itemIndex: number, outsourceIndex: number) => {
        const newItems = [...items];
        const item = { ...newItems[itemIndex] };
        const newOutsources = [...(item.outsources || [])];
        newOutsources.splice(outsourceIndex, 1);
        item.outsources = newOutsources;
        newItems[itemIndex] = item;
        setItems(newItems);
    };

    const updateOutsource = (itemIndex: number, outsourceIndex: number, field: keyof Outsource, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[itemIndex] };
        const newOutsources = [...(item.outsources || [])];
        const outsource = { ...newOutsources[outsourceIndex], [field]: value };

        // Auto-calculate COST based on partner rule if needed
        if (field === 'partnerId') {
            const partner = partners.find(p => p.id === value);
            if (partner && partner.costRules && partner.costRules.length > 0) {
                let costRule = partner.costRules.find(r => r.clients?.some(c => c.id === selectedClientId));
                if (!costRule) costRule = partner.costRules.find(r => !r.clients?.length && r.isDefault);
                if (!costRule) costRule = partner.costRules[0];

                if (costRule) {
                    outsource.amount = calculatePrice(costRule, item.duration || 0);
                }
            }
        }

        newOutsources[outsourceIndex] = outsource;
        item.outsources = newOutsources;
        newItems[itemIndex] = item;
        setItems(newItems);
    };

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index], [field]: value };
        const duration = field === 'duration' ? Number(value) : Number(item.duration || 0);

        // Auto-calculate PRICE (Revenue)
        if (field === 'pricingRuleId' || field === 'duration' || field === 'quantity' || field === 'unitPrice') {
            const ruleId = field === 'pricingRuleId' ? value : item.pricingRuleId;
            if (ruleId) {
                const rule = pricingRules.find(r => r.id === ruleId);
                if (rule) {
                    item.unitPrice = calculatePrice(rule, duration);
                    item.amount = (item.unitPrice || 0) * (item.quantity || 1);
                }
            } else if (field === 'unitPrice') {
                item.unitPrice = Number(value);
                item.amount = (item.unitPrice || 0) * (item.quantity || 1);
            }
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalCost = items.reduce((sum, item) => {
        const itemCost = (item.outsources || []).reduce((isum, o) => isum + (Number(o.amount) || 0), 0);
        return sum + itemCost;
    }, 0);
    const estimatedProfit = totalAmount - totalCost;
    const profitMargin = totalAmount > 0 ? (estimatedProfit / totalAmount) * 100 : 0;

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const dataToSave = {
                id: initialData?.id,
                clientId: selectedClientId,
                supervisorId: selectedSupervisorId,
                communicationChannel,
                issueDate: invoiceDate,
                items,
                subtotal: totalAmount,
                totalAmount,
                totalCost,
                profit: estimatedProfit,
                profitMargin
            };

            await upsertInvoice(dataToSave);
            alert(isEditing ? "案件情報を更新しました" : "新しい案件を作成しました");
            router.push("/");
        } catch (e) {
            console.error(e);
            alert("保存中にエラーが発生しました。");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-8">読み込み中...</div>;

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>案件基本情報</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>クライアント</Label>
                        <Select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}>
                            <option value="">選択してください...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>統括マネージャー</Label>
                        <Select value={selectedSupervisorId} onChange={(e) => setSelectedSupervisorId(e.target.value)}>
                            <option value="">未定</option>
                            <option value="s1">田中 統括</option>
                            <option value="s2">山本 マネージャー</option>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center text-lg">
                        <span>制作内容・発注管理</span>
                        <Button size="sm" onClick={handleAddItem} variant="outline">
                            <PlusCircle className="mr-2 h-4 w-4" /> 行を追加
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {items.map((item, index) => (
                        <div key={item.id} className="border rounded-lg bg-zinc-50/30 overflow-hidden">
                            <div className="p-4 grid grid-cols-12 gap-4 items-end bg-zinc-50 border-b">
                                <div className="col-span-12 md:col-span-3 space-y-2">
                                    <Label className="text-xs">品目名</Label>
                                    <Input value={item.name || ""} onChange={(e) => updateItem(index, 'name', e.target.value)} />
                                </div>
                                <div className="col-span-12 md:col-span-3 space-y-2">
                                    <Label className="text-xs">料金ルール</Label>
                                    <Select value={item.pricingRuleId || ""} onChange={(e) => updateItem(index, 'pricingRuleId', e.target.value)}>
                                        <option value="">マニュアル入力...</option>
                                        {availableRules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </Select>
                                </div>
                                <div className="col-span-4 md:col-span-2 space-y-2">
                                    <Label className="text-xs">尺 (分)</Label>
                                    <Input type="number" step="0.1" value={item.duration || ""} onChange={(e) => updateItem(index, 'duration', e.target.value)} />
                                </div>
                                <div className="col-span-8 md:col-span-2 space-y-2">
                                    <Label className="text-xs">受注金額</Label>
                                    <div className="flex h-10 w-full rounded-md border bg-white px-3 items-center justify-end font-mono">
                                        ¥{item.amount?.toLocaleString()}
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-2 flex justify-end">
                                    <Button size="icon" variant="ghost" className="text-red-400" onClick={() => handleRemoveItem(index)} disabled={items.length === 1}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                                        <Users className="w-3 h-3" /> 発注先アサイン (Outsourcing)
                                    </Label>
                                    <Button size="sm" variant="ghost" className="text-[10px] h-7 px-2" onClick={() => addOutsource(index)}>
                                        <UserPlus className="w-3 h-3 mr-1" /> パートナーを追加
                                    </Button>
                                </div>

                                {(!item.outsources || item.outsources.length === 0) && (
                                    <p className="text-[10px] text-zinc-400 italic text-center py-2">発注先が設定されていません</p>
                                )}

                                {item.outsources?.map((outsource, oIndex) => (
                                    <div key={outsource.id} className="grid grid-cols-12 gap-2 items-center bg-white p-2 border rounded-md shadow-sm">
                                        <div className="col-span-12 md:col-span-3">
                                            <Select className="text-xs h-8" value={outsource.partnerId} onChange={(e) => updateOutsource(index, oIndex, 'partnerId', e.target.value)}>
                                                <option value="">パートナー選択...</option>
                                                {partners.map(p => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
                                            </Select>
                                        </div>
                                        <div className="col-span-12 md:col-span-3">
                                            <Input className="text-xs h-8" placeholder="内容 (例: YouTube編集)" value={outsource.description || ""} onChange={(e) => updateOutsource(index, oIndex, 'description', e.target.value)} />
                                        </div>
                                        <div className="col-span-6 md:col-span-2">
                                            <Input className="text-xs h-8 text-right" type="number" placeholder="発注額" value={outsource.amount || ""} onChange={(e) => updateOutsource(index, oIndex, 'amount', e.target.value)} />
                                        </div>
                                        <div className="col-span-6 md:col-span-3 flex gap-2">
                                            <Select className="text-[10px] h-8 flex-1" value={outsource.status} onChange={(e) => updateOutsource(index, oIndex, 'status', e.target.value)}>
                                                <option value="Pending">未発注</option>
                                                <option value="Ordered">発注済</option>
                                                <option value="Completed">納品済</option>
                                                <option value="Paid">支払済</option>
                                            </Select>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400" onClick={() => removeOutsource(index, oIndex)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
                <CardFooter className="flex justify-end p-6 border-t bg-zinc-50 gap-8">
                    <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase">Revenue</div>
                        <div className="text-2xl font-bold">¥{totalAmount.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase text-red-400">Outsource Cost</div>
                        <div className="text-2xl font-bold text-red-500">¥{totalCost.toLocaleString()}</div>
                    </div>
                    <div className="text-right border-l pl-8">
                        <div className="text-xs text-muted-foreground uppercase text-green-400">Profit ({profitMargin.toFixed(1)}%)</div>
                        <div className={`text-2xl font-bold ${profitMargin > 30 ? 'text-green-600' : 'text-orange-600'}`}>
                            ¥{estimatedProfit.toLocaleString()}
                        </div>
                    </div>
                </CardFooter>
            </Card>

            <div className="flex justify-end gap-4 p-4">
                <Button variant="outline" onClick={() => router.back()}>戻る</Button>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" /> 案件を保存
                </Button>
            </div>
        </div>
    );
}
