
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupervisors, upsertSupervisor, deleteSupervisor } from "@/actions/pricing-actions";
import { Supervisor } from "@/types";
import { Trash2, UserPlus, Pencil } from "lucide-react";

export default function SupervisorsPage() {
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingSup, setEditingSup] = useState<Partial<Supervisor>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const data = await getSupervisors();
        setSupervisors(data as any);
        setIsLoading(false);
    };

    const handleAddNew = () => {
        setEditingSup({ name: "", email: "" });
        setIsEditing(true);
    };

    const handleEdit = (sup: Supervisor) => {
        setEditingSup({ ...sup });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editingSup.name) return;
        setIsLoading(true);
        await upsertSupervisor(editingSup);
        await loadData();
        setIsEditing(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm("この統括者を削除してもよろしいですか？")) {
            setIsLoading(true);
            await deleteSupervisor(id);
            await loadData();
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">統括者管理</h1>
                    <p className="text-zinc-500">案件を統括するマネージャーの登録・編集を行います。</p>
                </div>
                <Button onClick={handleAddNew}>
                    <UserPlus className="mr-2 h-4 w-4" /> 統括者を追加
                </Button>
            </header>

            {isEditing && (
                <Card className="mb-8 border-blue-200 bg-blue-50/20">
                    <CardHeader>
                        <CardTitle>{editingSup.id ? "統括者編集" : "新規統括者登録"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>氏名</Label>
                                <Input
                                    value={editingSup.name || ""}
                                    onChange={e => setEditingSup({ ...editingSup, name: e.target.value })}
                                    placeholder="田中 統括"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>メールアドレス</Label>
                                <Input
                                    type="email"
                                    value={editingSup.email || ""}
                                    onChange={e => setEditingSup({ ...editingSup, email: e.target.value })}
                                    placeholder="tanaka@example.com"
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
                    <CardTitle>登録済み統括者一覧</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading && supervisors.length === 0 ? (
                        <div className="text-center py-8">読み込み中...</div>
                    ) : supervisors.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">登録された統括者がいません。</div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-left">氏名</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-left">メールアドレス</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {supervisors.map((sup) => (
                                        <tr key={sup.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-medium">{sup.name}</td>
                                            <td className="p-4 align-middle">{sup.email || "-"}</td>
                                            <td className="p-4 align-middle text-right space-x-2">
                                                <Button size="icon" variant="ghost" onClick={() => handleEdit(sup)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(sup.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
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
