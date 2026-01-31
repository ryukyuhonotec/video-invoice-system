
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Button disabled className="bg-blue-600/50">
                    <Link2 className="mr-2 h-4 w-4" /> 招待リンク発行
                </Button>
            </header>

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Table Header */}
                        <div className="flex justify-between border-b pb-2 dark:border-zinc-700">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        {/* Rows */}
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center py-4 border-b dark:border-zinc-700 last:border-0">
                                <Skeleton className="h-6 w-32 rounded-full" />
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-5 w-16 mx-auto" />
                                <Skeleton className="h-5 w-16 mx-auto" />
                                <Skeleton className="h-5 w-16 mx-auto" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
