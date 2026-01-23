"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { MOCK_CLIENTS, MOCK_PRICING_RULES, MOCK_PARTNERS } from "@/data/mock";
import { calculatePrice, calculatePartnerCost } from "@/lib/pricing";
import { InvoiceItem, PricingRule } from "@/types";
import { PlusCircle, Trash2 } from "lucide-react";

export default function NewInvoicePage() {
    const [selectedClientId, setSelectedClientId] = useState("");
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

    const [items, setItems] = useState<Partial<InvoiceItem>[]>([
        { id: "1", quantity: 1, duration: 0, productionStatus: 'Pre-Order' }
    ]);

    // Derived state
    const selectedClient = MOCK_CLIENTS.find(c => c.id === selectedClientId);
    const availableRules = selectedClient
        ? MOCK_PRICING_RULES.filter(r => selectedClient.defaultPricingRules?.includes(r.id))
        : MOCK_PRICING_RULES;

    const handleAddItem = () => {
        setItems([...items, { id: Math.random().toString(), quantity: 1, duration: 0, productionStatus: 'Pre-Order' }]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index], [field]: value };

        // Auto-calculate price if rule or duration changes
        if (field === 'pricingRuleId' || field === 'duration') {
            const ruleId = field === 'pricingRuleId' ? value : item.pricingRuleId;
            const duration = field === 'duration' ? Number(value) : Number(item.duration || 0);

            if (ruleId) {
                const rule = MOCK_PRICING_RULES.find(r => r.id === ruleId);
                if (rule) {
                    item.unitPrice = calculatePrice(rule, duration);
                    item.amount = (item.unitPrice || 0) * (item.quantity || 1);
                }
            }
        }

        // Auto-calculate COST if partner or duration changes (and client is selected)
        if (field === 'assignedPartnerId' || field === 'duration') {
            const partnerId = field === 'assignedPartnerId' ? value : item.assignedPartnerId;
            const duration = field === 'duration' ? Number(value) : Number(item.duration || 0);

            if (partnerId && selectedClientId) {
                const partner = MOCK_PARTNERS.find(p => p.id === partnerId);
                if (partner) {
                    const estimatedCost = calculatePartnerCost(partner, selectedClientId, duration);
                    if (estimatedCost > 0) {
                        item.cost = estimatedCost;
                    }
                }
            }
        }

        // Recalculate amount if quantity or unitPrice changes manually
        if (field === 'quantity' || field === 'unitPrice') {
            item.amount = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1);
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">新規案件・見積作成</h1>
                <p className="text-zinc-500">制作内容と尺を入力して、料金と原価を算出します。</p>
            </header>

            <div className="grid gap-6">
                {/* Client Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>クライアント情報 (Client Info)</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>クライアント (Client)</Label>
                            <Select
                                value={selectedClientId}
                                onChange={(e) => setSelectedClientId(e.target.value)}
                            >
                                <option value="">選択してください...</option>
                                {MOCK_CLIENTS.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>発行日 (Issue Date)</Label>
                            <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Invoice Items */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>制作内容・内訳 (Line Items)</span>
                            <Button size="sm" onClick={handleAddItem} variant="outline">
                                <PlusCircle className="mr-2 h-4 w-4" /> 行を追加
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {items.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-12 gap-4 items-end border p-4 rounded-lg bg-zinc-50/50">
                                <div className="col-span-12 md:col-span-4 space-y-2">
                                    <Label>制作パターン・品目</Label>
                                    <Select
                                        value={item.pricingRuleId || ""}
                                        onChange={(e) => updateItem(index, 'pricingRuleId', e.target.value)}
                                    >
                                        <option value="">選択してください...</option>
                                        {availableRules.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </Select>
                                </div>

                                <div className="col-span-6 md:col-span-2 space-y-2">
                                    <Label>尺 (分)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        placeholder="2.5"
                                        value={item.duration || ""}
                                        onChange={(e) => updateItem(index, 'duration', e.target.value)}
                                    />
                                </div>

                                <div className="col-span-6 md:col-span-2 space-y-2">
                                    <Label>納品日 (Delivery)</Label>
                                    <Input
                                        type="date"
                                        value={item.deliveryDate || ""}
                                        onChange={(e) => updateItem(index, 'deliveryDate', e.target.value)}
                                    />
                                </div>

                                <div className="col-span-6 md:col-span-4 space-y-2">
                                    <Label>発注先・原価 (Cost)</Label>
                                    <div className="flex gap-1">
                                        <Select
                                            className="w-1/2 text-xs px-1"
                                            value={item.assignedPartnerId || ""}
                                            onChange={(e) => updateItem(index, 'assignedPartnerId', e.target.value)}
                                        >
                                            <option value="">（未定）</option>
                                            {MOCK_PARTNERS.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </Select>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={item.cost || ""}
                                            onChange={(e) => updateItem(index, 'cost', Number(e.target.value))}
                                            className="bg-red-50 border-red-100 focus-visible:ring-red-200"
                                        />
                                    </div>
                                </div>

                                <div className="col-span-6 md:col-span-3 space-y-2">
                                    <Label>制作状況 (Status)</Label>
                                    <Select
                                        value={item.productionStatus || "Pre-Order"}
                                        onChange={(e) => updateItem(index, 'productionStatus', e.target.value)}
                                    >
                                        <option value="Pre-Order">未受注</option>
                                        <option value="In Progress">制作中</option>
                                        <option value="Review">確認中</option>
                                        <option value="Delivered">納品済</option>
                                    </Select>
                                </div>

                                <div className="col-span-6 md:col-span-2 space-y-2">
                                    <Label>金額 (Price)</Label>
                                    <div className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-right items-center justify-end font-mono">
                                        {item.amount?.toLocaleString()}
                                    </div>
                                </div>

                                <div className="col-span-12 md:col-span-1 flex justify-end pb-1">
                                    {items.length > 1 && (
                                        <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleRemoveItem(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter className="flex justify-end p-6 border-t bg-zinc-50 gap-8">
                        <div className="flex flex-col items-end space-y-1 text-red-600">
                            <span className="text-sm">原価合計 (Total Cost)</span>
                            <span className="text-xl font-bold">¥{items.reduce((sum, item) => sum + (item.cost || 0), 0).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col items-end space-y-1 text-green-600">
                            <span className="text-sm">想定粗利 (Profit)</span>
                            <span className="text-xl font-bold">
                                ¥{(totalAmount - items.reduce((sum, item) => sum + (item.cost || 0), 0)).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex flex-col items-end space-y-1 border-l pl-8 ml-4">
                            <span className="text-sm text-muted-foreground">見積合計 (Total)</span>
                            <span className="text-3xl font-bold">¥{totalAmount.toLocaleString()}</span>
                        </div>
                    </CardFooter>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button variant="outline">下書き保存</Button>
                    <Button size="lg">請求書作成</Button>
                </div>
            </div>
        </div>
    );
}
