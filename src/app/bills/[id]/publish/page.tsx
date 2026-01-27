"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getBill } from "@/actions/bill-display-actions";
import { getCompanyProfile } from "@/actions/settings-actions";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";

export default function BillPublishPage({ params }: { params: Promise<{ id: string }> }) {
    const [bill, setBill] = useState<any>(null);
    const [company, setCompany] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [unwrappedParams, setUnwrappedParams] = useState<{ id: string } | null>(null);

    useEffect(() => {
        params.then(setUnwrappedParams);
    }, [params]);

    useEffect(() => {
        if (!unwrappedParams) return;
        const load = async () => {
            const [bData, cData] = await Promise.all([
                getBill(unwrappedParams.id),
                getCompanyProfile()
            ]);
            setBill(bData);
            setCompany(cData || {});
            setIsLoading(false);
        };
        load();
    }, [unwrappedParams]);

    if (isLoading) return <div className="p-10 text-center">読み込み中...</div>;
    if (!bill) return <div className="p-10 text-center">請求書が見つかりません</div>;

    const issueDate = new Date(bill.issueDate).toLocaleDateString("ja-JP", { year: 'numeric', month: 'long', day: 'numeric' });
    const limitDate = bill.paymentDueDate ? new Date(bill.paymentDueDate).toLocaleDateString("ja-JP", { year: 'numeric', month: 'long', day: 'numeric' }) : "翌月末日";

    // Flatten all items from all invoices
    const allItems = bill.invoices.flatMap((inv: any) =>
        inv.items.map((item: any) => ({
            ...item,
            projectName: inv.items[0]?.name === item.name ? null : inv.items[0]?.name // Try to detect if item name is essentially the project name? No, just list items.
        }))
    );

    return (
        <div className="min-h-screen bg-zinc-100 p-8 print:p-0 print:bg-white text-zinc-900 font-sans">
            <div className="max-w-[210mm] mx-auto mb-8 flex justify-end print:hidden">
                <Button onClick={() => window.print()} className="bg-zinc-800 text-white">
                    <Printer className="mr-2 h-4 w-4" /> 印刷 / PDF保存
                </Button>
            </div>

            <div className="max-w-[210mm] mx-auto bg-white shadow-2xl min-h-[297mm] p-[40px] print:shadow-none print:p-0 relative">

                {/* Header */}
                <div className="flex justify-between items-start mb-16 border-b-2 border-zinc-800 pb-8">
                    <div className="w-[60%]">
                        <h1 className="text-3xl font-bold tracking-[0.2em] mb-8">ご請求書</h1>
                        <h2 className="text-2xl font-bold border-b border-zinc-400 pb-2 mb-2 inline-block min-w-[300px]">
                            {bill.client.name} <span className="text-sm ml-2">御中</span>
                        </h2>
                        <div className="text-sm mt-4">
                            <div className="flex justify-between w-[300px] border-b border-zinc-200 py-1">
                                <span>件名</span>
                                <span>動画制作費用 他</span>
                            </div>
                            <div className="flex justify-between w-[300px] border-b border-zinc-200 py-1 font-bold">
                                <span>御請求金額</span>
                                <span>¥{bill.totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between w-[300px] border-b border-zinc-200 py-1 text-xs text-zinc-500">
                                <span>お支払期限</span>
                                <span>{limitDate}</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-[35%] text-right text-sm leading-relaxed">
                        <div className="mb-4">
                            <div className="font-bold text-lg">{company.name || "自社名未設定"}</div>
                            {company.registrationNumber && <div className="text-xs text-zinc-500">登録番号: {company.registrationNumber}</div>}
                        </div>
                        <p>{company.address}</p>
                        <p>{company.phone}</p>
                        {company.email && <p>{company.email}</p>}

                        <div className="mt-8 text-xs">
                            <div className="flex justify-between border-b border-zinc-200">
                                <span>請求番号</span>
                                <span>{bill.id.substring(0, 8).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between border-b border-zinc-200">
                                <span>発行日</span>
                                <span>{issueDate}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-12 text-sm">
                    <thead>
                        <tr className="bg-zinc-800 text-white">
                            <th className="py-3 px-4 text-left w-[50%]">内容 / 品目</th>
                            <th className="py-3 px-2 text-center">数量</th>
                            <th className="py-3 px-2 text-center">単価</th>
                            <th className="py-3 px-4 text-right">金額</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allItems.map((item: any, i: number) => (
                            <tr key={i} className="border-b border-zinc-200">
                                <td className="py-3 px-4">
                                    <div className="font-bold text-zinc-800">{item.name}</div>
                                    {item.duration > 0 && <div className="text-xs text-zinc-500">尺: {item.duration}分</div>}
                                </td>
                                <td className="py-3 px-2 text-center">{item.quantity}</td>
                                <td className="py-3 px-2 text-center">
                                    ¥{item.unitPrice > 0 ? item.unitPrice.toLocaleString() : (item.amount / (item.quantity || 1)).toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-right font-medium">¥{item.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer Totals */}
                <div className="flex justify-end mb-20">
                    <div className="w-[40%] space-y-2">
                        <div className="flex justify-between py-2 border-b border-zinc-300">
                            <span>小計</span>
                            <span>¥{(bill.totalAmount - bill.tax).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-zinc-300">
                            <span>消費税 (10%)</span>
                            <span>¥{bill.tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-4 font-bold text-xl bg-zinc-50 px-4 mt-2">
                            <span>合計</span>
                            <span>¥{bill.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Banking & Notes */}
                <div className="grid grid-cols-2 gap-12 text-sm border-t-2 border-zinc-800 pt-8">
                    <div>
                        <h3 className="font-bold border-b border-zinc-400 pb-1 mb-2">お振込先</h3>
                        {company.bankName ? (
                            <div className="leading-loose">
                                {company.bankName} {company.bankBranch}<br />
                                {company.bankAccountType} {company.bankAccountNumber}<br />
                                <span className="font-bold">{company.bankAccountHolder}</span>
                            </div>
                        ) : (
                            <div className="text-zinc-400 italic">振込先情報が設定されていません</div>
                        )}
                        <p className="text-xs text-zinc-500 mt-2">※振込手数料は貴社にてご負担願います。</p>
                    </div>
                    <div>
                        <h3 className="font-bold border-b border-zinc-400 pb-1 mb-2">備考</h3>
                        <div className="min-h-24 bg-zinc-50 rounded p-2 text-sm text-zinc-700 whitespace-pre-wrap">
                            {bill.notes || (
                                <span className="text-zinc-400 text-xs text-center block py-8">備考なし</span>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
