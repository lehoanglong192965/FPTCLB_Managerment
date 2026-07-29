# Release gate `fix-project -> main`

Ngày kiểm tra: 2026-07-29 (Asia/Saigon)

## 1. Phạm vi và commit được kiểm tra

- Nhánh: `fix-project`.
- Commit code đã kiểm tra: `b477b324fd714dddf425acf51dbbe85fa54af943`.
- `origin/main`: `cc9c473c8b86ad39985c6c410230296fe01c12ba`.
- Trước bản sửa release blocker, local và `origin/fix-project` không lệch (`0/0`).
- Không merge/push `main`, không đụng nhánh `deploy`, không thao tác Azure production.

Các file được sửa trong release gate:

1. `backend/src/test/java/com/fptu/fcms/controller/DisciplineLogControllerIntegrationTest.java`
   - Bỏ phụ thuộc ngầm vào `userID=1` và `semesterID=1` của DB seed.
   - Tạo `UserAccount` và `Semester` fixture trong transaction của test; rollback sau mỗi test.
   - Production code không thay đổi.
2. `RELEASE_GATE_FIX_PROJECT_TO_MAIN.md` (báo cáo này).

## 2. Tính toàn vẹn hai versioned migration cũ

Lệnh đối chiếu:

```text
git diff 408efe5 77c01c3 -- V2026072501... V2026072513...
```

Diff cho thấy:

- `V2026072501`: ba lệnh thêm cột trực tiếp được đổi thành ba guard độc lập bằng `COL_LENGTH` cho `withdrawalReason`, `withdrawnBy`, `withdrawnAt`.
- `V2026072513`: hai lệnh thêm `refundBankCode` trực tiếp được đổi thành guard `COL_LENGTH` độc lập cho `EventRegistration` và `GuestEventRegistration`.

Checksum được tính theo thuật toán CRC32 của Flyway 10.10 và so sánh với legacy clone:

| Migration | Git blob hiện tại | Checksum file hiện tại | Legacy DB | Kết quả |
|---|---|---:|---:|---|
| `V2026072501` | `11421f5828863aa2da594b17c323aaa6af9e720f` | `1643012116` | `1643012116` | Khớp |
| `V2026072513` | `e925f71565dd4f652acabb3692afeb20294105ba` | `850444657` | `850444657` | Khớp |

Legacy history ghi `success=1` ở rank 40 và 52. Checksum chứng minh legacy clone đã apply đúng byte/nội dung guarded hiện tại. Không sửa hai file, không sửa `flyway_schema_history`, không dùng `flyway repair`. Không query Azure production.

## 3. Fresh database gate

Database dùng một lần: `FCMS_GATE_FRESH_20260729_01`, tạo bằng `CREATE DATABASE`, không restore schema, không tạo bảng thủ công, không dùng Hibernate `update`.

Cấu hình: profile `prod`, Flyway bật, `spring.jpa.hibernate.ddl-auto=validate`.

Flyway history:

| Rank | Version | Description | Type | Checksum | Success |
|---:|---|---|---|---:|---:|
| 1 | 2026072901 | fcms full schema | SQL_BASELINE | 249395952 | 1 |
| 2 | 2026072902 | contribution batch unique active index | SQL | -534430637 | 1 |
| 3 | 2026072903 | personnel reassign log | SQL | -463838174 | 1 |
| 4 | 2026072904 | required reference data | SQL | 1442610685 | 1 |

Kết quả:

- Bản baseline dựng toàn bộ schema thành công; migrations cũ được Flyway bỏ qua đúng semantics baseline.
- Hibernate validate và application context pass.
- Failed migrations: `0`.
- FK disabled/untrusted: `0`.
- Check constraints disabled/untrusted: `0`.
- `UX_ContributionBatch_Event_Active`: tồn tại (`count=1`).
- `DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS`: không có vi phạm.

## 4. Legacy database gate

Database: `FCMS_GATE_LEGACY_20260729_01`, restore từ backup local đã qua `RESTORE VERIFYONLY`; không chạy trên production.

Trước migrate: 55 Flyway rows; dữ liệu nghiệp vụ gồm 8 users, 3 semesters, 4 system roles, 3 club roles, 5 event roles và 11 system configs.

Sau migrate: 60 Flyway rows. Baseline `B2026072901` không chạy (`baseline_2901_rows=0`); chỉ các migration mới được apply:

| Rank | Version | Description | Checksum | Success |
|---:|---|---|---:|---:|
| 55 | 2026072516 | automatic event report schema | -2128226272 | 1 |
| 56 | 2026072701 | vnpay payment intents | 1300335427 | 1 |
| 57 | 2026072901 | user token invalidated at | -1319770682 | 1 |
| 58 | 2026072902 | contribution batch unique active index | -534430637 | 1 |
| 59 | 2026072903 | personnel reassign log | -463838174 | 1 |
| 60 | 2026072904 | required reference data | 1442610685 | 1 |

Kết quả:

