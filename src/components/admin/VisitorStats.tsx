import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getVisitorStats } from "@/lib/analytics.functions";
import { cairoDay } from "@/lib/analytics-core";

const unknown = "غير معروف";

function sourceLabel(s: string) {
  if (s === "direct") return "مباشر / غير معروف";
  if (s.startsWith("utm:")) return `حملة: ${s.slice(4)}`;
  if (s.startsWith("ref:")) return `إحالة: ${s.slice(4)}`;
  return s;
}

export function VisitorStatsPanel() {
  const today = cairoDay(new Date());
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const fetchStats = useServerFn(getVisitorStats);
  const q = useQuery({
    queryKey: ["visitor-stats", from, to],
    queryFn: () => fetchStats({ data: { from, to } }),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  const s = q.data;
  const conv = s && s.sessions ? ((s.orders_from_tracked_sessions / s.sessions) * 100).toFixed(1) + "%" : "—";
  const cards: [string, string | number][] = s ? [
    ["نشطين الآن (آخر دقيقتين)", s.active_now],
    ["مشاهدات الصفحة", s.pageviews],
    ["جلسات تقريبية", s.sessions],
    ["جلسات جديدة", s.new_sessions],
    ["بدأوا الطلب", s.checkout_starts],
    ["طلبات من جلسات متتبعة", s.orders_from_tracked_sessions],
    ["كل الطلبات في الفترة", s.orders_total],
    ["نسبة التحويل", conv],
  ] : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs">من <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="w-40" /></label>
        <label className="text-xs">إلى <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="w-40" /></label>
        <Button variant="outline" onClick={() => { setFrom(today); setTo(today); }}>النهارده</Button>
        <span className="text-xs text-muted-foreground">بتوقيت القاهرة — تحديث كل 30 ثانية</span>
      </div>
      {q.isError && <p className="text-destructive">تعذر تحميل الإحصائيات.</p>}
      {q.isLoading && <p>جاري التحميل…</p>}
      {s && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {cards.map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="font-display text-2xl font-bold">{v}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
            <p><b>طريقة الحساب:</b> «الجلسة» = cookie عشوائي في متصفح واحد لمدة 30 يوم، فده تقدير مش عدد أشخاص (نفس الشخص على جهازين = جلستين، وعدة أشخاص على نفس الشبكة أو IP مش بيتجمعوا). كل التابات في نفس المتصفح بتتحسب جلسة واحدة.</p>
            <p>الأرقام بتشمل بس الزوار اللي وافقوا على الإحصائيات؛ اللي رفضوا مش بيتعدّوا. «نشطين الآن» = جلسات بعتت نبضة وهي ظاهرة على الشاشة خلال آخر دقيقتين.</p>
            <p>نسبة التحويل = طلبات اتسجلت من جلسات متتبعة ÷ الجلسات المتتبعة في الفترة. الزيارات الآلية المعروفة مستبعدة ({s.bot_sessions} جلسة)، وده مش بيمنع كل البوتات.</p>
            <p>الموقع مستنتج تقريبيًا من عنوان IP عن طريق شبكة الاستضافة، وممكن يظهر «غير معروف».</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Table title="الموقع التقريبي" head={["الدولة", "المنطقة", "المدينة", "جلسات"]}
              rows={s.geo.map((g) => [g.country ?? unknown, g.region ?? unknown, g.city ?? unknown, g.n])} />
            <Table title="مصدر الزيارة" head={["المصدر", "medium", "campaign", "جلسات"]}
              rows={s.sources.map((x) => [sourceLabel(x.source), x.medium ?? "—", x.campaign ?? "—", x.n])} />
          </div>
          <Table title="حسب اليوم" head={["اليوم", "جلسات", "مشاهدات"]} rows={s.by_day.map((d) => [d.day, d.sessions, d.pageviews])} />
        </>
      )}
    </div>
  );
}

function Table({ title, head, rows }: { title: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <h3 className="p-3 font-bold">{title}</h3>
      <table className="w-full text-sm">
        <thead className="bg-muted text-right"><tr>{head.map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={head.length} className="p-4 text-center text-muted-foreground">مفيش بيانات</td></tr>}
          {rows.map((r, i) => <tr key={i} className="border-t border-border">{r.map((c, j) => <td key={j} className="p-2">{c}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

export function OrderAttribution({ orderId }: { orderId: string }) {
  const q = useQuery({
    queryKey: ["order-attr", orderId],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_attribution").select("*").eq("order_id", orderId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (q.isLoading) return <p className="text-xs">…</p>;
  const a = q.data;
  if (!a) return <p className="text-xs text-muted-foreground">بيانات الزيارة غير متاحة لهذا الطلب.</p>;
  const v = (x: string | null | undefined) => x || "—";
  return (
    <dl className="space-y-0.5 text-xs">
      <div><dt className="inline font-bold">IP: </dt><dd className="inline" dir="ltr">{a.ip ? String(a.ip) : a.identifiers_purged_at ? "اتمسح (أكتر من 30 يوم)" : "غير متاح"}</dd></div>
      <div><dt className="inline font-bold">الموقع التقريبي: </dt><dd className="inline">{[a.country, a.region, a.city].filter(Boolean).join(" / ") || unknown}</dd></div>
      <div><dt className="inline font-bold">موافقة الإحصائيات: </dt><dd className="inline">{a.analytics_consent ? "نعم" : "لا"}</dd></div>
      <div><dt className="inline font-bold">الجلسة: </dt><dd className="inline" dir="ltr">{a.session_id ? a.session_id.slice(0, 8) : "—"}</dd></div>
      <div><dt className="inline font-bold">الإحالة: </dt><dd className="inline" dir="ltr">{a.referrer_host ? `${a.referrer_host}${a.referrer_path ?? ""}` : "مباشر/غير معروف"}</dd></div>
      <div><dt className="inline font-bold">أول زيارة utm: </dt><dd className="inline" dir="ltr">{[a.first_utm_source, a.first_utm_medium, a.first_utm_campaign, a.first_utm_content].map(v).join(" | ")}</dd></div>
      <div><dt className="inline font-bold">utm عند الطلب: </dt><dd className="inline" dir="ltr">{[a.checkout_utm_source, a.checkout_utm_medium, a.checkout_utm_campaign, a.checkout_utm_content].map(v).join(" | ")}</dd></div>
    </dl>
  );
}
