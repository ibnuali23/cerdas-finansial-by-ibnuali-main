import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatRp, monthNowYYYYMM, todayYYYYMMDD } from "@/lib/format";
import { MonthPicker } from "@/components/MonthPicker";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

function budgetTone(percent) {
  if (percent > 90) return { label: "Hampir habis", cls: "bg-rose-100 text-rose-700 border-rose-200" };
  if (percent >= 70) return { label: "Hati-hati", cls: "bg-amber-100 text-amber-700 border-amber-200" };
  return { label: "Aman", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
}

export default function DashboardPage() {
  const [month, setMonth] = useState(monthNowYYYYMM());
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const [pmList, setPmList] = useState([]);
  const [transferOpen, setTransferOpen] = useState(false);
  const [trFrom, setTrFrom] = useState("");
  const [trTo, setTrTo] = useState("");
  const [trAmount, setTrAmount] = useState(0);
  const [trDate, setTrDate] = useState(todayYYYYMMDD());
  const [trDesc, setTrDesc] = useState("");
  const [busyTransfer, setBusyTransfer] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/dashboard/overview", { params: { month, days: 30 } });
      setOverview(res.data);
      setPmList(res.data.payment_methods || []);
      if (!trFrom && res.data.payment_methods?.[0]?.id) setTrFrom(res.data.payment_methods[0].id);
      if (!trTo && res.data.payment_methods?.[1]?.id) setTrTo(res.data.payment_methods[1].id);
    } catch (err) {
      toast({ title: "Gagal memuat dashboard", description: err.detail, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const balanceChartData = useMemo(() => {
    const methods = overview?.payment_methods || [];
    return methods.map((m) => ({ name: m.name, value: Number(m.balance || 0) }));
  }, [overview]);

  const pieColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-3))",
  ];

  async function submitTransfer() {
    setBusyTransfer(true);
    try {
      await api.post("/transfers", {
        date: trDate,
        from_payment_method_id: trFrom,
        to_payment_method_id: trTo,
        amount: Number(trAmount || 0),
        description: trDesc,
      });
      toast({ title: "Transfer tersimpan", description: "Saldo berhasil diperbarui." });
      setTransferOpen(false);
      setTrDesc("");
      setTrAmount(0);
      await load();
    } catch (err) {
      toast({ title: "Gagal transfer", description: err.detail, variant: "destructive" });
    } finally {
      setBusyTransfer(false);
    }
  }

  return (
    <div data-testid="dashboard-page" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 data-testid="dashboard-title" className="text-2xl font-bold tracking-tight">
            Dashboard
          </h2>
          <p data-testid="dashboard-desc" className="text-sm text-muted-foreground">
            Ringkasan pemasukan, pengeluaran, saldo, dan anggaran (real-time).
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            data-testid="dashboard-export-pdf-button"
            className="h-10 rounded-xl bg-[hsl(var(--accent))] text-[hsl(170_25%_10%)] hover:bg-[hsl(var(--accent)/0.92)]"
            onClick={async () => {
              try {
                const res = await api.get("/reports/expenses/pdf", { params: { month }, responseType: "blob" });
                const disposition = res.headers?.["content-disposition"];
                const fallback = `Laporan_Pengeluaran_${month}.pdf`;
                const matchStar = String(disposition || "").match(/filename\*=UTF-8''([^;]+)/i);
                const match = String(disposition || "").match(/filename="?([^;\"]+)"?/i);
                const filename = matchStar?.[1] ? decodeURIComponent(matchStar[1]) : match?.[1] || fallback;
                const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                toast({ title: "✅ Laporan berhasil dibuat", description: "File PDF akan diunduh otomatis." });
              } catch (err) {
                toast({ title: "Gagal ekspor PDF", description: err.detail, variant: "destructive" });
              }
            }}
          >
            📄 Ekspor PDF
          </Button>

          <Button
            data-testid="dashboard-export-xlsx-button"
            className="h-10 rounded-xl bg-[hsl(var(--accent))] text-[hsl(170_25%_10%)] hover:bg-[hsl(var(--accent)/0.92)]"
            onClick={async () => {
              try {
                const res = await api.get("/reports/expenses/xlsx", { params: { month }, responseType: "blob" });
                const disposition = res.headers?.["content-disposition"];
                const fallback = `Laporan_Pengeluaran_${month}.xlsx`;
                const matchStar = String(disposition || "").match(/filename\*=UTF-8''([^;]+)/i);
                const match = String(disposition || "").match(/filename="?([^;\"]+)"?/i);
                const filename = matchStar?.[1] ? decodeURIComponent(matchStar[1]) : match?.[1] || fallback;
                const url = window.URL.createObjectURL(
                  new Blob([res.data], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  }),
                );
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                toast({ title: "✅ Laporan berhasil dibuat", description: "File Excel akan diunduh otomatis." });
              } catch (err) {
                toast({ title: "Gagal ekspor Excel", description: err.detail, variant: "destructive" });
              }
            }}
          >
            📊 Ekspor Excel
          </Button>

          <MonthPicker testId="dashboard-month-picker" value={month} onChange={setMonth} />
          <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
            <DialogTrigger asChild>
              <Button data-testid="open-transfer-dialog-button" className="h-10 rounded-xl">
                Pindah Uang 🔁
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="transfer-dialog" className="rounded-2xl">
              <DialogHeader>
                <DialogTitle data-testid="transfer-dialog-title">Pindah Uang 🔁</DialogTitle>
                <DialogDescription data-testid="transfer-dialog-desc">
                  Pindahkan saldo antar metode pembayaran.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label data-testid="transfer-from-label">Dari</Label>
                  <Select value={trFrom} onValueChange={setTrFrom}>
                    <SelectTrigger data-testid="transfer-from-select" className="rounded-xl">
                      <SelectValue placeholder="Pilih metode" />
                    </SelectTrigger>
                    <SelectContent>
                      {pmList.map((pm) => (
                        <SelectItem data-testid={`transfer-from-item-${pm.id}`} key={pm.id} value={pm.id}>
                          {pm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label data-testid="transfer-to-label">Ke</Label>
                  <Select value={trTo} onValueChange={setTrTo}>
                    <SelectTrigger data-testid="transfer-to-select" className="rounded-xl">
                      <SelectValue placeholder="Pilih metode" />
                    </SelectTrigger>
                    <SelectContent>
                      {pmList.map((pm) => (
                        <SelectItem data-testid={`transfer-to-item-${pm.id}`} key={pm.id} value={pm.id}>
                          {pm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label data-testid="transfer-date-label">Tanggal</Label>
                  <Input
                    data-testid="transfer-date-input"
                    className="rounded-xl"
                    type="date"
                    value={trDate}
                    onChange={(e) => setTrDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label data-testid="transfer-amount-label">Nominal (Rp)</Label>
                  <Input
                    data-testid="transfer-amount-input"
                    className="rounded-xl"
                    type="number"
                    value={trAmount}
                    onChange={(e) => setTrAmount(e.target.value)}
                    min={0}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label data-testid="transfer-desc-label">Deskripsi</Label>
                  <Textarea
                    data-testid="transfer-desc-textarea"
                    className="rounded-xl"
                    value={trDesc}
                    onChange={(e) => setTrDesc(e.target.value)}
                    placeholder="Contoh: pindah saldo untuk belanja"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  data-testid="transfer-submit-button"
                  disabled={busyTransfer}
                  className="rounded-xl"
                  onClick={submitTransfer}
                >
                  {busyTransfer ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card data-testid="summary-income-card" className="rounded-3xl">
          <CardHeader>
            <CardTitle data-testid="summary-income-title">Total Pemasukan Bulan Ini</CardTitle>
            <CardDescription data-testid="summary-income-desc">Akumulasi pemasukan untuk bulan terpilih.</CardDescription>
          </CardHeader>
          <CardContent>
            <div data-testid="summary-income-value" className="text-2xl font-extrabold">
              {loading ? "..." : formatRp(overview?.income_total)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="summary-expense-card" className="rounded-3xl">
          <CardHeader>
            <CardTitle data-testid="summary-expense-title">Total Pengeluaran Bulan Ini</CardTitle>
            <CardDescription data-testid="summary-expense-desc">Akumulasi pengeluaran untuk bulan terpilih.</CardDescription>
          </CardHeader>
          <CardContent>
            <div data-testid="summary-expense-value" className="text-2xl font-extrabold">
              {loading ? "..." : formatRp(overview?.expense_total)}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              <span data-testid="summary-expense-today-label">Total Pengeluaran Hari Ini:</span>{" "}
              <span data-testid="summary-expense-today-value" className="font-semibold text-foreground">
                {loading ? "..." : formatRp(overview?.today_expense_total)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="summary-net-card" className="rounded-3xl">
          <CardHeader>
            <CardTitle data-testid="summary-net-title">Saldo Bersih</CardTitle>
            <CardDescription data-testid="summary-net-desc">Pemasukan - Pengeluaran</CardDescription>
          </CardHeader>
          <CardContent>
            <div data-testid="summary-net-value" className="text-2xl font-extrabold">
              {loading ? "..." : formatRp(overview?.net_total)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card data-testid="balances-card" className="rounded-3xl">
          <CardHeader>
            <CardTitle data-testid="balances-title">Saldo per Metode Pembayaran</CardTitle>
            <CardDescription data-testid="balances-desc">Saldo akan ter-update setiap transaksi / transfer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border bg-background p-3">
                <div data-testid="balances-table-label" className="text-sm font-semibold">
                  Daftar Saldo
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead data-testid="balances-col-method">Metode</TableHead>
                      <TableHead data-testid="balances-col-balance" className="text-right">
                        Saldo
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(overview?.payment_methods || []).map((pm) => (
                      <TableRow data-testid={`balance-row-${pm.id}`} key={pm.id}>
                        <TableCell data-testid={`balance-name-${pm.id}`} className="font-medium">
                          {pm.name}
                        </TableCell>
                        <TableCell data-testid={`balance-value-${pm.id}`} className="text-right">
                          {formatRp(pm.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-2xl border bg-background p-3">
                <div data-testid="balances-chart-label" className="text-sm font-semibold">
                  Perbandingan Saldo (Donut)
                </div>
                <div className="mt-3 h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={balanceChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {balanceChartData.map((_, idx) => (
                          <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatRp(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-secondary/40 p-3">
              <div data-testid="balances-tip" className="text-sm text-muted-foreground">
                Tip: Gunakan fitur <span className="font-semibold text-foreground">Pindah Uang 🔁</span> untuk merapikan saldo
                antar e-wallet / bank.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="daily-expense-card" className="rounded-3xl">
          <CardHeader>
            <CardTitle data-testid="daily-expense-title">Pengeluaran Harian</CardTitle>
            <CardDescription data-testid="daily-expense-desc">Grafik 7–30 hari terakhir (sesuai bulan terpilih).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overview?.daily_expense || []} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    minTickGap={24}
                    tickFormatter={(v) => String(v).slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v) => formatRp(v)} />
                  <Line type="monotone" dataKey="amount" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="budget-usage-card" className="rounded-3xl">
        <CardHeader>
          <CardTitle data-testid="budget-usage-title">Pemakaian Anggaran Bulan Ini</CardTitle>
          <CardDescription data-testid="budget-usage-desc">
            Indikator: 🟢 &lt;70% aman, 🟡 70–90% hati-hati, 🔴 &gt;90% hampir habis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="cf-no-scrollbar overflow-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead data-testid="budget-col-subcategory">Subkategori</TableHead>
                  <TableHead data-testid="budget-col-budget" className="text-right">
                    Budget
                  </TableHead>
                  <TableHead data-testid="budget-col-spent" className="text-right">
                    Terpakai
                  </TableHead>
                  <TableHead data-testid="budget-col-remaining" className="text-right">
                    Sisa
                  </TableHead>
                  <TableHead data-testid="budget-col-percent" className="text-right">
                    %
                  </TableHead>
                  <TableHead data-testid="budget-col-indicator" className="text-right">
                    Indikator
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(overview?.budgets || []).slice(0, 40).map((row) => {
                  const tone = budgetTone(row.percent);
                  return (
                    <TableRow data-testid={`budget-row-${row.subcategory_id}`} key={row.subcategory_id}>
                      <TableCell data-testid={`budget-subcategory-${row.subcategory_id}`} className="min-w-[240px]">
                        <div className="font-semibold">{row.subcategory_name}</div>
                        <div className="text-xs text-muted-foreground">{row.category_name}</div>
                        <div className="mt-2">
                          <Progress
                            data-testid={`budget-progress-${row.subcategory_id}`}
                            value={row.percent}
                            className="h-2.5 rounded-full"
                          />
                        </div>
                      </TableCell>
                      <TableCell data-testid={`budget-budget-${row.subcategory_id}`} className="text-right">
                        {formatRp(row.budget)}
                      </TableCell>
                      <TableCell data-testid={`budget-spent-${row.subcategory_id}`} className="text-right">
                        {formatRp(row.spent)}
                      </TableCell>
                      <TableCell data-testid={`budget-remaining-${row.subcategory_id}`} className="text-right">
                        {formatRp(row.remaining)}
                      </TableCell>
                      <TableCell data-testid={`budget-percent-${row.subcategory_id}`} className="text-right font-semibold">
                        {Math.round(row.percent)}%
                      </TableCell>
                      <TableCell data-testid={`budget-indicator-${row.subcategory_id}`} className="text-right">
                        <Badge className={`rounded-full border ${tone.cls}`}>{tone.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div data-testid="budget-footer-note" className="text-sm text-muted-foreground">
              Edit budget per subkategori ada di menu <span className="font-semibold text-foreground">Profil</span>.
            </div>
            <Button data-testid="dashboard-refresh-button" variant="secondary" className="rounded-xl" onClick={load}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="transfer-history-card" className="rounded-3xl">
        <CardHeader>
          <CardTitle data-testid="transfer-history-title">Riwayat Transfer</CardTitle>
          <CardDescription data-testid="transfer-history-desc">Transfer antar metode pembayaran pada bulan terpilih.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="cf-no-scrollbar overflow-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead data-testid="transfer-col-date">Tanggal</TableHead>
                  <TableHead data-testid="transfer-col-from">Dari</TableHead>
                  <TableHead data-testid="transfer-col-to">Ke</TableHead>
                  <TableHead data-testid="transfer-col-amount" className="text-right">
                    Nominal
                  </TableHead>
                  <TableHead data-testid="transfer-col-desc">Deskripsi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(overview?.recent_transfers || []).map((tr) => (
                  <TableRow data-testid={`transfer-row-${tr.id}`} key={tr.id}>
                    <TableCell data-testid={`transfer-date-${tr.id}`}>{tr.date}</TableCell>
                    <TableCell data-testid={`transfer-from-${tr.id}`}
                      >{pmList.find((p) => p.id === tr.from_payment_method_id)?.name || "-"}</TableCell
                    >
                    <TableCell data-testid={`transfer-to-${tr.id}`}
                      >{pmList.find((p) => p.id === tr.to_payment_method_id)?.name || "-"}</TableCell
                    >
                    <TableCell data-testid={`transfer-amount-${tr.id}`} className="text-right">
                      {formatRp(tr.amount)}
                    </TableCell>
                    <TableCell data-testid={`transfer-desc-${tr.id}`} className="min-w-[240px]">
                      {tr.description || "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && (overview?.recent_transfers || []).length === 0 ? (
                  <TableRow>
                    <TableCell data-testid="transfer-empty" colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                      Belum ada transfer.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
