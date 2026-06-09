import { test, expect } from '@playwright/test';

test.describe.serial('Authentication Flow', () => {
  const unregisteredEmail = 'unknown_user_test@gmail.com';
  const whitelistedEmail = 'lehoanglong19062005@gmail.com'; // In seed data
  const testPassword = 'Password123!';

  test('should fail registration for non-whitelisted gmail', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="username"]', 'Test User');
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.fill('input[name="email"]', unregisteredEmail);
    await page.fill('input[name="studentId"]', 'SE123456');
    await page.selectOption('select[name="major"]', 'SE');
    
    await page.click('button[type="submit"]');

    // Wait for the error message
    const errorLocator = page.locator('.rg-error', { hasText: 'cấp phép' });
    await expect(errorLocator).toBeVisible();
  });

  test('should register successfully with whitelisted email', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="username"]', 'Hoang Long');
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.fill('input[name="email"]', whitelistedEmail);
    await page.fill('input[name="studentId"]', 'SE123456');
    await page.selectOption('select[name="major"]', 'SE');
    
    await page.click('button[type="submit"]');

    // Wait for success message or redirect
    await expect(page.locator('text=Đăng ký thành công!')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('should login and navigate to member dashboard by default', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', whitelistedEmail);
    await page.fill('input[type="password"]', testPassword);
    
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/member/);
  });
});
