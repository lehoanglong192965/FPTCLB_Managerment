# 🎓 FPTU Club Management System (FCMS)

> Hệ thống quản lý Câu lạc bộ sinh viên tại Đại học FPT TP.HCM
> SWP391 – Application Development Project | Summer 2026

---

# 📌 Giới thiệu dự án

**FPTU Club Management System (FCMS)** là nền tảng quản lý tập trung dành cho các Câu lạc bộ sinh viên tại Đại học FPT TP.HCM, được vận hành bởi phòng **IC-PDP (Phát triển Sinh viên)**.

Hệ thống được xây dựng nhằm giải quyết các vấn đề thực tế:

* Dữ liệu CLB phân tán trên nhiều nền tảng (Facebook, Messenger, Discord, file rời)
* Thiếu cơ chế quản lý vòng đời thành viên theo học kỳ
* Quy trình đề xuất & phê duyệt sự kiện thủ công, thiếu minh bạch
* Thất thoát tri thức giữa các thế hệ Ban Điều Hành
* Thiếu hệ thống hỗ trợ tra cứu thông minh và Dashboard quản trị

---

# 🏗️ Kiến trúc hệ thống

## 🔹 Mô hình kiến trúc

* **Decoupled Architecture**
* Front-end và Back-end phát triển độc lập
* Giao tiếp thông qua RESTful API

---

## 🔹 Kiến trúc Back-end

```text
Controller
   ↓
Service
   ↓
Repository / DAO
```

* Multi-layer Architecture
* Xử lý Business Logic tập trung
* Bảo mật bằng Spring Security + JWT

---

## 🔹 Kiến trúc Front-end

* Component-Based Architecture
* React Hooks
* Context API / Redux
* React Router

---

## 🔹 Cơ chế hoạt động

* Client-Side Rendering (CSR)
* Axios gọi REST APIs
* WebSocket xử lý dữ liệu Realtime
* Không reload trang khi thao tác dữ liệu

---

# 🔐 Authentication & Authorization

## Công nghệ sử dụng

* Google OAuth2
* JWT Token
* Spring Security Resource Server
* RBAC động theo:

```text
(User × Semester × Role)
```

## Kiểm soát bảo mật

### Front-end

* Route Guard
* Protected Routes
* Token Validation

### Back-end

* Method Security
* JWT Verification
* Dynamic RBAC Authorization

---

# ⚙️ Công nghệ sử dụng

| Category          | Technology                   |
| ----------------- | ---------------------------- |
| Back-end          | Java 21, Spring Boot 3.3.0   |
| Security          | Spring Security OAuth2 + JWT |
| Database          | Microsoft SQL Server         |
| ORM               | Spring Data JPA / Hibernate  |
| Front-end         | ReactJS + TailwindCSS        |
| API Communication | Axios / Fetch API            |
| Realtime          | WebSocket (STOMP)            |
| AI Integration    | Google Gemini API            |
| Search Engine     | SQL Server Full-Text Search  |
| Task Management   | Jira                         |
| Version Control   | GitHub                       |
| Design Tool       | Replit AI / v0 AI            |
| Documentation     | Draw.io / Visual Paradigm    |

---

# 🧠 AI Integration

Hệ thống tích hợp **RAG Chatbot** sử dụng:

* Google Gemini API
* SQL Server Full-Text Search

## Tính năng AI

* Tra cứu tài liệu CLB
* Hỏi đáp quy chế
* Tìm kiếm tài liệu bàn giao
* Render Markdown Response
* Guardrail fallback khi confidence < 70%

---

# 📊 Chức năng chính

## 👤 User & Authentication

* Đăng nhập Google SSO
* JWT Authentication
* RBAC động theo học kỳ

---

## 🏛️ Club Management

* Quản lý CLB
* Quản lý thành viên
* Lifecycle thành viên

---

## 🎯 Recruitment System

* Form tuyển dụng động
* Giới hạn tối đa 4 CLB ứng tuyển
* Theo dõi trạng thái tuyển dụng
* Quản lý phỏng vấn

