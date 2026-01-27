"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCompanyProfile, updateCompanyProfile } from "@/actions/settings-actions";
import { Save } from "lucide-react";

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<any>({});

    useEffect(() => {
        const load = async () => {
            const data = await getCompanyProfile();
            setProfile(data || {});
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

    if (isLoading) return <div className="p-8">読み込み中...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">マスタ設定</h1>

            <Card className="mb-8">
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

            <Card className="mb-8">
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
        </div>
    );
}
