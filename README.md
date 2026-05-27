# FPTU Club Management System (FCMS)

---

## 1. Thông tin dự án

| Hạng mục      | Chi tiết                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------ |
| **Môn học**   | SWP391 - Application Development Project                                                   |
| **Mã đề tài** | SU26SWP11                                                                                  |
| **Học kỳ**    | Summer 2026                                                                                |
| **Chủ đề**    | Hệ thống quản lý Câu lạc bộ sinh viên tại Đại học FPT TP.HCM (FPTU Club Management System) |

**Mục tiêu:** Xây dựng hệ thống phần mềm **tập trung hóa** dữ liệu và quản lý toàn diện Câu lạc bộ (CLB) sinh viên, do phòng **IC-PDP** (Phát triển Sinh viên) vận hành. Giải quyết triệt để các bài toán thực tế: thông tin CLB phân tán trên nhiều nền tảng (Facebook, Messenger, Discord, file rời), thiếu cơ chế lifecycle thành viên theo học kỳ, luồng đề xuất – phê duyệt sự kiện thủ công thiếu minh bạch, thất thoát tri thức bàn giao giữa các thế hệ BĐH, và thiếu công cụ tra cứu thông minh hỗ trợ ra quyết định.

**Mô hình kiến trúc:** Hybrid Monolithic Architecture (Kết hợp Server-Side Rendering và RESTful API).

- Tuân thủ kiến trúc Multi-layer: `Controller → Service → Repository (DAO)`.
- Giao diện render bằng **Thymeleaf**, kết hợp **AJAX/Fetch API** gọi REST APIs để xử lý các tác vụ Real-time (Notification, Leaderboard Dashboard) và Validation (Tuyển dụng, Check-in sự kiện) mà không cần reload trang.
- Phân quyền động **(RBAC)** theo cặp `(User × Semester × Role)`, xác thực qua **Google OAuth2** giới hạn domain `@fpt.edu.vn`.

---

## 2. Công nghệ và Công cụ sử dụng

| Phân loại               | Công nghệ / Công cụ                                                                        | Vai trò trong dự án                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Back-end Core**       | Java 21, Spring Boot 3.3.0 (Spring Web, Spring MVC, Spring Security)                       | Nền tảng xây dựng REST API, xử lý nghiệp vụ và phân quyền hệ thống.                                                                                                                           |
| **Authentication**      | Spring Security OAuth2 Client (Google SSO `@fpt.edu.vn`)                                   | Xác thực đăng nhập duy nhất qua tài khoản Google FPT, không lưu mật khẩu nội bộ.                                                                                                              |
| **Database & ORM**      | **Microsoft SQL Server** + **Spring Data JPA / Hibernate**                                 | Cam kết tuân thủ nghiêm ngặt chuẩn hóa **3NF** với quy mô **16 bảng dữ liệu**. Quản lý Object-Relational Mapping (ORM) và đảm bảo tính toàn vẹn của Transaction (ACID) cho 39 Business Rules. |
| **Front-end & UI**      | **Thymeleaf** (Template Engine) + **TailwindCSS** (CDN) + **JavaScript** thuần (Fetch API) | Thymeleaf phục vụ cơ chế Server-Side Rendering (SSR). TailwindCSS kết hợp JavaScript thuần để xử lý DOM, xây dựng Form/Table tương tác động và gọi REST API.                                  |
| **Giao tiếp Real-time** | **WebSocket** (STOMP Protocol)                                                             | Truyền tải dữ liệu thời gian thực: thông báo phê duyệt sự kiện, cập nhật trạng thái tuyển dụng, push notification cho Leader/IC-PDP.                                                          |
| **AI Integration**      | **Google Gemini API** + SQL Server **Full-Text Search**                                    | Xây dựng RAG Chatbot tra cứu tài liệu bàn giao & quy chế CLB. Phân quyền tài liệu AI theo scope (Public / Club Internal). Guardrail: fallback tự động khi confidence < 70%.                   |
| **Quản lý Task**        | **Jira**                                                                                   | Theo dõi tiến độ công việc (Sprint/Kanban Boards), phân chia Task và quản lý lỗi (Issue/Bug Tracking).                                                                                        |
| **Quản lý Source Code** | **GitHub**                                                                                 | Quản lý phiên bản mã nguồn (Version Control), lưu trữ Repository tập trung và hỗ trợ cộng tác nhóm hiệu quả thông qua các quy trình Branching, Pull Request và Code Review.                   |
| **Công cụ thiết kế**    | **Replit AI**                                                                              | Ứng dụng AI để gen Prototype (UI/UX) nhanh chóng, bám sát định hướng AI-Augmented Development.                                                                                                |
| **Tài liệu kỹ thuật**   | **Draw.io / Visual Paradigm**                                                              | Phục vụ vẽ tài liệu SDS (Use Case Diagram, Class Diagram, Sequence Diagram, ERD).                                                                                                             |

