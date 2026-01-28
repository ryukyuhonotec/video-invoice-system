import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, PlusCircle, Users } from "lucide-react";
import { InvoiceItem, Outsource, Partner, PricingRule } from "@/types";
import { OutsourceTaskRow } from "./OutsourceTaskRow";

interface InvoiceItemRowProps {
    item: Partial<InvoiceItem>;
    itemIndex: number;
    updateItem: (index: number, field: keyof InvoiceItem, value: any) => void;
    handleRemoveItem: (index: number) => void;
    handleAddTask: (itemIndex: number) => void;
    updateTask: (itemIndex: number, taskIndex: number, field: keyof Outsource, value: any) => void;
    handleRemoveTask: (itemIndex: number, taskIndex: number) => void;
    pricingRules: PricingRule[];
    partners: Partner[];
    availableRules: PricingRule[];
    canDeleteItem: boolean;
    errors?: { [key: string]: string };
}

export function InvoiceItemRow({
    item,
    itemIndex,
    updateItem,
    handleRemoveItem,
    handleAddTask,
    updateTask,
    handleRemoveTask,
    pricingRules,
    partners,
    availableRules,
    canDeleteItem,
    errors
}: InvoiceItemRowProps) {
    const nameError = errors?.[`items.${itemIndex}.name`];

    return (
        <Card className={`overflow-hidden shadow-md border-zinc-200 ${nameError ? "border-red-500" : ""}`}>
            {/* Item Header */}
            <div className={`p-4 ${nameError ? "bg-red-900" : "bg-zinc-800"} text-white grid grid-cols-12 gap-3 items-end transition-colors`}>
                <div className="col-span-12 md:col-span-8 space-y-1">
                    <Label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">品目名</Label>
                    <Input
                        value={item.name || ""}
                        onChange={(e) => updateItem(itemIndex, 'name', e.target.value)}
                        className={`bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-500 h-9 ${nameError ? "border-red-400 bg-red-900/50" : ""}`}
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
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-zinc-500 hover:text-red-400 h-9 w-9"
                        onClick={() => handleRemoveItem(itemIndex)}
                        disabled={!canDeleteItem}
                        type="button"
                    >
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
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-[10px] h-7 px-3 border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={() => handleAddTask(itemIndex)}
                        type="button"
                    >
                        <PlusCircle className="w-3 h-3 mr-1" /> タスク追加
                    </Button>
                </div>

                {(item.outsources || []).map((task, taskIndex) => (
                    <OutsourceTaskRow
                        key={task.id}
                        task={task}
                        itemIndex={itemIndex}
                        taskIndex={taskIndex}
                        pricingRules={pricingRules}
                        partners={partners}
                        updateTask={updateTask}
                        handleRemoveTask={handleRemoveTask}
                        availableRules={availableRules}
                        canDelete={(item.outsources?.length || 0) > 1}
                        errors={errors}
                    />
                ))}
            </CardContent>
        </Card>
    );
}
