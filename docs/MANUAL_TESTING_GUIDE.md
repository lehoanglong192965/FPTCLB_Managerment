# Hướng dẫn Kiểm thử Thủ công (Browser & Swagger)

Tài liệu này cung cấp hướng dẫn từng bước để kiểm thử thủ công phân hệ **Đăng ký Thành lập Câu lạc bộ** trên Trình duyệt (giao diện người dùng) và qua Swagger UI (kiểm thử API).

---

## LƯU Ý QUAN TRỌNG: CÁCH RESET DATA ĐỂ KIỂM THỬ LẠI NHIỀU LẦN

Khi bạn chạy **E2E Playwright tests** hoặc đã thực hiện thành công quy trình duyệt đơn ở Bước 3, hệ thống sẽ kích hoạt CLB và gán email `lehoanglong19062005@gmail.com` làm **Trưởng CLB (Club Leader)** trong học kỳ hiện tại. Do đó:
* Lần đăng nhập tiếp theo của tài khoản này sẽ tự động chuyển hướng đến `/club-leader`.
* Menu bên trái sẽ không hiển thị mục **Đăng ký thành lập CLB** (vì Trưởng CLB không được phép đăng ký thêm CLB mới).

**Để reset tài khoản này về trạng thái sinh viên bình thường (Member) để kiểm thử lại:**
Hãy chạy các lệnh SQL sau trong SQL Server (SSMS hoặc qua tool chạy lệnh):
```sql
USE FPTUCLUB;
GO
SET QUOTED_IDENTIFIER ON;

-- 1. Soft-delete quyền Leader hiện tại của Long trong kỳ hiện tại
UPDATE ClubMembership SET isDeleted = 1 WHERE userID = 5;

-- 2. Soft-delete các đơn đăng ký mẫu đã nộp của Long
UPDATE ClubRegistration SET isDeleted = 1 WHERE leaderEmail = 'lehoanglong19062005@gmail.com';
GO
```
Sau khi chạy xong lệnh trên, bạn đăng nhập lại sẽ thấy tài khoản quay lại vai trò **Thành viên (Member)** và hiển thị nút **Đăng ký thành lập CLB** trên menu bên trái như bình thường.

---

## PHẦN 1: KIỂM THỬ TRÊN TRÌNH DUYỆT (BROWSER)

### Cấu hình môi trường:
* **Frontend URL:** `http://localhost:5173`
* **Backend URL:** `http://localhost:8080`

---

### Bước 1: Kiểm thử Đăng nhập & Đăng xuất

#### 1.1. Tài khoản Sinh viên (Student)
1. Mở trình duyệt, truy cập `http://localhost:5173/login`.
2. Nhập thông tin đăng nhập:
   * **Email:** `lehoanglong19062005@gmail.com`
   * **Mật khẩu:** `Password123`
3. Nhấn nút **Đăng nhập**.
4. **Kết quả mong muốn:**
   * Trình duyệt chuyển hướng thành công đến Dashboard của sinh viên tại địa chỉ `http://localhost:5173/member`.
   * Menu sidebar hiển thị các mục dành cho sinh viên (ví dụ: *Câu lạc bộ*, *Sự kiện*, *Đăng ký thành lập CLB*).
5. Để chuẩn bị cho bước sau, nhấn nút **Đăng xuất** ở dưới cùng sidebar để quay lại trang đăng nhập.

#### 1.2. Tài khoản Cán bộ (IC-PDP Manager)
1. Truy cập lại trang `http://localhost:5173/login`.
2. Nhập thông tin đăng nhập:
   * **Email:** `pdp.manager@fpt.edu.vn`
   * **Mật khẩu:** `Password123`
3. Nhấn nút **Đăng nhập**.
4. **Kết quả mong muốn:**
   * Trình duyệt chuyển hướng thành công đến Dashboard của ICPDP tại địa chỉ `http://localhost:5173/icpdp`.
   * Menu sidebar hiển thị các mục quản lý của ICPDP (ví dụ: *Quản lý CLB*, *Duyệt đăng ký CLB*, *Phê duyệt sự kiện*).
5. Nhấn **Đăng xuất** để quay về trang đăng nhập.

---

### Bước 2: Sinh viên điền Đơn đăng ký thành lập CLB

1. Đăng nhập lại bằng tài khoản Sinh viên (`lehoanglong19062005@gmail.com` / `Password123`).
2. Trên menu bên trái, chọn mục **Đăng ký thành lập CLB** (hoặc truy cập trực tiếp `http://localhost:5173/member/club-register`).
3. **Bước 1: Thông tin chung**:
   * **Tên CLB (Tiếng Việt):** Nhập tên mong muốn (ví dụ: `CLB Nghệ Thuật FPTU`)
   * **Mã viết tắt (Code):** Nhập mã viết tắt viết hoa không cách (ví dụ: `FART`)
   * **Lĩnh vực hoạt động:** Chọn một lĩnh vực trong dropdown (ví dụ: `Art`)
   * **Sứ mệnh & Mục tiêu:** Nhập mục tiêu hoạt động của CLB.
   * **Điểm khác biệt:** Nhập lý do trường cần CLB này.
   * Nhấn **Tiếp tục**.
