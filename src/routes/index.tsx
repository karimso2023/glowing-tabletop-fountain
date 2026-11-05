import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Droplets, Gift, Home, Layers, Lightbulb, Mountain, Banknote, Truck, RefreshCcw, ShieldCheck, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkout } from "@/components/store/Checkout";
import { ProductVideo } from "@/components/store/ProductVideo";
import { getStoreConfig, type PublicConfig } from "@/lib/store.functions";
import { formatEGP } from "@/lib/egypt";
import { track } from "@/lib/tracking";
import hero from "@/assets/fountain-hero.jpg.asset.json";
import details from "@/assets/fountain-details.jpg.asset.json";
import tabletop from "@/assets/fountain-tabletop.jpg.asset.json";
import rooms from "@/assets/fountain-rooms.jpg.asset.json";
import video from "@/assets/fountain-video.mp4.asset.json";
import poster from "@/assets/fountain-video-poster.jpg.asset.json";

const configQuery = queryOptions({ queryKey: ["store-config"], queryFn: () => getStoreConfig(), staleTime: 60_000 });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نافورة ميا LED صغيرة من Dutti — ٧٥٠ ج.م | الدفع عند الاستلام" },
      { name: "description", content: "نافورة مكتب صغيرة بثلاث درجات لمية متدفقة، إضاءة LED دافية وحصى طبيعي. اطلبها دلوقتي والدفع عند الاستلام." },
      { property: "og:title", content: "نافورة ميا LED صغيرة — ركن صغير… وهدوء يملأ المكان" },
      { property: "og:description", content: "مية بتنزل على ثلاث درجات وإضاءة دافية. الدفع عند الاستلام." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "preload", as: "image", href: hero.url }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(configQuery),
  component: Landing,
});

const WHATSAPP_URL = "https://wa.me/201064377166";
const WARRANTY = "ضمان على المنتج، واستبدال لو المنتج مش شغال";

const GALLERY = [
  { src: hero.url, alt: "النافورة على ترابيزة بإضاءة دافية" },
  { src: details.url, alt: "تفاصيل الثلاث درجات والحصى والإضاءة" },
  { src: tabletop.url, alt: "النافورة على مكتب خشب" },
  { src: rooms.url, alt: "النافورة في أوضة النوم والصالة والمطبخ والمكتب" },
];

const BENEFITS = [
  { icon: Layers, title: "مية بتنزل على ٣ درجات", text: "تصميم شلال صغير بثلاث أحواض، المية بتتنقل من حوض للتاني بشكل لطيف للعين." },
  { icon: Lightbulb, title: "إضاءة LED دافية", text: "نور دهبي هادي من الحوض اللي تحت بيدّي الركن شكل مميز وقت الليل." },
  { icon: Mountain, title: "حصى طبيعي حوالين القاعدة", text: "حصى بألوان ترابية بيكمّل الشكل ويخلي النافورة قطعة ديكور متكاملة." },
  { icon: Droplets, title: "مية بتلف في دايرة", text: "المية بتتجمع في القاعدة وتطلع تاني لفوق، فمش محتاج تملاها كل شوية." },
  { icon: Home, title: "تنفع في أي ركن", text: "على الكومودينو، في الصالة، المطبخ أو جنب اللابتوب على المكتب." },
  { icon: Gift, title: "هدية شكلها مختلف", text: "فكرة هدية لطيفة لحد بيحب الديكور الهادي والتفاصيل الحلوة." },
];

