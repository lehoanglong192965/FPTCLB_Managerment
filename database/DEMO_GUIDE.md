# FCMS demo data guide

## Cách nạp dữ liệu

1. Tạo database `FPTUCLUB` và chạy backend ít nhất một lần để Flyway/Hibernate hoàn thiện schema.
2. Mở SQL Server Management Studio, chọn đúng database `FPTUCLUB`.
3. Chạy `database/demo_data.sql`. Script có transaction và có thể chạy lại mà không nhân đôi dữ liệu.
4. Khởi động lại backend, đăng nhập bằng các tài khoản bên dưới.

> Dữ liệu này dành riêng cho môi trường demo/local. Không chạy trên production.

## Tài khoản trình diễn

Mật khẩu chung: `password`

| Vai trò | Email | Luồng nên trình diễn |
|---|---|---|
| Admin | `admin.fcms@fpt.edu.vn` | Người dùng, học kỳ, cấu hình hệ thống |
| IC-PDP | `icpdp.fcms@fpt.edu.vn` | Duyệt sự kiện, CLB, KPI và báo cáo |
| Chủ nhiệm FCODE | `leader.fcode@fpt.edu.vn` | Thành viên, tuyển quân, sự kiện, điểm danh, đóng góp |
| Phó chủ nhiệm FCODE | `vice.fcode@fpt.edu.vn` | Quản lý CLB và hỗ trợ sự kiện |
| Thành viên | `member.an@fpt.edu.vn` | Đăng ký sự kiện, CLB của tôi, đóng góp |
| Ứng viên | `candidate.mai@fpt.edu.vn` | Hồ sơ ứng tuyển và lịch sử đăng ký |

## Kịch bản dữ liệu đã chuẩn bị

- Hai CLB có định hướng khác nhau để trang danh sách và bộ lọc không bị đơn điệu.
- Một hồ sơ ứng tuyển có phần giới thiệu, câu trả lời và nhận xét AI rõ nghĩa.
- Một sự kiện đã đóng, có đăng ký, điểm danh và báo cáo được duyệt.
- Một hackathon đang mở đăng ký để demo luồng sinh viên đăng ký.
- Một talkshow đang chờ IC-PDP phê duyệt để demo workflow.
- KPI của hai CLB khác nhau để dashboard có dữ liệu so sánh.

## Checklist trước giờ chấm

- Chạy script trên bản backup database dùng để chấm và kiểm tra thông báo `FCMS demo data loaded successfully`.
- Đăng nhập thử đủ Admin, IC-PDP, Leader và Member.
- Kiểm tra ngày sự kiện vì script dùng ngày tương đối theo thời điểm chạy.
- Không tạo thêm bản ghi tên `test`, `abc`, `demo 1`, email giả hoặc mô tả một dòng.
- Xóa/ẩn các tài khoản và dữ liệu thử cũ không thuộc bộ seed sau khi đã backup.
- Không trình diễn đường dẫn báo cáo mẫu nếu chức năng yêu cầu tải file thật; hãy tải một PDF báo cáo hoàn chỉnh trước buổi chấm.
