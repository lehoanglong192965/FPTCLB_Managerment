import { Page, Locator, expect } from '@playwright/test';

export class ClubEventsMgmtPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly createBtn: Locator;
  
  // Modal locators
  readonly eventNameInput: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly locationInput: Locator;
  readonly budgetInput: Locator;
  readonly descriptionInput: Locator;
  readonly submitBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('input[placeholder="Tìm sự kiện..."]');
    this.createBtn = page.locator('button.dl-btn-add');
    
    // Create Modal
    this.eventNameInput = page.locator('.cm-modal-body input').nth(0);
    this.startDateInput = page.locator('input[type="datetime-local"]').nth(0);
    this.endDateInput = page.locator('input[type="datetime-local"]').nth(1);
    this.locationInput = page.locator('.cm-modal-body input').nth(3);
    this.budgetInput = page.locator('input[type="number"]');
    this.descriptionInput = page.locator('textarea');
    this.submitBtn = page.locator('button.cm-btn-modal-submit');
  }

  async goto() {
    await this.page.goto('/club-leader/events');
    await this.page.waitForLoadState('networkidle');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async createEvent(name: string, startDate: string, endDate: string, location: string, budget: string, desc: string) {
    await this.createBtn.click();
    await expect(this.eventNameInput).toBeVisible();
    await this.eventNameInput.fill(name);
    await this.startDateInput.fill(startDate);
    await this.endDateInput.fill(endDate);
    await this.locationInput.fill(location);
    await this.budgetInput.fill(budget);
    await this.descriptionInput.fill(desc);
    await this.submitBtn.click();
    await this.page.waitForResponse(resp => resp.url().includes('/events') && resp.request().method() === 'POST');
    await this.page.waitForLoadState('networkidle');
  }
}
