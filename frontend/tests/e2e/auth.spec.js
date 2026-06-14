import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Authentication Flows', () => {
  const suspendedEmail = 'suspended_e2e_user@fpt.edu.vn';
  const activeEmail = 'active_e2e_user@fpt.edu.vn';
  const password = 'MySecurePassword123!';

  test('Test Case 1: Chặn đăng nhập tài khoản Suspended', async ({ page, request }) => {
    // 1. Đăng ký tài khoản
    await request.post('http://localhost:8080/api/auth/register', {
      data: {
        email: suspendedEmail,
        password: password,
        fullName: 'Suspended User',
        major: 'SE'
      }
    });

    // 2. Set accountStatus = 'Suspended' trong Database qua sqlcmd
    execSync(`sqlcmd -S localhost -U sa -P 123456 -d FPTUCLUB -Q "SET QUOTED_IDENTIFIER ON; UPDATE UserAccount SET accountStatus = 'Suspended' WHERE email = '${suspendedEmail}'"`);

    // 3. Mở giao diện đăng nhập
    await page.goto('/login');
    await page.fill('input[type="email"]', suspendedEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // 4. Kiểm tra lỗi hiển thị trên giao diện
    const errorMsg = page.getByText('Tài khoản của bạn đã bị khóa (Suspended). Vui lòng liên hệ Admin.');
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });

  test('Test Case 2: Đăng xuất không bị lỗi API đỏ', async ({ page, request }) => {
    // 1. Đăng ký tài khoản Active
    await request.post('http://localhost:8080/api/auth/register', {
      data: {
        email: activeEmail,
        password: password,
        fullName: 'Active User',
        major: 'SE'
      }
    });

    // Đảm bảo trạng thái là Active trong Database
    execSync(`sqlcmd -S localhost -U sa -P 123456 -d FPTUCLUB -Q "SET QUOTED_IDENTIFIER ON; UPDATE UserAccount SET accountStatus = 'Active' WHERE email = '${activeEmail}'"`);

    // 2. Đăng nhập
    await page.goto('/login');
    await page.fill('input[type="email"]', activeEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Chờ chuyển hướng trang thành công (hết loading, vào màn hình chính)
    // Đã xóa waitForURL để tránh lỗi redirect path khác nhau.

    // Đợi layout chính và sidebar hiển thị
    await expect(page.getByRole('button', { name: 'Đăng xuất', exact: false })).toBeVisible({ timeout: 10000 });

    // 3. Lắng nghe network và console để bắt lỗi đỏ (đặc biệt là lỗi 404 từ api/auth/logout)
    let has404Error = false;
    let hasConsoleError = false;

    page.on('response', response => {
      if (response.url().includes('/auth/logout') && response.status() === 404) {
        has404Error = true;
      }
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('404')) {
        hasConsoleError = true;
      }
    });

    // 4. Nhấn nút Đăng xuất
    await page.getByRole('button', { name: 'Đăng xuất', exact: false }).click();

    // 5. Xác minh được chuyển hướng về trang đăng nhập
    await page.waitForURL('**/login', { timeout: 5000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Xác minh không có lỗi 404 khi đăng xuất
    expect(has404Error).toBe(false);
    expect(hasConsoleError).toBe(false);
  });
});
