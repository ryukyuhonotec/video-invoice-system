
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-48" />
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-8" />
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="dark:bg-zinc-900 dark:border-zinc-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded" />
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-6 w-20" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* All-time Stats */}
            <Card className="mb-8 dark:bg-zinc-900 dark:border-zinc-800">
                <CardHeader className="py-3 border-b dark:border-zinc-700">
                    <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent className="py-3">
                    <div className="flex gap-6">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                </CardContent>
            </Card>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 h-80">
                <Skeleton className="h-full w-full rounded-xl" />
                <Skeleton className="h-full w-full rounded-xl" />
            </div>
        </div>
    );
}
