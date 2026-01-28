"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { getInvoice, updateInvoiceStatus } from "@/actions/pricing-actions";
import { Invoice } from "@/types";
import { useParams, useSearchParams } from "next/navigation";
import { Download, Send, CheckCircle2, CheckCircle } from "lucide-react";

export default function InvoicePublishPage({ params }: { params: Promise<{ id: string }> }) {
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);
    // unwrapping params
    const [unwrappedParams, setUnwrappedParams] = useState<{ id: string } | null>(null);
    const searchParams = useSearchParams();
    const type = searchParams.get('type'); // 'quotation' or null
    const isQuotation = type === 'quotation';

    useEffect(() => {
        params.then(setUnwrappedParams);
    }, [params]);

    useEffect(() => {
        if (!unwrappedParams) return;
        const load = async () => {
            try {
                const data = await getInvoice(unwrappedParams.id);
                setInvoice(data as any);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [unwrappedParams]);

    const handleDownloadPdf = async () => {
        if (!printRef.current || !invoice) return;
        setIsDownloading(true);
        try {
            // Dynamically import html2pdf to avoid SSR issues
            const html2pdf = (await import('html2pdf.js')).default;
            const element = printRef.current;
            const opt = {
                margin: 10,
                filename: `${isQuotation ? '見積書' : '請求書'}_${invoice.client?.name || 'unknown'}_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
            };
            await html2pdf().set(opt).from(element).save();
        } catch (e) {
            console.error('PDF generation failed:', e);
            alert('PDF生成に失敗しました');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleIssue = async () => {
        if (!invoice) return;
        if (!confirm("請求書を発行しますか？\n品目のステータスが「請求済」に変更されます。")) return;

        setIsLoading(true);
        await updateInvoiceStatus(invoice.id, "Billed"); // Using internal Billed or 請求済 based on logic
        // Reload
        const data = await getInvoice(invoice.id);
        setInvoice(data as any);
        setIsLoading(false);
    };

    const handlePayment = async () => {
        if (!invoice) return;
        if (!confirm("入金確認を完了しますか？\n品目のステータスが「完了」に変更されます。")) return;

        setIsLoading(true);
        await updateInvoiceStatus(invoice.id, "Paid"); // Internal Paid
        const data = await getInvoice(invoice.id);
        setInvoice(data as any);
        setIsLoading(false);
    };

    if (isLoading) return <div className="p-10 text-center">読み込み中...</div>;
    if (!invoice) return <div className="p-10 text-center">請求書が見つかりません</div>;

    // Display helpers
    const clientName = invoice.client?.name || "顧客名未定";
    const issueDate = invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString("ja-JP") : "----/--/--";
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("ja-JP") : "末日";

    // Status badges - cast to string to handle all possible status values
    const status = invoice.status as string;
    const isBilled = status === "Billed" || status === "請求済" || status === "Paid" || status === "入金済み" || status === "完了";
    const isPaid = status === "Paid" || status === "入金済み" || status === "完了";

    return (
        <div className="min-h-screen bg-zinc-100 p-8 print:p-0 print:bg-white">
            {/* Toolbar (Hidden when printing) */}
            <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
                <div className="flex gap-4">
                    {!isBilled && (
                        <Button onClick={handleIssue} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Send className="w-4 h-4 mr-2" /> 請求書を発行 (ステータス更新)
                        </Button>
                    )}
                    <Button onClick={handlePayment} className="bg-green-600 hover:bg-green-700 text-white">
                        <CheckCircle className="w-4 h-4 mr-2" /> 入金確認 (完了にする)
                    </Button>
                    {isPaid && <div className="text-green-600 font-bold flex items-center"><CheckCircle className="mr-2" /> 支払完了 (Paid)</div>}
                </div>
                <Button onClick={handleDownloadPdf} disabled={isDownloading} className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Download className="w-4 h-4 mr-2" /> {isQuotation ? '見積書PDF保存' : (isDownloading ? 'ダウンロード中...' : 'PDFダウンロード')}
                </Button>
            </div>

            {/* A4 Paper Layout */}
            <div ref={printRef} className="max-w-4xl mx-auto bg-white shadow-lg p-16 min-h-[1100px] print:shadow-none print:p-8 text-zinc-900">

                {/* Header */}
                <div className="flex justify-between items-start mb-16">
                    <div>
                        <h1 className="text-3xl font-bold tracking-widest mb-2">{isQuotation ? '御見積書' : 'ご請求書'}</h1>
                        <div className="text-sm underline decoration-1 underline-offset-4">{isQuotation ? 'QUOTATION' : 'INVOICE'}</div>
                    </div>
                    <div className="text-right text-xs space-y-1">
                        <div>登録番号: T1234567890123</div>
                        <div>{isQuotation ? '見積日' : '発行日'}: {issueDate}</div>
                        <div>{isQuotation ? '見積番号' : '請求番号'}: {invoice.id.substring(0, 8).toUpperCase()}</div>
                    </div>
                </div>

                {/* Client & Company Info */}
                <div className="flex justify-between mb-12">
                    <div className="w-1/2">
                        <h2 className="text-xl font-bold border-b-2 border-black pb-1 mb-4 inline-block">{clientName} 御中</h2>
                    </div>
                    <div className="w-1/2 text-right text-sm">
                        <h3 className="font-bold text-lg mb-2">株式会社Example Creative</h3>
                        <p>〒100-0001</p>
                        <p>東京都千代田区千代田1-1-1</p>
                        <p>Techビルディング 5F</p>
                        <p>Tel: 03-1234-5678</p>
                        <p>Email: accounting@example.com</p>
                    </div>
                </div>

                {/* Total Amount Box */}
                <div className="mb-12">
                    <div className="flex justify-between items-end border-b-4 border-black pb-2">
                        <div className="text-sm font-bold">{isQuotation ? '御見積金額 (税込)' : '御請求金額 (税込)'}</div>
                        <div className="text-4xl font-bold">¥{invoice.totalAmount.toLocaleString()} -</div>
                    </div>
                    <div className="text-xs mt-2 text-right">
                        {isQuotation ? `有効期限: ${dueDate}` : `お支払期限: ${dueDate}`}
                    </div>
                </div>

                {/* Details Table */}
                <table className="w-full mb-12 text-sm">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="py-2 text-left w-[40%]">品目 / 内容</th>
                            <th className="py-2 text-center">数量</th>
                            <th className="py-2 text-center">単位</th>
                            <th className="py-2 text-right">単価</th>
                            <th className="py-2 text-right">金額</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((item, i) => (
                            <tr key={i} className="border-b border-zinc-200">
                                <td className="py-3">
                                    <div className="font-bold">{item.name}</div>
                                    {item.duration && <div className="text-xs text-zinc-500">尺: {item.duration}分</div>}
                                </td>
                                <td className="py-3 text-center">{item.quantity}</td>
                                <td className="py-3 text-center">-</td>
                                <td className="py-3 text-right">¥{item.unitPrice.toLocaleString()}</td>
                                <td className="py-3 text-right">¥{item.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                        {/* Empty rows filler */}
                        {Array.from({ length: Math.max(0, 5 - invoice.items.length) }).map((_, i) => (
                            <tr key={`empty-${i}`} className="border-b border-zinc-100">
                                <td className="py-3">&nbsp;</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Summary */}
                <div className="flex justify-end">
                    <div className="w-[40%] space-y-2">
                        <div className="flex justify-between py-1 border-b border-zinc-300">
                            <span>小計 (税抜)</span>
                            <span>¥{invoice.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-300">
                            <span>消費税 (10%)</span>
                            <span>¥{invoice.tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2 font-bold text-lg">
                            <span>合計</span>
                            <span>¥{invoice.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Footer / Notes */}
                <div className="mt-20 pt-8 border-t border-zinc-200 text-xs text-zinc-500">
                    <h4 className="font-bold mb-2">備考</h4>
                    <ul className="list-disc list-inside space-y-1">
                        <li>振込手数料は貴社にてご負担願います。</li>
                        <li>本請求書に関するお問い合わせは上記連絡先までお願いいたします。</li>
                    </ul>

                    <div className="mt-8 font-bold">
                        【振込先】
                        <div className="mt-1 ml-4">
                            三井住友銀行 渋谷支店 (店番: 123)<br />
                            普通 1234567<br />
                            カ) イグザンプル
                        </div>
                    </div>
                </div>

            </div>
        </div >
    );
}
