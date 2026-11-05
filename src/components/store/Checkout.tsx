import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Minus, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GOVERNORATES, formatEGP, toLatinDigits } from "@/lib/egypt";
import { orderInputSchema } from "@/lib/order-schema";
import { createOrder, type PublicConfig } from "@/lib/store.functions";
import { readUtm, track, trackOrderRegistered } from "@/lib/tracking";
import { getConsent, trackCheckoutStart } from "@/lib/analytics-client";

type Fields = { name: string; phone: string; governorate: string; city: string; address: string; notes: string };
const empty: Fields = { name: "", phone: "", governorate: "", city: "", address: "", notes: "" };

export function Checkout({ config, image }: { config: PublicConfig; image: string }) {
  const [f, setF] = useState<Fields>(empty);
  const [qty, setQty] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"form" | "review">("form");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState<{ orderNumber: string; total: number } | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const idemKey = useRef<string>("");
  const startedAt = useRef<number>(0);
  const started = useRef(false);
  const submit = useServerFn(createOrder);

  useEffect(() => {
    idemKey.current = crypto.randomUUID();
    startedAt.current = Date.now();
  }, []);

  const shipping = shippingFor(config, f.governorate);
  const subtotal = config.unitPrice != null ? config.unitPrice * qty : null;
  const total = subtotal != null && shipping != null ? subtotal + shipping : null;
  const governorateUnavailable = !!f.governorate && shipping == null && config.orderable;

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!started.current) { started.current = true; track("InitiateCheckout"); trackCheckoutStart(); }
    const v = k === "phone" ? toLatinDigits(e.target.value) : e.target.value;
    setF((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: "" }));
    // Any edit after review invalidates the previous attempt key only if order was not created.
  };

  const payload = useMemo(() => ({
    idempotencyKey: idemKey.current, name: f.name, phone: f.phone, governorate: f.governorate, city: f.city,
    address: f.address, quantity: qty, notes: f.notes, utm: readUtm(), analyticsConsent: getConsent() === "granted", website: honeypot, startedAt: startedAt.current,
  }), [f, qty, honeypot]);

  function validate() {
    const r = orderInputSchema.safeParse({ ...payload, idempotencyKey: idemKey.current || crypto.randomUUID(), startedAt: startedAt.current });
    if (r.success) { setErrors({}); return true; }
    const map: Record<string, string> = {};
    for (const i of r.error.issues) { const k = String(i.path[0]); if (!map[k]) map[k] = i.message; }
    setErrors(map);
    document.getElementById(`f-${Object.keys(map)[0]}`)?.focus();
    return false;
  }

  async function confirm() {
    if (submitting || !config.orderable || total == null) return;
    setSubmitting(true); setServerError("");
    try {
      const res = await submit({ data: { ...payload, idempotencyKey: idemKey.current } });
      if (res.ok) {
        setSuccess({ orderNumber: res.orderNumber, total: res.total });
        trackOrderRegistered(res.orderNumber, res.total);
      } else setServerError(res.message);
    } catch {
      setServerError("مشكلة في الاتصال. بياناتك محفوظة في الفورم، جرّب تاني.");
    } finally { setSubmitting(false); }
  }

  if (success) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-soft animate-rise" role="status">
        <CheckCircle2 className="mx-auto size-14 text-success" />
        <h3 className="mt-4 text-2xl font-bold">تم تسجيل طلبك بنجاح ✅</h3>
        <p className="mt-3 text-muted-foreground">رقم طلبك:</p>
        <p className="mt-1 font-display text-2xl font-extrabold tracking-wider" dir="ltr">{success.orderNumber}</p>
        <p className="mt-4 leading-relaxed">شكرًا لطلبك! هنراجع بيانات الأوردر ونتواصل معاك لتأكيده قبل الشحن.</p>
        <p className="mt-2 font-bold">الإجمالي: {formatEGP(success.total)} — الدفع عند الاستلام.</p>
      </div>
    );
  }

  const field = (k: keyof Fields, label: string, el: React.ReactNode) => (
    <div className="space-y-1.5">
      <Label htmlFor={`f-${k}`} className="text-sm font-bold">{label}</Label>
      {el}
      {errors[k] && <p className="text-sm text-destructive" role="alert">{errors[k]}</p>}
    </div>
  );
  const cls = (k: string) => `h-12 rounded-xl bg-background text-base ${errors[k] ? "border-destructive" : ""}`;

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8">
      {step === "form" ? (
        <form noValidate onSubmit={(e) => { e.preventDefault(); if (validate()) setStep("review"); }} className="space-y-4">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          {field("name", "الاسم بالكامل", <Input id="f-name" autoComplete="name" className={cls("name")} value={f.name} onChange={set("name")} />)}
          {field("phone", "رقم الموبايل", <Input id="f-phone" type="tel" inputMode="numeric" autoComplete="tel" dir="ltr" placeholder="01xxxxxxxxx" className={`${cls("phone")} text-right`} value={f.phone} onChange={set("phone")} />)}
          {field("governorate", "المحافظة",
            <select id="f-governorate" className={`w-full border px-3 ${cls("governorate")}`} value={f.governorate} onChange={set("governorate")}>
              <option value="">اختار المحافظة</option>
              {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>)}
          {governorateUnavailable && <p className="text-sm text-destructive">الشحن لمحافظة {f.governorate} مش متاح حاليًا.</p>}
          {field("city", "المدينة أو المنطقة", <Input id="f-city" autoComplete="address-level2" className={cls("city")} value={f.city} onChange={set("city")} />)}
          {field("address", "العنوان بالتفصيل", <Textarea id="f-address" autoComplete="street-address" rows={3} placeholder="الشارع، رقم العمارة، الدور، علامة مميزة" className={`rounded-xl bg-background text-base ${errors["address"] ? "border-destructive" : ""}`} value={f.address} onChange={set("address")} />)}
          <div className="space-y-1.5">
            <Label className="text-sm font-bold">الكمية</Label>
            <div className="flex w-fit items-center gap-3 rounded-xl border border-input bg-background p-1">
              <Button type="button" variant="ghost" size="icon" aria-label="زوّد" onClick={() => setQty((q) => Math.min(config.maxQuantity, q + 1))}><Plus /></Button>
              <span className="w-8 text-center text-lg font-bold" aria-live="polite">{qty}</span>
              <Button type="button" variant="ghost" size="icon" aria-label="قلّل" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus /></Button>
            </div>
          </div>
          {field("notes", "ملاحظات (اختياري)", <Textarea id="f-notes" rows={2} className="rounded-xl bg-background text-base" value={f.notes} onChange={set("notes")} />)}
          <Button type="submit" variant="order" size="xl" className="w-full">راجع طلبك</Button>
        </form>
      ) : (
        <div className="space-y-5">
          <h3 className="text-xl font-bold">ملخص الطلب</h3>
          <div className="flex items-center gap-4">
            <img src={image} alt="" className="size-20 rounded-2xl object-cover" width={80} height={80} />
            <div>
              <p className="font-bold">{config.productName}</p>
              <p className="text-sm text-muted-foreground">الكمية: {qty}</p>
            </div>
          </div>
          <dl className="space-y-2 rounded-2xl bg-muted p-4 text-sm">
            <Row k="سعر القطعة" v={config.unitPrice != null ? formatEGP(config.unitPrice) : "لم يُحدد بعد"} />
            {config.compareAtPrice && config.unitPrice != null && (
              <Row k="السعر قبل الخصم" v={formatEGP(config.compareAtPrice * qty)} />
            )}
            {config.compareAtPrice && config.unitPrice != null && (
              <Row k="بتوفر" v={formatEGP((config.compareAtPrice - config.unitPrice) * qty)} />
            )}
            <Row k="مصاريف الشحن (للأوردر)" v={shipping != null ? formatEGP(shipping) : "لم تُحدد بعد"} />
            <div className="border-t border-border pt-2"><Row k="الإجمالي المستحق" v={total != null ? formatEGP(total) : "غير متاح"} bold /></div>
          </dl>
          <div className="text-sm leading-relaxed text-muted-foreground">
            <p><b className="text-foreground">{f.name}</b> — <span dir="ltr">{f.phone}</span></p>
            <p>{f.governorate}، {f.city} — {f.address}</p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">الشحن متاح لكل محافظات مصر. هنكلمك نأكد بيانات الطلب قبل الشحن.</p>
          {!config.orderable && (
            <p className="rounded-xl border border-gold bg-gold-soft/40 p-3 text-sm">
              استقبال الطلبات هيتفتح أول ما يتم تأكيد السعر ومصاريف الشحن. بياناتك لسه موجودة في الفورم.
            </p>
          )}
          {serverError && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">{serverError}</p>}
          <Button variant="order" size="xl" className="w-full" disabled={submitting || !config.orderable || total == null} onClick={confirm}>
            {submitting ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
            أكد طلبك – الدفع عند الاستلام
          </Button>
          <Button variant="ghost" className="w-full" disabled={submitting} onClick={() => setStep("form")}>تعديل البيانات</Button>
        </div>
      )}
    </div>
  );
}

export function shippingFor(config: PublicConfig, governorate: string): number | undefined {
  if (!governorate) return config.flatShippingFee ?? undefined;
  const r = config.shippingRates?.[governorate];
  return r ?? config.flatShippingFee ?? undefined;
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "text-base font-bold" : ""}`}><dt>{k}</dt><dd>{v}</dd></div>;
}
