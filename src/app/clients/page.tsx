"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_CLIENTS } from "@/data/mock";

export default function ClientsPage() {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">クライアント管理</h1>
                    <p className="text-zinc-500">取引先クライアントの登録・編集を行います。</p>
                </div>
                <Button>+ クライアント登録</Button>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>登録済みクライアント一覧</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">ID</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">会社名</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">適用ルール数</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {MOCK_CLIENTS.map((client) => (
                                    <tr key={client.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{client.id}</td>
                                        <td className="p-4 align-middle font-bold">{client.name}</td>
                                        <td className="p-4 align-middle">{client.defaultPricingRules?.length || 0} ルール</td>
                                        <td className="p-4 align-middle text-right">
                                            <Button variant="outline" size="sm">詳細・編集</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
