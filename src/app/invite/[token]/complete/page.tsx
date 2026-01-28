"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getInvitationByToken, useInvitation } from "@/actions/invitation-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2, Users } from "lucide-react";

export default function InviteCompletePage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const token = params.token as string;

    const [step, setStep] = useState<'loading' | 'form' | 'processing' | 'success' | 'error'>('loading');
    const [invitation, setInvitation] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        const checkSession = async () => {
            if (status === 'loading') return;

            if (!session?.user) {
                router.push(`/invite/${token}`);
                return;
            }

            // Pre-fill from Google account
            setName(session.user.name || "");
            setEmail(session.user.email || "");

            // Check invitation
            const inv = await getInvitationByToken(token);
            if (!inv || inv.status !== 'valid') {
                setError("招待リンクが無効です");
                setStep('error');
                return;
            }

            setInvitation(inv);
            setStep('form');
        };

        checkSession();
    }, [session, status, token, router]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            alert("名前を入力してください");
            return;
        }
        if (!email.trim()) {
            alert("メールアドレスを入力してください");
            return;
        }

        setStep('processing');
        try {
            await useInvitation(token, session?.user?.id || '', {
                name: name.trim(),
                email: email.trim()
            });

            setStep('success');

            // Redirect after success
            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch (err: any) {
            setError(err.message || "登録に失敗しました");
            setStep('error');
        }
    };

    const getRoleLabel = (role: string) => {
        return role === 'OPERATIONS' ? '事業統括' : '経理';
    };

    if (step === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                        <h2 className="text-xl font-bold mb-2">読み込み中...</h2>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'form' && invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <CardTitle>スタッフ登録</CardTitle>
                        <CardDescription>
                            <span className={`inline-block px-2 py-0.5 rounded text-xs ${invitation.staffRole === 'OPERATIONS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                {getRoleLabel(invitation.staffRole)}
                            </span>
                            として登録します
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>氏名 <span className="text-red-500">*</span></Label>
                            <Input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="田中 太郎"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>メールアドレス <span className="text-red-500">*</span></Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="taro@example.com"
                            />
                        </div>
                        <Button className="w-full" size="lg" onClick={handleSubmit}>
                            登録を完了する
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'processing') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                        <h2 className="text-xl font-bold mb-2">登録処理中...</h2>
                        <p className="text-zinc-500">しばらくお待ちください</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">❌</span>
                        </div>
                        <h2 className="text-xl font-bold mb-2">エラー</h2>
                        <p className="text-zinc-500">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">登録完了!</h2>
                        <p className="text-zinc-500">ダッシュボードへ移動します...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}