---

## 📅 Event Management

* Tạo & quản lý sự kiện
* Workflow phê duyệt:

```text
Draft → Pending → Approved → Reported → Closed
```

* Upload báo cáo
* Phân vai EventRole

---

## 📈 KPI & Leaderboard

* Dashboard KPI
* Member Performance
* Club Ranking
* Realtime Leaderboard

---

## 🔔 Notification System

* Push Notification realtime
* WebSocket communication
* Event Approval Notification
* Recruitment Status Notification

---

## 📚 Knowledge Archive

* Lưu trữ tài liệu CLB
* Quản lý bàn giao
* Tra cứu thông minh

---

# 🗂️ Cấu trúc Repository

## Back-end Repository

```bash
fcms-backend/
├── src/main/java
├── controller
├── service
├── repository
├── entity
├── security
├── websocket
└── config
```

---

## Front-end Repository

```bash
fcms-frontend/
├── src/
├── components/
├── pages/
├── services/
├── routes/
├── contexts/
├── hooks/
└── layouts/
```

---

# 🗄️ Database Design

## Thông tin Database

* Microsoft SQL Server
* Chuẩn hóa 3NF
* 19 bảng dữ liệu
* Hỗ trợ ACID Transaction
* 50 Business Rules

---

# 👥 Thành viên nhóm

| MSSV     | Họ và Tên         | Vai trò                     |
| -------- | ----------------- | --------------------------- |
| SE192965 | Lê Hoàng Long     | Project Leader / Back-end Developer |
| SE190688 | Trần Văn An       | Back-end Developer          |
| SE192984 | Phan Bảo Duy      | Back-end Developer          |
| SE192612 | Nguyễn Văn Linh   | Front-end Developer         |
| SE190630 | Đặng Minh Bình An | Front-end Developer         |

---

# 🚀 Phân công công việc

## 🔹 Lê Hoàng Long

* Thiết lập kiến trúc hệ thống
* Google OAuth2 + JWT Security
* Dynamic RBAC
* Code Review & Git Management

---

## 🔹 Trần Văn An

* Thiết kế Database
* Event Workflow APIs
* KPI & Excel Export

---

## 🔹 Phan Bảo Duy

* Recruitment APIs
* Member Control
* Audit Log
* SRS & Test Case

---

## 🔹 Nguyễn Văn Linh

* ReactJS Project Structure
* Public Club Directory
* Recruitment UI
* Notification Dashboard

---

## 🔹 Đặng Minh Bình An

* Event Management UI
* AI Chatbot UI
* KPI Dashboard
* System Config UI

---

# 🧪 Business Rules

## Ví dụ nghiệp vụ

* Một sinh viên chỉ được ứng tuyển tối đa 4 CLB
* Event phải được duyệt trước khi triển khai
* Chỉ Leader/Admin mới được phê duyệt Event
* RBAC thay đổi theo từng học kỳ
* Blacklist member theo phạm vi CLB

---

# 📡 Realtime Features

## WebSocket Features

* Event Approval Notification
* Recruitment Updates
* Leaderboard Updates
* System Broadcast Notification

---

# 🛠️ Development Workflow

## Git Flow

```bash
main
 ├── develop
 │    ├── feature/backend
 │    ├── feature/frontend
 │    └── feature/security
```

## Quy trình làm việc

1. Tạo feature branch
2. Code & Commit
3. Push branch lên GitHub
4. Tạo Pull Request
5. Code Review
6. Merge vào develop
7. Release lên main

---

# 🎯 Mục tiêu dự án

* Chuẩn hóa quản lý CLB sinh viên
* Tăng tính minh bạch quy trình vận hành
* Hỗ trợ chuyển giao tri thức
* Tích hợp AI hỗ trợ tra cứu thông minh
* Xây dựng hệ thống realtime hiện đại

---

# 📄 License

Project developed for educational purposes at
**FPT University Ho Chi Minh City – SWP391**

---

# 🌟 FCMS

> Modern AI-Augmented Student Club Management Platform
