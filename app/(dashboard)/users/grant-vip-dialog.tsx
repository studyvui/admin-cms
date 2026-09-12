"use client";

// [PLAN.md muc 25] Dialog "Kich hoat VIP" cho mot hoc sinh — admin nhap so ngay, tao/gia
// han 1 Subscription that (khong qua VNPay/MoMo — chua co merchant that). Khac
// reset-progress-dialog.tsx: day KHONG phai hanh dong pha huy nen khong can go xac nhan.

import { useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
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

type KetQua = { id: string; endsAt: string };

export function GrantVipDialog({
  open,
  onOpenChange,
  targetUserId,
  targetUserName,
  grantVipMut,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string | null;
  targetUserName?: string | null;
  grantVipMut: UseMutationResult<KetQua, unknown, { id: string; days: number }, unknown>;
}) {
  const [days, setDays] = useState("30");
  const [ketQua, setKetQua] = useState<KetQua | null>(null);

  function handleClose(next: boolean) {
    if (!next) {
      setDays("30");
      setKetQua(null);
      grantVipMut.reset();
    }
    onOpenChange(next);
  }

  const soNgay = Number(days);
  const hopLe = Number.isInteger(soNgay) && soNgay >= 1 && soNgay <= 3650;

  async function chay() {
    if (!targetUserId || !hopLe) return;
    const ra = await grantVipMut.mutateAsync({ id: targetUserId, days: soNgay });
    setKetQua(ra);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kích hoạt VIP</DialogTitle>
          <DialogDescription>
            Học sinh: <b>{targetUserName ?? "—"}</b>
          </DialogDescription>
        </DialogHeader>

        {ketQua ? (
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-green-600">Đã kích hoạt VIP thành công.</p>
            <p>
              Hết hạn: <b>{new Date(ketQua.endsAt).toLocaleDateString("vi-VN")}</b>
            </p>
            <p className="text-muted-foreground">
              Nếu tài khoản đang có VIP còn hạn, thời gian này được CỘNG THÊM vào (không mất
              thời gian còn lại).
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Chưa tích hợp VNPay/MoMo thật — đây là thao tác kích hoạt VIP thủ công, dùng khi
              bạn đã tự thu tiền ngoài hệ thống.
            </p>
            <div className="space-y-1">
              <Label htmlFor="so-ngay-vip">Số ngày kích hoạt/gia hạn:</Label>
              <Input
                id="so-ngay-vip"
                type="number"
                min={1}
                max={3650}
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </div>
            {grantVipMut.isError && (
              <p className="text-destructive">{extractError(grantVipMut.error)}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            {ketQua ? "Đóng" : "Huỷ"}
          </Button>
          {!ketQua && (
            <Button disabled={!hopLe || grantVipMut.isPending} onClick={chay}>
              {grantVipMut.isPending ? "Đang kích hoạt…" : "Kích hoạt VIP"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