function Landing() {
  const { data: config } = useSuspenseQuery(configQuery);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => { track("PageView"); track("ViewContent"); }, []);
  useEffect(() => {
    const el = document.getElementById("order");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setFormVisible(!!e?.isIntersecting), { rootMargin: "0px 0px -10% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const goOrder = () => document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground md:pb-0">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <span className="font-display text-xl font-extrabold tracking-wide" dir="ltr">{config.storeName ?? "نافورة ميا"}</span>
        <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold"><Banknote className="size-4 text-gold" /> الدفع عند الاستلام</span>
      </header>

      {/* Hero */}
      <section className="bg-warm">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-5 pb-10 md:grid-cols-2 md:gap-12 md:py-16">
          <div className="relative overflow-hidden rounded-[2rem] shadow-soft md:order-2">
            <img src={hero.url} alt="نافورة ميا LED صغيرة بإضاءة دافية على ترابيزة" width={1280} height={1280} fetchPriority="high" className="aspect-[5/4] w-full object-cover md:aspect-square" />
          </div>
          <div className="animate-rise md:order-1">
            <p className="text-sm font-bold text-gold">نافورة مكتب صغيرة بإضاءة LED</p>
            <h1 className="mt-2 text-4xl leading-[1.25] font-extrabold sm:text-5xl">ركن صغير… وهدوء يملأ المكان</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {config.productName}: مية بتنزل على ثلاث درجات، نور دافي، وحصى طبيعي — قطعة ديكور بتغيّر إحساس أي ركن في بيتك أو مكتبك.
            </p>
            <PriceBlock config={config} />
            <Button variant="order" size="xl" className="mt-6 w-full sm:w-auto" onClick={goOrder}>اطلب دلوقتي</Button>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4 text-gold" /> من غير حساب ومن غير دفع أونلاين</p>
          </div>
        </div>
      </section>

      {/* Video */}
      <section className="mx-auto max-w-4xl px-5 py-14">
        <SectionTitle eyebrow="شوفها وهي شغالة" title="المية والنور على الطبيعة" />
        <div className="mt-8 overflow-hidden rounded-[2rem] bg-primary shadow-soft">
          <ProductVideo src={video.url} poster={poster.url} />
        </div>
        <CTA onClick={goOrder} />
      </section>

      {/* Benefits */}
      <section className="bg-secondary/60 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <SectionTitle eyebrow="ليه هتحبها" title="تفاصيل صغيرة بفرق كبير" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-3xl bg-card p-6 shadow-soft">
                <span className="grid size-12 place-items-center rounded-2xl bg-gold-soft/60"><b.icon className="size-6 text-foreground" /></span>
                <h3 className="mt-4 text-lg font-bold">{b.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{b.text}</p>
              </div>
            ))}
          </div>
          <CTA onClick={goOrder} />
        </div>
      </section>

      {/* Gallery */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <SectionTitle eyebrow="الصور الحقيقية" title="شوف كل التفاصيل" />
        <div className="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 md:grid md:grid-cols-4 md:overflow-visible">
          {GALLERY.map((g, i) => (
            <button key={g.src} onClick={() => setLightbox(i)} className="w-[78%] shrink-0 snap-center overflow-hidden rounded-3xl shadow-soft md:w-auto" aria-label={`تكبير: ${g.alt}`}>
              <img src={g.src} alt={g.alt} loading="lazy" width={640} height={640} className="aspect-square w-full object-cover transition-transform duration-500 hover:scale-105" />
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">دوس على أي صورة لتكبيرها</p>
      </section>
      <Dialog open={lightbox !== null} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">صورة المنتج</DialogTitle>
          {lightbox !== null && (
            <div className="relative">
              <img src={GALLERY[lightbox]?.src} alt={GALLERY[lightbox]?.alt} className="w-full rounded-3xl" />
              <button onClick={() => setLightbox(null)} className="absolute top-3 left-3 grid size-10 place-items-center rounded-full bg-card shadow-soft" aria-label="إغلاق"><X className="size-5" /></button>
              <div className="mt-3 flex justify-center gap-2">
                {GALLERY.map((_, i) => (
                  <button key={i} onClick={() => setLightbox(i)} aria-label={`صورة ${i + 1}`} className={`h-2 rounded-full transition-all ${i === lightbox ? "w-6 bg-gold" : "w-2 bg-card"}`} />
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pricing */}
      <section className="bg-primary py-14 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-extrabold">السعر والشحن</h2>
          <div className="mt-6 rounded-3xl border border-gold/40 p-6">
            {config.unitPrice != null ? (
              <p className="font-display text-4xl font-extrabold">
                {formatEGP(config.unitPrice)}
                {config.compareAtPrice && <span className="mr-3 text-xl font-medium opacity-60 line-through">{formatEGP(config.compareAtPrice)}</span>}
              </p>
            ) : (
              <p className="font-display text-2xl font-bold">السعر هيتعلن قريبًا</p>
            )}
            <p className="mt-3 opacity-80">
              {config.flatShippingFee != null
                ? `الشحن ${formatEGP(config.flatShippingFee)} للأوردر كله لكل محافظات مصر الـ٢٧، مهما كانت الكمية.`
                : config.shippingRates ? "مصاريف الشحن بتتحسب حسب محافظتك وبتظهرلك في ملخص الطلب قبل التأكيد." : "مصاريف الشحن هيتم تحديدها قريبًا."}
            </p>
            {config.compareAtPrice && config.unitPrice && (
              <p className="mt-2 font-bold text-gold">هتوفر {formatEGP(config.compareAtPrice - config.unitPrice)} ({Math.round(((config.compareAtPrice - config.unitPrice) / config.compareAtPrice) * 10000) / 100}٪)</p>
            )}
          </div>
          <Button variant="goldOutline" size="xl" className="mt-6 text-primary-foreground" onClick={goOrder}>اطلب دلوقتي</Button>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <SectionTitle eyebrow="اطمّن" title="هتطلب وانت مرتاح" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Trust icon={Banknote} title="الدفع عند الاستلام" text="مش هتدفع أي حاجة غير لما الأوردر يوصلك." />
          <Trust icon={Truck} title="شحن لكل المحافظات" text={`بنوصّل لكل محافظات مصر${config.flatShippingFee != null ? ` بشحن ثابت ${formatEGP(config.flatShippingFee)} للأوردر` : ""}، وهنكلمك نأكد البيانات قبل الشحن.`} />
          <Trust icon={RefreshCcw} title="الضمان" text={WARRANTY} />
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="block rounded-3xl border border-gold p-6 text-center transition-colors hover:bg-gold-soft/40">
            <MessageCircle className="mx-auto size-8 text-gold" />
            <h3 className="mt-3 font-bold">كلمنا واتساب</h3>
            <p className="mt-1 text-sm text-muted-foreground" dir="ltr">+20 106 437 7166</p>
          </a>
        </div>
      </section>

      {/* Checkout */}
      <section id="order" className="scroll-mt-4 bg-warm py-14">
        <div className="mx-auto max-w-xl px-5">
          <SectionTitle eyebrow="خطوة واحدة" title="اطلب دلوقتي" />
          <p className="mt-2 text-center text-muted-foreground">املا بياناتك وهنتواصل معاك لتأكيد الطلب.</p>
          <div className="mt-8"><Checkout config={config} image={hero.url} /></div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-14">
        <SectionTitle eyebrow="عندك سؤال؟" title="أسئلة شائعة" />
        <Accordion type="single" collapsible className="mt-8">
          {[
            ["إزاي بدفع؟", "الدفع كاش عند استلام الأوردر. مش محتاج كارت ولا تعمل حساب."],
            ["بكام السعر والشحن؟", config.unitPrice != null && config.flatShippingFee != null ? `سعر القطعة ${formatEGP(config.unitPrice)}${config.compareAtPrice ? ` بدل ${formatEGP(config.compareAtPrice)}` : ""}، والشحن ${formatEGP(config.flatShippingFee)} للأوردر كله. يعني قطعة واحدة إجماليها ${formatEGP(config.unitPrice + config.flatShippingFee)}.` : "السعر ومصاريف الشحن بيظهروا بالتفصيل في ملخص الطلب قبل التأكيد."],
            ["بتوصلوا لمحافظتي؟", `أيوه، الشحن متاح لكل محافظات مصر الـ٢٧${config.flatShippingFee != null ? ` بنفس السعر ${formatEGP(config.flatShippingFee)} للأوردر` : ""}.`],
            ["في ألوان أو مقاسات تانية؟", "المتاح حاليًا هو الموديل اللي في الصور: أسود منقط بالأبيض مع حصى طبيعي."],
            ["في ضمان؟", `${WARRANTY}. لتفاصيل أكتر كلمنا واتساب.`],
            ["بعد ما أطلب إيه اللي هيحصل؟", "هيظهرلك رقم طلب، وهنتواصل معاك على الموبايل نأكد البيانات قبل الشحن."],
          ].map(([q, a]) => q && (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="text-right text-base font-bold">{q}</AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p><span dir="ltr">{config.storeName ?? ""}</span> — نافورة ميا LED صغيرة — الدفع عند الاستلام</p>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-bold text-foreground underline-offset-4 hover:underline"><MessageCircle className="size-4" /> واتساب <span dir="ltr">+20 106 437 7166</span></a>
      </footer>

      {/* Sticky mobile bar */}
      <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 backdrop-blur transition-transform duration-300 md:hidden ${formVisible ? "translate-y-full" : ""}`}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">{config.productName}</p>
            <p className="font-display font-bold">{config.unitPrice != null ? formatEGP(config.unitPrice) : "السعر قريبًا"}</p>
          </div>
          <Button variant="order" size="lg" className="h-12" onClick={goOrder}>اطلب دلوقتي</Button>
        </div>
      </div>
    </div>
  );
}

function PriceBlock({ config }: { config: PublicConfig }) {
  return (
    <div className="mt-6 flex flex-wrap items-baseline gap-3">
      {config.unitPrice != null ? (
        <>
          <span className="font-display text-3xl font-extrabold">{formatEGP(config.unitPrice)}</span>
          {config.compareAtPrice && <span className="text-lg text-muted-foreground line-through">{formatEGP(config.compareAtPrice)}</span>}
        </>
      ) : (
        <span className="rounded-full border border-gold px-4 py-1.5 text-sm font-bold">السعر هيتعلن قريبًا</span>
      )}
      <span className="text-sm font-bold text-gold">• الدفع عند الاستلام</span>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-bold text-gold">{eyebrow}</p>
      <h2 className="mt-1 text-3xl font-extrabold">{title}</h2>
      <span className="mx-auto mt-3 block h-0.5 w-12 rounded bg-gold-gradient" />
    </div>
  );
}

function CTA({ onClick }: { onClick: () => void }) {
  return <div className="mt-8 text-center"><Button variant="order" size="xl" onClick={onClick}>اطلب دلوقتي</Button></div>;
}

function Trust({ icon: Icon, title, text }: { icon: typeof Banknote; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-border p-6 text-center">
      <Icon className="mx-auto size-8 text-gold" />
      <h3 className="mt-3 font-bold">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
