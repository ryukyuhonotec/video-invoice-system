
import PricingRulesClient from "./PricingRulesClient";
import { getPricingRules, getClients, getPartners } from "@/actions/pricing-actions";

export default async function PricingRulesPage() {
    // Parallel fetching on the server
    const [rules, clients, partners] = await Promise.all([
        getPricingRules(),
        getClients(),
        getPartners()
    ]);

    return (
        <PricingRulesClient
            initialRules={rules as any}
            initialClients={clients as any}
            initialPartners={partners as any}
        />
    );
}
