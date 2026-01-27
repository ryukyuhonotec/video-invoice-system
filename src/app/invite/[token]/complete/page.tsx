"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getInvitationByToken, useInvitation } from "@/actions/invitation-actions";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";

export default function InviteCompletePage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const token = params.token as string;

    const [processing, setProcessing] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const completeRegistration = async () => {
            if (status === 'loading') return;

            if (!session?.user) {
                router.push(`/invite/${token}`);
                return;
            }

            try {
                const invitation = await getInvitationByToken(token);
                if (!invitation || invitation.status !== 'valid') {
                    setError("招待リンクが無効です");
                    setProcessing(false);
                    return;
                }

                await useInvitation(token, session.user.id!, {
                    name: session.user.name || "Unknown",
                    email: session.user.email || ""
                });

                setSuccess(true);
                setProcessing(false);

                // Redirect after success
                setTimeout(() => {
                    router.push('/');
                }, 2000);
            } catch (err: any) {
                setError(err.message || "登録に失敗しました");
                setProcessing(false);
            }
        };

        completeRegistration();
    }, [session, status, token, router]);

    if (processing) {
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

    if (error) {
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

    if (success) {
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
