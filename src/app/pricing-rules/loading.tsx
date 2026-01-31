
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Loading() {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Button disabled className="bg-blue-600/50">
                    + ルール追加
                </Button>
            </header>

            <Card className="shadow-md dark:bg-zinc-900 dark:border-zinc-800">
                <CardHeader className="bg-zinc-50 dark:bg-zinc-800 border-b dark:border-zinc-700">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Search Bar */}
                    <div className="p-4 border-b dark:border-zinc-700">
                        <div className="relative max-w-md">
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                    <div className="space-y-4 p-4">
                        {/* Table Header */}
                        <div className="flex justify-between border-b pb-2 dark:border-zinc-700">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        {/* Rows */}
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center py-4 border-b dark:border-zinc-700 last:border-0">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-40" />
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <Skeleton className="h-8 w-16" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
