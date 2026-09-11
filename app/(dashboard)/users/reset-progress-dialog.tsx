"use client";

// [PLAN.md muc 23 #8] Dialog "Reset tien do hoc tap" cua mot hoc sinh.
//
// Day la thao tac XOA DU LIEU va KHONG HOAN TAC DUOC: mot cu bam nham la mat toan bo tien
// do hoc cua mot dua tre. Vi vay nut chi bat khi admin go DUNG email hoc sinh — cung co che
// GitHub dung cho thao tac xoa repo.
//
// Cung nguyen tac voi reset-password-dialog.tsx: moi duong dong di qua handleClose() duy
// nhat (reset form + reset loi mutation cu), vi Radix Dialog khong unmount giua cac lan mo.

import { useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { coPhepResetTienDo, moTaResetTienDo } from "@/lib/users/reset-progress";
import { extractError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type KetQua = {
  id: string;
  deleted: { progress: number; answerLog: number; reviewQueueItem: number; userBossProgress: number };
  progressResetAt: string;
};

export function ResetProgressDialog({
  open,
  onOpenChange,
  targetUserId,
  targetUserEmail,
  targetUserName,
  resetProgressMut,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string | null;
  targetUserEmail?: string | null;
  targetUserName?: string | null;
  resetProgressMut: UseMutationResult<KetQua, unknown, string, unknown>;
}) {
  const [daGo, setDaGo] = useState("");
  const [ketQua, setKetQua] = useState<KetQua["deleted"] | null>(null);
  const mo = moTaResetTienDo();
  const choPhep = coPhepResetTienDo(daGo, targetUserEmail);

  function handleClose(next: boolean) {
    if (!next) {
      setDaGo("");
      setKetQua(null);
      resetProgressMut.reset();
    }
    onOpenChange(next);
  }

  async function chay() {
    if (!targetUserId || !choPhep) return;
    const ra = await resetProgressMut.mutateAsync(targetUserId);
    setKetQua(ra.deleted);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-destructive">Reset tiến độ học tập</DialogTitle>
          <DialogDescription>
            Học sinh: <b>{targetUserName ?? "—"}</b> ({targetUserEmail ?? "—"})
          </DialogDescription>
        </DialogHeader>

        {ketQua ? (
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-green-600">Đã reset xong. Số dòng đã xoá:</p>
            <ul className="list-disc pl-5">
              <li>Tiến độ bài: {ketQua.progress}</li>
              <li>Lịch sử trả lời: {ketQua.answerLog}</li>
              <li>Hàng đợi ôn tập: {ketQua.reviewQueueItem}</li>
              <li>Tiến độ boss: {ketQua.userBossProgress}</li>
            </ul>
            <p className="text-muted-foreground">
              Máy của bé sẽ tự dọn dữ liệu tiến độ ở lần mở ứng dụng kế tiếp.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">Sẽ xoá:</p>
              <ul className="list-disc pl-5 text-muted-foreground">
                {mo.xoa.map((x) => <li key={x}>{x}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-semibold">Vẫn giữ nguyên:</p>
              <ul className="list-disc pl-5 text-muted-foreground">
                {mo.giu.map((x) => <li key={x}>{x}</li>)}
              </ul>
            </div>
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 font-semibold text-destructive">
              {mo.canhBao}
            </p>
            <div className="space-y-1">
              <Label htmlFor="xac-nhan-email">
                Gõ đúng email của học sinh để bật nút:
              </Label>
              <Input
                id="xac-nhan-email"
                value={daGo}
                onChange={(e) => setDaGo(e.target.value)}
                placeholder={targetUserEmail ?? ""}
                autoComplete="off"
              />
            </div>
            {resetProgressMut.isError && (
              <p className="text-destructive">{extractError(resetProgressMut.error)}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            {ketQua ? "Đóng" : "Huỷ"}
          </Button>
          {!ketQua && (
            <Button
              variant="destructive"
              disabled={!choPhep || resetProgressMut.isPending}
              onClick={chay}
            >
              {resetProgressMut.isPending ? "Đang xoá…" : "Reset tiến độ"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
