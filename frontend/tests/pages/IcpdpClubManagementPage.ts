import { Page, Locator, expect } from '@playwright/test';

export class IcpdpClubManagementPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly filterSelect: Locator;
  readonly createBtn: Locator;
  readonly clubCards: Locator;
  
  // Modal locators
  readonly clubNameInput: Locator;
  readonly clubCodeInput: Locator;
  readonly leaderIdInput: Locator;
  readonly descriptionInput: Locator;
  readonly submitBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('.cm-search-input');
    this.filterSelect = page.locator('.cm-filter-select');
    this.createBtn = page.locator('button.cm-btn-create').first();
    this.clubCards = page.locator('.cm-club-card');
    
    // Create Modal
    this.clubNameInput = page.locator('input[placeholder="VD: FPTU Chess Club"]');
    this.clubCodeInput = page.locator('input[placeholder="VD: FCC"]');
    this.leaderIdInput = page.locator('input[placeholder="VD: SE241234"]');
    this.descriptionInput = page.locator('.pr-textarea');
    this.submitBtn = page.locator('button.cm-btn-modal-submit');
  }

  async goto() {
    await this.page.goto('/icpdp/club-management');
    await this.page.waitForLoadState('networkidle');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async filterByStatus(status: string) {
    await this.filterSelect.selectOption(status);
  }

  async createClub(name: string, code: string, leaderId: string, desc: string) {
    await this.createBtn.click();
    await expect(this.clubNameInput).toBeVisible();
    await this.clubNameInput.fill(name);
    await this.clubCodeInput.fill(code);
    await this.leaderIdInput.fill(leaderId);
    await this.descriptionInput.fill(desc);
    await this.submitBtn.click();
    // Wait for the success toast or network
    await this.page.waitForResponse(resp => resp.url().includes('/api/clubs') && resp.request().method() === 'POST');
    await this.page.waitForLoadState('networkidle');
  }

  async getClubCount() {
    return await this.clubCards.count();
  }
}
