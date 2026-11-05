import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, LogOut, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GOVERNORATES, formatEGP } from "@/lib/egypt";
import { getIntegrationState, getN8nWorkflow, retrySync } from "@/lib/admin.functions";
import { VisitorStatsPanel, OrderAttribution } from "@/components/admin/VisitorStats";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "إدارة الطلبات — نافورة ميا" },
      { name: "description", content: "لوحة متابعة طلبات الدفع عند الاستلام." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "إدارة الطلبات" },
      { property: "og:description", content: "لوحة متابعة الطلبات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const STATUSES = ["New", "Pending Confirmation", "Confirmed", "Shipped", "Completed", "Cancelled"] as const;
const STATUS_AR: Record<string, string> = {
  New: "جديد", "Pending Confirmation": "قيد التأكيد", Confirmed: "مؤكد", Shipped: "تم الشحن", Completed: "مكتمل", Cancelled: "ملغي",
};
type Order = Tables<"orders">;

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const integration = useServerFn(getIntegrationState);
  const access = useQuery({ queryKey: ["admin-access"], queryFn: () => integration(), retry: false });

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (access.isLoading) return <div className="p-10 text-center">جاري التحميل…</div>;
  if (access.isError) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">مفيش صلاحية</h1>
          <p className="mt-2 text-muted-foreground">الحساب ده مش مضاف كمسؤول أو موظف طلبات.</p>
          <Button className="mt-4" variant="outline" onClick={signOut}>تسجيل خروج</Button>
        </div>
      </div>
    );
  }
  const state = access.data!;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <h1 className="text-xl font-extrabold">إدارة الطلبات</h1>
          <Button variant="ghost" onClick={signOut}><LogOut />خروج</Button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-6">
        <SyncBanner state={state} />
        <Tabs defaultValue="orders" className="mt-6">
          <TabsList>
            <TabsTrigger value="orders">الطلبات</TabsTrigger>
            {state.isAdmin && <TabsTrigger value="visitors">إحصائيات الزوار</TabsTrigger>}
            {state.isAdmin && <TabsTrigger value="settings">الإعدادات</TabsTrigger>}
          </TabsList>
          <TabsContent value="orders"><Orders isAdmin={state.isAdmin} /></TabsContent>
          {state.isAdmin && <TabsContent value="visitors"><VisitorStatsPanel /></TabsContent>}
          {state.isAdmin && <TabsContent value="settings"><Settings /></TabsContent>}
        </Tabs>
      </main>
    </div>
  );
}

function SyncBanner({ state }: { state: Awaited<ReturnType<typeof getIntegrationState>> }) {
  const verified = state.status.find((s) => s.key === "n8n_sheets");
  const lastErr = state.status.find((s) => s.key === "n8n_sheets_last_error");
  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 text-sm sm:grid-cols-2">
      <div>
        <b>Google Sheets عبر n8n: </b>
        {!state.n8nSecretsPresent ? <Badge variant="outline">غير مضبوط</Badge>
          : verified?.verified_at ? <Badge className="bg-success text-primary-foreground">تم التحقق {new Date(verified.verified_at).toLocaleString("ar-EG")}</Badge>
          : <Badge variant="outline">مضبوط — لم يتم التحقق بطلب حقيقي بعد</Badge>}
      </div>
      {lastErr?.detail && <p className="truncate text-muted-foreground" title={lastErr.detail}>آخر خطأ: {lastErr.detail}</p>}
    </div>
  );
}

