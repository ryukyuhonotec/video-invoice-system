
import { Suspense } from "react";
import StaffDashboardClient from "./StaffDashboardClient";
import { getStaff, getCurrentUserRole, getStaffStats } from "@/actions/pricing-actions";

// Server Component
export default async function StaffDashboardPage({
    searchParams
}: {
    searchParams: { year?: string; month?: string; staffId?: string }
}) {
    const year = searchParams.year ? parseInt(searchParams.year) : undefined;
    const month = searchParams.month ? parseInt(searchParams.month) : undefined;

    // Parallel fetching
    const [stats, staff, role] = await Promise.all([
        getStaffStats(year, month),
        getStaff(),
        getCurrentUserRole()
    ]);

    return (
        <StaffDashboardClient
            initialStaff={staff as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            initialStats={stats as any}
            currentUserRole={role}
            currentYear={year || new Date().getFullYear()}
            currentMonth={month !== undefined ? month : new Date().getMonth()}
        />
    );
}
