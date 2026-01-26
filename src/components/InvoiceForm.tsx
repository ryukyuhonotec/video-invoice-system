"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getClients, getPartners, getPricingRules, upsertInvoice, getSupervisors } from "@/actions/pricing-actions";
import { calculatePrice } from "@/lib/pricing";
import { Invoice, InvoiceItem, Client, Partner, PricingRule, Outsource, Supervisor } from "@/types";
import { PlusCircle, Trash2, Save, Users, UserPlus, Calendar, CheckCircle2 } from "lucide-react";
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
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedClientId, setSelectedClientId] = useState(initialData?.clientId || "");
    const [selectedSupervisorId, setSelectedSupervisorId] = useState(initialData?.supervisorId || "");
    const [communicationChannel, setCommunicationChannel] = useState(initialData?.communicationChannel || "");
    const [invoiceDate, setInvoiceDate] = useState(initialData?.issueDate || new Date().toISOString().split('T')[0]);

    const [items, setItems] = useState<Partial<InvoiceItem>[]>(
        initialData?.items || [{ id: Math.random().toString(), name: "", quantity: 1, duration: 0, productionStatus: 'Pre-Order', outsources: [] }]
    );

    useEffect(() => {
        const loadData = async () => {
            const [cData, pData, rData, sData] = await Promise.all([
                getClients(),
                getPartners(),
                getPricingRules(),
                getSupervisors()
            ]);
            setClients(cData as any);
            setPartners(pData as any);
            setPricingRules(rData as any);
            setSupervisors(sData as any);
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
        setItems([...items, { id: Math.random().toString(), name: "", quantity: 1, duration: 0, productionStatus: 'Pre-Order', outsources: [] }]);
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
            if (partner && partner.pricingRules && partner.pricingRules.length > 0) {
                let costRule = partner.pricingRules.find(r => r.clients?.some(c => c.id === selectedClientId));
                if (!costRule) costRule = partner.pricingRules.find(r => !r.clients?.length && r.isDefault);
                if (!costRule) costRule = partner.pricingRules[0];

                if (costRule) {
                    // Use cost fields from PricingRule if available, otherwise fallback to revenue fields
                    const revenue = calculatePrice(costRule, item.duration || 0);
                    // Mock calculation for experimental cost settings
                    outsource.amount = costRule.fixedCost || revenue * 0.7;
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
        if (!selectedClientId) {
            alert("クライアントを選択してください");
            return;
        }
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
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="bg-zinc-50/50">
                    <CardTitle className="text-lg">案件基本情報</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-3 p-6">
                    <div className="space-y-2">
                        <Label className="text-zinc-600 font-bold">クライアント</Label>
                        <Select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="bg-white border-zinc-300">
                            <option value="">選択してください...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-zinc-600 font-bold">統括マネージャー</Label>
                        <Select value={selectedSupervisorId} onChange={(e) => setSelectedSupervisorId(e.target.value)} className="bg-white border-zinc-300">
                            <option value="">未定</option>
                            {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-zinc-600 font-bold">発行日 (案件開始日)</Label>
                        <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="bg-white border-zinc-300" />
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-xl font-bold tracking-tight">制作内容・構成</h2>
                    <Button onClick={handleAddItem} variant="outline" className="bg-white hover:bg-zinc-50">
                        <PlusCircle className="mr-2 h-4 w-4" /> 品目行を追加
                    </Button>
                </div>

                {items.map((item, index) => (
                    <Card key={item.id} className="overflow-hidden shadow-md border-zinc-200">
                        {/* Item Revenue Header */}
                        <div className="p-4 bg-zinc-800 text-white grid grid-cols-12 gap-4 items-end">
                            <div className="col-span-12 md:col-span-3 space-y-1">
                                <Label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">品目・案件名</Label>
                                <Input
                                    value={item.name || ""}
                                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                                    className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-500 h-9"
                                    placeholder="動画制作 A"
                                />
                            </div>
                            <div className="col-span-12 md:col-span-3 space-y-1">
                                <Label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">料金ルール適用</Label>
                                <Select
                                    value={item.pricingRuleId || ""}
                                    onChange={(e) => updateItem(index, 'pricingRuleId', e.target.value)}
                                    className="bg-zinc-700/50 border-zinc-600 text-white h-9"
                                >
                                    <option value="">マニュアル入力...</option>
                                    {availableRules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </Select>
                            </div>
                            <div className="col-span-4 md:col-span-2 space-y-1">
                                <Label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">尺 (分)</Label>
                                <Input type="number" step="0.1" value={item.duration || ""} onChange={(e) => updateItem(index, 'duration', e.target.value)} className="bg-zinc-700/50 border-zinc-600 h-9" />
                            </div>
                            <div className="col-span-8 md:col-span-3 space-y-1">
                                <Label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider text-green-400">受注売上額 (Revenue)</Label>
                                <div className="flex h-9 w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 items-center justify-end font-mono text-green-400 font-bold">
                                    ¥{item.amount?.toLocaleString()}
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-1 flex justify-end">
                                <Button size="icon" variant="ghost" className="text-zinc-500 hover:text-red-400 h-9 w-9" onClick={() => handleRemoveItem(index)} disabled={items.length === 1}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Item Delivery & Status */}
                        <div className="px-4 py-3 bg-zinc-100/80 border-b flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-zinc-500" />
                                <Label className="text-xs font-bold text-zinc-600">納期 (Delivery):</Label>
                                <Input
                                    type="date"
                                    value={item.deliveryDate || ""}
                                    onChange={(e) => updateItem(index, 'deliveryDate', e.target.value)}
                                    className="h-8 py-0 px-2 text-xs w-36 bg-white border-zinc-300"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-zinc-500" />
                                <Label className="text-xs font-bold text-zinc-600">進捗 (Status):</Label>
                                <Select
                                    value={item.productionStatus}
                                    onChange={(e) => updateItem(index, 'productionStatus', e.target.value)}
                                    className="h-8 py-0 text-xs w-32 bg-white border-zinc-300"
                                >
                                    <option value="Pre-Order">受注前</option>
                                    <option value="In Progress">制作中</option>
                                    <option value="Review">確認中</option>
                                    <option value="Delivered">納品済</option>
                                    <option value="Paid">支払完了</option>
                                </Select>
                            </div>
                        </div>

                        {/* Cost Management Section */}
                        <CardContent className="bg-white p-4 space-y-3">
                            <div className="flex items-center justify-between border-b pb-2">
                                <Label className="text-xs font-black text-zinc-800 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-500" /> 発注管理・パートナーアサイン
                                </Label>
                                <Button size="sm" variant="outline" className="text-[10px] h-7 px-3 border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => addOutsource(index)}>
                                    <UserPlus className="w-3 h-3 mr-1" /> パートナーを追加
                                </Button>
                            </div>

                            {(!item.outsources || item.outsources.length === 0) && (
                                <p className="text-xs text-zinc-400 italic text-center py-4 bg-zinc-50 rounded-md border border-dashed">
                                    パートナーがアサインされていません。「パートナーを追加」ボタンから設定してください。
                                </p>
                            )}

                            <div className="space-y-2">
                                {item.outsources?.map((outsource, oIndex) => (
                                    <div key={outsource.id} className="grid grid-cols-12 gap-3 items-center bg-zinc-50 p-3 border rounded-lg hover:border-zinc-300 transition-all">
                                        <div className="col-span-12 md:col-span-3 space-y-1">
                                            <Label className="text-[9px] font-bold text-zinc-500 uppercase">担当パートナー</Label>
                                            <Select className="text-xs h-9 bg-white" value={outsource.partnerId} onChange={(e) => updateOutsource(index, oIndex, 'partnerId', e.target.value)}>
                                                <option value="">選択してください...</option>
                                                {partners.map(p => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
                                            </Select>
                                        </div>
                                        <div className="col-span-12 md:col-span-3 space-y-1">
                                            <Label className="text-[9px] font-bold text-zinc-500 uppercase">内容・備考</Label>
                                            <Input className="text-xs h-9 bg-white" placeholder="YouTube編集、サムネイル等" value={outsource.description || ""} onChange={(e) => updateOutsource(index, oIndex, 'description', e.target.value)} />
                                        </div>
                                        <div className="col-span-6 md:col-span-2 space-y-1">
                                            <Label className="text-[9px] font-bold text-zinc-500 uppercase text-red-500">発注金額</Label>
                                            <Input className="text-xs h-9 text-right font-mono bg-white border-red-100 focus:border-red-400" type="number" value={outsource.amount || ""} onChange={(e) => updateOutsource(index, oIndex, 'amount', e.target.value)} />
                                        </div>
                                        <div className="col-span-6 md:col-span-4 flex gap-2 items-end">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-[9px] font-bold text-zinc-500 uppercase">支払ステータス</Label>
                                                <Select className="text-[10px] h-9 bg-white" value={outsource.status} onChange={(e) => updateOutsource(index, oIndex, 'status', e.target.value)}>
                                                    <option value="Pending">未発注</option>
                                                    <option value="Ordered">発注済</option>
                                                    <option value="Completed">納品済</option>
                                                    <option value="Paid">支払済</option>
                                                </Select>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-9 w-9 text-zinc-300 hover:text-red-500" onClick={() => removeOutsource(index, oIndex)}>
                                                <Trash2 className="h-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="shadow-lg border-zinc-300 overflow-hidden">
                <CardFooter className="flex flex-wrap justify-end p-8 bg-zinc-900 text-white gap-x-12 gap-y-4">
                    <div className="flex flex-col items-end">
                        <div className="text-[10px] text-zinc-400 uppercase font-black tracking-widest border-b border-zinc-700 w-full text-right pb-1 mb-2">Total Revenue</div>
                        <div className="text-3xl font-mono text-white">¥{totalAmount.toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-[10px] text-red-400 uppercase font-black tracking-widest border-b border-red-900 w-full text-right pb-1 mb-2">Total Cost</div>
                        <div className="text-3xl font-mono text-red-400">¥{totalCost.toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col items-end border-l border-zinc-700 pl-12">
                        <div className="text-[10px] text-green-400 uppercase font-black tracking-widest border-b border-green-900 w-full text-right pb-1 mb-2">Estimated Profit</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-[10px] text-zinc-500">Margin: {profitMargin.toFixed(1)}%</span>
                            <div className={`text-3xl font-mono font-bold ${profitMargin > 30 ? 'text-green-500' : 'text-orange-500'}`}>
                                ¥{estimatedProfit.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </CardFooter>
            </Card>

            <div className="flex justify-end gap-4 p-4 mb-20">
                <Button variant="ghost" size="lg" onClick={() => router.back()}>変更を破棄して戻る</Button>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-14 text-lg font-bold shadow-xl" onClick={handleSave} disabled={isLoading}>
                    <Save className="mr-2 h-6 w-6" /> 案件情報を保存
                </Button>
            </div>
        </div>
    );
}

