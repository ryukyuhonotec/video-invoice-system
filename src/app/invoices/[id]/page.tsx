"use client";

import { use, useEffect, useState } from "react";
import InvoiceForm from "@/components/InvoiceForm";
import { MOCK_INVOICES } from "@/data/mock";
import { Invoice } from "@/types";

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const [invoice, setInvoice] = useState<Invoice | undefined>(undefined);
    // Unwrap params in Next.js 15+ 
    // Actually the 'use' hook is recommended or just await in server component, 
    // but in client component we need to be careful.
    // Let's assume params is a Promise as per some next.js 15 rules or just object in 14.
    // Safest allowed way in Client Components for Next 15 is using `use(params)` or useEffect.
    // But standard `params` prop in page.tsx is often just an object in older versions or need unwrapping.
    // Let's rely on standard useEffect unwrapping pattern or `use` if available.
    // We'll stick to simple async effect to find data.

    useEffect(() => {
        // Mock fetching data
        params.then(unwrappedParams => {
            const data = MOCK_INVOICES.find(inv => inv.id === unwrappedParams.id);
            setInvoice(data);
        });
    }, [params]);

    if (!invoice) {
        return <div className="p-8">Loading or Not Found...</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">案件編集: {invoice.id}</h1>
                <p className="text-zinc-500">プロジェクト情報を編集・更新します。</p>
            </header>

            <InvoiceForm initialData={invoice} isEditing={true} />
        </div>
    );
}
