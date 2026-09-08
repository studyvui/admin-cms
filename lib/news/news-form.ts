import { z } from "zod";
import type { CreateNewsInput, UpdateNewsInput } from "@/lib/types";

export const newsFormSchema = z.object({
  type: z.enum(["tip", "update", "event"]),
  title: z.string().min(3, "Tối thiểu 3 ký tự"),
  hook: z.string().optional(),
  content: z.string().min(10, "Tối thiểu 10 ký tự"),
  image: z.string().optional(),
});

export type NewsFormValues = z.infer<typeof newsFormSchema>;

// Tao bai moi: bo qua field rong de payload gon (backend cung coi undefined
// = "khong co", khac chuoi rong).
export function toCreatePayload(values: NewsFormValues): CreateNewsInput {
  return {
    type: values.type,
    title: values.title,
    ...(values.hook ? { hook: values.hook } : {}),
    content: values.content,
    ...(values.image ? { image: values.image } : {}),
  };
}

// Cap nhat: LUON gui du hook/image (ke ca chuoi rong) de admin xoa duoc
// hook/anh da co truoc do — omit field se bi service hieu la "khong doi".
export function toUpdatePayload(values: NewsFormValues): UpdateNewsInput {
  return {
    type: values.type,
    title: values.title,
    hook: values.hook ?? "",
    content: values.content,
    image: values.image ?? "",
  };
}
