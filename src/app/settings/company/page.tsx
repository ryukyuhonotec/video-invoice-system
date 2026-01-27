"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCompanyProfile, updateCompanyProfile, getCompanyStats } from "@/actions/settings-actions";
import { Loader2, Building2, Save, TrendingUp, DollarSign, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CompanySettingsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
        email: "",
        registrationNumber: "",
        bankName: "",
        bankBranch: "",
        bankAccountType: "普通",
        bankAccountNumber: "",
        bankAccountHolder: ""
    });

    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [profile, companyStats] = await Promise.all([
                    getCompanyProfile(),
                    getCompanyStats()
                ]);

                if (profile) {
                    setFormData({
                        name: profile.name || "",
                        address: profile.address || "",
                        phone: profile.phone || "",
                        email: profile.email || "",
                        registrationNumber: profile.registrationNumber || "",
                        bankName: profile.bankName || "",
                        bankBranch: profile.bankBranch || "",
                        bankAccountType: profile.bankAccountType || "普通",
                        bankAccountNumber: profile.bankAccountNumber || "",
                        bankAccountHolder: profile.bankAccountHolder || ""
                    });
                }
                setStats(companyStats);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateCompanyProfile(formData);
            alert("会社情報を保存しました。");
            router.refresh();
        } catch (e) {
            console.error(e);
            alert("保存に失敗しました。");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                <Building2 className="h-8 w-8" />
                自社情報・経営分析
            </h1>

            {/* Analytics Section */}
            {stats && (
                <div className="mb-12 space-y-8">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="dark:bg-zinc-900 dark:border-zinc-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium dark:text-zinc-400">これまでの総粗利</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold dark:text-zinc-100">¥{stats.totalProfit.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground dark:text-zinc-500">
                                    総売上: ¥{stats.totalRevenue.toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="dark:bg-zinc-900 dark:border-zinc-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium dark:text-zinc-400">Total 粗利率</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${stats.totalMargin > 30 ? 'text-green-600 dark:text-green-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                    {stats.totalMargin.toFixed(1)}%
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="dark:bg-zinc-900 dark:border-zinc-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium dark:text-zinc-400">今年の粗利 (YTD)</CardTitle>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold dark:text-zinc-100">¥{stats.thisYearProfit.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground dark:text-zinc-500">
                                    今年売上: ¥{stats.thisYearRevenue.toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="dark:bg-zinc-900 dark:border-zinc-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium dark:text-zinc-400">今年の粗利率</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${stats.thisYearMargin > 30 ? 'text-green-600 dark:text-green-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                    {stats.thisYearMargin.toFixed(1)}%
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="dark:bg-zinc-900 dark:border-zinc-800">
                        <CardHeader>
                            <CardTitle className="dark:text-zinc-100">月次売上・粗利推移 (直近12ヶ月)</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-0">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.monthlyStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#525252" opacity={0.2} />
                                        <XAxis
                                            dataKey="name"
                                            tickFormatter={(value) => value.slice(5)} // Show MM only (e.g., "01") or "YY-MM" depending on pref
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `¥${value / 10000}万`}
                                        />
                                        <Tooltip
                                            formatter={(value: number | undefined) => `¥${(value || 0).toLocaleString()}`}
                                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            cursor={{ fill: 'transparent' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="revenue" name="売上" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="profit" name="粗利" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                <Card className="dark:bg-zinc-900 dark:border-zinc-800">
                    <CardHeader className="border-b dark:border-zinc-800">
                        <CardTitle className="dark:text-zinc-100">基本情報設定</CardTitle>
                        <CardDescription className="dark:text-zinc-400">請求書に記載される発行元の情報です。</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 pt-6">
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="name" className="dark:text-zinc-200">会社名 / 屋号 <span className="text-red-500">*</span></Label>
                            <Input id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="株式会社Example" className="dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700" />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="address" className="dark:text-zinc-200">住所</Label>
                            <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="〒100-0000 東京都千代田区..." className="dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="dark:text-zinc-200">電話番号</Label>
                            <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="03-0000-0000" className="dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="dark:text-zinc-200">メールアドレス</Label>
                            <Input id="email" name="email" value={formData.email} onChange={handleChange} placeholder="contact@example.com" className="dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="registrationNumber" className="dark:text-zinc-200">インボイス登録番号</Label>
                            <Input id="registrationNumber" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} placeholder="T1234567890123" className="dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="dark:bg-zinc-900 dark:border-zinc-800">
                    <CardHeader className="border-b dark:border-zinc-800">
                        <CardTitle className="dark:text-zinc-100">振込先口座情報設定</CardTitle>
                        <CardDescription className="dark:text-zinc-400">請求書に記載される振込先情報です。</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="bankName" className="dark:text-zinc-200">銀行名</Label>
                            <Input id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} placeholder="〇〇銀行" className="dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bankBranch" className="dark:text-zinc-200">支店名</Label>
                            <Input id="bankBranch" name="bankBranch" value={formData.bankBranch} onChange={handleChange} placeholder="〇〇支店" className="dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bankAccountType" className="dark:text-zinc-200">口座種別</Label>
                            <select
                                id="bankAccountType"
                                name="bankAccountType"
                                value={formData.bankAccountType}
                                onChange={handleChange}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"
                            >
                                <option value="普通">普通</option>
                                <option value="当座">当座</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bankAccountNumber" className="dark:text-zinc-200">口座番号</Label>
                            <Input id="bankAccountNumber" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} placeholder="1234567" className="dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700" />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="bankAccountHolder" className="dark:text-zinc-200">口座名義 (カタカナ)</Label>
                            <Input id="bankAccountHolder" name="bankAccountHolder" value={formData.bankAccountHolder} onChange={handleChange} placeholder="カ) イグザンプル" className="dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700" />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving} className="min-w-[150px] bg-blue-600 hover:bg-blue-700 text-white font-bold">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        保存する
                    </Button>
                </div>
            </form>
        </div>
    );
}
