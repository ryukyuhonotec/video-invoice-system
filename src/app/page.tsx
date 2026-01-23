import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_INVOICES, MOCK_CLIENTS } from "@/data/mock";

export default function Home() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">請求・原価管理ダッシュボード</h1>
          <p className="text-zinc-500">案件の請求、原価、利益を一元管理します。</p>
        </div>
        <div className="flex gap-2">
          <Link href="/clients">
            <Button variant="outline">クライアント管理</Button>
          </Link>
          <Link href="/partners">
            <Button variant="outline">パートナー管理</Button>
          </Link>
          <Link href="/invoices/new">
            <Button>+ 新規案件・見積作成</Button>
          </Link>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">月次売上 (Total Revenue)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥45,000</div>
            <p className="text-xs text-muted-foreground">先月比 +20.1%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">稼働中案件 (Active Projects)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">納品間近: 3件</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未入金 (Pending Payments)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥120,000</div>
            <p className="text-xs text-muted-foreground">期限超過: 2件</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近の請求書・案件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">ID</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">クライアント</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">ステータス</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">発行日</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">金額</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {MOCK_INVOICES.map((inv) => {
                  const client = MOCK_CLIENTS.find(c => c.id === inv.clientId);
                  return (
                    <tr key={inv.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle font-medium">{inv.id}</td>
                      <td className="p-4 align-middle">{client?.name || inv.clientId}</td>
                      <td className="p-4 align-middle">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                          ${inv.status === 'Paid' ? 'bg-green-100 text-green-800' :
                            inv.status === 'Billed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4 align-middle">{inv.issueDate}</td>
                      <td className="p-4 align-middle text-right">¥{inv.totalAmount.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
