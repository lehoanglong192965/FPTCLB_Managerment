import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { IcpdpClubManagementPage } from '../pages/IcpdpClubManagementPage';

test.describe('ICPDP Club Management Flow', () => {
  const icpdpEmail = 'hoanglm@fpt.edu.vn'; // Assumed ICPDP staff email from seed data
  let clubMgmtPage: IcpdpClubManagementPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    // Use the real email to log in
    await loginPage.login(icpdpEmail);
    // Wait until logged in
    await expect(page).toHaveURL(/.*icpdp.*/);

    clubMgmtPage = new IcpdpClubManagementPage(page);
    await clubMgmtPage.goto();
  });

  test('should display the club list by default', async ({ page }) => {
    const count = await clubMgmtPage.getClubCount();
    expect(count).toBeGreaterThanOrEqual(0);
    // Verify header exists
    await expect(page.locator('h1.page-title')).toHaveText('Quản Lý CLB');
  });

  test('should allow creating a new club', async ({ page }) => {
    const uniqueCode = 'E2E' + Math.floor(Math.random() * 1000);
    const clubName = 'Test Club ' + uniqueCode;
    
    // We need a valid student ID to assign as leader. SE123456 is used in seed data.
    await clubMgmtPage.createClub(clubName, uniqueCode, 'SE123456', 'Created by Playwright');
    
    // Toast should appear
    await expect(page.locator('.co-toast-success')).toBeVisible();
    
    // We should be able to search for it
    await clubMgmtPage.search(uniqueCode);
    const count = await clubMgmtPage.getClubCount();
    expect(count).toBe(1);
    await expect(clubMgmtPage.clubCards.first()).toContainText(uniqueCode);
  });

  test('should filter clubs by status', async ({ page }) => {
    await clubMgmtPage.filterByStatus('Active');
    // If there are clubs, they should not have the dissolved class
    const count = await clubMgmtPage.getClubCount();
    if (count > 0) {
      const dissolvedCards = await page.locator('.cm-card-dissolved').count();
      expect(dissolvedCards).toBe(0);
    }
  });
});
