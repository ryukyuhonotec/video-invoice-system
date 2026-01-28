
import { auth, signOut } from "@/auth"
import { UserMenuClient } from "@/components/UserMenuClient"

export default async function UserMenu() {
    const session = await auth()
    if (!session?.user) return null

    const signOutAction = async () => {
        "use server"
        await signOut({ redirectTo: "/login" })
    }

    return (
        <div className="pl-4 ml-4">
            <UserMenuClient user={session.user} signOutAction={signOutAction} />
        </div>
    )
}
