import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check that page has loaded
    await expect(page).toHaveTitle(/Архитектор лидерства/);
    
    // Check that main content is visible
    await expect(page.locator('main')).toBeVisible();
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');
    
    // Check that login form elements are present
    await expect(page.locator('input')).toBeVisible();
  });

  test('navigation is responsive', async ({ page }) => {
    await page.goto('/');
    
    // Check navigation exists
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });
});

test.describe('Cross-browser Visual Consistency', () => {
  test('main layout renders without errors', async ({ page }) => {
    await page.goto('/');
    
    // No console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Filter out expected errors (like API calls that fail without auth)
    const criticalErrors = errors.filter(
      (e) => !e.includes('401') && !e.includes('Failed to fetch')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('CSS custom properties are applied', async ({ page }) => {
    await page.goto('/');
    
    // Check that our CSS variables are defined
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    
    // obsidian-core: #0F1216 -> rgb(15, 18, 22)
    expect(bgColor).toBe('rgb(15, 18, 22)');
  });
});

test.describe('Accessibility', () => {
  test('page has no critical accessibility issues', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic accessibility
    // Main landmark exists
    await expect(page.locator('main')).toBeVisible();
    
    // Check that interactive elements are keyboard accessible
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        // Should be focusable
        await button.focus();
        await expect(button).toBeFocused();
      }
    }
  });
});
