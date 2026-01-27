"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCompanyProfile, updateCompanyProfile } from "@/actions/settings-actions";
import { getAuditLogs, getCurrentUser } from "@/actions/audit-actions";
import { Save, Building2, History, Shield, User } from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<any>({});
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            const [data, logs, user] = await Promise.all([
                getCompanyProfile(),
                getAuditLogs({ limit: 50 }),
                getCurrentUser()
            ]);
            setProfile(data || {});
            setAuditLogs(logs);
            setCurrentUser(user);
            setIsLoading(false);
        };
        load();
    }, []);

    const handleChange = (field: string, value: string) => {
        setProfile((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        await updateCompanyProfile(profile);
        setIsLoading(false);
        alert("設定を保存しました");
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'CREATE': return '作成';
            case 'UPDATE': return '更新';
            case 'DELETE': return '削除';
            case 'LOGIN': return 'ログイン';
            case 'LOGOUT': return 'ログアウト';
            default: return action;
        }
    };

    const getTargetLabel = (targetType: string) => {
        switch (targetType) {
            case 'INVOICE': return '案件';
            case 'CLIENT': return 'クライアント';
            case 'PARTNER': return 'パートナー';
            case 'STAFF': return 'スタッフ';
            case 'PRICING_RULE': return '単価ルール';
            case 'BILL': return '請求書';
            case 'SETTINGS': return '設定';
            default: return targetType;
        }
    };

    if (isLoading) return <div className="p-8">読み込み中...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-5xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">設定</h1>
                {currentUser && (
                    <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-4 py-2">
                        {currentUser.image ? (
                            <Image src={currentUser.image} alt="" width={32} height={32} className="rounded-full" />
                        ) : (
                            <User className="w-8 h-8 text-zinc-400" />
                        )}
                        <div>
                            <div className="font-medium text-sm">{currentUser.name}</div>
                            <div className="text-xs text-zinc-500">
                                {currentUser.role === 'OWNER' ? 'オーナー' : 'スタッフ'}
                                {currentUser.staff && ` (${currentUser.staff.role === 'OPERATIONS' ? '事業統括' : '経理'})`}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Tabs defaultValue="company" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="company" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span className="hidden sm:inline">自社情報</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span className="hidden sm:inline">セキュリティ</span>
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="flex items-center gap-2">
                        <History className="w-4 h-4" />
                        <span className="hidden sm:inline">変更履歴</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="company">
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>自社情報 (請求書発行元)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>会社名 / 屋号</Label>
                                    <Input value={profile.name || ""} onChange={e => handleChange("name", e.target.value)} placeholder="株式会社サンプル" />
                                </div>
                                <div className="space-y-2">
                                    <Label>登録番号 (T番号)</Label>
                                    <Input value={profile.registrationNumber || ""} onChange={e => handleChange("registrationNumber", e.target.value)} placeholder="T1234567890123" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>住所</Label>
                                    <Input value={profile.address || ""} onChange={e => handleChange("address", e.target.value)} placeholder="東京都..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>電話番号</Label>
                                    <Input value={profile.phone || ""} onChange={e => handleChange("phone", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input value={profile.email || ""} onChange={e => handleChange("email", e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>振込先口座情報</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>銀行名</Label>
                                    <Input value={profile.bankName || ""} onChange={e => handleChange("bankName", e.target.value)} placeholder="三井住友銀行" />
                                </div>
                                <div className="space-y-2">
                                    <Label>支店名</Label>
                                    <Input value={profile.bankBranch || ""} onChange={e => handleChange("bankBranch", e.target.value)} placeholder="渋谷支店" />
                                </div>
                                <div className="space-y-2">
                                    <Label>口座種別</Label>
                                    <Input value={profile.bankAccountType || ""} onChange={e => handleChange("bankAccountType", e.target.value)} placeholder="普通" />
                                </div>
                                <div className="space-y-2">
                                    <Label>口座番号</Label>
                                    <Input value={profile.bankAccountNumber || ""} onChange={e => handleChange("bankAccountNumber", e.target.value)} placeholder="1234567" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>口座名義 (カナ)</Label>
                                    <Input value={profile.bankAccountHolder || ""} onChange={e => handleChange("bankAccountHolder", e.target.value)} placeholder="カ) サンプル" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button size="lg" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Save className="mr-2 h-5 w-5" /> 設定を保存
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>セキュリティ設定</CardTitle>
                            <CardDescription>アカウントのセキュリティ状況</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
                                    <div>
                                        <div className="font-medium text-green-800 dark:text-green-200">Google認証で保護されています</div>
                                        <div className="text-sm text-green-600 dark:text-green-400">{currentUser?.email}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-medium">セキュリティポリシー</h3>
                                <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        全ルートでログイン認証が必要
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        JWT セッション管理で安全な認証
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        すべての変更が監査ログに記録
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="logs">
                    <Card>
                        <CardHeader>
                            <CardTitle>変更履歴</CardTitle>
                            <CardDescription>誰が、いつ、何を変更したかの記録</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {auditLogs.length === 0 ? (
                                <div className="text-center py-8 text-zinc-500">
                                    変更履歴はまだありません
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                    {auditLogs.map((log: any) => (
                                        <div key={log.id} className="flex items-start gap-4 p-3 border rounded-lg dark:border-zinc-700">
                                            {log.user?.image ? (
                                                <Image src={log.user.image} alt="" width={36} height={36} className="rounded-full" />
                                            ) : (
                                                <User className="w-9 h-9 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="font-medium">{log.user?.name || '不明'}</span>
                                                    <span className={`px-2 py-0.5 text-xs rounded ${log.action === 'CREATE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                log.action === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                    'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                                        }`}>
                                                        {getActionLabel(log.action)}
                                                    </span>
                                                    <span className="text-zinc-500">{getTargetLabel(log.targetType)}</span>
                                                </div>
                                                {log.details && (
                                                    <div className="text-xs text-zinc-500 mt-1 truncate">
                                                        {(() => {
                                                            try {
                                                                const details = JSON.parse(log.details);
                                                                return details.name || log.targetId;
                                                            } catch {
                                                                return log.details;
                                                            }
                                                        })()}
                                                    </div>
                                                )}
                                                <div className="text-xs text-zinc-400 mt-1">{formatDate(log.createdAt)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
