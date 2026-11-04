"use client";

import { Plus, Pencil, Trash2, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { lessonTypeLabel, skillLabel } from "@/lib/math-gen/labels";
import type { MathTemplate } from "@/lib/math-gen/types";

// Mục 93 Đợt 4c: Card "Ngân hàng mẫu" tách nguyên văn từ page.tsx (state, handler vẫn ở page.tsx).
export function MathTemplateBankCard({
  lessonType,
  isLoading,
  allTemplates,
  selectedTplId,
  setSelectedTplId,
  openAddTemplate,
  openEditUser,
  handleDelete,
  openCloneBuiltin,
  openSequenceRange,
}: {
  lessonType: string;
  isLoading: boolean;
  allTemplates: MathTemplate[];
  selectedTplId: string | null;
  setSelectedTplId: (id: string) => void;
  openAddTemplate: () => void;
  openEditUser: (t: MathTemplate) => void;
  handleDelete: (id: string) => void;
  openCloneBuiltin: (t: MathTemplate) => void;
  openSequenceRange: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Ngân hàng mẫu
            {lessonType && <Badge variant="secondary">{lessonTypeLabel(lessonType)}</Badge>}
          </span>
          <Button size="sm" onClick={openAddTemplate} disabled={!lessonType}>
            <Plus className="mr-1 h-4 w-4" /> Thêm mẫu
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!lessonType ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Chọn tuần có bài học Toán để xem/ thêm mẫu.
          </p>
        ) : (
          <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {isLoading && <p className="text-xs text-muted-foreground">Đang tải mẫu…</p>}
            {allTemplates.length === 0 && !isLoading && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Chưa có mẫu cho loại bài “{lessonTypeLabel(lessonType)}”. Bấm “Thêm mẫu”.
              </p>
            )}
            {allTemplates.map((t) => {
              const isSel = selectedTplId === t.id;
              return (
                <div
                  key={t.id}
                  className={cn(
                    "cursor-pointer rounded-md border p-2 text-sm transition-colors",
                    isSel ? "border-primary bg-primary/5" : "hover:bg-accent",
                  )}
                  onClick={() => setSelectedTplId(t.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{t.text}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        {t.source === "builtin" ? (
                          <Badge variant="outline" className="text-[10px] text-amber-600">⚙️ Built-in</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-emerald-600">✏️ Custom</Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px]">{skillLabel(t.skill)}</Badge>
                        {t.formula !== "built-in" && (
                          <code className="rounded bg-muted px-1 text-[10px]">{t.formula}</code>
                        )}
                        {t.condition && (
                          <code className="rounded bg-amber-100 px-1 text-[10px] text-amber-700">{t.condition}</code>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                      {t.source === "user" ? (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Sửa" onClick={() => openEditUser(t)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Xoá" onClick={() => handleDelete(t.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </>
                      ) : t.formula !== "built-in" ? (
                        <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-[11px]" title="Sửa (tạo bản sao)" onClick={() => openCloneBuiltin(t)}>
                          <Pencil className="h-3.5 w-3.5" /> Sửa
                        </Button>
                      ) : (
                        t.id === "TPL_SEQ_01" && (
                          <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-[11px]" title="Sửa range (start/step)" onClick={openSequenceRange}>
                            <Pencil className="h-3.5 w-3.5" /> Sửa
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
