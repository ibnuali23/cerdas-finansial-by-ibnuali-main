import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { downloadBlob, filenameFromDisposition } from "@/lib/download";
import { formatRp, monthNowYYYYMM } from "@/lib/format";
import MonthDropdown from "@/components/MonthDropdown";

function ExportButtons({ month, year }) {
  const [busyPdf, setBusyPdf] = useState(false);
  const [busyXlsx, setBusyXlsx] = useState(false);
  const [busyYear, setBusyYear] = useState(false);

  async function exportPdf() {
    setBusyPdf(true);
    try {
      const res = await api.get("/reports/expenses/pdf", {
        params: { month },
        responseType: "blob",
      });
      const filename = filenameFromDisposition(res.headers?.["content-disposition"], `Laporan_Pengeluaran_${month}.pdf`);
      downloadBlob(new Blob([res.data], { type: "application/pdf" }), filename);
      toast({ title: "✅ Laporan berhasil dibuat", description: "File PDF akan diunduh otomatis." });
    } catch (err) {
      toast({ title: "Gagal ekspor PDF", description: err.detail, variant: "destructive" });
    } finally {
      setBusyPdf(false);
    }
  }

  async function exportXlsx() {
    setBusyXlsx(true);
    try {
      const res = await api.get("/reports/expenses/xlsx", {
        params: { month },
        responseType: "blob",
      });
      const filename = filenameFromDisposition(
        res.headers?.["content-disposition"],
        `Laporan_Pengeluaran_${month}.xlsx`,
      );
      downloadBlob(
        new Blob([res.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        filename,
      );
      toast({ title: "✅ Laporan berhasil dibuat", description: "File Excel akan diunduh otomatis." });
    } catch (err) {
      toast({ title: "Gagal ekspor Excel", description: err.detail, variant: "destructive" });
    } finally {
      setBusyXlsx(false);
    }
  }

  async function exportYear() {
    setBusyYear(true);
    try {
      const res = await api.get("/reports/expenses/xlsx-year", {
        params: { year },
        responseType: "blob",
      });
      const filename = filenameFromDisposition(
        res.headers?.["content-disposition"],
        `Laporan_Pengeluaran_${year}.xlsx`,
      );
      downloadBlob(
        new Blob([res.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        filename,
      );
      toast({ title: "✅ Laporan berhasil dibuat", description: "Laporan tahunan akan diunduh otomatis." });
    } catch (err) {
      toast({ title: "Gagal ekspor tahunan", description: err.detail, variant: "destructive" });
    } finally {
      setBusyYear(false);
    }
  }

  return (
    <div data-testid="reports-export-buttons" className="flex flex-wrap items-center justify-end gap-2">
      <Button
        data-testid="export-pdf-button"
        onClick={exportPdf}
        disabled={busyPdf}
        className="h-10 rounded-xl bg-[hsl(var(--accent))] text-[hsl(170_25%_10%)] hover:bg-[hsl(var(--accent)/0.92)]"
      >
        📄 {busyPdf ? "Membuat..." : "Ekspor PDF"}
      </Button>
      <Button
        data-testid="export-xlsx-button"
        onClick={exportXlsx}
        disabled={busyXlsx}
        className="h-10 rounded-xl bg-[hsl(var(--accent))] text-[hsl(170_25%_10%)] hover:bg-[hsl(var(--accent)/0.92)]"
      >
        📊 {busyXlsx ? "Membuat..." : "Ekspor Excel"}
      </Button>
      <Button
        data-testid="export-year-xlsx-button"
        variant="outline"
        onClick={exportYear}
        disabled={busyYear}
        className="h-10 rounded-xl"
        title="Ekspor Semua Bulan (Setahun)"
      >
        {busyYear ? "Membuat..." : "Ekspor Setahun"}
      </Button>
    </div>
  );
}

export default function ReportsPage() {
  const [month, setMonth] = useState(monthNowYYYYMM());
  const year = useMemo(() => String(month).split("-")[0], [month]);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [totalsByCategory, setTotalsByCategory] = useState([]);
  const [total, setTotal] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/reports/expenses/data", { params: { month } });
      setRows(res.data.rows || []);
      setTotalsByCategory(res.data.totals_by_category || []);
      setTotal(Number(res.data.total || 0));
    } catch (err) {
      toast({ title: "Gagal memuat laporan", description: err.detail, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  return (
    <div data-testid="reports-page" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 data-testid="reports-title" className="text-2xl font-bold tracking-tight">
            Laporan Bulanan
          </h2>
          <p data-testid="reports-desc" className="text-sm text-muted-foreground">
            Laporan pengeluaran berdasarkan bulan yang dipilih. Bisa diekspor ke PDF atau Excel.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex items-center gap-3">
            <div>
              <div data-testid="reports-month-label" className="text-xs font-semibold text-muted-foreground">
                Pilih Bulan
              </div>
              <MonthDropdown
                testId="reports-month-dropdown"
                yearTestId="reports-year-select"
                monthTestId="reports-month-select"
                value={month}
                onChange={setMonth}
              />
            </div>
          </div>
        </div>
      </div>

      <Card data-testid="reports-table-card" className="rounded-3xl">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle data-testid="reports-table-title">Tabel Laporan Pengeluaran</CardTitle>
            <CardDescription data-testid="reports-table-subtitle">
              Kolom: Tanggal, Kategori, Subkategori, Deskripsi, Nominal, Metode Pembayaran.
            </CardDescription>
          </div>
          <ExportButtons month={month} year={year} />
        </CardHeader>

        <CardContent>
          <div className="cf-no-scrollbar overflow-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead data-testid="report-col-date">Tanggal</TableHead>
                  <TableHead data-testid="report-col-category">Kategori</TableHead>
                  <TableHead data-testid="report-col-subcategory">Subkategori</TableHead>
                  <TableHead data-testid="report-col-desc">Deskripsi</TableHead>
                  <TableHead data-testid="report-col-method">Metode</TableHead>
                  <TableHead data-testid="report-col-amount" className="text-right">
                    Nominal
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow data-testid={`report-row-${r.id}`} key={r.id}>
                    <TableCell data-testid={`report-date-${r.id}`}>{r.date}</TableCell>
                    <TableCell data-testid={`report-category-${r.id}`}>{r.category_name}</TableCell>
                    <TableCell data-testid={`report-subcategory-${r.id}`}>{r.subcategory_name}</TableCell>
                    <TableCell data-testid={`report-desc-${r.id}`} className="min-w-[240px]">
                      {r.description || "-"}
                    </TableCell>
                    <TableCell data-testid={`report-method-${r.id}`}>{r.payment_method_name}</TableCell>
                    <TableCell data-testid={`report-amount-${r.id}`} className="text-right">
                      {formatRp(r.amount)}
                    </TableCell>
                  </TableRow>
                ))}

                {!loading && rows.length === 0 ? (
                  <TableRow>
                    <TableCell data-testid="report-empty" colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      Tidak ada data pengeluaran untuk bulan ini.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border bg-secondary/40 p-4 lg:col-span-2">
              <div data-testid="report-category-totals-title" className="text-sm font-semibold">
                Total per Kategori
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {totalsByCategory.map((t) => (
                  <div
                    data-testid={`report-category-total-${t.category_id}`}
                    key={t.category_id}
                    className="flex items-center justify-between rounded-xl bg-background px-3 py-2"
                  >
                    <div className="text-sm font-medium">{t.category_name}</div>
                    <div className="text-sm font-bold">{formatRp(t.total)}</div>
                  </div>
                ))}
                {!loading && totalsByCategory.length === 0 ? (
                  <div data-testid="report-category-totals-empty" className="text-sm text-muted-foreground">
                    Tidak ada subtotal.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border p-4">
              <div data-testid="report-month-total-label" className="text-sm text-muted-foreground">
                Total Pengeluaran Bulan Ini
              </div>
              <div data-testid="report-month-total-value" className="mt-2 text-2xl font-extrabold">
                {formatRp(total)}
              </div>
              <Button data-testid="reports-refresh-button" variant="secondary" className="mt-4 w-full rounded-xl" onClick={load}>
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