4. **Bước 2: Đội ngũ sáng lập**:
   * **Chủ nhiệm (Leader):**
     * Nhập MSSV: `SE123456`
     * *Hệ thống sẽ tự động điền họ tên "Hoàng Long" và email của bạn.*
     * Nhập số điện thoại liên hệ bất kỳ.
     * Click vào vùng ảnh minh chứng và tải lên một file ảnh thẻ sinh viên hợp lệ.
   * **Phó chủ nhiệm (Vice Leader):**
     * Nhập MSSV: `SE170001`
     * *Hệ thống tự động điền tên "Nguyễn Văn Một".*
     * Nhập số điện thoại và tải lên ảnh thẻ sinh viên minh chứng.
   * **Thành viên sáng lập (Founding Members):**
     * Thành viên #1: Nhập `SE170002` (tự động điền "Nguyễn Văn Hai") và nhập số điện thoại.
     * Thành viên #2: Nhập `SE170003` (tự động điền "Nguyễn Văn Ba") và nhập số điện thoại.
     * Thành viên #3: Nhập `SE170004` (tự động điền "Nguyễn Văn Bốn") và nhập số điện thoại.
     * *(Kiểm tra nhập MSSV sai hoặc chưa có tài khoản sẽ báo lỗi đỏ trực quan ngay lập tức).*
   * Nhấn **Tiếp tục**.
5. **Bước 3: Phương án hoạt động & Tài chính**:
   * Nhập sơ đồ tổ chức (ví dụ: ban truyền thông, ban hậu cần).
   * Chọn tần suất sinh hoạt định kỳ.
   * Chọn địa điểm sinh hoạt.
   * Nhập phương án tài chính (ví dụ: thu quỹ thành viên).
   * Nhấn **Gửi đơn đăng ký**.
6. **Kết quả mong muốn:**
   * Màn hình chuyển sang trạng thái nộp đơn thành công kèm dấu tích xanh: **"Nộp Đơn Đăng Ký Thành Công!"**.
7. Chọn mục **Lịch sử đăng ký** (hoặc truy cập `http://localhost:5173/member/club-register-history`).
   * **Kết quả mong muốn:** Đơn đăng ký vừa tạo hiển thị trong danh sách bên trái với trạng thái màu vàng **"Chờ duyệt"**. Click vào đơn sẽ xem được timeline chi tiết của đơn.

---

### Bước 3: ICPDP phê duyệt đơn và kích hoạt câu lạc bộ

1. Đăng xuất tài khoản sinh viên.
2. Đăng nhập bằng tài khoản ICPDP (`pdp.manager@fpt.edu.vn` / `Password123`).
3. Chọn mục **Duyệt Đăng Ký CLB** (hoặc truy cập `http://localhost:5173/icpdp/club-requests`).
4. **Kết quả mong muốn:**
   * Danh sách bên trái hiển thị đơn đề xuất của `CLB Nghệ Thuật FPTU` ở trạng thái chờ duyệt.
5. Click chọn đơn đăng ký này trong danh sách:
   * **Cột giữa (Chi tiết hồ sơ):** Hiển thị toàn bộ thông tin đã điền của CLB, thông tin cá nhân kèm ảnh thẻ sinh viên đã upload của Leader và Vice Leader, danh sách thành viên cốt lõi.
   * **Cột phải (Kiểm định & Tác vụ):** Hiển thị kết quả quét tự động của hệ thống (MSSV hợp lệ, không ai tham gia quá 4 CLB trong học kỳ hiện tại).
6. Viết nhận xét vào phần **Nhận xét hoặc Lý do từ chối duyệt**.
7. Click chọn nút màu xanh **Duyệt & Kích hoạt CLB**.
8. **Kết quả mong muốn:**
   * Thông báo Toast màu xanh hiển thị thành công: *"Đã phê duyệt và kích hoạt câu lạc bộ thành công!"*.
   * Đơn đăng ký biến mất khỏi danh sách chờ duyệt.
9. Click sang mục **Quản Lý CLB** ở menu bên trái (hoặc truy cập `http://localhost:5173/icpdp/club-management`).
   * **Kết quả mong muốn:** Câu lạc bộ mới tạo hiển thị trong danh sách với trạng thái **Active** (Hoạt động).

---
---

## PHẦN 2: KIỂM THỬ TRÊN SWAGGER UI (API)

### Địa chỉ Swagger UI:
Truy cập `http://localhost:8080/swagger-ui/index.html` trên trình duyệt.

---

### Bước 1: Đăng nhập lấy JWT Token

1. Tìm nhóm API `/api/auth` trong danh sách Swagger.
2. Mở endpoint `POST /api/auth/login`.
3. Nhấp nút **Try it out** ở góc phải và nhập dữ liệu JSON:
   ```json
   {
     "email": "lehoanglong19062005@gmail.com",
     "password": "Password123"
   }
   ```
