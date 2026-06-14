import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import * as path from 'path';

test.describe('Club Registration and Approval Flow', () => {
  const studentEmail = 'lehoanglong19062005@gmail.com';
  const icpdpEmail = 'pdp.manager@fpt.edu.vn';
  const testPassword = 'Password123';

  test('should submit and approve club registration successfully', async ({ page }) => {
    const uniqueId = Math.floor(Math.random() * 10000);
    const clubName = `Playwright Club ${uniqueId}`;
    const clubCode = `PWC${uniqueId}`;

    // 1. Log in as Student
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(studentEmail, testPassword);
    await expect(page).toHaveURL(/\/member/);

    // 2. Navigate to Registration Form
    await page.goto('/member/club-register');
    await expect(page.locator('h1.page-title')).toHaveText('Đăng Ký Thành Lập CLB');

    // 3. Fill Step 1: Club Identity
    await page.fill('input[placeholder*="F-Code"]', clubName);
    await page.fill('input[placeholder*="FCODE"]', clubCode);
    await page.selectOption('select', 'Sports');
    await page.fill('textarea[placeholder*="hiển thị trên danh sách"]', 'Test short description');
    await page.fill('textarea[placeholder*="các giá trị mang lại"]', 'Test detailed mission & goals');
    await page.fill('textarea[placeholder*="tính độc nhất"]', 'Test uniqueness and reason for creation');
    
    // Click Next
    await page.click('button:has-text("Tiếp tục")');

    // 4. Fill Step 2: Core Team & Upload Cards
    const dummyPath = path.resolve(process.cwd(), '../scratch/dummy.png');

    // Leader details (SE123456)
    await page.fill('input[placeholder="Ví dụ: SE170001"]', 'SE123456');
    await page.waitForTimeout(500); // Allow lookup debounces
    await page.fill('input[placeholder="Nhập số điện thoại"]', '0987654321');
    await page.setInputFiles('input[type="file"]', dummyPath);
    await page.waitForTimeout(1500); // Allow upload to complete

    // Vice Leader details (SE170001)
    await page.locator('input[placeholder="Ví dụ: SE170002"]').fill('SE170001');
    await page.waitForTimeout(500);
    await page.locator('input[placeholder="Nhập số điện thoại"]').nth(1).fill('0987654322');
    await page.setInputFiles('input[type="file"]', dummyPath);
    await page.waitForTimeout(1500);

    // Founding Members details
    // Member 1 (SE170002)
    await page.locator('input[placeholder="Ví dụ: SE170003"]').nth(0).fill('SE170002');
    await page.waitForTimeout(500);
    await page.locator('input[placeholder="Số điện thoại"]').nth(0).fill('0987654323');

    // Member 2 (SE170003)
    await page.locator('input[placeholder="Ví dụ: SE170003"]').nth(1).fill('SE170003');
    await page.waitForTimeout(500);
    await page.locator('input[placeholder="Số điện thoại"]').nth(1).fill('0987654324');

    // Member 3 (SE170004)
    await page.locator('input[placeholder="Ví dụ: SE170003"]').nth(2).fill('SE170004');
    await page.waitForTimeout(500);
    await page.locator('input[placeholder="Số điện thoại"]').nth(2).fill('0987654325');

    // Click Next
    await page.click('button:has-text("Tiếp tục")');

    // 5. Fill Step 3: Plan & Financials
    await page.fill('textarea[placeholder*="Ban chuyên môn"]', 'Media: 5 members, Logistics: 5 members');
    await page.locator('select').nth(0).selectOption('1 lần / tuần');
    await page.locator('select').nth(1).selectOption('Sân trường / Khu vực chung');
    await page.fill('textarea[placeholder*="quỹ hoạt động"]', 'Thu quỹ định kỳ học kỳ');

    // Submit Registration
    await page.click('button:has-text("Gửi đơn đăng ký")');

    // Verify Success Screen
    await expect(page.locator('h2')).toContainText('Nộp Đơn Đăng Ký Thành Công!');

    // 6. Log out programmatically
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // 7. Log in as ICPDP
    await loginPage.login(icpdpEmail, testPassword);
    await expect(page).toHaveURL(/\/icpdp/);

    // 8. Go to ICPDP Review requests
    await page.goto('/icpdp/club-requests');
    await page.waitForLoadState('networkidle');
    
    // Select our submitted request in the list
    await page.click(`text=${clubName}`);

    // Input review comment
    await page.fill('textarea[placeholder*="Nhập lý do"]', 'Approved via Playwright automated flow.');

    // Approve the registration
    await page.click('button:has-text("Duyệt & Kích hoạt CLB")');

    // Toast success should appear
    await expect(page.locator('.co-toast-success')).toBeVisible();

    // 9. Verify the club is in active club management list
    await page.goto('/icpdp/club-management');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder*="Tìm tên CLB"]', clubName);
    await page.waitForTimeout(1000);
    await expect(page.locator(`.cm-club-card:has-text("${clubName}")`)).toBeVisible();
  });
});
