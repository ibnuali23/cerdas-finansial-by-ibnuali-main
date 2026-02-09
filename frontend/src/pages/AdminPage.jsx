import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      toast({ title: "Gagal memuat user", description: err.detail, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(u) {
    try {
      await api.delete(`/admin/users/${u.id}`);
      toast({ title: "User terhapus", description: "Semua data user tersebut juga dihapus." });
      await load();
    } catch (err) {
      toast({ title: "Gagal hapus", description: err.detail, variant: "destructive" });
    }
  }

  return (
    <div data-testid="admin-page" className="space-y-6">
      <div>
        <h2 data-testid="admin-title" className="text-2xl font-bold tracking-tight">Admin</h2>
        <p data-testid="admin-desc" className="text-sm text-muted-foreground">
          Kelola akun pengguna. Khusus admin “Presiden Mubarak 👑”.
        </p>
      </div>

      <Card data-testid="admin-users-card" className="rounded-3xl">
        <CardHeader>
          <CardTitle data-testid="admin-users-title">Daftar User</CardTitle>
          <CardDescription data-testid="admin-users-desc">Total: {users.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="cf-no-scrollbar overflow-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead data-testid="admin-col-name">Nama</TableHead>
                  <TableHead data-testid="admin-col-email">Email</TableHead>
                  <TableHead data-testid="admin-col-role">Role</TableHead>
                  <TableHead data-testid="admin-col-actions" className="text-right">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow data-testid={`admin-user-row-${u.id}`} key={u.id}>
                    <TableCell data-testid={`admin-user-name-${u.id}`} className="font-medium">
                      {u.name}
                    </TableCell>
                    <TableCell data-testid={`admin-user-email-${u.id}`}>{u.email}</TableCell>
                    <TableCell data-testid={`admin-user-role-${u.id}`}>{u.role}</TableCell>
                    <TableCell data-testid={`admin-user-actions-${u.id}`} className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            data-testid={`admin-user-delete-${u.id}`}
                            variant="destructive"
                            className="h-9 rounded-xl"
                            disabled={u.role === "admin"}
                          >
                            Hapus
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-testid={`admin-user-delete-dialog-${u.id}`} className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle data-testid={`admin-user-delete-title-${u.id}`}>Konfirmasi hapus user</AlertDialogTitle>
                            <AlertDialogDescription data-testid={`admin-user-delete-desc-${u.id}`}>
                              Semua data user ini akan ikut terhapus (transaksi, budget, kategori, saldo, transfer).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid={`admin-user-delete-cancel-${u.id}`} className="rounded-xl">
                              Batal
                            </AlertDialogCancel>
                            <AlertDialogAction
                              data-testid={`admin-user-delete-confirm-${u.id}`}
                              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => remove(u)}
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && users.length === 0 ? (
                  <TableRow>
                    <TableCell data-testid="admin-users-empty" colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      Tidak ada user.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Button data-testid="admin-refresh-button" variant="secondary" className="rounded-xl" onClick={load}>
        Refresh
      </Button>
    </div>
  );
}
