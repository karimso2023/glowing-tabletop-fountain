import { z } from "zod";
import { GOVERNORATES, normalizeEgyptianMobile } from "./egypt";

const text = (min: number, max: number, msg: string) =>
  z.string().trim().min(min, { message: msg }).max(max, { message: "النص أطول من اللازم" });

export const orderInputSchema = z.object({
  idempotencyKey: z.string().uuid(),
  name: text(3, 100, "اكتب اسمك بالكامل"),
  phone: z
    .string()
    .max(20)
    .transform((v, ctx) => {
      const n = normalizeEgyptianMobile(v);
      if (!n) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "رقم موبايل مصري غير صحيح (مثال: 01012345678)" });
        return z.NEVER;
      }
      return n;
    }),
  governorate: z.enum(GOVERNORATES, { errorMap: () => ({ message: "اختار المحافظة" }) }),
  city: text(2, 80, "اكتب المدينة أو المنطقة"),
  address: text(8, 300, "اكتب العنوان بالتفصيل (الشارع، رقم العمارة، الدور)"),
  quantity: z.coerce.number().int().min(1).max(20),
  notes: z.string().trim().max(500).optional().default(""),
  utm: z
    .object({
      source: z.string().max(100).optional(),
      medium: z.string().max(100).optional(),
      campaign: z.string().max(150).optional(),
      content: z.string().max(150).optional(),
    })
    .optional()
    .default({}),
  // anti-bot
  website: z.string().max(0).optional().default(""),
  startedAt: z.number().int(),
});

export type OrderInput = z.input<typeof orderInputSchema>;