- Flyway validate và Hibernate validate pass; không checksum mismatch.
- Failed migrations: `0`.
- FK disabled/untrusted: `0`; check constraints disabled/untrusted: `0`.
- Duplicate active `ContributionBatch`: `0`.
- `DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS`: không có vi phạm.
- Dữ liệu cũ được giữ: users `8`, semesters `3`, system roles `4`, system configs `11`. Club roles tăng `3 -> 4` và event roles tăng `5 -> 6` đúng mục đích của migration reference-data; không reset identity ngoài dự kiến.

## 5. Full backend test suite

Lệnh cuối:

```text
mvnw.cmd -B clean test -DforkCount=0 -Dspring.test.context.cache.maxSize=1
```

- Database/profile: fresh DB ở trên, profile `prod`, Flyway bật, Hibernate `validate`.
- Exit code: `0`.
- Surefire: 78 report XML, 323 tests; passed `323`, failed `0`, errors `0`, skipped `0`.
- Report: `backend/target/surefire-reports`.
- Log: `backend/full-backend-test-no-fork.log` (local evidence, không commit).

Blocker thật được sửa: `DisciplineLogControllerIntegrationTest` hard-code ID của dữ liệu seed nên POST hợp lệ trả 400 trên DB mới. Test giờ tự tạo reference fixtures; test cô lập đạt `7/7`, sau đó full suite đạt `323/323`.

Các lần JVM dừng trước đó được các `hs_err_pid*.log` xác nhận là native-memory exhaustion (`There is insufficient memory for the Java Runtime Environment to continue`), không phải assertion failure. Cách xử lý: giới hạn SQL Server local ở 640 MB, chạy một JVM với `forkCount=0`, heap 640 MB, metaspace 224 MB và context cache size 1. Không skip/disable/xóa test.

## 6. Frontend gate

| Lệnh | Exit | Kết quả |
|---|---:|---|
| `npm ci` | 0 | 259 packages cài từ lockfile |
| `npm run build` | 0 | Vite production build, 4193 modules transformed |
| `npx eslint src` | 0 | 0 errors, 48 configured warnings |

Lần build trong sandbox bị `spawn EPERM` khi load native Tailwind binary; chạy lại ngoài sandbox đạt exit 0, chứng minh đây là hạn chế môi trường, không phải lỗi source. `npm ci` báo 13 dependency audit findings; đây không phải build/lint error và không chạy `npm audit fix` ngoài phạm vi release gate.

## 7. PDF, CSV và resources

Ba resource đều được Git theo dõi và có mặt trong checkout:

- `backend/src/main/resources/fonts/Arial-Regular.ttf`
- `backend/src/main/resources/fonts/Arial-Bold.ttf`
- `backend/src/main/resources/images/fpt_university_logo.png`

Smoke test riêng:

- `EventReportPdfRendererImplTest`: pass; PDF `%PDF`, parse được bằng PDFBox, kích thước `133636` bytes; embedded Arial được load, không lỗi resource/path Windows/Linux.
- `EventExportServiceImplTest`: 5/5 pass; CSV export không bị ảnh hưởng.
- Tổng smoke: 6 tests, 0 failures/errors/skips, exit 0.

## 8. Secret scan

Scan chỉ trên tracked files, không in giá trị secret:

- Không phát hiện signature Google client secret, Gemini key, Cloudinary URL/secret, private key hoặc JDBC password.
- `application.yml` lấy `DB_PASSWORD`, `MAIL_PASSWORD`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `GEMINI_API_KEY`, `CLOUDINARY_API_SECRET`, `SEPAY_WEBHOOK_API_KEY` từ environment variables.
- `backend/.env.example` chỉ chứa placeholder; `application-sandbox.yml` có MailHog password rỗng; hai match frontend là validation/application expressions, không phải credential.
- Nếu credential từng xuất hiện trong Git history, repository owner vẫn phải rotate bằng dashboard của nhà cung cấp; task này không gọi dịch vụ ngoài để rotate.

## 9. Dry-run merge `fix-project -> origin/main`

- `git diff --check origin/main...HEAD`: exit 0.
- Worktree tạm từ `origin/main` được merge bằng `git merge --no-commit --no-ff fix-project`.
- Dry-run ở commit code có 141 file thay đổi; dry-run cuối trên HEAD đã gồm báo cáo này có 142 file thay đổi. Cả hai lần: merge exit `0`, unmerged files `0`, conflict markers `0`.
- Baseline, hai migration checksum-sensitive, hai Arial fonts và logo đều còn tracked sau merge.
- `application.yml` nhận đúng các thay đổi environment-binding của `fix-project`; không có textual/add-add conflict hay conflict resolution ghi đè cấu hình main.
- Merge đã abort; worktree tạm đã xóa (`TEMP_EXISTS_AFTER_CLEANUP=False`). Không commit/push main.

## 10. Các mục cố ý không làm

- Không tách frontend god components.
- Không làm refresh-token rotation/revocation store.
- Không đổi rate limiter sang distributed store.
- Không refactor kiến trúc/package/dead code hoặc sửa P2/P3 ngoài blocker.
- Không sửa baseline khi fresh DB đã pass.
- Không dùng Flyway repair, `DskipTests`, `@Disabled`, xóa test hoặc assertion giả.
- Không merge main, không đụng deploy, không thao tác Azure production.

## Kết luận

MERGE READY
