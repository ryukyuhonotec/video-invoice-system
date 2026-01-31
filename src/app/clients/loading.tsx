
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Loading() {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Button disabled className="bg-blue-600/50">
                    <Plus className="w-4 h-4 mr-2" /> 新規登録
                </Button>
            </header>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="w-48">
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="w-48">
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>

            <Card className="dark:bg-zinc-900 dark:border-zinc-800">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-12" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Table Header */}
                        <div className="flex justify-between border-b pb-2 dark:border-zinc-700">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        {/* Rows */}
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center py-4 border-b dark:border-zinc-700 last:border-0">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-3 w-40" />
                                </div>
                                <Skeleton className="h-4 w-20" />
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <div className="flex gap-1">
                                    <Skeleton className="h-5 w-12 rounded" />
                                    <Skeleton className="h-5 w-12 rounded" />
                                </div>
                                <div className="flex gap-1">
                                    <Skeleton className="h-5 w-24 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
