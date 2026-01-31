
import PartnersListClient from "./PartnersListClient";
import { getPartnerRoles, getClients, getPaginatedPartners, getPricingRules } from "@/actions/pricing-actions";

export default async function PartnersPage() {
    // Parallel fetching on the server
    const [pData, rData, cData, pricingRulesData] = await Promise.all([
        getPaginatedPartners(1, 20, "", "ALL", false),
        getPartnerRoles(),
        getClients(),
        getPricingRules()
    ]);

    return (
        <PartnersListClient
            initialPartnersData={pData as any}
            initialRoles={rData as any}
            initialClients={cData as any}
            initialPricingRules={pricingRulesData as any}
        />
    );
}
