import ClientsListClient from "./ClientsListClient";
import { getPaginatedClients, getStaff, getPricingRules, getPartners } from "@/actions/pricing-actions";

export default async function ClientsPage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
    const limit = 20;
    const search = typeof searchParams.search === 'string' ? searchParams.search : "";
    const operationsLeadId = typeof searchParams.operationsLeadId === 'string' ? searchParams.operationsLeadId : "";
    const accountantId = typeof searchParams.accountantId === 'string' ? searchParams.accountantId : "";
    const showArchived = searchParams.showArchived === 'true';

    // Parallel fetching on the server
    const [paginatedClients, staff, rules, partners] = await Promise.all([
        getPaginatedClients(page, limit, search, {
            operationsLeadId,
            accountantId,
            showArchived
        }),
        getStaff(),
        getPricingRules(),
        getPartners()
    ]);

    return (
        <ClientsListClient
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            paginatedClients={paginatedClients as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            staffList={staff as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pricingRules={rules as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            partners={partners as any}
        />
    );
}
