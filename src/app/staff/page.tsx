
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getStaff, upsertStaff, deleteStaff } from "@/actions/pricing-actions";
import { Staff } from "@/types";
import { Trash2, UserPlus, Pencil, ShieldCheck, Calculator } from "lucide-react";

export default function StaffPage() {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Partial<Staff>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const data = await getStaff();
        setStaffList(data as any);
        setIsLoading(false);
    };

    const handleAddNew = () => {
        setEditingStaff({ name: "", email: "", role: "OPERATIONS" });
        setIsEditing(true);
    };

    const handleEdit = (s: Staff) => {
        setEditingStaff({ ...s });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editingStaff.name) return;
        setIsLoading(true);
        await upsertStaff(editingStaff);
        await loadData();
        setIsEditing(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm("このメンバーを削除してもよろしいですか？")) {
            setIsLoading(true);
            await deleteStaff(id);
            await loadData();
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">事業統括・経理管理</h1>
                    <p className="text-zinc-500">案件を管理する事業統括、および経理スタッフの登録・編集を行います。</p>
                </div>
                <Button onClick={handleAddNew}>
                    <UserPlus className="mr-2 h-4 w-4" /> スタッフを追加
                </Button>
            </header>

            {isEditing && (
                <Card className="mb-8 border-blue-200 bg-blue-50/20">
                    <CardHeader>
                        <CardTitle>{editingStaff.id ? "スタッフ編集" : "新規スタッフ登録"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label>氏名</Label>
                                <Input
                                    value={editingStaff.name || ""}
                                    onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })}
                                    placeholder="田中 統括"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>役割 (Role)</Label>
                                <Select
                                    value={editingStaff.role}
                                    onChange={e => setEditingStaff({ ...editingStaff, role: e.target.value as any })}
                                >
                                    <option value="OPERATIONS">事業統括 (Operations Lead)</option>
                                    <option value="ACCOUNTING">経理 (Accounting)</option>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>メールアドレス</Label>
                                <Input
                                    type="email"
                                    value={editingStaff.email || ""}
                                    onChange={e => setEditingStaff({ ...editingStaff, email: e.target.value })}
                                    placeholder="staff@example.com"
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
                    <CardTitle>登録済みスタッフ一覧</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading && staffList.length === 0 ? (
                        <div className="text-center py-8 dark:text-zinc-400">読み込み中...</div>
                    ) : staffList.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">登録されたスタッフがいません。</div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b dark:border-zinc-700">
                                    <tr className="border-b transition-colors hover:bg-muted/50 dark:border-zinc-700">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400 text-left">役割</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400 text-left">氏名</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground dark:text-zinc-400 text-left">メールアドレス</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {staffList
                                        .sort((a, b) => {
                                            if (a.role === b.role) return a.name.localeCompare(b.name);
                                            return a.role === 'OPERATIONS' ? -1 : 1;
                                        })
                                        .map((s) => (
                                            <tr
                                                key={s.id}
                                                className="border-b transition-colors hover:bg-blue-50 cursor-pointer dark:border-zinc-700 dark:hover:bg-blue-900/30"
                                                onClick={() => window.location.href = `/staff-dashboard?staffId=${s.id}`}
                                            >
                                                <td className="p-4 align-middle">
                                                    {s.role === 'OPERATIONS' ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                                            <ShieldCheck className="h-3 w-3" /> 事業統括
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                                                            <Calculator className="h-3 w-3" /> 経理
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle font-medium dark:text-zinc-200">{s.name}</td>
                                                <td className="p-4 align-middle dark:text-zinc-300">{s.email || "-"}</td>
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