function Orders({ isAdmin }: { isAdmin: boolean }) {
  const [openAttr, setOpenAttr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [gov, setGov] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const retry = useServerFn(retrySync);
  const qc = useQueryClient();

  const counts = useQuery({
    queryKey: ["order-counts"],
    queryFn: async () => {
      const entries = await Promise.all(["all", ...STATUSES].map(async (s) => {
        let query = supabase.from("orders").select("id", { count: "exact", head: true });
        if (s !== "all") query = query.eq("order_status", s);
        const { count } = await query;
        return [s, count ?? 0] as const;
      }));
      return Object.fromEntries(entries) as Record<string, number>;
    },
  });

  const orders = useQuery({
    queryKey: ["orders", q, gov, status, from, to],
    queryFn: async () => {
      let query = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500);
      const term = q.trim();
      if (term) query = /^[0-9٠-٩+]/.test(term) && !term.toUpperCase().startsWith("MYA") ? query.ilike("phone", `%${term}%`) : query.ilike("order_number", `%${term}%`);
      if (gov) query = query.eq("governorate", gov);
      if (status) query = query.eq("order_status", status);
      if (from) query = query.gte("created_at", new Date(from).toISOString());
      if (to) query = query.lte("created_at", new Date(`${to}T23:59:59`).toISOString());
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  async function changeStatus(o: Order, s: string) {
    const { error } = await supabase.from("orders").update({ order_status: s }).eq("id", o.id);
    if (error) toast.error(error.message); else toast.success("تم تحديث الحالة");
    qc.invalidateQueries({ queryKey: ["orders"] }); qc.invalidateQueries({ queryKey: ["order-counts"] });
  }

  async function doRetry(orderId?: string) {
    const r = await retry({ data: { orderId } });
    r.ok ? toast.success(r.message) : toast.error(r.message);
    qc.invalidateQueries({ queryKey: ["orders"] });
  }

  const rows = orders.data ?? [];
  const csv = useMemo(() => {
    const head = ["Order ID","Order Date","Customer Name","Phone","Governorate","City","Address","Quantity","Unit Price","Shipping","Discount","Total","Payment","Status","Notes","UTM Source","UTM Campaign","Sync Status"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    return [head, ...rows.map((o) => [o.order_number, new Date(o.created_at).toLocaleString("en-GB", { timeZone: "Africa/Cairo" }), o.customer_name, o.phone, o.governorate, o.city, o.full_address, o.quantity, o.unit_price, o.shipping_fee, o.discount_amount, o.total_price, o.payment_method, o.order_status, o.customer_notes, o.utm_source, o.utm_campaign, o.sync_status])]
      .map((r) => r.map(esc).join(",")).join("\n");
  }, [rows]);

  function exportCsv() {
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `orders-${Date.now()}.csv`; a.click();
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {([["all", "الإجمالي"], ...STATUSES.map((s) => [s, STATUS_AR[s] ?? s])] as [string, string][]).map(([k, label]) => (
          <div key={k} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-display text-2xl font-bold">{counts.data?.[k] ?? "—"}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Input placeholder="بحث برقم الطلب أو الهاتف" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
        <select className="h-9 rounded-md border border-input bg-background px-2" value={gov} onChange={(e) => setGov(e.target.value)}>
          <option value="">كل المحافظات</option>{GOVERNORATES.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select className="h-9 rounded-md border border-input bg-background px-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">كل الحالات</option>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_AR[s]}</option>)}
        </select>
        <label className="text-xs">من <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" /></label>
        <label className="text-xs">إلى <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" /></label>
        <Button variant="outline" onClick={exportCsv} disabled={!rows.length}><Download />CSV</Button>
        <Button variant="outline" onClick={() => doRetry()}><RefreshCw />إعادة مزامنة الفاشل</Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-right">
            <tr>{["الطلب", "التاريخ", "العميل", "الهاتف", "العنوان", "الكمية", "الإجمالي", "الحالة", "المزامنة", ...(isAdmin ? ["الزيارة"] : [])].map((h) => <th key={h} className="p-3 font-bold whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {orders.isLoading && <tr><td colSpan={isAdmin ? 10 : 9} className="p-6 text-center">جاري التحميل…</td></tr>}
            {!orders.isLoading && rows.length === 0 && <tr><td colSpan={isAdmin ? 10 : 9} className="p-6 text-center text-muted-foreground">مفيش طلبات</td></tr>}
            {rows.map((o) => (
              <tr key={o.id} className="border-t border-border align-top">
                <td className="p-3 font-bold whitespace-nowrap" dir="ltr">{o.order_number}</td>
                <td className="p-3 whitespace-nowrap">{new Date(o.created_at).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}</td>
                <td className="p-3">{o.customer_name}{o.customer_notes && <p className="text-xs text-muted-foreground">{o.customer_notes}</p>}</td>
                <td className="p-3" dir="ltr">{o.phone}</td>
                <td className="p-3 min-w-48">{o.governorate}، {o.city}<p className="text-xs text-muted-foreground">{o.full_address}</p></td>
                <td className="p-3">{o.quantity}</td>
                <td className="p-3 whitespace-nowrap">{formatEGP(Number(o.total_price))}</td>
                <td className="p-3">
                  <select className="rounded-md border border-input bg-background px-2 py-1" value={o.order_status} onChange={(e) => changeStatus(o, e.target.value)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_AR[s]}</option>)}
                  </select>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <Badge variant={o.sync_status === "Synced" ? "default" : "outline"} className={o.sync_status === "Failed" ? "border-destructive text-destructive" : ""}>{o.sync_status}</Badge>
                  {o.sync_status !== "Synced" && <Button size="sm" variant="link" onClick={() => doRetry(o.id)}>إعادة</Button>}
                </td>
                {isAdmin && (
                  <td className="p-3 min-w-40">
                    <Button size="sm" variant="link" onClick={() => setOpenAttr(openAttr === o.id ? null : o.id)}>{openAttr === o.id ? "إخفاء" : "عرض"}</Button>
                    {openAttr === o.id && <OrderAttribution orderId={o.id} />}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Settings() {
  const qc = useQueryClient();
  const cfg = useQuery({
    queryKey: ["admin-config"],
    queryFn: async () => (await supabase.from("store_config").select("*").eq("id", 1).single()).data,
  });
  const [price, setPrice] = useState<string | null>(null);
  const [compare, setCompare] = useState<string | null>(null);
  const [rates, setRates] = useState<Record<string, string> | null>(null);
  const [flat, setFlat] = useState<string | null>(null);
  if (!cfg.data) return <p className="p-6">جاري التحميل…</p>;
  const c = cfg.data;
  const curRates = rates ?? Object.fromEntries(Object.entries((c.shipping_rates as Record<string, number>) ?? {}).map(([k, v]) => [k, String(v)]));

  async function save() {
    const p = (price ?? (c.unit_price?.toString() ?? "")).trim();
    const cp = (compare ?? (c.compare_at_price?.toString() ?? "")).trim();
    const r: Record<string, number> = {};
    for (const [g, v] of Object.entries(curRates)) {
      if (v.trim() === "") continue;
      const n = Number(v); if (!Number.isFinite(n) || n < 0) { toast.error(`رسوم شحن غير صحيحة لـ ${g}`); return; }
      r[g] = n;
    }
    const pn = p ? Number(p) : null, cpn = cp ? Number(cp) : null;
    const fl = (flat ?? (c.flat_shipping_fee?.toString() ?? "")).trim();
    const fln = fl ? Number(fl) : null;
    if (fln !== null && !(fln >= 0)) { toast.error("رسوم الشحن الثابتة غير صحيحة"); return; }
    if ((pn !== null && !(pn > 0)) || (cpn !== null && !(cpn > 0))) { toast.error("السعر لازم يكون رقم أكبر من صفر"); return; }
    const { error } = await supabase.from("store_config").update({
      unit_price: pn, compare_at_price: cpn, flat_shipping_fee: fln, shipping_rates: Object.keys(r).length ? r : null, updated_at: new Date().toISOString(),
    }).eq("id", 1);
    if (error) toast.error(error.message); else { toast.success("تم الحفظ"); qc.invalidateQueries(); }
  }

  return (
    <div className="max-w-3xl space-y-6 rounded-2xl border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">اترك أي قيمة فاضية لو لسه مش متأكد منها — الطلب مش هيتفتح للعملاء غير لما السعر وجدول الشحن يتحددوا.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-bold">سعر القطعة (ج.م)<Input inputMode="decimal" value={price ?? (c.unit_price?.toString() ?? "")} onChange={(e) => setPrice(e.target.value)} /></label>
        <label className="space-y-1 text-sm font-bold">السعر قبل الخصم (فقط لو حقيقي)<Input inputMode="decimal" value={compare ?? (c.compare_at_price?.toString() ?? "")} onChange={(e) => setCompare(e.target.value)} /></label>
      </div>
      <div>
        <label className="mb-4 block max-w-xs space-y-1 text-sm font-bold">شحن ثابت للأوردر (ج.م)<Input inputMode="decimal" value={flat ?? (c.flat_shipping_fee?.toString() ?? "")} onChange={(e) => setFlat(e.target.value)} /></label>
        <h3 className="font-bold">رسوم خاصة لمحافظات معينة (اختياري — تغلب على الشحن الثابت)</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {GOVERNORATES.map((g) => (
            <label key={g} className="flex items-center gap-2 text-sm"><span className="w-28 shrink-0">{g}</span>
              <Input inputMode="decimal" value={curRates[g] ?? ""} onChange={(e) => setRates({ ...curRates, [g]: e.target.value })} /></label>
          ))}
        </div>
      </div>
      <Button variant="order" size="lg" onClick={save}>حفظ</Button>
      <SheetsSetup />
    </div>
  );
}

function SheetsSetup() {
  const fetchWf = useServerFn(getN8nWorkflow);
  async function download() {
    try {
      const { json } = await fetchWf();
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url; a.download = "n8n-orders-to-sheets.workflow.json"; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("تعذر تحميل الملف"); }
  }
  return (
    <section className="space-y-3 border-t border-border pt-6 text-sm">
      <h3 className="font-bold">ربط الطلبات بـ Google Sheets (عن طريق n8n)</h3>
      <Button variant="outline" onClick={download}><Download className="ms-1 h-4 w-4" />تحميل ملف n8n workflow</Button>
      <ol className="list-decimal space-y-1 pe-5 text-muted-foreground">
        <li>افتح <a className="underline" href="https://n8n.dutti.net/" target="_blank" rel="noreferrer">n8n.dutti.net</a> ← Workflows ← Import from file واختار الملف ده.</li>
        <li>عقدة Webhook: اعمل Header Auth باسم <b>X-Webhook-Token</b> وقيمة سرية طويلة (من مدير كلمات السر).</li>
        <li>عقدة Google Sheets: اربط حساب جوجل (OAuth) — الشيت الحالي متحدد بالفعل، وتاب اسمها Orders.</li>
        <li>فعّل الـ workflow وانسخ <b>Production URL</b> من عقدة Webhook (شكله https://n8n.dutti.net/webhook/… — مش رابط الصفحة الرئيسية ولا webhook-test).</li>
        <li>في Lovable ← Project Settings ← Secrets ضيف <b>N8N_WEBHOOK_URL</b> و <b>N8N_WEBHOOK_TOKEN</b> (نفس القيمة). متبعتش القيم في الشات.</li>
        <li>اعمل طلب تجربة واضغط «إعادة مزامنة» — الحالة هتبقى متأكدة بس لما n8n يرد بنجاح.</li>
      </ol>
    </section>
  );
}
