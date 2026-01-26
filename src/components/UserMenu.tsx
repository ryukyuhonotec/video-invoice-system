
import { auth, signOut } from "@/auth"
import { Button } from "./ui/button"

export default async function UserMenu() {
    const session = await auth()
    if (!session?.user) return null

    return (
        <div className="flex items-center gap-4 border-l pl-4 ml-4">
            <div className="text-sm text-right hidden sm:block">
                <p className="font-medium">{session.user.name}</p>
                <p className="text-xs text-zinc-500">{session.user.email}</p>
            </div>
            <form
                action={async () => {
                    "use server"
                    await signOut({ redirectTo: "/login" })
                }}
            >
                <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900">
                    Sign Out
                </Button>
            </form>
        </div>
    )
}
