
import Dashboard from "@/components/Dashboard";
import UserMenu from "@/components/UserMenu";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getInvoices, getClients, getPartners, getSupervisors } from "@/actions/pricing-actions";

export default async function Home() {
  const [invoices, clients, partners, supervisors] = await Promise.all([
    getInvoices(),
    getClients(),
    getPartners(),
    getSupervisors()
  ]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 border-b-2 border-blue-500 pb-1">制作進行管理ダッシュボード</h1>
          <p className="text-zinc-500 mt-2">進行中の案件状況、担当者、納期を一元管理します。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/supervisors">
            <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">統括者管理</Button>
          </Link>
          <Link href="/clients">
            <Button variant="outline">クライアント</Button>
          </Link>
          <Link href="/partners">
            <Button variant="outline">パートナー</Button>
          </Link>
          <Link href="/pricing-rules">
            <Button variant="outline">料金ルール</Button>
          </Link>
          <Link href="/invoices/new">
            <Button className="bg-blue-600 hover:bg-blue-700 font-bold">+ 新規案件作成</Button>
          </Link>
          <UserMenu />
        </div>
      </header>
      <Dashboard
        initialInvoices={invoices as any}
        initialClients={clients as any}
        initialPartners={partners as any}
        initialSupervisors={supervisors as any}
      />
    </div>
  );
}
