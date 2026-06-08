import { test, expect } from '@playwright/test';

test.describe('OAuth2 Redirect Flow', () => {

  test('Xử lý token hợp lệ và chuyển hướng đúng Role MEMBER', async ({ page }) => {
    // Tạo 1 mock JWT token có payload { sub: "test@fpt.edu.vn", roleID: 3 }
    const mockHeader = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    // Base64Url encode of: {"sub":"test@fpt.edu.vn","roleID":3,"exp":1999999999}
    const mockPayload = 'eyJzdWIiOiJ0ZXN0QGZwdC5lZHUudm4iLCJyb2xlSUQiOjMsImV4cCI6MTk5OTk5OTk5OX0';
    const mockToken = `${mockHeader}.${mockPayload}.dummy_signature`;

    // 1. Điều hướng thẳng tới trang hứng token
    await page.goto(`/oauth2/redirect?token=${mockToken}`);

    // 2. Chờ chuyển hướng về trang /member
    await page.waitForURL('**/member');

    // 3. Kiểm tra localStorage có lưu user không (AuthContext)
    const userStorage = await page.evaluate(() => localStorage.getItem('user'));
    expect(userStorage).toBeTruthy();
    
    const parsedUser = JSON.parse(userStorage);
    expect(parsedUser.role).toBe('MEMBER');
    expect(parsedUser.email).toBe('test@fpt.edu.vn');
    
    // 4. Kiểm tra accessToken trong localStorage (TokenService)
    const tokenData = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(tokenData).toBe(mockToken);
  });

  test('Hiển thị lỗi trên trang Login nếu tham số thiếu/không hợp lệ', async ({ page }) => {
    // Đi tới trang hứng lỗi khi không có token
    await page.goto('/oauth2/redirect');

    // Sẽ bị redirect về /login?error=...
    await page.waitForURL('**/login?error=*');

    // Kiểm tra xem thông báo lỗi có hiển thị trên màn hình không
    const errorMsg = page.locator('.login-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Không nhận được token');
  });

});
