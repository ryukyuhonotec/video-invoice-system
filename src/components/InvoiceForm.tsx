"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
// Remove ActionResponse import if not used, or keep if needed later
import { TaxRate, InvoiceStatusEnum, TaskStatusEnum } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getClients, getPartners, getPricingRules, upsertInvoice, getStaff } from "@/actions/pricing-actions";
import { calculatePrice } from "@/lib/pricing";
import { Invoice, InvoiceItem, InvoiceStatus, Client, Partner, PricingRule, Outsource, Staff } from "@/types";
import { PlusCircle, Save, Calendar, ShieldCheck, FileText, Search, ClipboardList, AlertTriangle, AlertCircle, Loader2, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { InvoiceItemRow } from "./invoice-form/InvoiceItemRow";
import { DeliveryInfoSection } from "./invoice-form/DeliveryInfoSection";

export interface MasterData {
    clients: Client[];
    partners: Partner[];
    pricingRules: PricingRule[];
    staffList: Staff[];
}

interface InvoiceFormProps {
    initialData?: Invoice;
    isEditing?: boolean;
    masterData?: MasterData;
}

export default function InvoiceForm({ initialData, isEditing = false, masterData }: InvoiceFormProps) {
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>(masterData?.clients || []);
    const [partners, setPartners] = useState<Partner[]>(masterData?.partners || []);
    const [pricingRules, setPricingRules] = useState<PricingRule[]>(masterData?.pricingRules || []);
    const [staffList, setStaffList] = useState<Staff[]>(masterData?.staffList || []);
    const [isLoading, setIsLoading] = useState(!masterData);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Client search state
    const [clientSearchQuery, setClientSearchQuery] = useState("");
    const [selectedStaffFilter, setSelectedStaffFilter] = useState("");
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const clientSearchRef = useRef<HTMLDivElement>(null);

    const [selectedClientId, setSelectedClientId] = useState(initialData?.clientId || "");
    const [selectedStaffId, setSelectedStaffId] = useState(initialData?.staffId || "");
    const [invoiceDate, setInvoiceDate] = useState(initialData?.issueDate ? new Date(initialData.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]); // Fix date parsing
    const [actualDeliveryDate, setActualDeliveryDate] = useState(initialData?.actualDeliveryDate ? new Date(initialData.actualDeliveryDate).toISOString().split('T')[0] : "");
    const [requestUrl, setRequestUrl] = useState(initialData?.requestUrl || "");
    const [deliveryUrl, setDeliveryUrl] = useState(initialData?.deliveryUrl || "");
    const [deliveryNote, setDeliveryNote] = useState(initialData?.deliveryUrl ? (initialData as any).deliveryNote || "" : "");
    const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>(initialData?.status || InvoiceStatusEnum.DRAFT);

    // Warning Modal State
    const [showWarning, setShowWarning] = useState(false);
    const [pendingSaveAction, setPendingSaveAction] = useState<{ isDelivered: boolean } | null>(null);
    const [priceDiscrepancies, setPriceDiscrepancies] = useState<string[]>([]);

    const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
    const [errorSummary, setErrorSummary] = useState<string[]>([]); // Added for Draft Save validation feedback

    // Items state - each item has multiple tasks (outsources)
    const [items, setItems] = useState<Partial<InvoiceItem>[]>(
        initialData?.items || [{
            id: Math.random().toString(),
            name: "",
            quantity: 1,
            // duration: "", // Removed from Item
            productionStatus: TaskStatusEnum.PRE_ORDER as any, // Cast to any if ProductionStatus type mismatch with TaskStatusEnum
            unitPrice: 0,
            amount: 0,
            outsources: [{
                id: `task-${Date.now()}`,
                invoiceItemId: "",
                pricingRuleId: undefined,
                partnerId: undefined,
                revenueAmount: 0,
                costAmount: 0,
                status: TaskStatusEnum.PRE_ORDER,
                deliveryDate: undefined,
                duration: "",
                deliveryUrl: "",
                deliveryNote: ""
            } as Outsource]
        }]
    );

    // Handler functions
    const handleAddItem = useCallback(() => {
        setItems(prev => [...prev, {
            id: Math.random().toString(),
            name: "",
            quantity: 1,
            productionStatus: TaskStatusEnum.PRE_ORDER as any,
            unitPrice: 0,
            amount: 0,
            outsources: [{
                id: `task-${Date.now()}`,
                invoiceItemId: "",
                pricingRuleId: undefined,
                partnerId: undefined,
                revenueAmount: 0,
                costAmount: 0,
                deliveryDate: undefined,
                status: TaskStatusEnum.PRE_ORDER,
                deliveryUrl: "",
                deliveryNote: ""
            } as Outsource]
        }]);
    }, []);

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
        if (masterData) {
            setIsLoading(false);
            return;
        }
        const loadData = async () => {
            // Type assertion for component usage if necessary, but ideally fetch returns correct types
            const [cData, pData, rData, sData] = await Promise.all([
                getClients(),
                getPartners(),
                getPricingRules(),
                getStaff()
            ]);
            setClients(cData as Client[]);
            setPartners(pData as Partner[]);
            setPricingRules(rData as PricingRule[]);
            setStaffList(sData as Staff[]);
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
            result = result.filter(c => c.name.toLowerCase().includes(query) || (c.code && c.code.toLowerCase().includes(query)));
        }
        return result;
    }, [clients, clientSearchQuery, selectedStaffFilter]);

    const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);

    // Available rules for selected client (client-specific + generic)
    const availableRules = useMemo(() => {
        return pricingRules.filter(r =>
            // Rule is assigned to this client OR Rule has no assigned clients (Generic)
            (r.clients?.some(c => c.id === selectedClientId) || !r.clients?.length)
        );
    }, [pricingRules, selectedClientId]);

    // Available partners for selected client
    const availablePartners = useMemo(() => {
        if (!selectedClientId) return partners;

        // Fix for Issue #6: If client has linked partners, show them.
        // If NO partners are linked (common in initial setup/migration), show ALL partners.
        // This prevents the "Empty Dropdown" blocker.
        const linkedPartners = selectedClient?.partners || [];
        if (linkedPartners.length > 0) {
            return linkedPartners;
        }

        return partners;
    }, [partners, selectedClient, selectedClientId]);

    // Operations staff only
    const operationsStaff = useMemo(() => staffList.filter(s => s.role === 'OPERATIONS'), [staffList]);

    // Calculate totals from all tasks
    const { totalRevenue, totalCost, subtotal, tax, estimatedProfit, profitMargin } = useMemo(() => {
        let revenue = 0;
        let cost = 0;
        items.forEach(item => {
            (item.outsources || []).forEach((task) => {
                revenue += Number(task.revenueAmount) || 0;
                cost += Number(task.costAmount) || 0;
            });
        });
        const taxAmount = Math.floor(revenue * TaxRate);
        const total = revenue + taxAmount;
        const profit = total - cost;
        const margin = total > 0 ? (profit / total) * 100 : 0;
        return { totalRevenue: total, totalCost: cost, subtotal: revenue, tax: taxAmount, estimatedProfit: profit, profitMargin: margin };
    }, [items]);


    const handleRemoveItem = useCallback((index: number) => {
        if (items.length === 1) return;
        const item = items[index];
        if (item.name && item.name.length > 0) {
            if (!window.confirm("この品目を削除してもよろしいですか？")) return;
        }

        setItems(prev => {
            const newItems = [...prev];
            newItems.splice(index, 1);
            return newItems;
        });
    }, [items]);

    const handleAddTask = useCallback((itemIndex: number) => {
        setItems(prev => {
            const newItems = [...prev];
            const item = { ...newItems[itemIndex] };
            item.outsources = [...(item.outsources || []), {
                id: `task-${Date.now()}`,
                invoiceItemId: item.id || "",
                pricingRuleId: undefined,
                partnerId: undefined,
                revenueAmount: 0,
                costAmount: 0,
                deliveryDate: undefined,
                status: TaskStatusEnum.IN_PROGRESS,
                deliveryUrl: "",
                deliveryNote: ""
            } as Outsource];
            newItems[itemIndex] = item;
            return newItems;
        });
    }, []);

    const handleRemoveTask = useCallback((itemIndex: number, taskIndex: number) => {
        const item = items[itemIndex];
        const tasks = item.outsources || [];
        if (tasks.length === 1) return;

        const task = tasks[taskIndex];
        // Confirm if task has entered data (price, partner, etc)
        if ((task.pricingRuleId || task.partnerId || task.revenueAmount > 0) && !window.confirm("このタスクを削除してもよろしいですか？")) {
            return;
        }

        setItems(prev => {
            const newItems = [...prev];
            const currentItem = { ...newItems[itemIndex] };
            const currentTasks = [...(currentItem.outsources || [])];
            currentTasks.splice(taskIndex, 1);
            currentItem.outsources = currentTasks;
            newItems[itemIndex] = currentItem;
            return newItems;
        });
    }, [items]);

    const updateItem = useCallback((index: number, field: keyof InvoiceItem, value: any) => {
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], [field]: value };
            return newItems;
        });
    }, []);

    // Refactored to have stricter types for value, but kept as any for simplicity in generic handler
    const updateTask = useCallback((itemIndex: number, taskIndex: number, field: keyof Outsource, value: any) => {
        setItems(prev => {
            const newItems = [...prev];
            const item = { ...newItems[itemIndex] };
            const tasks = [...(item.outsources || [])];
            const task = { ...tasks[taskIndex], [field]: value };

            // Auto-calculate price when rule changes
            if (field === 'pricingRuleId') {
                const rule = pricingRules.find(r => r.id === value);
                const duration = task.duration || "0:00";
                const target = task.performanceTargetValue || 0;

                if (rule) {
                    task.revenueAmount = calculatePrice(rule, duration, 'revenue', target);
                    task.costAmount = calculatePrice(rule, duration, 'cost', target);
                }
            }

            // Recalculate when duration changes
            if (field === 'duration') {
                const duration = value;
                if (task.pricingRuleId) {
                    const rule = pricingRules.find(r => r.id === task.pricingRuleId);
                    if (rule) {
                        const target = task.performanceTargetValue || 0;
                        task.revenueAmount = calculatePrice(rule, duration, 'revenue', target);
                        task.costAmount = calculatePrice(rule, duration, 'cost', target);
                    }
                }
            }

            // Recalculate when performance target changes
            if (field === 'performanceTargetValue') {
                const target = value;
                if (task.pricingRuleId) {
                    const rule = pricingRules.find(r => r.id === task.pricingRuleId);
                    if (rule) {
                        const duration = task.duration || "0:00";
                        task.revenueAmount = calculatePrice(rule, duration, 'revenue', target);
                        task.costAmount = calculatePrice(rule, duration, 'cost', target);
                    }
                }
            }

            tasks[taskIndex] = task;
            item.outsources = tasks;
            newItems[itemIndex] = item;

            // Recalculate item totals
            const itemRevenue = tasks.reduce((sum, t) => sum + (Number(t.revenueAmount) || 0), 0);
            newItems[itemIndex] = { ...newItems[itemIndex], amount: itemRevenue, unitPrice: itemRevenue };

            return newItems;
        });
    }, [pricingRules]);



    const calculateStandardPrice = (task: Outsource) => {
        if (!task.pricingRuleId) return { revenue: 0, cost: 0 };
        const rule = pricingRules.find(r => r.id === task.pricingRuleId);
        if (!rule) return { revenue: 0, cost: 0 };
        const duration = task.duration || "0:00";
        const target = task.performanceTargetValue || 0;
        return {
            revenue: calculatePrice(rule, duration, 'revenue', target),
            cost: calculatePrice(rule, duration, 'cost', target)
        };
    };

    // Validation Helper
    const validateForm = (targetStatus: InvoiceStatus) => {
        const errors: { [key: string]: string } = {};

        // 1. Client & Staff Validation (Always Required)
        if (!selectedClientId) {
            errors['clientId'] = "クライアントを選択してください";
        }
        if (!selectedStaffId) {
            errors['staffId'] = "自社担当者(事業統括)を選択してください";
        }

        // 2. Item & Task Validation
        items.forEach((item, i) => {
            if (!item.name || !item.name.trim()) {
                errors[`items.${i}.name`] = "品目名を入力してください";
            }

            // Task Validation
            (item.outsources || []).forEach((task, j) => {
                // Pricing Rule is only required if status is NOT 'Draft' (受注前)
                // User Requirement: "受注前" (Draft) does not need pricing rule yet.
                // "受注確定" (Order Confirmed) or later requires it? 
                // User said: "進行になってからパートナーの担当ついてタスクの金額ルールが設定される" -> Likely "受注確定" or "制作中".
                // Let's enforce it for anything other than '受注前' (DRAFT).

                const isDraft = targetStatus === InvoiceStatusEnum.DRAFT || (targetStatus as string) === "受注前";

                if (!isDraft && !task.pricingRuleId) {
                    errors[`items.${i}.outsources.${j}.pricingRuleId`] = "料金ルールを選択してください (進行案件には必須です)";
                }

                // Also Partner might be needed if not Draft? User said "Partner assigned after progress"
                // For now, focusing on the reported error (PricingRule).
            });
        });

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // --- Form Submission ---

    const handleInitialSave = async (setDeliveredStatus = false) => {
        // Validation & Discrepancy Check
        // Pass the current selected status or implied status to validation
        // 'setDeliveredStatus' implies we are moving to Delivered? 
        // For now, assume validation against the CURRENT selected Invoice Status is what matters for "Save".
        if (!validateForm(invoiceStatus)) {
            // Calculate errors strictly to find target ID immediately
            let targetId = "";
            if (!selectedClientId) {
                targetId = "clientId";
            } else if (!selectedStaffId) {
                targetId = "staffId"; // Check Staff
            } else {
                const isDraft = invoiceStatus === InvoiceStatusEnum.DRAFT || (invoiceStatus as string) === "受注前";
                for (let i = 0; i < items.length; i++) {
                    if (!items[i].name || !items[i].name!.trim()) {
                        targetId = `items.${i}.name`;
                        break;
                    }
                    if (items[i].outsources) {
                        for (let j = 0; j < items[i].outsources!.length; j++) {
                            // Only check Pricing Rule if NOT Draft
                            if (!isDraft && !items[i].outsources![j].pricingRuleId) {
                                targetId = `items.${i}.outsources.${j}.pricingRuleId`;
                                break;
                            }
                        }
                    }
                    if (targetId) break;
                }
            }

            if (targetId) {
                // Small timeout to allow React to render any error states/classes
                setTimeout(() => {
                    const el = document.getElementById(targetId);
                    if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                        // Try to focus
                        el.focus();
                    } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }, 100);
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            return;
        }

        const discrepancies: string[] = [];
        items.forEach((item, i) => {
            (item.outsources || []).forEach((task: Outsource, j) => {
                const standard = calculateStandardPrice(task);
                // Check if manually modified (allow 1 yen diff for rounding)
                if (Math.abs(Number(task.revenueAmount) - standard.revenue) > 1) {
                    discrepancies.push(`品目${i + 1}-タスク${j + 1}: 請求額 (設定: ¥${standard.revenue.toLocaleString()} → 入力: ¥${Number(task.revenueAmount).toLocaleString()})`);
                }
                if (Math.abs(Number(task.costAmount) - standard.cost) > 1) {
                    discrepancies.push(`品目${i + 1}-タスク${j + 1}: 原価 (設定: ¥${standard.cost.toLocaleString()} → 入力: ¥${Number(task.costAmount).toLocaleString()})`);
                }
            });
        });

        if (discrepancies.length > 0) {
            setPriceDiscrepancies(discrepancies);
            setPendingSaveAction({ isDelivered: setDeliveredStatus });
            setShowWarning(true);
        } else {
            await executeSave(setDeliveredStatus);
        }
    };

    const handleTerminateSave = async () => {
        if (!confirm("案件を途中完了にしますか？\n(未完了のタスクがあってもステータスを完了に変更します)")) {
            return;
        }
        await executeSave(false, InvoiceStatusEnum.COMPLETED);
    };

    const handleCreateQuotation = async () => {
        // If already saved (has ID) and no changes, just go.
        // But simpler to just save first to ensure latest data.
        // Force status '受注前' if currently '受注前' to avoid accidental status change?
        // User said "create when registering status pre-order".
        // So we proceed with current status or default.
        const savedInvoice = await executeSave(false, undefined, true); // true = no redirect
        if (savedInvoice && savedInvoice.id) {
            window.open(`/invoices/${savedInvoice.id}/publish?type=quotation`, '_blank');
        }
    };

    const executeSave = async (setDeliveredStatus: boolean, statusOverride?: string, noRedirect: boolean = false) => {
        setIsSaving(true);
        setSaveError(null);
        try {
            const itemsToSave = setDeliveredStatus
                ? items.map(item => ({
                    ...item,
                    productionStatus: TaskStatusEnum.DELIVERED as any,
                    outsources: (item.outsources || []).map((t) => ({ ...t, status: TaskStatusEnum.DELIVERED }))
                }))
                : items;

            const res = await upsertInvoice({
                id: initialData?.id,
                clientId: selectedClientId,
                staffId: selectedStaffId || null,
                issueDate: invoiceDate,
                actualDeliveryDate: actualDeliveryDate || null,
                requestUrl,
                deliveryUrl,
                deliveryNote,
                status: (statusOverride || invoiceStatus) as InvoiceStatus,
                items: itemsToSave as InvoiceItem[],
                subtotal,
                tax,
                totalAmount: totalRevenue,
                totalCost,
                profit: estimatedProfit,
                profitMargin
            });

            if (!res.success) {
                throw new Error(res.error);
            }

            const saved = res.data;
            setShowWarning(false);

            if (!noRedirect) {
                if (statusOverride === InvoiceStatusEnum.COMPLETED) {
                    alert("案件を途中終了（完了）しました");
                } else {
                    alert(setDeliveredStatus ? "納品完了しました" : (isEditing ? "案件情報を更新しました" : "新しい案件を作成しました"));
                }
                router.push("/");
            }
            return saved;
        } catch (e: any) {
            console.error("Save error:", e);
            setSaveError(e.message || "保存中にエラーが発生しました。");
            setShowWarning(false);
            return null;
        } finally {
            setIsSaving(false);
        }
    };

    // Check if can complete delivery
    const canCompleteDelivery = useMemo(() => {
        const allTasksCompleted = items.every(item =>
            (item.outsources || []).every((task: Outsource) =>
                [TaskStatusEnum.DELIVERED, TaskStatusEnum.BILLED, TaskStatusEnum.PAID, TaskStatusEnum.COMPLETED].includes(task.status as any)
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

            <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                            金額の不一致（要確認）
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <div className="space-y-2 mt-2">
                                <p>設定された料金ルールと入力された金額が異なります。</p>
                                <ul className="list-disc list-inside text-xs p-2 bg-zinc-100 dark:bg-zinc-800 rounded max-h-40 overflow-y-auto">
                                    {priceDiscrepancies.map((msg, i) => (
                                        <li key={i}>{msg}</li>
                                    ))}
                                </ul>
                                <p className="font-bold mt-2">このまま保存しますか？</p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (pendingSaveAction) {
                                executeSave(pendingSaveAction.isDelivered);
                            } else {
                                executeSave(false);
                            }
                        }} className="bg-amber-600 hover:bg-amber-700">
                            保存する
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Error Summary (Draft Validation) */}
            {(errorSummary.length > 0 || Object.keys(validationErrors).length > 0) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                        <AlertCircle className="w-5 h-5" />
                        <span>入力エラーがあります</span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                        {errorSummary.map((err, i) => <li key={`sum-${i}`}>{err}</li>)}
                        {Object.entries(validationErrors).map(([key, msg]) => {
                            if (key === 'clientId') return null;
                            const match = key.match(/items\.(\d+)\.name/);
                            if (match) return <li key={key}>品目 {Number(match[1]) + 1}: {msg}</li>;

                            const taskMatch = key.match(/items\.(\d+)\.outsources\.(\d+)\.(.+)/);
                            if (taskMatch) {
                                const [_, itemIdx, taskIdx] = taskMatch;
                                return <li key={key}>品目 {Number(itemIdx) + 1} - タスク {Number(taskIdx) + 1}: {msg}</li>;
                            }
                            return <li key={key}>{msg}</li>;
                        })}
                    </ul>
                </div>
            )}

            {/* ===== STEP 1: 案件登録 ===== */}
            {!isEditing && (
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
                                <Label className="text-xs text-zinc-500 dark:text-zinc-400">事業統括 (必須)</Label>
                                <Select
                                    value={selectedStaffFilter}
                                    onChange={(e) => {
                                        setSelectedStaffFilter(e.target.value);
                                        // Auto-select if it's a specific person (not 'all')
                                        if (e.target.value) setSelectedStaffId(e.target.value);
                                    }}
                                    className={`text-sm h-10 bg-white border-blue-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 ${validationErrors['staffId'] ? 'ring-2 ring-red-500' : ''}`}
                                >
                                    <option value="">担当者を選択</option>
                                    {operationsStaff.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                                </Select>
                                {validationErrors['staffId'] && <span className="text-xs text-red-500">{validationErrors['staffId']}</span>}
                            </div>
                            <div className="md:col-span-5 space-y-1 relative">
                                <Label className="text-xs text-zinc-500 dark:text-zinc-400" htmlFor="clientId">クライアント検索</Label>
                                <div className={`relative ${validationErrors['clientId'] ? 'ring-2 ring-red-500 rounded-md' : ''}`}>
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                                    <Input
                                        id="clientId"
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
                                <Select
                                    value={invoiceStatus}
                                    onChange={(e) => setInvoiceStatus(e.target.value as InvoiceStatus)}
                                    className="h-10 bg-white border-blue-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                                >
                                    <option value={InvoiceStatusEnum.DRAFT}>受注前</option>
                                    <option value={InvoiceStatusEnum.IN_PROGRESS}>進行中</option>
                                </Select>
                            </div>
                            <div className="md:col-span-8 space-y-1">
                                <Label className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1"><FileText className="w-3 h-3" /> 依頼チャットURL</Label>
                                <Input value={requestUrl} onChange={(e) => setRequestUrl(e.target.value)} placeholder="https://chatwork.com/..." className="h-10 bg-white border-blue-200 text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}



            {/* ===== 品目・タスク設定 - Only show when not 受注前 or 失注 ===== */}
            {invoiceStatus !== InvoiceStatusEnum.LOST && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-lg font-bold tracking-tight">📦 品目・タスク設定</h2>
                        <Button onClick={handleAddItem} variant="outline" size="sm" className="bg-white hover:bg-zinc-50">
                            <PlusCircle className="mr-1 h-4 w-4" /> 品目追加
                        </Button>
                    </div>

                    {items.map((item, itemIndex) => (
                        <InvoiceItemRow
                            key={item.id}
                            item={item}
                            itemIndex={itemIndex}
                            updateItem={updateItem}
                            handleRemoveItem={handleRemoveItem}
                            handleAddTask={handleAddTask}
                            updateTask={updateTask}
                            handleRemoveTask={handleRemoveTask}
                            pricingRules={pricingRules}
                            partners={availablePartners}
                            availableRules={availableRules}
                            canDeleteItem={items.length > 1}
                            errors={validationErrors}
                            hideTasks={invoiceStatus === InvoiceStatusEnum.DRAFT}
                        />
                    ))}
                </div>
            )}

            {/* Top Error Message */}
            {Object.keys(validationErrors).length > 0 && (
                <div className="fixed bottom-32 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in">
                    <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-bold">入力エラーがあります。確認してください。</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-white hover:bg-white/20 rounded-full"
                            onClick={() => {
                                setValidationErrors({});
                                // Also clear error summary scroll
                            }}
                        >
                            ×
                        </Button>
                    </div>
                </div>
            )}

            {/* ===== STEP 2: 納品情報 - Only show when editing ===== */}
            <DeliveryInfoSection
                isEditing={isEditing}
                actualDeliveryDate={actualDeliveryDate}
                setActualDeliveryDate={setActualDeliveryDate}
                deliveryUrl={deliveryUrl}
                setDeliveryUrl={setDeliveryUrl}
                deliveryNote={deliveryNote}
                setDeliveryNote={setDeliveryNote}
                handleInitialSave={handleInitialSave}
                handleTerminateSave={handleTerminateSave}
                canCompleteDelivery={canCompleteDelivery}
                isSaving={isSaving}
            />

            {/* ===== Summary & Sticky Footer (Issue #12) ===== */}
            <div className="sticky bottom-0 z-40 bg-background/80 backdrop-blur-sm border-t shadow-lg pb-4 pt-2 -mx-4 px-4 sm:-mx-8 sm:px-8">
                <Card className="shadow-none border-0 bg-transparent">
                    <CardFooter className="flex flex-wrap justify-end p-2 gap-x-8 gap-y-2 items-center">
                        <div className="flex gap-6 mr-auto items-center">
                            <div className="flex flex-col items-end">
                                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-0.5">売上</div>
                                <div className="text-xl font-mono text-zinc-900 dark:text-zinc-100">¥{totalRevenue.toLocaleString()}</div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="text-[10px] text-red-400 uppercase font-bold tracking-widest mb-0.5">原価</div>
                                <div className="text-xl font-mono text-red-400">¥{totalCost.toLocaleString()}</div>
                            </div>
                            <div className="flex flex-col items-end border-l border-zinc-200 pl-6 dark:border-zinc-700">
                                <div className="text-[10px] text-green-500 uppercase font-bold tracking-widest mb-0.5 flex items-center gap-1">
                                    粗利
                                    <div className="group relative">
                                        <HelpCircle className="w-3 h-3 text-zinc-400 cursor-help" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-800 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                            売上(税抜) - 原価(税抜) <br />
                                            ※消費税は計算に含まれません
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xs text-zinc-500">{profitMargin.toFixed(0)}%</span>
                                    <div className={`text-xl font-mono font-bold ${profitMargin > 30 ? 'text-green-600' : 'text-orange-500'}`}>
                                        ¥{estimatedProfit.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="ghost" size="lg" onClick={() => router.back()}>戻る</Button>
                            {/* Quotation Button - Only if 受注前 */}
                            {invoiceStatus === InvoiceStatusEnum.DRAFT && (
                                <Button size="lg" variant="outline" className="hidden sm:flex border-cyan-500 text-cyan-600 hover:bg-cyan-50 px-6 font-bold" onClick={handleCreateQuotation} disabled={isSaving}>
                                    <FileText className="mr-2 h-5 w-5" /> 見積書作成
                                </Button>
                            )}
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 font-bold shadow-xl" onClick={() => handleInitialSave(false)} disabled={isSaving}>
                                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 保存中...</> : <><Save className="mr-2 h-5 w-5" /> 保存</>}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

