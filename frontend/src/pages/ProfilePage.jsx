import React, { useEffect, useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatRp, monthNowYYYYMM } from "@/lib/format";
import { MonthPicker } from "@/components/MonthPicker";

function PaymentMethodManager({ paymentMethods, reload }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setBalance(Number(editing.balance || 0));
    } else {
      setName("");
      setBalance(0);
    }
  }, [open, editing]);

  async function submit() {
    setBusy(true);
    try {
      const payload = { name, balance: Number(balance || 0) };
      if (editing?.id) {
        await api.put(`/payment-methods/${editing.id}`, payload);
      } else {
        await api.post("/payment-methods", payload);
      }
      toast({ title: "Tersimpan", description: "Metode pembayaran berhasil disimpan." });
      setOpen(false);
      setEditing(null);
      await reload();
    } catch (err) {
      toast({ title: "Gagal", description: err.detail, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function remove(pm) {
    try {
      await api.delete(`/payment-methods/${pm.id}`);
      toast({ title: "Terhapus", description: "Metode pembayaran terhapus." });
      await reload();
    } catch (err) {
      toast({ title: "Gagal hapus", description: err.detail, variant: "destructive" });
    }
  }

  return (
    <div data-testid="profile-payment-methods" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div data-testid="payment-methods-title" className="text-sm font-semibold">
            Metode Pembayaran
          </div>
          <div data-testid="payment-methods-desc" className="text-sm text-muted-foreground">
            Tambah/Edit/Hapus metode (Cash, GoPay, Dana, Bank, dll). Set saldo awal jika perlu.
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-testid="payment-method-add-button"
              className="rounded-xl"
              onClick={() => setEditing(null)}
            >
              Tambah
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="payment-method-dialog" className="rounded-2xl">
            <DialogHeader>
              <DialogTitle data-testid="payment-method-dialog-title">
                {editing ? "Edit" : "Tambah"} Metode
              </DialogTitle>
              <DialogDescription data-testid="payment-method-dialog-desc">
                Saldo juga akan berubah otomatis saat transaksi/transfer.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label data-testid="payment-method-name-label">Nama</Label>
                <Input
                  data-testid="payment-method-name-input"
                  className="rounded-xl"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: OVO"
                />
              </div>
              <div className="space-y-2">
                <Label data-testid="payment-method-balance-label">Saldo</Label>
                <Input
                  data-testid="payment-method-balance-input"
                  className="rounded-xl"
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button data-testid="payment-method-submit-button" disabled={busy} className="rounded-xl" onClick={submit}>
                {busy ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="cf-no-scrollbar overflow-auto rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead data-testid="pm-col-name">Metode</TableHead>
              <TableHead data-testid="pm-col-balance" className="text-right">
                Saldo
              </TableHead>
              <TableHead data-testid="pm-col-actions" className="text-right">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentMethods.map((pm) => (
              <TableRow data-testid={`pm-row-${pm.id}`} key={pm.id}>
                <TableCell data-testid={`pm-name-${pm.id}`} className="font-medium">
                  {pm.name}
                </TableCell>
                <TableCell data-testid={`pm-balance-${pm.id}`} className="text-right">
                  {formatRp(pm.balance)}
                </TableCell>
                <TableCell data-testid={`pm-actions-${pm.id}`} className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      data-testid={`pm-edit-${pm.id}`}
                      variant="outline"
                      className="h-9 rounded-xl"
                      onClick={() => {
                        setEditing(pm);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button data-testid={`pm-delete-${pm.id}`} variant="destructive" className="h-9 rounded-xl">
                          Hapus
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent data-testid={`pm-delete-dialog-${pm.id}`} className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle data-testid={`pm-delete-title-${pm.id}`}>Konfirmasi hapus</AlertDialogTitle>
                          <AlertDialogDescription data-testid={`pm-delete-desc-${pm.id}`}>
                            Metode akan dihapus jika tidak dipakai transaksi/transfer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid={`pm-delete-cancel-${pm.id}`} className="rounded-xl">
                            Batal
                          </AlertDialogCancel>
                          <AlertDialogAction
                            data-testid={`pm-delete-confirm-${pm.id}`}
                            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => remove(pm)}
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CategoryManager({ kind, categories, subcategories, reload }) {
  const [openCat, setOpenCat] = useState(false);
  const [catName, setCatName] = useState("");
  const [catEditing, setCatEditing] = useState(null);
  const [busyCat, setBusyCat] = useState(false);

  const [openSub, setOpenSub] = useState(false);
  const [subName, setSubName] = useState("");
  const [subCatId, setSubCatId] = useState("");
  const [subEditing, setSubEditing] = useState(null);
  const [busySub, setBusySub] = useState(false);

  const kindLabel = kind === "income" ? "Pemasukan" : "Pengeluaran";

  useEffect(() => {
    if (!openCat) return;
    if (catEditing) setCatName(catEditing.name);
    else setCatName("");
  }, [openCat, catEditing]);

  useEffect(() => {
    if (!openSub) return;
    if (subEditing) {
      setSubName(subEditing.name);
      setSubCatId(subEditing.category_id);
    } else {
      setSubName("");
      setSubCatId(categories?.[0]?.id || "");
    }
  }, [openSub, subEditing, categories]);

  async function saveCat() {
    setBusyCat(true);
    try {
      if (catEditing?.id) {
        await api.put(`/categories/${catEditing.id}`, { kind, name: catName });
      } else {
        await api.post("/categories", { kind, name: catName });
      }
      toast({ title: "Tersimpan", description: "Kategori tersimpan." });
      setOpenCat(false);
      setCatEditing(null);
      await reload();
    } catch (err) {
      toast({ title: "Gagal", description: err.detail, variant: "destructive" });
    } finally {
      setBusyCat(false);
    }
  }

  async function deleteCat(cat) {
    try {
      await api.delete(`/categories/${cat.id}`);
      toast({ title: "Terhapus", description: "Kategori terhapus." });
      await reload();
    } catch (err) {
      toast({ title: "Gagal hapus", description: err.detail, variant: "destructive" });
    }
  }

  async function saveSub() {
    setBusySub(true);
    try {
      const payload = { kind, category_id: subCatId, name: subName };
      if (subEditing?.id) {
        await api.put(`/subcategories/${subEditing.id}`, payload);
      } else {
        await api.post("/subcategories", payload);
      }
      toast({ title: "Tersimpan", description: "Subkategori tersimpan." });
      setOpenSub(false);
      setSubEditing(null);
      await reload();
    } catch (err) {
      toast({ title: "Gagal", description: err.detail, variant: "destructive" });
    } finally {
      setBusySub(false);
    }
  }

  async function deleteSub(sc) {
    try {
      await api.delete(`/subcategories/${sc.id}`);
      toast({ title: "Terhapus", description: "Subkategori terhapus." });
      await reload();
    } catch (err) {
      toast({ title: "Gagal hapus", description: err.detail, variant: "destructive" });
    }
  }

  return (
    <div data-testid={`profile-cats-${kind}`} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div data-testid={`cats-title-${kind}`} className="text-sm font-semibold">
            Kategori & Subkategori ({kindLabel})
          </div>
          <div data-testid={`cats-desc-${kind}`} className="text-sm text-muted-foreground">
            Form transaksi otomatis mengikuti perubahan di sini.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={openCat} onOpenChange={setOpenCat}>
            <DialogTrigger asChild>
              <Button data-testid={`cat-add-${kind}`} className="rounded-xl" onClick={() => setCatEditing(null)}>
                + Kategori
              </Button>
            </DialogTrigger>
            <DialogContent data-testid={`cat-dialog-${kind}`} className="rounded-2xl">
              <DialogHeader>
                <DialogTitle data-testid={`cat-dialog-title-${kind}`}>{catEditing ? "Edit" : "Tambah"} Kategori</DialogTitle>
                <DialogDescription data-testid={`cat-dialog-desc-${kind}`}>{kindLabel}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label data-testid={`cat-name-label-${kind}`}>Nama</Label>
                <Input data-testid={`cat-name-input-${kind}`} className="rounded-xl" value={catName} onChange={(e) => setCatName(e.target.value)} />
              </div>
              <DialogFooter>
                <Button data-testid={`cat-submit-${kind}`} disabled={busyCat} className="rounded-xl" onClick={saveCat}>
                  {busyCat ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={openSub} onOpenChange={setOpenSub}>
            <DialogTrigger asChild>
              <Button data-testid={`sub-add-${kind}`} variant="secondary" className="rounded-xl" onClick={() => setSubEditing(null)}>
                + Subkategori
              </Button>
            </DialogTrigger>
            <DialogContent data-testid={`sub-dialog-${kind}`} className="rounded-2xl">
              <DialogHeader>
                <DialogTitle data-testid={`sub-dialog-title-${kind}`}>{subEditing ? "Edit" : "Tambah"} Subkategori</DialogTitle>
                <DialogDescription data-testid={`sub-dialog-desc-${kind}`}>{kindLabel}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label data-testid={`sub-cat-label-${kind}`}>Kategori</Label>
                  <Select value={subCatId} onValueChange={setSubCatId}>
                    <SelectTrigger data-testid={`sub-cat-select-${kind}`} className="rounded-xl">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem data-testid={`sub-cat-item-${kind}-${c.id}`} key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label data-testid={`sub-name-label-${kind}`}>Nama Subkategori</Label>
                  <Input data-testid={`sub-name-input-${kind}`} className="rounded-xl" value={subName} onChange={(e) => setSubName(e.target.value)} />
                </div>
              </div>

              <DialogFooter>
                <Button data-testid={`sub-submit-${kind}`} disabled={busySub} className="rounded-xl" onClick={saveSub}>
                  {busySub ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border">
          <div data-testid={`cats-list-title-${kind}`} className="border-b bg-secondary/40 px-4 py-3 text-sm font-semibold">
            Kategori
          </div>
          <div className="cf-no-scrollbar max-h-[360px] overflow-auto p-2">
            {categories.map((c) => (
              <div key={c.id} data-testid={`cat-item-${kind}-${c.id}`} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-secondary/50">
                <div className="text-sm font-medium">{c.name}</div>
                <div className="flex items-center gap-2">
                  <Button data-testid={`cat-edit-${kind}-${c.id}`} variant="outline" className="h-9 rounded-xl" onClick={() => { setCatEditing(c); setOpenCat(true); }}>Edit</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button data-testid={`cat-delete-${kind}-${c.id}`} variant="destructive" className="h-9 rounded-xl">Hapus</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent data-testid={`cat-delete-dialog-${kind}-${c.id}`} className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle data-testid={`cat-delete-title-${kind}-${c.id}`}>Konfirmasi hapus kategori</AlertDialogTitle>
                        <AlertDialogDescription data-testid={`cat-delete-desc-${kind}-${c.id}`}>Kategori hanya bisa dihapus jika tidak punya subkategori.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid={`cat-delete-cancel-${kind}-${c.id}`} className="rounded-xl">Batal</AlertDialogCancel>
                        <AlertDialogAction data-testid={`cat-delete-confirm-${kind}-${c.id}`} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteCat(c)}>Hapus</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border">
          <div data-testid={`subs-list-title-${kind}`} className="border-b bg-secondary/40 px-4 py-3 text-sm font-semibold">
            Subkategori
          </div>
          <div className="cf-no-scrollbar max-h-[360px] overflow-auto p-2">
            {subcategories.map((s) => (
              <div key={s.id} data-testid={`sub-item-${kind}-${s.id}`} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-secondary/50">
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{categories.find((c) => c.id === s.category_id)?.name || "-"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button data-testid={`sub-edit-${kind}-${s.id}`} variant="outline" className="h-9 rounded-xl" onClick={() => { setSubEditing(s); setOpenSub(true); }}>Edit</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button data-testid={`sub-delete-${kind}-${s.id}`} variant="destructive" className="h-9 rounded-xl">Hapus</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent data-testid={`sub-delete-dialog-${kind}-${s.id}`} className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle data-testid={`sub-delete-title-${kind}-${s.id}`}>Konfirmasi hapus subkategori</AlertDialogTitle>
                        <AlertDialogDescription data-testid={`sub-delete-desc-${kind}-${s.id}`}>Subkategori hanya bisa dihapus jika tidak dipakai transaksi.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid={`sub-delete-cancel-${kind}-${s.id}`} className="rounded-xl">Batal</AlertDialogCancel>
                        <AlertDialogAction data-testid={`sub-delete-confirm-${kind}-${s.id}`} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteSub(s)}>Hapus</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetManager({ month, setMonth }) {
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await api.get("/budgets/overview", { params: { month } });
    setRows(res.data.rows || []);
  }

  useEffect(() => {
    load().catch((err) => {
      toast({ title: "Gagal memuat budget", description: err.detail, variant: "destructive" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  async function save() {
    setSaving(true);
    try {
      await api.put("/budgets", {
        month,
        items: rows.map((r) => ({ subcategory_id: r.subcategory_id, amount: Number(r.budget || 0) })),
      });
      toast({ title: "Budget tersimpan", description: "Budget bulan ini berhasil disimpan." });
      await load();
    } catch (err) {
      toast({ title: "Gagal simpan", description: err.detail, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const editedCount = useMemo(() => rows.length, [rows]);

  return (
    <div data-testid="profile-budgets" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div data-testid="budgets-title" className="text-sm font-semibold">
            Budget per Subkategori (Bulanan)
          </div>
          <div data-testid="budgets-desc" className="text-sm text-muted-foreground">
            Budget disimpan per bulan (YYYY-MM). Sistem menghitung terpakai otomatis.
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MonthPicker testId="budgets-month-picker" value={month} onChange={setMonth} />
          <Button data-testid="budgets-save-button" disabled={saving} className="rounded-xl" onClick={save}>
            {saving ? "Menyimpan..." : "Simpan Budget"}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border">
        <div data-testid="budgets-summary" className="border-b bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
          Total subkategori: <span className="font-semibold text-foreground">{editedCount}</span>
        </div>
        <div className="cf-no-scrollbar max-h-[520px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead data-testid="budgets-col-sub">Subkategori</TableHead>
                <TableHead data-testid="budgets-col-budget" className="text-right">Budget</TableHead>
                <TableHead data-testid="budgets-col-spent" className="text-right">Terpakai</TableHead>
                <TableHead data-testid="budgets-col-remaining" className="text-right">Sisa</TableHead>
                <TableHead data-testid="budgets-col-percent" className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow data-testid={`budget-edit-row-${r.subcategory_id}`} key={r.subcategory_id}>
                  <TableCell data-testid={`budget-edit-sub-${r.subcategory_id}`} className="min-w-[260px]">
                    <div className="font-semibold">{r.subcategory_name}</div>
                    <div className="text-xs text-muted-foreground">{r.category_name}</div>
                  </TableCell>
                  <TableCell data-testid={`budget-edit-budget-${r.subcategory_id}`} className="text-right">
                    <Input
                      data-testid={`budget-edit-input-${r.subcategory_id}`}
                      className="h-9 rounded-xl text-right"
                      type="number"
                      value={r.budget}
                      onChange={(e) => {
                        const v = Number(e.target.value || 0);
                        setRows((prev) => prev.map((x) => (x.subcategory_id === r.subcategory_id ? { ...x, budget: v } : x)));
                      }}
                    />
                  </TableCell>
                  <TableCell data-testid={`budget-edit-spent-${r.subcategory_id}`} className="text-right">
                    {formatRp(r.spent)}
                  </TableCell>
                  <TableCell data-testid={`budget-edit-remaining-${r.subcategory_id}`} className="text-right">
                    {formatRp(r.remaining)}
                  </TableCell>
                  <TableCell data-testid={`budget-edit-percent-${r.subcategory_id}`} className="text-right font-semibold">
                    {Math.round(r.percent)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="rounded-2xl border bg-secondary/40 p-4">
        <p data-testid="budgets-tip" className="text-sm text-muted-foreground">
          Anda bisa atur budget berbeda untuk tiap bulan (histori). Gunakan pemilih bulan di atas.
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [month, setMonth] = useState(monthNowYYYYMM());

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeSubcategories, setIncomeSubcategories] = useState([]);
  const [expenseSubcategories, setExpenseSubcategories] = useState([]);

  async function load() {
    const [pm, incCats, expCats, incSub, expSub] = await Promise.all([
      api.get("/payment-methods"),
      api.get("/categories", { params: { kind: "income" } }),
      api.get("/categories", { params: { kind: "expense" } }),
      api.get("/subcategories", { params: { kind: "income" } }),
      api.get("/subcategories", { params: { kind: "expense" } }),
    ]);
    setPaymentMethods(pm.data);
    setIncomeCategories(incCats.data);
    setExpenseCategories(expCats.data);
    setIncomeSubcategories(incSub.data);
    setExpenseSubcategories(expSub.data);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await load();
      } catch (err) {
        if (!active) return;
        toast({ title: "Gagal memuat profil", description: err.detail, variant: "destructive" });
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const incomeSubsSorted = useMemo(() => [...incomeSubcategories].sort((a, b) => a.name.localeCompare(b.name)), [incomeSubcategories]);
  const expenseSubsSorted = useMemo(() => [...expenseSubcategories].sort((a, b) => a.name.localeCompare(b.name)), [expenseSubcategories]);

  return (
    <div data-testid="profile-page" className="space-y-6">
      <div>
        <h2 data-testid="profile-title" className="text-2xl font-bold tracking-tight">Profil & Pengaturan</h2>
        <p data-testid="profile-desc" className="text-sm text-muted-foreground">
          Semua pengaturan dipusatkan di sini: budget, metode pembayaran, kategori, dan subkategori.
        </p>
      </div>

      <Card data-testid="profile-accordion-card" className="rounded-3xl">
        <CardHeader>
          <CardTitle data-testid="profile-accordion-title">Pengaturan</CardTitle>
          <CardDescription data-testid="profile-accordion-desc">Kelola struktur data keuangan Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion data-testid="profile-accordion" type="single" collapsible className="w-full">
            <AccordionItem value="budgets">
              <AccordionTrigger data-testid="accordion-trigger-budgets">Budget Bulanan</AccordionTrigger>
              <AccordionContent>
                <BudgetManager month={month} setMonth={setMonth} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="payment-methods">
              <AccordionTrigger data-testid="accordion-trigger-payment-methods">Metode Pembayaran</AccordionTrigger>
              <AccordionContent>
                <PaymentMethodManager paymentMethods={paymentMethods} reload={load} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cats-income">
              <AccordionTrigger data-testid="accordion-trigger-cats-income">Kategori & Subkategori (Pemasukan)</AccordionTrigger>
              <AccordionContent>
                <CategoryManager
                  kind="income"
                  categories={incomeCategories}
                  subcategories={incomeSubsSorted}
                  reload={load}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cats-expense">
              <AccordionTrigger data-testid="accordion-trigger-cats-expense">Kategori & Subkategori (Pengeluaran)</AccordionTrigger>
              <AccordionContent>
                <CategoryManager
                  kind="expense"
                  categories={expenseCategories}
                  subcategories={expenseSubsSorted}
                  reload={load}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <div className="rounded-3xl border bg-[radial-gradient(800px_circle_at_20%_10%,hsl(var(--primary)/0.12),transparent_55%),radial-gradient(600px_circle_at_85%_40%,hsl(var(--accent)/0.12),transparent_55%)] p-6">
        <div data-testid="profile-footer-title" className="text-sm font-semibold">Catatan</div>
        <p data-testid="profile-footer-text" className="mt-2 text-sm text-muted-foreground">
          Untuk keamanan, setiap pengguna hanya bisa melihat & mengedit data miliknya sendiri. Admin bisa mengelola user.
        </p>
      </div>
    </div>
  );
}
