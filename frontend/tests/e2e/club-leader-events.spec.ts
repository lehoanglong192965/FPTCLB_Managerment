import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ClubEventsMgmtPage } from '../pages/ClubEventsMgmtPage';

test.describe('Club Leader Events Management Flow', () => {
  const leaderEmail = 'lehoanglong19062005@gmail.com'; // Whitelisted student who might be a leader
  let eventsPage: ClubEventsMgmtPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    // Use the real email to log in
    await loginPage.login(leaderEmail);
    // Wait until logged in
    await expect(page).not.toHaveURL(/.*login.*/);

    eventsPage = new ClubEventsMgmtPage(page);
    await eventsPage.goto();
  });

  test('should display event list', async ({ page }) => {
    // Verify header exists
    await expect(page.locator('h1.page-title')).toHaveText('Sự Kiện CLB');
  });

  test('should create a new event', async ({ page }) => {
    const eventName = 'E2E Test Event ' + Math.floor(Math.random() * 1000);
    const now = new Date();
    const startStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    const endStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000) + 3600000).toISOString().slice(0, 16); // +1 hour
    
    await eventsPage.createEvent(eventName, startStr, endStr, 'Playwright Lab', '100000', 'Test Description');
    
    // Toast should appear
    await expect(page.locator('.co-toast-success')).toBeVisible();
    
    // Verify event is in the list
    await eventsPage.search(eventName);
    await expect(page.locator(`text=${eventName}`)).toBeVisible();
  });
});
