"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Book, FileText, Settings, HelpCircle } from "lucide-react";

export default function FAQPage() {
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <HelpCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">使い方FAQ</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">よくある質問とシステムの使い方ガイド</p>
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="dark:bg-zinc-900 dark:border-zinc-800">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-zinc-500" />
                            <CardTitle>請求書・案件管理</CardTitle>
                        </div>
                        <CardDescription>案件の作成から請求書発行までの流れ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>新しい案件を作成するには？</AccordionTrigger>
                                <AccordionContent>
                                    ダッシュボード右上の「+ 新規案件作成」ボタンをクリックしてください。
                                    クライアントを選択し、必要な項目を入力して保存することで案件が作成されます。
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>「途中終了」とは何ですか？</AccordionTrigger>
                                <AccordionContent>
                                    案件が何らかの理由で完了前に終了した場合に使用します。
                                    納品完了と同様に日付とURLを入力することで、完了として扱われ、請求書には反映されませんが履歴として残ります。
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>請求書をPDFダウンロードするには？</AccordionTrigger>
                                <AccordionContent>
                                    案件詳細画面の「PDFダウンロード」ボタンからダウンロードできます。
                                    まだ下書き（DRAFT）状態の場合はダウンロードできませんので、内容を確定させてください。
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>

                <Card className="dark:bg-zinc-900 dark:border-zinc-800">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-zinc-500" />
                            <CardTitle>設定・その他</CardTitle>
                        </div>
                        <CardDescription>アプリケーションの設定や分析機能について</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="analytics-1">
                                <AccordionTrigger>売上分析の「Top N」とは？</AccordionTrigger>
                                <AccordionContent>
                                    売上構成チャートで、売上の多い順に上位何社を表示するかを指定できます。
                                    指定した数より下位のクライアントは「その他」としてまとめて表示されます。
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="settings-1">
                                <AccordionTrigger>消費税率を変更したい</AccordionTrigger>
                                <AccordionContent>
                                    現在、消費税率はシステムで一律10%に固定されています。
                                    変更が必要な場合はシステム管理者へお問い合わせください。
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
