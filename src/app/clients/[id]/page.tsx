"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getClientStats, upsertClient, getStaff, getPartners, getPricingRules } from "@/actions/pricing-actions";
import { ArrowLeft, Building2, ExternalLink, Edit, X, Link2 } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientForm } from "@/components/forms/ClientForm";

const getStatusLabel = (status: string) => {
    switch (status) {
        case "PAID":
        case "入金済み":
            return "入金済み";
        case "ISSUED":
        case "請求済":
        case "Billed":
            return "請求済";
        case "納品済":
            return "納品済";
        case "制作中":
            return "制作中";
        case "確認中":
            return "確認中";
        case "受注前":
        case "DRAFT":
        default:
            return "進行中";
    }
};

const getStatusBadgeStyle = (status: string) => {
    const label = getStatusLabel(status);
    switch (label) {
        case "入金済み":
            return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
        case "請求済":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
        case "納品済":
            return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300";
        case "制作中":
        case "確認中":
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
        default:
            return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
    }
};

export default function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [partners, setPartners] = useState<any[]>([]);
    const [pricingRules, setPricingRules] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editData, setEditData] = useState<any>({});

    useEffect(() => {
        const load = async () => {
            if (params.id) {
                try {
                    const [res, staff, partnerData, pricingRulesData] = await Promise.all([
                        getClientStats(params.id as string),
                        getStaff(),
                        getPartners(),
                        getPricingRules()
                    ]);
                    setData(res);
                    setStaffList(staff);
                    setPartners(partnerData as any);
                    setPricingRules(pricingRulesData as any);
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        load();
    }, [params.id]);

    const handleEdit = () => {
        setEditData({
            ...data.client,
            partnerIds: data.client.partners?.map((p: any) => p.id) || []
        });
        setIsEditing(true);
    };

    const handleSave = async (updatedData: any) => {
        setIsSaving(true);
        try {
            await upsertClient(updatedData);
            // Refresh data
            const res = await getClientStats(params.id as string);
            setData(res);
            setIsEditing(false);
        } catch (e) {
            console.error(e);
            alert("保存に失敗しました");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">読み込み中...</div>;
    if (!data) return <div className="p-8 text-center text-red-500 dark:text-red-400">データが見つかりません</div>;

    const { client, invoices, stats } = data;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8">
                <Button variant="ghost" className="mb-4 text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 pl-0" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> クライアント一覧へ戻る
                </Button>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{client.name}</h1>
                            {client.website && (
                                <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                    <ExternalLink className="w-5 h-5" />
                                </a>
                            )}
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-2 flex items-center gap-2">
                            <Building2 className="w-4 h-4" /> {client.contactPerson || "担当者未登録"}
                        </p>
                    </div>
                    {!isEditing && (
                        <Button onClick={handleEdit} variant="outline" className="dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700">
                            <Edit className="w-4 h-4 mr-2" /> 情報を編集
                        </Button>
                    )}
                </div>
            </header>

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>クライアント情報を編集</DialogTitle>
                    </DialogHeader>
                    <ClientForm
                        initialData={editData}
                        staffList={staffList}
                        partners={partners}
                        onSave={handleSave}
                        onCancel={() => setIsEditing(false)}

                        isLoading={isSaving}
                        pricingRules={pricingRules}
                    />
                </DialogContent>
            </Dialog>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <Card>
                    <CardHeader className="pb-2 px-4 pt-4">
                        <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">これまでの総売上</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">¥{(stats.totalRevenue || 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2 px-4 pt-4">
                        <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">今年の売上</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">¥{(stats.thisYearRevenue || 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2 px-4 pt-4">
                        <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">未入金残高</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className={`text-xl font-bold ${stats.unpaidAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-400 dark:text-zinc-600'}`}>
                            ¥{(stats.unpaidAmount || 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2 px-4 pt-4">
                        <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">総粗利額</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">¥{(stats.totalProfit || 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2 px-4 pt-4">
                        <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">平均粗利率</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">{(stats.profitMargin || 0).toFixed(1)}%</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Info Column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base dark:text-zinc-100">基本情報</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <div className="text-zinc-500 dark:text-zinc-400 mb-1">メールアドレス</div>
                                <div className="dark:text-zinc-200">{client.email || "-"}</div>
                            </div>
                            <div>
                                <div className="text-zinc-500 dark:text-zinc-400 mb-1">Chatwork</div>
                                {client.chatworkGroup ? (
                                    <a href={client.chatworkGroup} target="_blank" className="text-blue-600 hover:underline break-all dark:text-blue-400">
                                        {client.chatworkGroup}
                                    </a>
                                ) : (
                                    <span className="dark:text-zinc-200">-</span>
                                )}
                            </div>
                            <div>
                                <div className="text-zinc-500 dark:text-zinc-400 mb-1">SNS</div>
                                <div className="space-y-1 dark:text-zinc-200">
                                    {client.sns1 && <div>{client.sns1}</div>}
                                    {client.sns2 && <div>{client.sns2}</div>}
                                    {client.sns3 && <div>{client.sns3}</div>}
                                    {!client.sns1 && !client.sns2 && !client.sns3 && "-"}
                                </div>
                            </div>
                            <div>
                                <div className="text-zinc-500 dark:text-zinc-400 mb-1">備考</div>
                                <div className="whitespace-pre-wrap text-zinc-700 bg-zinc-50 p-2 rounded dark:bg-zinc-800 dark:text-zinc-300">
                                    {client.description || "なし"}
                                </div>
                            </div>
                            <div>
                                <div className="text-zinc-500 dark:text-zinc-400 mb-1">担当パートナー</div>
                                <div className="flex flex-wrap gap-2">
                                    {client.partners && client.partners.length > 0 ? (
                                        client.partners.map((p: any) => (
                                            <span key={p.id} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded dark:bg-green-900/40 dark:text-green-300">
                                                {p.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-zinc-400 dark:text-zinc-500">-</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing Rules Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base dark:text-zinc-100">設定された料金ルール</CardTitle>
                            <Link href="/pricing-rules">
                                <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                                    <Link2 className="w-4 h-4 mr-1" /> ルール管理
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {client.pricingRules && client.pricingRules.length > 0 ? (
                                    client.pricingRules.map((r: any) => (
                                        <Link key={r.id} href="/pricing-rules">
                                            <span className="text-xs bg-zinc-100 px-2 py-1 rounded cursor-pointer hover:bg-blue-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-blue-900/40">
                                                {r.name}
                                            </span>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-zinc-400 text-sm">設定なし</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* History Column */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base dark:text-zinc-100">制作・請求履歴</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm text-left dark:text-zinc-300">
                                    <thead className="bg-zinc-50 text-zinc-700 border-b dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                                        <tr>
                                            <th className="h-10 px-4 font-medium">納品日</th>
                                            <th className="h-10 px-4 font-medium">件名/品目</th>
                                            <th className="h-10 px-4 font-medium text-right">金額</th>
                                            <th className="h-10 px-4 font-medium text-center">ステータス</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.length === 0 ? (
                                            <tr><td colSpan={4} className="p-4 text-center text-zinc-400 dark:text-zinc-500">履歴はありません</td></tr>
                                        ) : (
                                            invoices.map((inv: any) => (
                                                <tr
                                                    key={inv.id}
                                                    className="border-b transition-colors hover:bg-zinc-100/80 cursor-pointer dark:border-zinc-700 dark:hover:bg-zinc-800"
                                                    onClick={() => router.push(`/invoices/${inv.id}`)}
                                                >
                                                    <td className="p-4 align-middle font-mono">
                                                        {inv.actualDeliveryDate
                                                            ? new Date(inv.actualDeliveryDate).toLocaleDateString()
                                                            : (inv.issueDate ? <span className="text-zinc-400">{new Date(inv.issueDate).toLocaleDateString()} (発行)</span> : "-")}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div className="font-medium truncate max-w-[240px] text-blue-600 dark:text-blue-400">
                                                            {inv.items?.[0]?.name || "Unspecified"}
                                                            {inv.items.length > 1 && <span className="text-zinc-400 text-xs ml-1 dark:text-zinc-500">(+{inv.items.length - 1})</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle text-right font-mono">
                                                        ¥{inv.totalAmount.toLocaleString()}
                                                    </td>
                                                    <td className="p-4 align-middle text-center">
                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeStyle(inv.status)}`}>
                                                            {getStatusLabel(inv.status)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
