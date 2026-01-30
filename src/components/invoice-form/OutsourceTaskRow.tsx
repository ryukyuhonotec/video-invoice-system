import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle2 } from "lucide-react";
import { Outsource, Partner, PricingRule } from "@/types";
import { TaskStatusEnum } from "@/config/constants";
import { SearchableSelect } from "@/components/ui/searchable-select";

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

    // Filter Partners based on Rule Type
    let finalPartnerOptions = partners; // Default: Client-linked partners (from props)

    if (selectedRule) {
        if (selectedRule.partners && selectedRule.partners.length > 0) {
            // Case 1: Specific Rule (Explicitly linked partners)
            finalPartnerOptions = selectedRule.partners;
        } else if (selectedRule.targetRole) {
            // Case 2: Generic Rule with Target Role (Filter client partners by role)
            finalPartnerOptions = partners.filter(p => p.role === selectedRule.targetRole);
        }
    }

    // Ensure currently selected partner is always in the list (to avoid UI glitch if valid but filtered)
    if (task.partnerId && !finalPartnerOptions.some(p => p.id === task.partnerId)) {
        // Try to find in the broader list (props.partners)
        const missing = partners.find(p => p.id === task.partnerId);
        if (missing) {
            finalPartnerOptions = [...finalPartnerOptions, missing];
        }
    }
    const ruleError = errors?.[`items.${itemIndex}.outsources.${taskIndex}.pricingRuleId`];
    const partnerError = errors?.[`items.${itemIndex}.outsources.${taskIndex}.partnerId`];
    const statusError = errors?.[`items.${itemIndex}.outsources.${taskIndex}.status`];

    // Delivery Button Logic
    const isFixedPrice = selectedRule?.type === 'FIXED';
    const isPerformance = selectedRule?.type === 'PERFORMANCE';
    const hasDeliveryUrl = !!task.deliveryUrl && task.deliveryUrl.length > 0;
    const hasDeliveryDate = !!task.deliveryDate;
    const hasDuration = !!task.duration && task.duration.length > 0;
    const hasTargetValue = (task.performanceTargetValue || 0) > 0;

    // Condition: URL & Date required. Duration required only if NOT fixed and NOT performance. Target required if Performance.
    const canDeliver = hasDeliveryUrl && hasDeliveryDate && (isFixedPrice || (isPerformance ? hasTargetValue : hasDuration));
    const isDelivered = task.status === TaskStatusEnum.DELIVERED;

    const [manualEditConfirmed, setManualEditConfirmed] = useState(false);

    const handleDeliver = () => {
        if (!canDeliver) return;
        if (!confirm("納品完了としてステータスを更新しますか？")) return;
        updateTask(itemIndex, taskIndex, 'status', TaskStatusEnum.DELIVERED);
    };

    // Removed handlePriceFocus to allow free editing. 
    // Validation warning happens on Save.

    return (
        <div className={`bg-zinc-50 dark:bg-zinc-900/50 p-3 border rounded-lg space-y-3 ${ruleError || partnerError ? "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800" : "dark:border-zinc-800"}`}>
            {/* Row 1: Rule, Partner, Status */}
            <div className="grid grid-cols-12 gap-3 items-end">
                {/* Pricing Rule */}
                <div className="col-span-12 md:col-span-4 space-y-1">
                    <Label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">料金ルール（担当領域）</Label>
                    <SearchableSelect
                        className={`text-xs h-9 bg-white dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 ${ruleError ? "border-red-500" : ""}`}
                        value={task.pricingRuleId || ""}
                        id={`items.${itemIndex}.outsources.${taskIndex}.pricingRuleId`}
                        onChange={(val) => updateTask(itemIndex, taskIndex, 'pricingRuleId', val)}
                        options={availableRules.map(r => ({ label: r.name, value: r.id }))}
                        placeholder="ルールを選択..."
                    />
                </div>

                <div className="col-span-12 md:col-span-4 space-y-1">
                    <Label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">パートナー</Label>
                    <SearchableSelect
                        className="text-xs h-9 bg-white dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                        value={task.partnerId || ""}
                        id={`items.${itemIndex}.outsources.${taskIndex}.partnerId`}
                        onChange={(val) => updateTask(itemIndex, taskIndex, 'partnerId', val)}
                        disabled={!task.pricingRuleId}
                        options={finalPartnerOptions.map(p => ({ label: p.name, value: p.id }))}
                        placeholder="パートナーを選択..."
                    />
                </div>

                {/* Status */}
                <div className="col-span-12 md:col-span-3 space-y-1">
                    <Label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">ステータス</Label>
                    <Select
                        className="text-xs h-9 bg-white dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                        value={task.status || TaskStatusEnum.IN_PROGRESS}
                        id={`items.${itemIndex}.outsources.${taskIndex}.status`}
                        onChange={(e) => updateTask(itemIndex, taskIndex, 'status', e.target.value)}
                    >
                        <option value={TaskStatusEnum.IN_PROGRESS}>進行中</option>
                        <option value={TaskStatusEnum.CORRECTION}>修正中</option>
                        <option value={TaskStatusEnum.REVIEW}>確認中</option>
                        {/* Only show DELIVERED if it IS the current status (cannot select manually) */}
                        {task.status === TaskStatusEnum.DELIVERED && (
                            <option value={TaskStatusEnum.DELIVERED}>納品済</option>
                        )}
                    </Select>
                </div>

                {/* Remove Task */}
                {canDelete && (
                    <div className="col-span-12 md:col-span-1 flex justify-center pb-1">
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

            {/* Row 2: Date, Duration/Target, Revenue, Cost + Delivery Button */}
            <div className="grid grid-cols-12 gap-3 items-end border-t border-zinc-200 pt-3">
                <div className="col-span-6 md:col-span-3 space-y-1">
                    <Label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">納期</Label>
                    <Input
                        type="date"
                        className="text-xs h-9 bg-white dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                        value={task.deliveryDate ? (new Date(task.deliveryDate).toISOString().split('T')[0]) : ""}
                        onChange={(e) => updateTask(itemIndex, taskIndex, 'deliveryDate', e.target.value)}
                    />
                </div>

                {/* Duration or Performance Target */}
                <div className="col-span-6 md:col-span-3 space-y-1">
                    {isPerformance ? (
                        <>
                            <Label className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase">成果対象額 (売上/消化)</Label>
                            <Input
                                type="number"
                                min={0}
                                className="text-xs h-9 bg-white dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                                placeholder="金額を入力..."
                                value={task.performanceTargetValue || ""}
                                onChange={(e) => updateTask(itemIndex, taskIndex, 'performanceTargetValue', Math.max(0, parseInt(e.target.value) || 0))}
                            />
                        </>
                    ) : isFixedPrice ? (
                        // Fixed Price: Show Disabled/Hidden or just Label indicating fixed?
                        // User says "Fixed -> Duration not needed".
                        // We can leave it empty or show a placeholder.
                        null
                    ) : (
                        <>
                            <Label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">尺 (MM:SS)</Label>
                            <Input
                                className="text-xs h-9 bg-white dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
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
                        </>
                    )}
                </div>

                {/* Delivery Info (Moved from Row 3 to here for compact layout if space allows, or keep in separate row? User requested: "Put URL and Date and Duration -> Button") */}
                {/* Let's put URL here too to make the flow natural: Date -> Duration -> URL -> Button */}

                {/* Revenue */}
                <div className="col-span-6 md:col-span-3 space-y-1">
                    <Label className="text-[9px] font-bold text-green-600 dark:text-green-400 uppercase">請求額</Label>
                    <Input
                        className="text-xs h-9 text-right font-mono bg-white border-green-200 dark:bg-zinc-800 dark:border-green-900/50 dark:text-green-100"
                        type="number"
                        min={0}
                        value={task.revenueAmount || ""}
                        onChange={(e) => updateTask(itemIndex, taskIndex, 'revenueAmount', Math.max(0, Number(e.target.value)))}
                    // onFocus removed to allow free editing
                    />
                </div>
                {/* Cost */}
                <div className="col-span-6 md:col-span-3 space-y-1">
                    <Label className="text-[9px] font-bold text-red-500 dark:text-red-400 uppercase">原価</Label>
                    <Input
                        className="text-xs h-9 text-right font-mono bg-white border-red-100 dark:bg-zinc-800 dark:border-red-900/50 dark:text-red-100"
                        type="number"
                        min={0}
                        value={task.costAmount || ""}
                        onChange={(e) => updateTask(itemIndex, taskIndex, 'costAmount', Math.max(0, Number(e.target.value)))}
                    // onFocus removed to allow free editing
                    />
                </div>
            </div>

            {/* Row 3: Task Delivery URL & Note & Button */}
            <div className="grid grid-cols-12 gap-3 items-end border-t border-dashed border-zinc-200 pt-2">
                <div className="col-span-12 md:col-span-5 space-y-1">
                    <Label className="text-[9px] font-bold text-zinc-400 uppercase">納品URL (タスク別)</Label>
                    <Input
                        value={task.deliveryUrl || ""}
                        onChange={(e) => updateTask(itemIndex, taskIndex, 'deliveryUrl', e.target.value)}
                        className="h-8 text-xs bg-white dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                        placeholder="URL..."
                    />
                </div>
                <div className="col-span-12 md:col-span-4 space-y-1">
                    <Label className="text-[9px] font-bold text-zinc-400 uppercase">納品備考</Label>
                    <Input
                        value={task.deliveryNote || ""}
                        onChange={(e) => updateTask(itemIndex, taskIndex, 'deliveryNote', e.target.value)}
                        className="h-8 text-xs bg-white dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                        placeholder="備考..."
                    />
                </div>
                <div className="col-span-12 md:col-span-3 flex justify-end">
                    <Button
                        size="sm"
                        onClick={handleDeliver}
                        disabled={!canDeliver || isDelivered}
                        className={`w-full text-xs h-8 font-bold ${isDelivered ? 'bg-green-100 text-green-700 border border-green-300' : (canDeliver ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-zinc-200 text-zinc-400')}`}
                        type="button"
                    >
                        {isDelivered ? (
                            <><CheckCircle2 className="w-3 h-3 mr-1" /> 納品済</>
                        ) : (
                            "納品完了"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
