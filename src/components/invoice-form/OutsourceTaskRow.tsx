import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Outsource, Partner, PricingRule } from "@/types";
import { TaskStatusEnum } from "@/config/constants";

interface OutsourceTaskRowProps {
    task: Outsource;
    itemIndex: number;
    taskIndex: number;
    pricingRules: PricingRule[];
    partners: Partner[];
    updateTask: (itemIndex: number, taskIndex: number, field: keyof Outsource, value: any) => void;
    handleRemoveTask: (itemIndex: number, taskIndex: number) => void;
    availableRules: PricingRule[];
    canDelete: boolean;
    errors?: { [key: string]: string };
}

export function OutsourceTaskRow({
    task,
    itemIndex,
    taskIndex,
    pricingRules,
    partners,
    updateTask,
    handleRemoveTask,
    availableRules,
    canDelete,
    errors
}: OutsourceTaskRowProps) {
    const selectedRule = pricingRules.find(r => r.id === task.pricingRuleId);
    const rulePartners = selectedRule?.partners || [];
    const ruleError = errors?.[`items.${itemIndex}.outsources.${taskIndex}.pricingRuleId`];
    const partnerError = errors?.[`items.${itemIndex}.outsources.${taskIndex}.partnerId`];
    const statusError = errors?.[`items.${itemIndex}.outsources.${taskIndex}.status`];

    return (
        <div className={`bg-zinc-50 p-3 border rounded-lg space-y-3 ${ruleError || partnerError ? "border-red-200 bg-red-50" : ""}`}>
            {/* Row 1: Rule, Partner, Status */}
            <div className="grid grid-cols-12 gap-3 items-end">
                {/* Pricing Rule */}
                <div className="col-span-12 md:col-span-4 space-y-1">
                    <Label className="text-[9px] font-bold text-zinc-500 uppercase">料金ルール（担当領域）</Label>
                    <Select
                        className={`text-xs h-9 bg-white ${ruleError ? "border-red-500" : ""}`}
                        value={task.pricingRuleId || ""}
                        onChange={(e) => updateTask(itemIndex, taskIndex, 'pricingRuleId', e.target.value)}
                    >
                        <option value="">選択...</option>
                        {availableRules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </Select>
                </div>

                {/* Partner */}
                <div className="col-span-12 md:col-span-4 space-y-1">
                    <Label className="text-[9px] font-bold text-zinc-500 uppercase">パートナー</Label>
                    <Select
                        className="text-xs h-9 bg-white"
                        value={task.partnerId || ""}
                        onChange={(e) => updateTask(itemIndex, taskIndex, 'partnerId', e.target.value)}
                        disabled={!task.pricingRuleId}
                    >
                        <option value="">選択...</option>
                        {/* If rule has specific partners, show them. Otherwise show all partners. */}
                        {(rulePartners.length > 0 ? rulePartners : partners).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                </div>

                {/* Status */}
                <div className="col-span-12 md:col-span-3 space-y-1">
                    <Label className="text-[9px] font-bold text-zinc-500 uppercase">ステータス</Label>
                    <Select
                        className="text-xs h-9 bg-white"
                        value={task.status || TaskStatusEnum.PRE_ORDER}
                        onChange={(e) => updateTask(itemIndex, taskIndex, 'status', e.target.value)}
                    >
                        <option value={TaskStatusEnum.PRE_ORDER}>{TaskStatusEnum.PRE_ORDER}</option>
                        <option value={TaskStatusEnum.IN_PROGRESS}>{TaskStatusEnum.IN_PROGRESS}</option>
                        <option value={TaskStatusEnum.REVIEW}>{TaskStatusEnum.REVIEW}</option>
                        <option value={TaskStatusEnum.DELIVERED}>{TaskStatusEnum.DELIVERED}</option>
                    </Select>
                </div>

                {/* Delivery Note for Task */}
                <div className="col-span-12 space-y-1 pt-2 border-t border-dashed border-zinc-200">
                    <div className="flex gap-2">
                        <div className="w-1/2">
                            <Label className="text-[9px] font-bold text-zinc-400 uppercase">納品URL (タスク別)</Label>
                            <Input
                                value={task.deliveryUrl || ""}
                                onChange={(e) => updateTask(itemIndex, taskIndex, 'deliveryUrl', e.target.value)}
                                className="h-8 text-xs bg-white"
                                placeholder="URL..."
                            />
                        </div>
                        <div className="w-1/2">
                            <Label className="text-[9px] font-bold text-zinc-400 uppercase">納品備考</Label>
                            <Input
                                value={task.deliveryNote || ""}
                                onChange={(e) => updateTask(itemIndex, taskIndex, 'deliveryNote', e.target.value)}
                                className="h-8 text-xs bg-white"
                                placeholder="備考..."
                            />
                        </div>
                    </div>
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
                        value={task.deliveryDate ? (new Date(task.deliveryDate).toISOString().split('T')[0]) : ""}
                        onChange={(e) => updateTask(itemIndex, taskIndex, 'deliveryDate', e.target.value)}
                    />
                </div>

                {/* Duration */}
                <div className="col-span-6 md:col-span-3 space-y-1">
                    <Label className="text-[9px] font-bold text-zinc-500 uppercase">尺 (MM:SS)</Label>
                    <Input
                        className="text-xs h-9 bg-white"
                        placeholder="05:00"
                        value={task.duration || ""}
                        onChange={(e) => updateTask(itemIndex, taskIndex, 'duration', e.target.value)}
                        onBlur={(e) => {
                            const val = e.target.value;
                            const normalized = val.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                                .replace(/：/g, ':');
                            if (val !== normalized) {
                                updateTask(itemIndex, taskIndex, 'duration', normalized);
                            }
                        }}
                    />
                </div>

                {/* Revenue */}
                <div className="col-span-6 md:col-span-2 space-y-1">
                    <Label className="text-[9px] font-bold text-green-600 uppercase">請求額</Label>
                    <Input
                        className="text-xs h-9 text-right font-mono bg-white border-green-200"
                        type="number"
                        value={task.revenueAmount || ""}
                        onChange={(e) => updateTask(itemIndex, taskIndex, 'revenueAmount', e.target.value)}
                    />
                </div>

                {/* Cost */}
                <div className="col-span-6 md:col-span-2 space-y-1">
                    <Label className="text-[9px] font-bold text-red-500 uppercase">原価</Label>
                    <Input
                        className="text-xs h-9 text-right font-mono bg-white border-red-100"
                        type="number"
                        value={task.costAmount || ""}
                        onChange={(e) => updateTask(itemIndex, taskIndex, 'costAmount', e.target.value)}
                    />
                </div>
            </div>

            {/* Row 3: Task Delivery URL (Duplicate removed in previous edits but ensuring clear here) */}
            {/* The previous implementation had Delivery URL again in Row 3. We moved it to Row 1. Keeping it aligned with new design. */}

            {/* Remove Task */}
            {canDelete && (
                <div className="flex justify-end pt-2 border-t border-zinc-100 mt-2">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-zinc-300 hover:text-red-500"
                        onClick={() => handleRemoveTask(itemIndex, taskIndex)}
                        type="button"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
