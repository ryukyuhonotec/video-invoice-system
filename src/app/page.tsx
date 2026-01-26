
import Dashboard from "@/components/Dashboard";
import UserMenu from "@/components/UserMenu";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">制作進行管理ダッシュボード</h1>
          <p className="text-zinc-500">進行中の案件状況、担当者、納期を一元管理します。</p>
        </div>
        <div className="flex items-center gap-2">
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
            <Button>+ 新規案件作成</Button>
          </Link>
          <UserMenu />
        </div>
      </header>
      <Dashboard />
    </div>
  );
}
