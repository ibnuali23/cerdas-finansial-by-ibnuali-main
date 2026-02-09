import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

function Field({ label, id, children, testId }) {
  return (
    <div className="space-y-2">
      <Label data-testid={testId} htmlFor={id}>
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [tab, setTab] = useState("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const [busy, setBusy] = useState(false);

  const subtitle = useMemo(
    () => "Kelola Keuanganmu dengan Cerdas, Aman, dan Berkah",
    [],
  );

  async function onLogin(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await auth.login(loginEmail, loginPassword);
      navigate("/app/dashboard");
    } catch (err) {
      toast({
        title: "Gagal login",
        description: err.detail || "Periksa email & password",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function onRegister(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await auth.register(regName, regEmail, regPassword, regConfirm);
      navigate("/app/dashboard");
    } catch (err) {
      toast({
        title: "Gagal registrasi",
        description: err.detail || "Cek kembali data Anda",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      data-testid="auth-page"
      className="min-h-screen bg-[radial-gradient(1200px_circle_at_20%_10%,hsl(var(--accent)/0.25),transparent_55%),radial-gradient(900px_circle_at_85%_30%,hsl(var(--primary)/0.25),transparent_55%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--background)))]"
    >
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6">
        <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div
                data-testid="auth-logo"
                className="grid h-12 w-12 place-items-center rounded-2xl bg-[hsl(var(--accent))] text-[hsl(170_25%_10%)] shadow"
              >
                <span className="text-xl font-black">💰</span>
              </div>
              <div>
                <h1
                  data-testid="auth-title"
                  className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl"
                >
                  💵 Cerdas Finansial
                </h1>
                <p data-testid="auth-subtitle" className="mt-2 text-base text-muted-foreground md:text-lg">
                  {subtitle}
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border bg-background/60 p-5 shadow-sm backdrop-blur">
              <p data-testid="auth-note" className="text-sm text-foreground/80">
                Data Anda tersimpan di cloud (MongoDB) dan otomatis tersinkron saat login di perangkat lain.
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li data-testid="auth-bullet-1">• Catat pemasukan & pengeluaran terstruktur</li>
                <li data-testid="auth-bullet-2">• Saldo metode pembayaran real-time</li>
                <li data-testid="auth-bullet-3">• Budget per subkategori + indikator aman/hati-hati</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Card data-testid="auth-card" className="w-full max-w-md rounded-3xl shadow-lg">
              <CardHeader>
                <CardTitle data-testid="auth-card-title" className="text-2xl">
                  Masuk / Daftar
                </CardTitle>
                <CardDescription data-testid="auth-card-desc">
                  Silakan login atau buat akun baru.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={tab} onValueChange={setTab}>
                  <TabsList data-testid="auth-tabs-list" className="grid w-full grid-cols-2 rounded-2xl">
                    <TabsTrigger data-testid="auth-tab-login" value="login">
                      Login
                    </TabsTrigger>
                    <TabsTrigger data-testid="auth-tab-register" value="register">
                      Registrasi
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form data-testid="login-form" onSubmit={onLogin} className="mt-4 space-y-4">
                      <Field label="Email" id="login-email" testId="login-email-label">
                        <Input
                          data-testid="login-email-input"
                          id="login-email"
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="nama@email.com"
                          className="rounded-2xl"
                          required
                        />
                      </Field>
                      <Field label="Password" id="login-password" testId="login-password-label">
                        <Input
                          data-testid="login-password-input"
                          id="login-password"
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="rounded-2xl"
                          required
                        />
                      </Field>
                      <Button
                        data-testid="login-submit-button"
                        type="submit"
                        disabled={busy}
                        className="h-11 w-full rounded-2xl"
                      >
                        {busy ? "Memproses..." : "Login"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="register">
                    <form data-testid="register-form" onSubmit={onRegister} className="mt-4 space-y-4">
                      <Field label="Nama" id="reg-name" testId="register-name-label">
                        <Input
                          data-testid="register-name-input"
                          id="reg-name"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Nama Anda"
                          className="rounded-2xl"
                          required
                        />
                      </Field>
                      <Field label="Email" id="reg-email" testId="register-email-label">
                        <Input
                          data-testid="register-email-input"
                          id="reg-email"
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="nama@email.com"
                          className="rounded-2xl"
                          required
                        />
                      </Field>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Password" id="reg-password" testId="register-password-label">
                          <Input
                            data-testid="register-password-input"
                            id="reg-password"
                            type="password"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="••••••••"
                            className="rounded-2xl"
                            required
                          />
                        </Field>
                        <Field label="Konfirmasi" id="reg-confirm" testId="register-confirm-label">
                          <Input
                            data-testid="register-confirm-input"
                            id="reg-confirm"
                            type="password"
                            value={regConfirm}
                            onChange={(e) => setRegConfirm(e.target.value)}
                            placeholder="••••••••"
                            className="rounded-2xl"
                            required
                          />
                        </Field>
                      </div>
                      <Button
                        data-testid="register-submit-button"
                        type="submit"
                        disabled={busy}
                        className="h-11 w-full rounded-2xl"
                      >
                        {busy ? "Memproses..." : "Buat Akun"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
