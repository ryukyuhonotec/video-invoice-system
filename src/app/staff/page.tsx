
import StaffListClient from "./StaffListClient";
import { getStaff, getClients, getInvoices } from "@/actions/pricing-actions";
import { getStaffInvitations } from "@/actions/invitation-actions";

export default async function StaffPage() {
    // Parallel fetching on the server
    const [staff, clients, invoices, invitations] = await Promise.all([
        getStaff(),
        getClients(),
        getInvoices(),
        getStaffInvitations()
    ]);

    return (
        <StaffListClient
            initialStaffList={staff as any}
            initialClients={clients as any}
            initialInvoices={invoices as any}
            initialInvitations={invitations as any}
        />
    );
}
