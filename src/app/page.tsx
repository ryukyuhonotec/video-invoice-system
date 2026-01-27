
import Dashboard from "@/components/Dashboard";
import UserMenu from "@/components/UserMenu";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getInvoices, getClients, getPartners, getStaff } from "@/actions/pricing-actions";

export default async function Home() {
  const [invoices, clients, partners, staffList] = await Promise.all([
    getInvoices(),
    getClients(),
    getPartners(),
    getStaff()
  ]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 whitespace-nowrap">制作進行管理ダッシュボード</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 whitespace-nowrap">進行中の案件状況、担当者、納期を一元管理します。</p>
        </div>
        <Link href="/invoices/new">
          <Button className="bg-blue-600 hover:bg-blue-700 font-bold dark:bg-blue-700 dark:hover:bg-blue-600 shadow-sm">
            + 新規案件作成
          </Button>
        </Link>
      </header>

      <Dashboard
        initialInvoices={invoices as any}
        initialClients={clients as any}
        initialPartners={partners as any}
        initialStaff={staffList as any}
      />
    </div>
  );
}
