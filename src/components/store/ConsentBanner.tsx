import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getConsent, setConsent, startAnalytics, type Consent } from "@/lib/analytics-client";

export function ConsentBanner() {
  const [consent, setC] = useState<Consent | "loading">("loading");
  useEffect(() => {
    const c = getConsent();
    setC(c);
    if (c === "granted") startAnalytics();
    const on = (e: Event) => setC((e as CustomEvent<Consent>).detail);
    window.addEventListener("dutti:consent", on);
    return () => window.removeEventListener("dutti:consent", on);
  }, []);
  if (consent !== null) return null;
  return (
    <div role="dialog" aria-label="إحصائيات الزيارة" className="fixed inset-x-3 bottom-24 z-50 rounded-2xl border border-border bg-card p-4 text-sm shadow-lg md:bottom-4 md:start-4 md:end-auto md:max-w-md">
      <p className="leading-relaxed">
        نستخدم إحصائيات زيارة بسيطة (عنوان IP وموقع تقريبي ومصدر الزيارة) علشان نفهم الإقبال على الصفحة. مفيش إعلانات ولا تتبع خارجي، والطلب متاح سواء وافقت أو رفضت.{" "}
        <Link to="/privacy" className="font-bold underline">سياسة الخصوصية</Link>
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => setConsent("granted")}>موافق</Button>
        <Button size="sm" variant="outline" onClick={() => setConsent("denied")}>رفض</Button>
      </div>
    </div>
  );
}
