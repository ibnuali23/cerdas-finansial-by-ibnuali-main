import React, { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatRp, monthNowYYYYMM, todayYYYYMMDD } from "@/lib/format";
import { MonthPicker } from "@/components/MonthPicker";

function TxForm({
  type,
  open,
  setOpen,
  onSaved,
  editing,
  categories,
  subcategories,
  paymentMethods,
}) {
  const [date, setDate] = useState(todayYYYYMMDD());
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [amount, setAmount] = useState(0);
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const filteredSubcategories = useMemo(() => {
    return (subcategories || []).filter((s) => s.category_id === categoryId);
  }, [subcategories, categoryId]);

  useEffect(() => {
    if (!open) return;

    if (editing) {
      setDate(editing.date);
      setCategoryId(editing.category_id);
      setSubcategoryId(editing.subcategory_id);
      setPaymentMethodId(editing.payment_method_id);
      setAmount(Number(editing.amount || 0));
      setDesc(editing.description || "");
      return;
    }

    // defaults
    const firstCat = categories?.[0]?.id || "";
    setCategoryId(firstCat);
    const firstSub = (subcategories || []).find((s) => s.category_id === firstCat)?.id || "";
    setSubcategoryId(firstSub);
    setPaymentMethodId(paymentMethods?.[0]?.id || "");
    setDate(todayYYYYMMDD());
    setAmount(0);
    setDesc("");
  }, [open, editing, categories, subcategories, paymentMethods]);

  useEffect(() => {
    if (!open) return;
    const first = filteredSubcategories?.[0]?.id || "";
    if (first && !filteredSubcategories.some((s) => s.id === subcategoryId)) {
      setSubcategoryId(first);
    }
  }, [open, filteredSubcategories, subcategoryId]);

  async function submit() {
    setBusy(true);
    try {
      const payload = {
        type,
        date,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        description: desc,
        amount: Number(amount || 0),
        payment_method_id: paymentMethodId,
      };

      if (editing?.id) {
        await api.put(`/transactions/${editing.id}`, payload);
      } else {
        await api.post("/transactions", payload);
      }

      toast({ title: "Tersimpan", description: "Transaksi berhasil disimpan dan saldo diperbarui." });
      setOpen(false);
      onSaved();
    } catch (err) {
      toast({ title: "Gagal menyimpan", description: err.detail, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid={`tx-add-${type}-button`} className="rounded-xl">
          Tambah {type === "income" ? "Pemasukan" : "Pengeluaran"}
        </Button>
      </DialogTrigger>
      <DialogContent data-testid={`tx-dialog-${type}`} className="rounded-2xl">
        <DialogHeader>
          <DialogTitle data-testid={`tx-dialog-title-${type}`}>
            {editing ? "Edit" : "Tambah"} {type === "income" ? "Pemasukan" : "Pengeluaran"}
          </DialogTitle>
          <DialogDescription data-testid={`tx-dialog-desc-${type}`}>
            Isi data transaksi. Form otomatis mengikuti kategori/subkategori yang Anda atur.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label data-testid={`tx-date-label-${type}`}>Tanggal</Label>
            <Input
              data-testid={`tx-date-input-${type}`}
              type="date"
              className="rounded-xl"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label data-testid={`tx-amount-label-${type}`}>Nominal (Rp)</Label>
            <Input
              data-testid={`tx-amount-input-${type}`}
              type="number"
              className="rounded-xl"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label data-testid={`tx-category-label-${type}`}>Kategori</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger data-testid={`tx-category-select-${type}`} className="rounded-xl">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {(categories || []).map((c) => (
                  <SelectItem data-testid={`tx-category-item-${type}-${c.id}`} key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label data-testid={`tx-subcategory-label-${type}`}>Subkategori</Label>
            <Select value={subcategoryId} onValueChange={setSubcategoryId}>
              <SelectTrigger data-testid={`tx-subcategory-select-${type}`} className="rounded-xl">
                <SelectValue placeholder="Pilih subkategori" />
              </SelectTrigger>
              <SelectContent>
                {filteredSubcategories.map((s) => (
                  <SelectItem data-testid={`tx-subcategory-item-${type}-${s.id}`} key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label data-testid={`tx-payment-method-label-${type}`}>Metode Pembayaran</Label>
            <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
              <SelectTrigger data-testid={`tx-payment-method-select-${type}`} className="rounded-xl">
                <SelectValue placeholder="Pilih metode" />
              </SelectTrigger>
              <SelectContent>
                {(paymentMethods || []).map((pm) => (
                  <SelectItem data-testid={`tx-payment-method-item-${type}-${pm.id}`} key={pm.id} value={pm.id}>
                    {pm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label data-testid={`tx-desc-label-${type}`}>Deskripsi</Label>
            <Textarea
              data-testid={`tx-desc-textarea-${type}`}
              className="rounded-xl"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Contoh: beli bensin / terima gaji"
            />
          </div>
        </div>

        <DialogFooter>
          <Button data-testid={`tx-submit-button-${type}`} disabled={busy} className="rounded-xl" onClick={submit}>
            {busy ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TransactionsPage() {
  const [month, setMonth] = useState(monthNowYYYYMM());
  const [tab, setTab] = useState("expense");

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeSubcategories, setIncomeSubcategories] = useState([]);
  const [expenseSubcategories, setExpenseSubcategories] = useState([]);

  const [incomeTxs, setIncomeTxs] = useState([]);
  const [expenseTxs, setExpenseTxs] = useState([]);

  const [openIncome, setOpenIncome] = useState(false);
  const [openExpense, setOpenExpense] = useState(false);
  const [editing, setEditing] = useState(null);

  async function loadMeta() {
    const [pm, incCats, expCats] = await Promise.all([
      api.get("/payment-methods"),
      api.get("/categories", { params: { kind: "income" } }),
      api.get("/categories", { params: { kind: "expense" } }),
    ]);

    setPaymentMethods(pm.data);
    setIncomeCategories(incCats.data);
    setExpenseCategories(expCats.data);

    const [incSub, expSub] = await Promise.all([
      api.get("/subcategories", { params: { kind: "income" } }),
      api.get("/subcategories", { params: { kind: "expense" } }),
    ]);

    setIncomeSubcategories(incSub.data);
    setExpenseSubcategories(expSub.data);
  }

  async function loadTx() {
    const [inc, exp] = await Promise.all([
      api.get("/transactions", { params: { type: "income", month } }),
      api.get("/transactions", { params: { type: "expense", month } }),
    ]);
    setIncomeTxs(inc.data);
    setExpenseTxs(exp.data);
  }

  async function loadAll() {
    try {
      await loadMeta();
      await loadTx();
    } catch (err) {
      toast({ title: "Gagal memuat data", description: err.detail, variant: "destructive" });
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  async function removeTx(tx) {
    try {
      await api.delete(`/transactions/${tx.id}`);
      toast({ title: "Terhapus", description: "Transaksi dihapus dan saldo dikembalikan." });
      await loadTx();
    } catch (err) {
      toast({ title: "Gagal hapus", description: err.detail, variant: "destructive" });
    }
  }

  const activeType = tab;
  const activeTxs = activeType === "income" ? incomeTxs : expenseTxs;

  const catById = useMemo(() => {
    const all = [...incomeCategories, ...expenseCategories];
    return Object.fromEntries(all.map((c) => [c.id, c]));
  }, [incomeCategories, expenseCategories]);

  const subById = useMemo(() => {
    const all = [...incomeSubcategories, ...expenseSubcategories];
    return Object.fromEntries(all.map((s) => [s.id, s]));
  }, [incomeSubcategories, expenseSubcategories]);

  const pmById = useMemo(() => Object.fromEntries(paymentMethods.map((p) => [p.id, p])), [paymentMethods]);

  return (
    <div data-testid="transactions-page" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 data-testid="transactions-title" className="text-2xl font-bold tracking-tight">
            Transaksi
          </h2>
          <p data-testid="transactions-desc" className="text-sm text-muted-foreground">
            Tambah, edit, dan hapus pemasukan/pengeluaran. Saldo otomatis ter-update.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthPicker testId="transactions-month-picker" value={month} onChange={setMonth} />

          <TxForm
            type="income"
            open={openIncome}
            setOpen={(v) => {
              setEditing(null);
              setOpenIncome(v);
            }}
            onSaved={loadAll}
            categories={incomeCategories}
            subcategories={incomeSubcategories}
            paymentMethods={paymentMethods}
          />

          <TxForm
            type="expense"
            open={openExpense}
            setOpen={(v) => {
              setEditing(null);
              setOpenExpense(v);
            }}
            onSaved={loadAll}
            categories={expenseCategories}
            subcategories={expenseSubcategories}
            paymentMethods={paymentMethods}
          />
        </div>
      </div>

      <Card data-testid="transactions-table-card" className="rounded-3xl">
        <CardHeader>
          <CardTitle data-testid="transactions-table-title">Daftar Transaksi</CardTitle>
          <CardDescription data-testid="transactions-table-subtitle">
            Pilih tab pemasukan/pengeluaran. Klik Edit untuk ubah data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList data-testid="transactions-tabs-list" className="rounded-2xl">
              <TabsTrigger data-testid="transactions-tab-expense" value="expense">
                Pengeluaran
              </TabsTrigger>
              <TabsTrigger data-testid="transactions-tab-income" value="income">
                Pemasukan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expense">
              <div className="cf-no-scrollbar mt-4 overflow-auto rounded-2xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead data-testid="tx-col-date-expense">Tanggal</TableHead>
                      <TableHead data-testid="tx-col-sub-expense">Subkategori</TableHead>
                      <TableHead data-testid="tx-col-desc-expense">Deskripsi</TableHead>
                      <TableHead data-testid="tx-col-method-expense">Metode</TableHead>
                      <TableHead data-testid="tx-col-amount-expense" className="text-right">
                        Nominal
                      </TableHead>
                      <TableHead data-testid="tx-col-actions-expense" className="text-right">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseTxs.map((tx) => (
                      <TableRow data-testid={`tx-row-${tx.id}`} key={tx.id}>
                        <TableCell data-testid={`tx-date-${tx.id}`}>{tx.date}</TableCell>
                        <TableCell data-testid={`tx-sub-${tx.id}`} className="font-medium">
                          {subById[tx.subcategory_id]?.name || "-"}
                          <div className="text-xs text-muted-foreground">{catById[tx.category_id]?.name || "-"}</div>
                        </TableCell>
                        <TableCell data-testid={`tx-desc-${tx.id}`} className="min-w-[240px]">
                          {tx.description || "-"}
                        </TableCell>
                        <TableCell data-testid={`tx-method-${tx.id}`}>{pmById[tx.payment_method_id]?.name || "-"}</TableCell>
                        <TableCell data-testid={`tx-amount-${tx.id}`} className="text-right">
                          {formatRp(tx.amount)}
                        </TableCell>
                        <TableCell data-testid={`tx-actions-${tx.id}`} className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              data-testid={`tx-edit-${tx.id}`}
                              variant="outline"
                              className="h-9 rounded-xl"
                              onClick={() => {
                                setEditing(tx);
                                setOpenExpense(true);
                              }}
                            >
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  data-testid={`tx-delete-${tx.id}`}
                                  variant="destructive"
                                  className="h-9 rounded-xl"
                                >
                                  Hapus
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent data-testid={`tx-delete-dialog-${tx.id}`} className="rounded-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle data-testid={`tx-delete-title-${tx.id}`}>Konfirmasi hapus</AlertDialogTitle>
                                  <AlertDialogDescription data-testid={`tx-delete-desc-${tx.id}`}>
                                    Transaksi akan dihapus dan saldo akan dikembalikan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel data-testid={`tx-delete-cancel-${tx.id}`} className="rounded-xl">
                                    Batal
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    data-testid={`tx-delete-confirm-${tx.id}`}
                                    className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => removeTx(tx)}
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
                    {expenseTxs.length === 0 ? (
                      <TableRow>
                        <TableCell data-testid="tx-empty-expense" colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                          Belum ada pengeluaran.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="income">
              <div className="cf-no-scrollbar mt-4 overflow-auto rounded-2xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead data-testid="tx-col-date-income">Tanggal</TableHead>
                      <TableHead data-testid="tx-col-sub-income">Subkategori</TableHead>
                      <TableHead data-testid="tx-col-desc-income">Deskripsi</TableHead>
                      <TableHead data-testid="tx-col-method-income">Metode</TableHead>
                      <TableHead data-testid="tx-col-amount-income" className="text-right">
                        Nominal
                      </TableHead>
                      <TableHead data-testid="tx-col-actions-income" className="text-right">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeTxs.map((tx) => (
                      <TableRow data-testid={`tx-row-${tx.id}`} key={tx.id}>
                        <TableCell data-testid={`tx-date-${tx.id}`}>{tx.date}</TableCell>
                        <TableCell data-testid={`tx-sub-${tx.id}`} className="font-medium">
                          {subById[tx.subcategory_id]?.name || "-"}
                          <div className="text-xs text-muted-foreground">{catById[tx.category_id]?.name || "-"}</div>
                        </TableCell>
                        <TableCell data-testid={`tx-desc-${tx.id}`} className="min-w-[240px]">
                          {tx.description || "-"}
                        </TableCell>
                        <TableCell data-testid={`tx-method-${tx.id}`}>{pmById[tx.payment_method_id]?.name || "-"}</TableCell>
                        <TableCell data-testid={`tx-amount-${tx.id}`} className="text-right">
                          {formatRp(tx.amount)}
                        </TableCell>
                        <TableCell data-testid={`tx-actions-${tx.id}`} className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              data-testid={`tx-edit-${tx.id}`}
                              variant="outline"
                              className="h-9 rounded-xl"
                              onClick={() => {
                                setEditing(tx);
                                setOpenIncome(true);
                              }}
                            >
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  data-testid={`tx-delete-${tx.id}`}
                                  variant="destructive"
                                  className="h-9 rounded-xl"
                                >
                                  Hapus
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent data-testid={`tx-delete-dialog-${tx.id}`} className="rounded-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle data-testid={`tx-delete-title-${tx.id}`}>Konfirmasi hapus</AlertDialogTitle>
                                  <AlertDialogDescription data-testid={`tx-delete-desc-${tx.id}`}>
                                    Transaksi akan dihapus dan saldo akan dikembalikan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel data-testid={`tx-delete-cancel-${tx.id}`} className="rounded-xl">
                                    Batal
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    data-testid={`tx-delete-confirm-${tx.id}`}
                                    className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => removeTx(tx)}
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
                    {incomeTxs.length === 0 ? (
                      <TableRow>
                        <TableCell data-testid="tx-empty-income" colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                          Belum ada pemasukan.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit dialogs reuse TxForm by using editing + open toggles */}
      <TxForm
        type="income"
        open={openIncome}
        setOpen={setOpenIncome}
        onSaved={loadAll}
        editing={editing && editing.type === "income" ? editing : editing?.type ? null : editing}
        categories={incomeCategories}
        subcategories={incomeSubcategories}
        paymentMethods={paymentMethods}
      />

      <TxForm
        type="expense"
        open={openExpense}
        setOpen={setOpenExpense}
        onSaved={loadAll}
        editing={editing && editing.type === "expense" ? editing : editing?.type ? null : editing}
        categories={expenseCategories}
        subcategories={expenseSubcategories}
        paymentMethods={paymentMethods}
      />

      <div className="rounded-2xl border bg-secondary/40 p-4">
        <p data-testid="tx-footer-note" className="text-sm text-muted-foreground">
          Kategori & subkategori dapat Anda atur di menu <span className="font-semibold text-foreground">Profil</span>.
        </p>
      </div>
    </div>
  );
}
