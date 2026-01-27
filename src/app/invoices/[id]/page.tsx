import InvoiceForm from "@/components/InvoiceForm";
import { getInvoice } from "@/actions/pricing-actions";
import { notFound } from "next/navigation";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const invoice = await getInvoice(id);

    if (!invoice) {
        notFound();
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">案件編集: {(invoice as any).client?.name} - {(invoice as any).items?.[0]?.name}</h1>
                <p className="text-zinc-500">プロジェクト情報を編集・更新します。</p>
            </header>

            <InvoiceForm initialData={invoice as any} isEditing={true} />
        </div>
    );
}
