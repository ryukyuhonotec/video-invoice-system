"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPartnerStats } from "@/actions/pricing-actions";
import { ArrowLeft, UserCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function PartnerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (params.id) {
                try {
                    const res = await getPartnerStats(params.id as string);
                    setData(res);
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        load();
    }, [params.id]);

    if (isLoading) return <div className="p-8 text-center text-zinc-500">読み込み中...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">データが見つかりません</div>;

    const { partner, tasks, stats } = data;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8">
                <Button variant="ghost" className="mb-4 text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 pl-0" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> パートナー一覧へ戻る
                </Button>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{partner.name}</h1>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${partner.role === '経理' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                                {partner.role}
                            </span>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-2 flex items-center gap-2">
                            {partner.position && <span>{partner.position}</span>}
                        </p>
                    </div>
                    {/* Edit Button */}
                    <Link href={`/partners?edit=${partner.id}`}>
                        <Button variant="outline" size="sm" className="hidden">
                            編集
                        </Button>
                        {/* 
                          Ideally this should open the modal on the list page. 
                          Pass a query param ?edit=ID to the list page and have it auto-open.
                          Or, duplicate the edit form here (less ideal).
                          Let's try the query param approach.
                        */}
                        <Button variant="outline" size="sm" onClick={() => router.push(`/partners?edit=${partner.id}`)}>
                            情報を編集
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">これまでの総発注額（原価）</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">¥{stats.totalCost.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">今年の発注金額</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">¥{stats.thisYearCost.toLocaleString()}</div>
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
                                <div className="dark:text-zinc-200">{partner.email || "-"}</div>
                            </div>
                            <div>
                                <div className="text-zinc-500 dark:text-zinc-400 mb-1">Chatwork</div>
                                {partner.chatworkGroup ? (
                                    <a href={partner.chatworkGroup} target="_blank" className="text-blue-600 hover:underline break-all dark:text-blue-400">
                                        {partner.chatworkGroup}
                                    </a>
                                ) : (
                                    <span className="dark:text-zinc-200">-</span>
                                )}
                            </div>
                            <div>
                                <div className="text-zinc-500 dark:text-zinc-400 mb-1">備考</div>
                                <div className="whitespace-pre-wrap text-zinc-700 bg-zinc-50 p-2 rounded dark:bg-zinc-800 dark:text-zinc-300">
                                    {partner.description || "なし"}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base dark:text-zinc-100">設定された原価ルール</CardTitle>
                            <Link href="/pricing-rules">
                                <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                                    ルール管理 →
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {partner.pricingRules && partner.pricingRules.length > 0 ? (
                                    partner.pricingRules.map((r: any) => (
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
                            <CardTitle className="text-base dark:text-zinc-100">担当タスク履歴</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm text-left dark:text-zinc-300">
                                    <thead className="bg-zinc-50 text-zinc-700 border-b dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                                        <tr>
                                            <th className="h-10 px-4 font-medium">納期</th>
                                            <th className="h-10 px-4 font-medium">タスク名/案件</th>
                                            <th className="h-10 px-4 font-medium text-right">発注額</th>
                                            <th className="h-10 px-4 font-medium text-center">ステータス</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tasks.length === 0 ? (
                                            <tr><td colSpan={4} className="p-4 text-center text-zinc-400">履歴はありません</td></tr>
                                        ) : (
                                            tasks.map((task: any) => (
                                                <tr key={task.id} className="border-b transition-colors hover:bg-zinc-50/50 dark:border-zinc-700 dark:hover:bg-zinc-800/50">
                                                    <td className="p-4 align-middle">
                                                        {task.deliveryDate ? new Date(task.deliveryDate).toLocaleDateString() : "-"}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div className="font-bold">{task.pricingRule?.name || "担当領域未設定"}</div>
                                                        <div className="text-xs text-zinc-500 truncate max-w-[200px] dark:text-zinc-400">
                                                            {task.invoiceItem?.invoice?.client?.name} / {task.invoiceItem?.name}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle text-right font-mono">
                                                        ¥{task.costAmount.toLocaleString()}
                                                    </td>
                                                    <td className="p-4 align-middle text-center">
                                                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                                                            {task.status}
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
