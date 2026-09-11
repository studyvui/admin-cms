// [PLAN.md muc 23 #8] Reset tien do hoc tap cua hoc sinh — logic THUAN cua cong xac nhan.
//
// Day la thao tac XOA DU LIEU va KHONG HOAN TAC DUOC: mot cu bam nham la mat toan bo tien
// do hoc cua mot dua tre. Vi vay nut chi duoc bat khi admin go DUNG email hoc sinh — cung
// co che GitHub dung cho thao tac xoa repo.
//
// Tach ra file rieng (khong nhet trong component) de unit test duoc — dung quy uoc
// lib/**/__tests__ cua repo nay.

/** Admin da go dung email hoc sinh chua? Bo qua khoang trang thua va HOA/thuong. */
export function coPhepResetTienDo(daGo: string, emailMucTieu?: string | null): boolean {
  const muc = (emailMucTieu ?? "").trim().toLowerCase();
  if (!muc) return false; // chua biet xoa cua ai -> TUYET DOI khong bat nut
  return daGo.trim().toLowerCase() === muc;
}

/**
 * Noi dung hop thoai. Phai noi ro CA HAI phia — xoa gi va GIU gi: neu chi liet ke phan xoa,
 * admin de tuong thao tac nay xoa sach tai khoan va khong dam bam.
 */
export function moTaResetTienDo(): { xoa: string[]; giu: string[]; canhBao: string } {
  return {
    xoa: [
      "Sao và mức thành thạo của từng bài",
      "Lịch sử trả lời các câu hỏi",
      "Hàng đợi ôn tập (nhắc ôn từ đã học)",
      "Tiến độ các màn boss",
    ],
    giu: [
      "Xu, cấp độ, chuỗi ngày học",
      "Huy hiệu và thành tựu đã đạt",
      "Vật phẩm trong kho",
      "Tài khoản, hồ sơ, lớp — bé vẫn đăng nhập bình thường",
    ],
    canhBao:
      "Thao tác này KHÔNG hoàn tác được. Bé sẽ học lại từ đầu trên mọi thiết bị đang dùng.",
  };
}
