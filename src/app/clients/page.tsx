"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getClients, getPartners, upsertClient } from "@/actions/pricing-actions";
import { Client } from "@/types";

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [accountingPartners, setAccountingPartners] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingClient, setEditingClient] = useState<Partial<Client>>({});

    useEffect(() => {
        const loadData = async () => {
            const [clientsData, partnersData] = await Promise.all([
                getClients(),
                getPartners()
            ]);
            setClients(clientsData as any);
            setAccountingPartners(partnersData.filter(p => p.role === '経理'));
            setIsLoading(false);
        };
        loadData();
    }, []);

    const handleAddNew = () => {
        setEditingClient({
            name: "",
            website: "",
            contactPerson: "",
            billingContact: "",
            sns1: "",
            sns2: "",
            sns3: "",
            email: "",
            chatworkGroup: ""
        });
        setIsEditing(true);
    };

    const handleEdit = (client: Client) => {
        setEditingClient({ ...client });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editingClient.name) return;
        setIsLoading(true);

        await upsertClient(editingClient);
        const updatedClients = await getClients();
        setClients(updatedClients as any);

        setIsEditing(false);
        setIsLoading(false);
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">クライアント管理</h1>
                    <p className="text-zinc-500">取引先クライアントの登録・編集を行います。</p>
                </div>
                <Button onClick={handleAddNew}>+ クライアント登録</Button>
            </header>

            {isEditing && (
                <Card className="mb-8 border-blue-200 bg-blue-50/20">
                    <CardHeader>
                        <CardTitle>{editingClient.id ? "クライアント編集" : "新規クライアント登録"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>会社名・屋号</Label>
                                <Input
                                    value={editingClient.name || ""}
                                    onChange={e => setEditingClient({ ...editingClient, name: e.target.value })}
                                    placeholder="株式会社Example"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>WebサイトURL</Label>
                                <Input
                                    value={editingClient.website || ""}
                                    onChange={e => setEditingClient({ ...editingClient, website: e.target.value })}
                                    placeholder="https://example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>メールアドレス</Label>
                                <Input
                                    type="email"
                                    value={editingClient.email || ""}
                                    onChange={e => setEditingClient({ ...editingClient, email: e.target.value })}
                                    placeholder="contact@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>メイン連絡用 Chatwork グループURL</Label>
                                <Input
                                    value={editingClient.chatworkGroup || ""}
                                    onChange={e => setEditingClient({ ...editingClient, chatworkGroup: e.target.value })}
                                    placeholder="https://www.chatwork.com/g/..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>担当者名</Label>
                                <Input
                                    value={editingClient.contactPerson || ""}
                                    onChange={e => setEditingClient({ ...editingClient, contactPerson: e.target.value })}
                                    placeholder="広報 田中 様"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>経理担当 (パートナーから選択)</Label>
                                <Select
                                    value={editingClient.billingContact || ""}
                                    onChange={e => setEditingClient({ ...editingClient, billingContact: e.target.value })}
                                >
                                    <option value="">選択してください...</option>
                                    {accountingPartners.map(p => (
                                        <option key={p.id} value={p.name}>{p.name}</option>
                                    ))}
                                </Select>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label>SNS / YouTube Channels</Label>
                                <div className="grid gap-2 md:grid-cols-3">
                                    <Input
                                        value={editingClient.sns1 || ""}
                                        onChange={e => setEditingClient({ ...editingClient, sns1: e.target.value })}
                                        placeholder="SNS 1 (YouTube etc)"
                                    />
                                    <Input
                                        value={editingClient.sns2 || ""}
                                        onChange={e => setEditingClient({ ...editingClient, sns2: e.target.value })}
                                        placeholder="SNS 2"
                                    />
                                    <Input
                                        value={editingClient.sns3 || ""}
                                        onChange={e => setEditingClient({ ...editingClient, sns3: e.target.value })}
                                        placeholder="SNS 3"
                                    />
                                </div>
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
                    <CardTitle>登録済みクライアント一覧</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading && clients.length === 0 ? (
                        <div>読み込み中...</div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">会社名</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">担当者</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">経理担当</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">設定ルール</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {clients.map((client) => (
                                        <tr key={client.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle">
                                                <div className="font-bold">{client.name}</div>
                                                {client.website && (
                                                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                                                        {client.website} ↗
                                                    </a>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle">{client.contactPerson || "-"}</td>
                                            <td className="p-4 align-middle">
                                                {client.billingContact ? (
                                                    <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700">
                                                        {client.billingContact}
                                                    </span>
                                                ) : "-"}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {client.pricingRules && client.pricingRules.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {client.pricingRules.map((r: any) => (
                                                            <span key={r.id} className="text-[10px] bg-zinc-100 px-1 rounded truncate max-w-[80px]">
                                                                {r.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : "-"}
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(client)}>編集</Button>
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