4. Nhấp nút **Execute**.
5. **Kết quả mong muốn:**
   * Response Status: `200 OK`
   * Response Body chứa trường `token` dạng JWT string. Hãy sao chép chuỗi token này (bỏ dấu ngoặc kép).
6. Ở góc trên cùng bên phải trang Swagger, nhấp nút **Authorize**.
7. Nhập vào ô Value: `Bearer <chuỗi_token_vừa_copy>` (Ví dụ: `Bearer eyJhbGciOi...`) và nhấn **Authorize**, sau đó nhấn **Close**.

---

### Bước 2: Nộp đơn đăng ký thành lập (Dưới quyền Sinh viên)

1. Tìm nhóm API `/api/clubs/registrations`.
2. Mở endpoint `POST /api/clubs/registrations` (Submit Registration).
3. Chọn **Try it out** và điền Request Body mẫu:
   ```json
   {
     "clubCode": "SWAGGERCLUB",
     "clubName": "CLB Test Swagger",
     "clubNameEn": "Swagger Test Club",
     "category": "IT",
     "description": "Short description test",
     "mission": "Detailed mission test",
     "uniqueness": "Uniqueness reason test",
     "orgStructure": "Media: 5 members, Logistics: 5 members",
     "meetingFrequency": "1 lần / tuần",
     "meetingLocation": "Phòng học trống của trường",
     "financialPlan": "Thu quỹ định kỳ học kỳ",
     "leaderStudentId": "SE123456",
     "leaderName": "Hoàng Long",
     "leaderEmail": "lehoanglong19062005@gmail.com",
     "leaderPhone": "0987654321",
     "leaderCardImage": "/api/uploads/dummy.png",
     "viceLeaderStudentId": "SE170001",
     "viceLeaderName": "Nguyễn Văn Một",
     "viceLeaderEmail": "member1@fpt.edu.vn",
     "viceLeaderPhone": "0987654322",
     "viceLeaderCardImage": "/api/uploads/dummy.png",
     "foundingMembers": [
       {
         "studentId": "SE170002",
         "fullName": "Nguyễn Văn Hai",
         "email": "member2@fpt.edu.vn",
         "phoneNumber": "0987654323",
         "cardImage": "/api/uploads/dummy.png"
       },
       {
         "studentId": "SE170003",
         "fullName": "Nguyễn Văn Ba",
         "email": "member3@fpt.edu.vn",
         "phoneNumber": "0987654324",
         "cardImage": "/api/uploads/dummy.png"
       },
       {
         "studentId": "SE170004",
         "fullName": "Nguyễn Văn Bốn",
         "email": "member4@fpt.edu.vn",
         "phoneNumber": "0987654325",
         "cardImage": "/api/uploads/dummy.png"
       }
     ]
   }
   ```
4. Nhấn **Execute**.
5. **Kết quả mong muốn:**
   * Response Status: `201 Created`
   * Response Body trả về thông tin đơn đăng ký có chứa số `registrationID` (Ví dụ: `registrationID: 5`) và trạng thái `"status": "PENDING"`.

---

### Bước 3: Xem danh sách chờ duyệt (Đăng nhập ICPDP)

1. Nhấp lại nút **Authorize** ở góc trên cùng, nhấn **Logout** để xóa token sinh viên cũ.
2. Gọi lại API `POST /api/auth/login` với tài khoản ICPDP:
   ```json
   {
     "email": "pdp.manager@fpt.edu.vn",
     "password": "Password123"
   }
   ```
3. Copy chuỗi token mới nhận được.
4. Nhấn nút **Authorize**, nhập: `Bearer <token_mới>` và nhấn **Authorize**.
5. Tìm endpoint `GET /api/clubs/registrations/pending` (Danh sách đơn chờ duyệt).
6. Nhấp **Try it out** -> **Execute**.
7. **Kết quả mong muốn:**
   * Response Status: `200 OK`
   * Trả về mảng JSON chứa các đơn đăng ký đang có trạng thái `PENDING` (trong đó có đơn `SWAGGERCLUB` vừa nộp ở bước trước).

---

### Bước 4: Duyệt & Kích hoạt câu lạc bộ (Dưới quyền ICPDP)

1. Mở endpoint `PUT /api/clubs/registrations/{id}/review`.
2. Chọn **Try it out**.
3. Điền tham số:
   * **id:** Số `registrationID` của đơn vừa nộp ở Bước 2 (Ví dụ: `5`).
   * **Request Body:**
     ```json
     {
       "status": "APPROVED",
       "icpdpComment": "Approved via Swagger UI API verification."
     }
     ```
4. Nhấn **Execute**.
5. **Kết quả mong muốn:**
   * Response Status: `200 OK`
   * Trả về thông tin đơn đăng ký cập nhật trạng thái `"status": "APPROVED"`.
   * Ở phía DB, câu lạc bộ mới `SWAGGERCLUB` đã được tạo trong bảng `Club` ở trạng thái `"Active"` và các vai trò ban điều hành học kỳ hiện tại đã được thêm vào `ClubMembership`.