---

## 3. Thành viên nhóm & Phân chia vai trò (Feature-Based)

| MSSV       | Họ và Tên                | Vai trò chính                   | Trách nhiệm cốt lõi trong dự án (Dự kiến)                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SE**\_\_** | **\*\***\_\_\_\_**\*\*** | **Project Leader / Full-stack** | - Thiết lập kiến trúc Spring Boot, cấu hình JPA/Hibernate và Google OAuth2. <br> - Hiện thực hóa **Workflow 0 (Security):** Phân hệ Đăng nhập Google SSO `@fpt.edu.vn` / Phân quyền RBAC động theo học kỳ với Spring Security. <br> - Review Code, quản lý Git merge request và đảm bảo tiến độ Milestone.                                                                                 |
| SE**\_\_** | **\*\***\_\_\_\_**\*\*** | **Back-end Developer**          | - Chịu trách nhiệm thiết kế Database (ERD 16 thực thể, Chuẩn hóa 3NF, 16 bảng). <br> - Hiện thực hóa **Workflow 2 — Event & Performance:** API + Logic vòng đời sự kiện (`Draft → Pending → Approved → Reported → Closed`), phân vai EventRole, chấm điểm hiệu suất MemberPerformance và xuất Excel (Apache POI).                                                                          |
| SE192984   | Phan Bảo Duy             | **Back-end Developer**          | - Xây dựng module **Recruitment & Member Control:** Giới hạn ứng tuyển tối đa 4 CLB (BR-R01), form tuyển dụng động, đợt tuyển 15 ngày, duyệt phỏng vấn. <br> - Hiện thực hóa **Workflow 3 — Member Kick / Blacklist / ActivityLog** và cơ chế sửa ngoại lệ (Override AuditLog). <br> - Phụ trách viết tài liệu SRS (≥ 12 User Stories) và thiết kế bộ kịch bản kiểm thử (≥ 25 Test Cases). |
| SE**\_\_** | **\*\***\_\_\_\_**\*\*** | **Front-end (Thymeleaf/UI)**    | - Sử dụng **v0 AI** để gen UI HTML/CSS và tích hợp vào Thymeleaf. <br> - Xây dựng **Real-time Notification Dashboard:** Dùng JS/Fetch API gọi REST/WebSocket để cập nhật trạng thái tuyển dụng, phê duyệt sự kiện và Leaderboard thi đua. <br> - Code giao diện Public Club Directory và trang ứng tuyển CLB.                                                                              |
| SE**\_\_** | **\*\***\_\_\_\_**\*\*** | **Front-end (Thymeleaf/UI)**    | - Tối ưu hóa UI/UX form quản lý sự kiện cho Leader (Tạo Event, gán vai trò, upload báo cáo). <br> - Code giao diện **AI Chatbot** (Hỏi-đáp tài liệu CLB) và trang Knowledge Archive. <br> - Xây dựng giao diện Báo cáo KPI CLB, bảng xếp hạng thi đua (Leaderboard) và trang SystemConfig cho Admin.                       
