"use client";

import InvoiceForm from "@/components/InvoiceForm";

export default function NewInvoicePage() {
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">新規案件・見積作成</h1>
                <p className="text-zinc-500">制作内容と尺を入力して、料金と原価を算出します。</p>
            </header>

            <InvoiceForm />
        </div>
    );
}
