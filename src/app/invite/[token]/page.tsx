"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getInvitationByToken } from "@/actions/invitation-actions";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function InvitePage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [invitation, setInvitation] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkInvitation = async () => {
            const result = await getInvitationByToken(token);
            setInvitation(result);
            setLoading(false);
        };
        checkInvitation();
    }, [token]);

    const handleSignIn = () => {
        // Store token in sessionStorage for auth callback to use
        sessionStorage.setItem('invitationToken', token);
        signIn('google', { callbackUrl: `/invite/${token}/complete` });
    };

    const getRoleLabel = (role: string) => {
        return role === 'OPERATIONS' ? '事業統括' : '経理';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                <div className="text-zinc-500">読み込み中...</div>
            </div>
        );
    }

    if (!invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">招待リンクが見つかりません</h2>
                        <p className="text-zinc-500">このリンクは無効です。管理者にお問い合わせください。</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (invitation.status === 'used') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">登録済み</h2>
                        <p className="text-zinc-500 mb-4">この招待リンクは既に使用されています。</p>
                        <Button onClick={() => router.push('/login')}>ログインページへ</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (invitation.status === 'expired') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <Clock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">有効期限切れ</h2>
                        <p className="text-zinc-500">この招待リンクは有効期限が切れています。管理者に新しいリンクを発行してもらってください。</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle>スタッフ登録</CardTitle>
                    <CardDescription>制作進行管理システムへようこそ</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">登録ロール</span>
                            <span className="font-medium">{getRoleLabel(invitation.staffRole)}</span>
                        </div>
                        {invitation.email && (
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">メールアドレス</span>
                                <span className="font-medium">{invitation.email}</span>
                            </div>
                        )}
                        {invitation.name && (
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">名前</span>
                                <span className="font-medium">{invitation.name}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">有効期限</span>
                            <span className="font-medium">{new Date(invitation.expiresAt).toLocaleDateString('ja-JP')}</span>
                        </div>
                    </div>

                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleSignIn}
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Googleアカウントで登録
                    </Button>

                    <p className="text-xs text-zinc-500 text-center">
                        Googleアカウントで認証すると、スタッフとして登録されます
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
