# Spec backend cần bổ sung — Quản Lý Người Dùng (Admin)

Frontend (`UserManagement.jsx` + `adminApi.js`) đang gọi 3 endpoint dưới `/api/admin/users`
nhưng backend hiện chưa có controller nào xử lý các route này (không có `AdminUserController`).
Kết quả: mọi request trả về `500 Internal Server Error` thay vì `404`, vì
`GlobalExceptionHandler.handleGenericException()` (dòng 131) ép mọi exception không xác định
về mã 500 — kể cả lỗi "route không tồn tại" của Spring MVC.

## 1. GET /api/admin/users

- Quyền: `@PreAuthorize("hasRole('Admin')")`.
- Trả danh sách toàn bộ user (không phân trang cũng được vì FE tự filter/search client-side
  qua `useMemo`, nhưng nên loại `isDeleted = true`).
- Response — mảng object, field name phải khớp đúng với `UserAccount` entity vì FE đọc trực tiếp
  (`u.userID`, `u.fullName`, `u.email`, `u.major`, `u.roleID`, `u.accountStatus`, `u.createdAt`):

```json
[
  {
    "userID": 12,
    "fullName": "Nguyễn Văn A",
    "email": "a@fpt.edu.vn",
    "major": "Software Engineering",
    "roleID": 3,
    "accountStatus": "Active",
    "createdAt": "2026-01-10T08:00:00"
  }
]
```

- `roleID` map ở FE: `{1: "Admin", 2: "ICPDP", 3: "Sinh viên"}` — cần đảm bảo giá trị `roleID`
  trả về đúng 3 role đó.
- `accountStatus` FE chỉ so sánh 2 giá trị chuỗi: `"Active"` / `"Suspended"` — dùng đúng chính tả
  này (case-sensitive).
- **Không** trả field `password`.

## 2. PUT /api/admin/users/{userID}/suspend

- Quyền: `@PreAuthorize("hasRole('Admin')")`.
- Set `accountStatus = "Suspended"` cho user có `userID` tương ứng.
- Nên chặn admin tự suspend chính mình, và chặn suspend user đã `isDeleted = true`.
- Response 200, body tối thiểu `{ "message": "..." }` (FE không đọc field cụ thể ngoài
  bắt lỗi qua `err.response.data.message`).
- Lỗi (vd không tìm thấy user) → ném `BusinessRuleException` để trả đúng message qua
  `GlobalExceptionHandler` — FE hiển thị thẳng message này trong toast.

## 3. PUT /api/admin/users/{userID}/activate

- Tương tự suspend, set `accountStatus = "Active"`.

## Ghi chú thêm

- Trường "Kỷ luật" (tab Quản lý Kỷ luật trong drawer chi tiết user) hiện đang dùng
  **mockdata hoàn toàn ở FE** (`disciplinesMap` state cục bộ, không gọi API) — không nằm
  trong phạm vi spec này, chưa cần backend.
