"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; // Placeholder for future use

// Mock data for partners (internal use for now)
const MOCK_PARTNERS = [
    { id: "p-001", name: "山田 太郎", role: "カメラマン" },
    { id: "p-002", name: "鈴木 花子", role: "エディター" },
    { id: "p-003", name: "佐藤 次郎", role: "ディレクター" },
];

export default function PartnersPage() {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">パートナー管理</h1>
                    <p className="text-zinc-500">制作スタッフ（カメラマン、エディター等）の管理を行います。</p>
                </div>
                <Button>+ パートナー登録</Button>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>パートナー一覧</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">ID</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">氏名</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">役割 (Role)</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {MOCK_PARTNERS.map((p) => (
                                    <tr key={p.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{p.id}</td>
                                        <td className="p-4 align-middle font-bold">{p.name}</td>
                                        <td className="p-4 align-middle">{p.role}</td>
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
