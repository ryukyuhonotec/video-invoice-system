import Dashboard from "@/components/Dashboard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getPaginatedTasks, getClients, getPartners, getStaff } from "@/actions/pricing-actions";

export default async function Home({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const limit = 50;
  const search = typeof searchParams.search === 'string' ? searchParams.search : "";
  const clientId = typeof searchParams.clientId === 'string' ? searchParams.clientId : "";
  const partnerId = typeof searchParams.partnerId === 'string' ? searchParams.partnerId : "";
  const staffId = typeof searchParams.staffId === 'string' ? searchParams.staffId : "";
  const status = typeof searchParams.status === 'string' ? searchParams.status : "";
  const showCompleted = searchParams.showCompleted === 'true';

  const [paginatedTasks, clients, partners, staffList] = await Promise.all([
    getPaginatedTasks(page, limit, {
      search,
      clientId,
      partnerId,
      staffId,
      status,
      showCompleted
    }),
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
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm dark:bg-blue-600 dark:hover:bg-blue-700">
            + 新規案件作成
          </Button>
        </Link>
      </header>

      <Dashboard
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        paginatedTasks={paginatedTasks as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialClients={clients as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialPartners={partners as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialStaff={staffList as any}
      />
    </div>
  );
}
