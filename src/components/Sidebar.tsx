"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Briefcase,
    Handshake,
    FileText,
    Settings,
    Building2,
    ShieldCheck,
    TrendingUp,
    HelpCircle
} from "lucide-react";

const menuItems = [
    { name: "進行管理", href: "/", icon: LayoutDashboard },
    { name: "事業統括・経理", href: "/staff", icon: ShieldCheck },
    { name: "クライアント", href: "/clients", icon: Briefcase },
    { name: "パートナー", href: "/partners", icon: Handshake },
    { name: "請求管理", href: "/bills", icon: FileText },
    { name: "料金ルール", href: "/pricing-rules", icon: FileText },
    { name: "売上分析", href: "/analytics", icon: TrendingUp },
    { name: "使い方FAQ", href: "/faq", icon: HelpCircle },
    { name: "設定", href: "/settings", icon: Settings },
];

export function Sidebar({ version = "0.1.0" }: { version?: string }) {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-zinc-900 text-zinc-300 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-50">
            <div className="p-6">
                <h1 className="text-xl font-bold text-white tracking-wider">VIDEO INVOICE</h1>
                <p className="text-xs text-zinc-500 mt-1">制作進行管理システム</p>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-zinc-500 group-hover:text-white")} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-zinc-800">
                <div className="text-xs text-zinc-500 text-center">
                    v{version} &copy; Honotec Movie
                </div>
            </div>
        </aside>
    );
}
