import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    // Start at the home page
    await page.goto('/');
    
    // Check if we're on the home page
    await expect(page.getByRole('heading', { name: 'Welcome to Parser Library' })).toBeVisible();
    
    // Navigate to About page
    await page.getByRole('link', { name: 'About' }).click();
    
    // Check if we're on the about page
    await expect(page.getByRole('heading', { name: 'About Parser Library' })).toBeVisible();
    
    // Navigate back to Home
    await page.getByRole('link', { name: 'Home' }).click();
    
    // Verify we're back on the home page
    await expect(page.getByRole('heading', { name: 'Welcome to Parser Library' })).toBeVisible();
  });
}); 