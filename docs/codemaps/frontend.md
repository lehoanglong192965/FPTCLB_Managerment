<!-- Generated: 2026-06-08 | Files scanned: ~40 | Token estimate: ~600 -->

# Bản đồ cấu trúc Frontend

## Cấu trúc Thư mục Tính năng (Feature-based)
`src/features/`
- `/auth`: LoginPage, RegisterPage, OAuthRedirect, VerifyOTP.
- `/landing`: LandingPage (Trang chủ công khai).
- `/clubs`: ClubListPage, ClubDetailPage (Tìm kiếm CLB).
- `/events`: EventListPage, EventDetailPage (Tìm kiếm Sự kiện).
- `/icpdp`: Dashboard ICPDP Overview.
- `/admin`: SemesterManagement, UserManagement.
- `/clubLeader`: ClubOverview, ClubMemberMgmt, ClubEventsMgmt.
- `/member`: MemberHome, MemberClubs, MemberEvents.

## Route Map (`src/routes/index.jsx`)
- `/` → `LandingPage`
- `/login` → `LoginPage`
- `/register` → `RegisterPage`
- `/oauth2/redirect` → `OAuthRedirect`
- `/admin/*` → `DashboardLayout` + `Admin Pages`
- `/icpdp/*` → `DashboardLayout` + `ICPDP Pages`
- `/club-leader/*` → `DashboardLayout` + `Leader Pages`
- `/member/*` → `DashboardLayout` + `Member Pages`

## Quản lý Trạng thái (State Management)
- Dùng `AuthContext` (React Context API) để lưu trữ thông tin User đã đăng nhập.
- `TokenService` (trong Axios interceptors) để quản lý access token từ `localStorage`.
