"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getClients, getPartners, getPricingRules, upsertInvoice, getStaff } from "@/actions/pricing-actions";
import { calculatePrice } from "@/lib/pricing";
import { Invoice, InvoiceItem, Client, Partner, PricingRule, Outsource, Staff } from "@/types";
import { PlusCircle, Trash2, Save, Users, Calendar, CheckCircle2, ShieldCheck, FileText, Search, Package, ClipboardList } from "lucide-react";
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
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Client search state
    const [clientSearchQuery, setClientSearchQuery] = useState("");
    const [selectedStaffFilter, setSelectedStaffFilter] = useState("");
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const clientSearchRef = useRef<HTMLDivElement>(null);

    const [selectedClientId, setSelectedClientId] = useState(initialData?.clientId || "");
    const [selectedStaffId, setSelectedStaffId] = useState(initialData?.staffId || "");
    const [invoiceDate, setInvoiceDate] = useState(initialData?.issueDate || new Date().toISOString().split('T')[0]);
    const [actualDeliveryDate, setActualDeliveryDate] = useState(initialData?.actualDeliveryDate ? new Date(initialData.actualDeliveryDate).toISOString().split('T')[0] : "");
    const [requestUrl, setRequestUrl] = useState(initialData?.requestUrl || "");
    const [deliveryUrl, setDeliveryUrl] = useState(initialData?.deliveryUrl || "");
    const [invoiceStatus, setInvoiceStatus] = useState(initialData?.status || '受注前');

    // Items state - each item has multiple tasks (outsources)
    const [items, setItems] = useState<Partial<InvoiceItem>[]>(
        initialData?.items || [{
            id: Math.random().toString(),
            name: "",
            quantity: 1,
            duration: "",
            productionStatus: '受注前',
            outsources: [{
                id: `task-${Date.now()}`,
                pricingRuleId: "",
                partnerId: "",
                revenueAmount: 0,
                costAmount: 0,
                deliveryDate: "",
                status: "受注前"
            } as any]
        }]
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (clientSearchRef.current && !clientSearchRef.current.contains(event.target as Node)) {
                setShowClientDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const loadData = async () => {
            const [cData, pData, rData, sData] = await Promise.all([
                getClients(),
                getPartners(),
                getPricingRules(),
                getStaff()
            ]);
            setClients(cData as any);
            setPartners(pData as any);
            setPricingRules(rData as any);
            setStaffList(sData as any);
            setIsLoading(false);
        };
        loadData();
    }, []);

    // Filtered clients based on search and staff filter
    const filteredClients = useMemo(() => {
        let result = clients;
        if (selectedStaffFilter) {
            result = result.filter(c => c.operationsLeadId === selectedStaffFilter);
        }
        if (clientSearchQuery) {
            const query = clientSearchQuery.toLowerCase();
            result = result.filter(c => c.name.toLowerCase().includes(query) || c.code?.toLowerCase().includes(query));
        }
        return result;
    }, [clients, clientSearchQuery, selectedStaffFilter]);

    const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);

    // Available rules for selected client (client-specific + default)
    const availableRules = useMemo(() => {
        return pricingRules.filter(r =>
            (r.clients?.some(c => c.id === selectedClientId) || (!r.clients?.length && r.isDefault))
        );
    }, [pricingRules, selectedClientId]);

    // Operations staff only
    const operationsStaff = useMemo(() => staffList.filter(s => s.role === 'OPERATIONS'), [staffList]);

    // Calculate totals from all tasks
    const { totalRevenue, totalCost, subtotal, tax, estimatedProfit, profitMargin } = useMemo(() => {
        let revenue = 0;
        let cost = 0;
        items.forEach(item => {
            (item.outsources || []).forEach((task: any) => {
                revenue += Number(task.revenueAmount) || 0;
                cost += Number(task.costAmount) || 0;
            });
        });
        const taxAmount = Math.floor(revenue * 0.1);
        const total = revenue + taxAmount;
        const profit = total - cost;
        const margin = total > 0 ? (profit / total) * 100 : 0;
        return { totalRevenue: total, totalCost: cost, subtotal: revenue, tax: taxAmount, estimatedProfit: profit, profitMargin: margin };
    }, [items]);

    // Handler functions
    const handleAddItem = () => {
        setItems([...items, {
            id: Math.random().toString(),
            name: "",
            quantity: 1,
            productionStatus: '受注前',
            outsources: [{
                id: `task-${Date.now()}`,
                pricingRuleId: "",
                partnerId: "",
                revenueAmount: 0,
                costAmount: 0,
                deliveryDate: "",
                status: "受注前"
            } as any]
        }]);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length === 1) return;
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleAddTask = (itemIndex: number) => {
        const newItems = [...items];
        const item = { ...newItems[itemIndex] };
        item.outsources = [...(item.outsources || []), {
            id: `task-${Date.now()}`,
            pricingRuleId: "",
            partnerId: "",
            revenueAmount: 0,
            costAmount: 0,
            deliveryDate: "",
            status: "受注前"
        } as any];
        newItems[itemIndex] = item;
        setItems(newItems);
    };

    const handleRemoveTask = (itemIndex: number, taskIndex: number) => {
        const newItems = [...items];
        const item = { ...newItems[itemIndex] };
        const tasks = [...(item.outsources || [])];
        if (tasks.length === 1) return;
        tasks.splice(taskIndex, 1);
        item.outsources = tasks;
        newItems[itemIndex] = item;
        setItems(newItems);
    };

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const updateTask = (itemIndex: number, taskIndex: number, field: string, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[itemIndex] };
        const tasks = [...(item.outsources || [])];
        const task = { ...tasks[taskIndex], [field]: value };

        // Auto-calculate price when rule or duration changes
        if (field === 'pricingRuleId') {
            const rule = pricingRules.find(r => r.id === value);
            // Use task duration if available, or default
            const duration = task.duration || "0:00";
            if (rule) {
                task.revenueAmount = calculatePrice(rule, duration, 'revenue');
                task.costAmount = calculatePrice(rule, duration, 'cost');
            }
        }

        // Recalculate when duration changes
        if (field === 'duration') {
            const duration = value;
            if (task.pricingRuleId) {
                const rule = pricingRules.find(r => r.id === task.pricingRuleId);
                if (rule) {
                    task.revenueAmount = calculatePrice(rule, duration, 'revenue');
                    task.costAmount = calculatePrice(rule, duration, 'cost');
                }
            }
        }

        tasks[taskIndex] = task;
        item.outsources = tasks;
        newItems[itemIndex] = item;
        setItems(newItems);

        // Recalculate item totals
        const itemRevenue = tasks.reduce((sum, t: any) => sum + (Number(t.revenueAmount) || 0), 0);
        newItems[itemIndex] = { ...newItems[itemIndex], amount: itemRevenue, unitPrice: itemRevenue };
        setItems(newItems);
    };



    const handleSave = async (setDeliveredStatus = false) => {
        if (!selectedClientId) {
            alert("クライアントを選択してください");
            return;
        }
        setIsSaving(true);
        setSaveError(null);
        try {
            const itemsToSave = setDeliveredStatus
                ? items.map(item => ({
                    ...item,
                    productionStatus: '納品済',
                    outsources: (item.outsources || []).map((t: any) => ({ ...t, status: '納品済' }))
                }))
                : items;

            await upsertInvoice({
                id: initialData?.id,
                clientId: selectedClientId,
                staffId: selectedStaffId || null,
                issueDate: invoiceDate,
                actualDeliveryDate: actualDeliveryDate || null,
                requestUrl,
                deliveryUrl,
                status: invoiceStatus,
                items: itemsToSave,
                subtotal,
                tax,
                totalAmount: totalRevenue,
                totalCost,
                profit: estimatedProfit,
                profitMargin
            });
            alert(setDeliveredStatus ? "納品完了しました" : (isEditing ? "案件情報を更新しました" : "新しい案件を作成しました"));
            router.push("/");
        } catch (e: any) {
            console.error("Save error:", e);
            setSaveError(e.message || "保存中にエラーが発生しました。");
        } finally {
            setIsSaving(false);
        }
    };

    // Check if can complete delivery
    const canCompleteDelivery = useMemo(() => {
        const allTasksCompleted = items.every(item =>
            (item.outsources || []).every((task: any) =>
                ['納品済', '請求済', '入金済み', '完了'].includes(task.status)
            )
        );
        return allTasksCompleted && !!deliveryUrl;
    }, [items, deliveryUrl]);

    if (isLoading) return <div className="p-8">読み込み中...</div>;

    return (
        <div className="grid gap-6">
            {saveError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <strong>エラー:</strong> {saveError}
                </div>
            )}

            {/* ===== STEP 1: 案件登録 ===== */}
            <Card className="border-l-4 border-l-blue-500 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-blue-600" />
                        <span className="text-blue-800">Step 1: 案件登録</span>
                        <span className="text-xs text-blue-500 font-normal ml-2">（受注時に入力）</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 p-6">
                    {/* Client Search Row */}
                    <div className="grid md:grid-cols-12 gap-4 items-end" ref={clientSearchRef}>
                        <div className="md:col-span-3 space-y-1">
                            <Label className="text-xs text-zinc-500 dark:text-zinc-400">事業統括で絞込</Label>
                            <Select value={selectedStaffFilter} onChange={(e) => setSelectedStaffFilter(e.target.value)} className="text-sm h-10 bg-white border-blue-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                                <option value="">全員</option>
                                {operationsStaff.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                            </Select>
                        </div>
                        <div className="md:col-span-5 space-y-1 relative">
                            <Label className="text-xs text-zinc-500 dark:text-zinc-400">クライアント検索</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                                <Input
                                    value={clientSearchQuery}
                                    onChange={(e) => { setClientSearchQuery(e.target.value); setShowClientDropdown(true); }}
                                    onFocus={() => setShowClientDropdown(true)}
                                    placeholder="社名で検索..."
                                    className="pl-10 h-10 bg-white border-blue-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                                />
                            </div>
                            {showClientDropdown && (
                                <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-blue-200 rounded-lg shadow-xl dark:bg-zinc-800 dark:border-zinc-700">
                                    {filteredClients.length === 0 ? (
                                        <div className="p-3 text-sm text-zinc-400">該当なし</div>
                                    ) : filteredClients.map(c => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedClientId(c.id);
                                                setClientSearchQuery(c.name);
                                                setShowClientDropdown(false);
                                                if (c.operationsLeadId) setSelectedStaffId(c.operationsLeadId);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-zinc-700 flex justify-between items-center ${selectedClientId === c.id ? 'bg-blue-100 dark:bg-blue-900 font-bold' : 'dark:text-zinc-100'}`}
                                        >
                                            <span>{c.name}</span>
                                            {c.operationsLead && (<span className="text-xs text-blue-500"><ShieldCheck className="w-3 h-3 inline mr-1" />{c.operationsLead.name}</span>)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-4">
                            {selectedClient ? (
                                <div className="h-10 px-4 bg-blue-100 rounded border border-blue-300 flex items-center justify-between dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-100">
                                    <span className="font-bold text-blue-800 dark:text-blue-100 truncate">{selectedClient.name}</span>
                                </div>
                            ) : (
                                <div className="h-10 px-4 bg-zinc-100 rounded border border-dashed border-zinc-300 flex items-center text-zinc-400 text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-500">クライアント未選択</div>
                            )}
                        </div>
                    </div>

                    {/* Date & Status Row */}
                    <div className="grid md:grid-cols-12 gap-4">
                        <div className="md:col-span-2 space-y-1">
                            <Label className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> 案件開始日</Label>
                            <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="h-10 bg-white border-blue-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100" />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                            <Label className="text-xs text-zinc-500 dark:text-zinc-400">案件ステータス</Label>
                            <Select value={invoiceStatus} onChange={(e) => setInvoiceStatus(e.target.value)} className="h-10 bg-white border-blue-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                                <option value="受注前">受注前</option>
                                <option value="進行中">進行中</option>
                                <option value="納品済">納品済</option>
                                <option value="失注">失注</option>
                            </Select>
                        </div>
                        <div className="md:col-span-8 space-y-1">
                            <Label className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1"><FileText className="w-3 h-3" /> 依頼チャットURL</Label>
                            <Input value={requestUrl} onChange={(e) => setRequestUrl(e.target.value)} placeholder="https://chatwork.com/..." className="h-10 bg-white border-blue-200 text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ===== 品目・タスク設定 - Only show when not 受注前 or 失注 ===== */}
            {invoiceStatus !== '失注' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-lg font-bold tracking-tight">📦 品目・タスク設定</h2>
                        <Button onClick={handleAddItem} variant="outline" size="sm" className="bg-white hover:bg-zinc-50">
                            <PlusCircle className="mr-1 h-4 w-4" /> 品目追加
                        </Button>
                    </div>

                    {items.map((item, itemIndex) => (
                        <Card key={item.id} className="overflow-hidden shadow-md border-zinc-200">
                            {/* Item Header */}
                            <div className="p-4 bg-zinc-800 text-white grid grid-cols-12 gap-3 items-end">
                                <div className="col-span-12 md:col-span-8 space-y-1">
                                    <Label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">品目名</Label>
                                    <Input
                                        value={item.name || ""}
                                        onChange={(e) => updateItem(itemIndex, 'name', e.target.value)}
                                        className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-500 h-9"
                                        placeholder="〇〇様 PR動画"
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-3 space-y-1 text-right">
                                    <Label className="text-[10px] text-green-400 uppercase font-bold tracking-wider">合計請求</Label>
                                    <div className="flex h-9 w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 items-center justify-end font-mono text-green-400 font-bold text-sm">
                                        ¥{item.amount?.toLocaleString() || 0}
                                    </div>
                                </div>
                                <div className="col-span-2 md:col-span-1 flex justify-end">
                                    <Button size="icon" variant="ghost" className="text-zinc-500 hover:text-red-400 h-9 w-9" onClick={() => handleRemoveItem(itemIndex)} disabled={items.length === 1}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Tasks (Outsources) */}
                            <CardContent className="bg-white p-4 space-y-3">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <Label className="text-xs font-bold text-zinc-700 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-500" /> タスク（担当領域）
                                    </Label>
                                    <Button size="sm" variant="outline" className="text-[10px] h-7 px-3 border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => handleAddTask(itemIndex)}>
                                        <PlusCircle className="w-3 h-3 mr-1" /> タスク追加
                                    </Button>
                                </div>

                                {(item.outsources || []).map((task: any, taskIndex: number) => {
                                    const selectedRule = pricingRules.find(r => r.id === task.pricingRuleId);
                                    const rulePartners = selectedRule?.partners || [];

                                    return (
                                        <div key={task.id} className="bg-zinc-50 p-3 border rounded-lg space-y-3">

                                            {/* Row 1: Rule, Partner, Status */}
                                            <div className="grid grid-cols-12 gap-3 items-end">
                                                {/* Pricing Rule */}
                                                <div className="col-span-12 md:col-span-4 space-y-1">
                                                    <Label className="text-[9px] font-bold text-zinc-500 uppercase">料金ルール（担当領域）</Label>
                                                    <Select className="text-xs h-9 bg-white" value={task.pricingRuleId || ""} onChange={(e) => updateTask(itemIndex, taskIndex, 'pricingRuleId', e.target.value)}>
                                                        <option value="">選択...</option>
                                                        {availableRules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                                    </Select>
                                                </div>

                                                {/* Partner */}
                                                <div className="col-span-12 md:col-span-4 space-y-1">
                                                    <Label className="text-[9px] font-bold text-zinc-500 uppercase">パートナー</Label>
                                                    <Select className="text-xs h-9 bg-white" value={task.partnerId || ""} onChange={(e) => updateTask(itemIndex, taskIndex, 'partnerId', e.target.value)} disabled={!task.pricingRuleId}>
                                                        <option value="">選択...</option>
                                                        {(rulePartners.length > 0 ? rulePartners : partners).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                    </Select>
                                                </div>

                                                {/* Status - Restrict options for tasks (no Billed/Paid) */}
                                                <div className="col-span-12 md:col-span-3 space-y-1">
                                                    <Label className="text-[9px] font-bold text-zinc-500 uppercase">ステータス</Label>
                                                    <Select className="text-xs h-9 bg-white" value={task.status || "受注前"} onChange={(e) => updateTask(itemIndex, taskIndex, 'status', e.target.value)}>
                                                        <option value="受注前">受注前</option>
                                                        <option value="制作中">制作中</option>
                                                        <option value="確認中">確認中</option>
                                                        <option value="納品済">納品済</option>
                                                    </Select>
                                                </div>

                                                {/* Delete Button placeholder */}
                                                <div className="col-span-12 md:col-span-1 flex justify-end">
                                                    {/* Button code is outside this block in original, but layout needs it here? No, let's keep it clean. */}
                                                </div>
                                            </div>

                                            {/* Row 2: Date, Duration, Revenue, Cost */}
                                            <div className="grid grid-cols-12 gap-3 items-end border-t border-zinc-200 pt-3">
                                                {/* Delivery Date */}
                                                <div className="col-span-6 md:col-span-3 space-y-1">
                                                    <Label className="text-[9px] font-bold text-zinc-500 uppercase">納期</Label>
                                                    <Input
                                                        type="date"
                                                        className="text-xs h-9 bg-white"
                                                        value={task.deliveryDate instanceof Date ? task.deliveryDate.toISOString().split('T')[0] : (task.deliveryDate ? String(task.deliveryDate).split('T')[0] : "")}
                                                        onChange={(e) => updateTask(itemIndex, taskIndex, 'deliveryDate', e.target.value)}
                                                    />
                                                </div>

                                                {/* Duration (尺) */}
                                                <div className="col-span-6 md:col-span-3 space-y-1">
                                                    <Label className="text-[9px] font-bold text-zinc-500 uppercase">尺 (MM:SS)</Label>
                                                    <Input
                                                        className="text-xs h-9 bg-white"
                                                        placeholder="05:00"
                                                        value={task.duration || ""}
                                                        onChange={(e) => updateTask(itemIndex, taskIndex, 'duration', e.target.value)}
                                                    />
                                                </div>

                                                {/* Revenue */}
                                                <div className="col-span-6 md:col-span-2 space-y-1">
                                                    <Label className="text-[9px] font-bold text-green-600 uppercase">請求額</Label>
                                                    <Input className="text-xs h-9 text-right font-mono bg-white border-green-200" type="number" value={task.revenueAmount || ""} onChange={(e) => updateTask(itemIndex, taskIndex, 'revenueAmount', e.target.value)} />
                                                </div>

                                                {/* Cost */}
                                                <div className="col-span-6 md:col-span-2 space-y-1">
                                                    <Label className="text-[9px] font-bold text-red-500 uppercase">原価</Label>
                                                    <Input className="text-xs h-9 text-right font-mono bg-white border-red-100" type="number" value={task.costAmount || ""} onChange={(e) => updateTask(itemIndex, taskIndex, 'costAmount', e.target.value)} />
                                                </div>
                                            </div>

                                            {/* Row 3: Task Delivery URL */}
                                            <div className="grid grid-cols-12 gap-3 items-end border-t border-zinc-200 pt-3">
                                                <div className="col-span-12 space-y-1">
                                                    <Label className="text-[9px] font-bold text-zinc-500 uppercase">タスク納品URL</Label>
                                                    <Input
                                                        className="text-xs h-9 bg-white"
                                                        placeholder="https://drive.google.com/..."
                                                        value={task.deliveryUrl || ""}
                                                        onChange={(e) => updateTask(itemIndex, taskIndex, 'deliveryUrl', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Remove Task */}
                                            {(item.outsources?.length || 0) > 1 && (
                                                <div className="col-span-12 md:col-span-0 flex justify-end">
                                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-zinc-300 hover:text-red-500" onClick={() => handleRemoveTask(itemIndex, taskIndex)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* ===== STEP 2: 納品情報 - Only show when editing ===== */}
            {isEditing && (
                <Card className="border-l-4 border-l-amber-500 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100/50 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="w-5 h-5 text-amber-600" />
                            <span className="text-amber-800">Step 2: 納品情報</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 p-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-zinc-700 flex items-center gap-1"><Calendar className="w-4 h-4" /> 納品完了日</Label>
                                <Input type="date" value={actualDeliveryDate} onChange={(e) => setActualDeliveryDate(e.target.value)} className={`h-10 bg-white ${!actualDeliveryDate ? 'border-amber-400' : 'border-green-400'}`} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-zinc-700 flex items-center gap-1"><FileText className="w-4 h-4" /> 納品URL</Label>
                                <Input type="text" placeholder="https://drive.google.com/..." value={deliveryUrl} onChange={(e) => setDeliveryUrl(e.target.value)} className={`h-10 bg-white text-sm ${!deliveryUrl ? 'border-amber-400' : 'border-green-400'}`} />
                            </div>
                        </div>

                        <div className="flex justify-center pt-4">
                            <Button
                                size="lg"
                                onClick={() => handleSave(true)}
                                disabled={!canCompleteDelivery || isSaving}
                                className={`px-12 h-14 text-lg font-bold shadow-xl ${canCompleteDelivery ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'}`}
                            >
                                <CheckCircle2 className="mr-2 h-6 w-6" /> 納品完了
                            </Button>
                        </div>
                        {!canCompleteDelivery && <p className="text-center text-sm text-amber-600">⚠️ 納品完了には、全タスクの納期・納品URLの入力が必要です</p>}
                    </CardContent>
                </Card>
            )}

            {/* ===== Summary ===== */}
            <Card className="shadow-lg border-zinc-300 overflow-hidden">
                <CardFooter className="flex flex-wrap justify-end p-6 bg-zinc-900 text-white gap-x-8 gap-y-4">
                    <div className="flex flex-col items-end">
                        <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mb-1">売上</div>
                        <div className="text-2xl font-mono text-white">¥{totalRevenue.toLocaleString()}</div>
                        <div className="text-[10px] text-zinc-500">(税込)</div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-[10px] text-red-400 uppercase font-bold tracking-widest mb-1">原価</div>
                        <div className="text-2xl font-mono text-red-400">¥{totalCost.toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col items-end border-l border-zinc-700 pl-8">
                        <div className="text-[10px] text-green-400 uppercase font-bold tracking-widest mb-1">粗利</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs text-zinc-500">{profitMargin.toFixed(0)}%</span>
                            <div className={`text-2xl font-mono font-bold ${profitMargin > 30 ? 'text-green-500' : 'text-orange-500'}`}>
                                ¥{estimatedProfit.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </CardFooter>
            </Card>

            <div className="flex justify-end gap-4 p-4 mb-20">
                <Button variant="ghost" size="lg" onClick={() => router.back()}>戻る</Button>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 font-bold shadow-xl" onClick={() => handleSave(false)} disabled={isSaving}>
                    <Save className="mr-2 h-5 w-5" /> {isSaving ? '保存中...' : '保存'}
                </Button>
            </div>
        </div>
    );
}
