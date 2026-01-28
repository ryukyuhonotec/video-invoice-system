"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileDialog } from "@/components/ProfileDialog";
import { LogOut, Settings, User } from "lucide-react";

export function UserMenuClient({ user, signOutAction }: { user: any, signOutAction: () => Promise<void> }) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-12 w-full justify-start pl-0 hover:bg-transparent">
                        <div className="flex items-center gap-2 text-left">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold dark:bg-blue-900 dark:text-blue-200">
                                {user.image ? <img src={user.image} alt={user.name} className="h-8 w-8 rounded-full" /> : (user.name?.[0] || "U")}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium leading-none">{user.name}</p>
                                <p className="text-xs text-zinc-500 truncate max-w-[120px]">{user.email}</p>
                            </div>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                        <User className="mr-2 h-4 w-4" />
                        プロフィール設定
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => signOutAction()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        ログアウト
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ProfileDialog user={user} open={isProfileOpen} onOpenChange={setIsProfileOpen} />
        </>
    );
}
