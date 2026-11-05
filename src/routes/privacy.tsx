import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getConsent, setConsent, type Consent } from "@/lib/analytics-client";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية — نافورة ميا LED" },
      { name: "description", content: "إزاي بنستخدم بيانات الطلب وإحصائيات الزيارة (IP وموقع تقريبي ومصدر الزيارة)." },
      { property: "og:title", content: "سياسة الخصوصية — نافورة ميا" },
      { property: "og:description", content: "بيانات الطلب وإحصائيات الزيارة وطريقة الرفض." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  const [c, setC] = useState<Consent>(null);
  useEffect(() => setC(getConsent()), []);
  const choose = (v: "granted" | "denied") => { setConsent(v); setC(v); };
  return (
    <main dir="rtl" className="mx-auto max-w-2xl space-y-5 px-5 py-10 leading-relaxed">
      <h1 className="font-display text-3xl font-extrabold">سياسة الخصوصية</h1>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">بيانات الطلب</h2>
        <p>لما تسجل طلب بنحفظ الاسم والموبايل والعنوان والكمية علشان نأكد ونشحن الطلب. مع كل طلب جديد بنسجل كمان عنوان IP اللي اتبعت منه الطلب وموقع تقريبي مستنتج منه (دولة/منطقة/مدينة)، وده لحماية الطلبات من التلاعب والمراجعة. الموقع ده تقريبي وممكن يكون غلط، ومش بنستخدمه بدل عنوان الشحن. البيانات دي بيشوفها مدير المتجر بس، وعنوان IP بيتمسح تلقائيًا بعد 30 يوم.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">إحصائيات الزيارة</h2>
        <p>بنحط ملف تعريف (cookie) عشوائي لمدة 30 يوم علشان نعرف عدد الزيارات والزوار النشطين ومصدر الزيارة (الموقع اللي جيت منه بدون تفاصيل الرابط، وروابط الحملات utm) والموقع التقريبي من IP، وبنربطها بطلبك لو سجلت طلب. مفيش بصمة جهاز، ومفيش Facebook Pixel أو أدوات إعلانية مفعّلة. لو مش عايز كده، اضغط "رفض الإحصائيات" تحت وقفنا فورًا، وتقدر تطلب عادي في الحالتين.</p>
        <p className="text-sm text-muted-foreground">اختيارك الحالي: {c === "granted" ? "موافق" : "رافض"}</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => choose("granted")}>تشغيل الإحصائيات</Button>
          <Button size="sm" variant="outline" onClick={() => choose("denied")}>رفض الإحصائيات</Button>
        </div>
      </section>
      <p>لأي استفسار تواصل معانا على واتساب <a className="underline" dir="ltr" href="https://wa.me/201064377166">+20 106 437 7166</a>.</p>
      <Link to="/" className="font-bold underline">الرجوع للصفحة الرئيسية</Link>
    </main>
  );
}
