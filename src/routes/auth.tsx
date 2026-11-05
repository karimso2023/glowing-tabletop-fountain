import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل دخول الإدارة — نافورة ميا" },
      { name: "description", content: "دخول فريق إدارة الطلبات." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "تسجيل دخول الإدارة" },
      { property: "og:description", content: "دخول فريق إدارة الطلبات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError("البريد أو كلمة المرور غير صحيحة."); return; }
    navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-warm px-5">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-3xl bg-card p-8 shadow-soft">
        <h1 className="text-2xl font-extrabold">لوحة إدارة الطلبات</h1>
        <p className="text-sm text-muted-foreground">الدخول لفريق العمل المصرح له فقط. الحسابات بيتم إنشاؤها من المسؤول.</p>
        <div className="space-y-1.5"><Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" /></div>
        <div className="space-y-1.5"><Label htmlFor="pw">كلمة المرور</Label>
          <Input id="pw" type="password" dir="ltr" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" /></div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button type="submit" variant="order" size="lg" className="h-12 w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" />}دخول</Button>
      </form>
    </div>
  );
}
