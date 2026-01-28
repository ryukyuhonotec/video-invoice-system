import InvoiceForm, { MasterData } from "@/components/InvoiceForm";
import { getClients, getPartners, getPricingRules, getStaff } from "@/actions/pricing-actions";
import { Client, Partner, PricingRule, Staff } from "@/types";

export default async function NewInvoicePage() {
    // Fetch all data in parallel
    const [clients, partners, pricingRules, staffList] = await Promise.all([
        getClients(),
        getPartners(),
        getPricingRules(),
        getStaff()
    ]);

    const masterData: MasterData = {
        clients: clients as Client[],
        partners: partners as Partner[],
        pricingRules: pricingRules as PricingRule[],
        staffList: staffList as Staff[]
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">新規案件・見積作成</h1>
                <p className="text-zinc-500">制作内容と尺を入力して、料金と原価を算出します。</p>
            </header>

            <InvoiceForm masterData={masterData} />
        </div>
    );
}
