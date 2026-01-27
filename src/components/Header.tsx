import UserMenu from "@/components/UserMenu";

export function Header() {
    return (
        <header className="h-16 border-b bg-white dark:bg-zinc-950 dark:border-zinc-800 flex items-center justify-end px-8 sticky top-0 z-40">
            <UserMenu />
        </header>
    );
}
