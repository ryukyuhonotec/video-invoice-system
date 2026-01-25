"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getPartners, upsertPartner } from "@/actions/pricing-actions";
import { Partner } from "@/types";

export default function PartnersPage() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partial<Partner>>({});

    useEffect(() => {
        const loadData = async () => {
            const data = await getPartners();
            setPartners(data as any);
            setIsLoading(false);
        };
        loadData();
    }, []);

    const handleAddNew = () => {
        setEditingPartner({ name: "", role: "エディター", email: "", chatworkGroup: "" });
        setIsEditing(true);
    };

    const handleEdit = (partner: Partner) => {
        setEditingPartner({ ...partner });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editingPartner.name) return;
        setIsLoading(true);

        await upsertPartner(editingPartner);
        const updated = await getPartners();
        setPartners(updated as any);

        setIsEditing(false);
        setIsLoading(false);
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">パートナー管理</h1>
                    <p className="text-zinc-500">制作スタッフ（カメラマン、エディター等）の管理を行います。</p>
                </div>
                <Button onClick={handleAddNew}>+ パートナー登録</Button>
            </header>

            {isEditing && (
                <Card className="mb-8 border-blue-200 bg-blue-50/20">
                    <CardHeader>
                        <CardTitle>{editingPartner.id ? "パートナー編集" : "新規パートナー登録"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>氏名</Label>
                                <Input
                                    value={editingPartner.name || ""}
                                    onChange={e => setEditingPartner({ ...editingPartner, name: e.target.value })}
                                    placeholder="山田 太郎"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>役割・職種</Label>
                                <Select
                                    value={editingPartner.role}
                                    onChange={e => setEditingPartner({ ...editingPartner, role: e.target.value })}
                                >
                                    <option value="ディレクター">ディレクター</option>
                                    <option value="カメラマン">カメラマン</option>
                                    <option value="エディター">エディター</option>
                                    <option value="経理">経理</option>
                                    <option value="アシスタント">アシスタント</option>
                                    <option value="その他">その他</option>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>メールアドレス</Label>
                                <Input
                                    value={editingPartner.email || ""}
                                    onChange={e => setEditingPartner({ ...editingPartner, email: e.target.value })}
                                    placeholder="example@email.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Chatwork グループURL</Label>
                                <Input
                                    value={editingPartner.chatworkGroup || ""}
                                    onChange={e => setEditingPartner({ ...editingPartner, chatworkGroup: e.target.value })}
                                    placeholder="https://www.chatwork.com/g/..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>キャンセル</Button>
                            <Button onClick={handleSave} disabled={isLoading}>
                                {isLoading ? "保存中..." : "保存"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>パートナー一覧</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading && partners.length === 0 ? (
                        <div>読み込み中...</div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">氏名</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">役割</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">連絡先/リンク</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">原価ルール</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {partners.map((p) => (
                                        <tr key={p.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-bold">{p.name}</td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                                                    ${p.role === '経理' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {p.role}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-xs text-muted-foreground">
                                                {p.email && <div>📧 {p.email}</div>}
                                                {p.chatworkGroup && (
                                                    <div>
                                                        💬 <a href={p.chatworkGroup} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                            Chatwork Group
                                                        </a>
                                                    </div>
                                                )}
                                                {!p.email && !p.chatworkGroup && "-"}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {p.costRules && p.costRules.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {p.costRules.map((r: any) => (
                                                            <span key={r.id} className="text-[10px] bg-zinc-100 px-1 rounded truncate max-w-[80px]">
                                                                {r.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : "-"}
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>編集</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
