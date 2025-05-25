import { test, expect } from '@playwright/test';

test.describe('Parser Tester App', () => {
  test('should load the parser tester page', async ({ page }) => {
    // Start at the home page (which now shows ParserTester directly)
    await page.goto('/');
    
    // Check if the main heading is visible
    await expect(page.getByRole('heading', { name: 'Fluent Bit Parser Tester' })).toBeVisible();
    
    // Check if the parser library is visible
    await expect(page.getByText('📚 Parser Library')).toBeVisible();
    
    // Check if the form elements are present
    await expect(page.getByPlaceholder('Enter your regex pattern...')).toBeVisible();
    await expect(page.getByPlaceholder('e.g., %d/%b/%Y:%H:%M:%S %z')).toBeVisible();
    await expect(page.getByPlaceholder('Enter the log line to test...')).toBeVisible();
    
    // Check if the action buttons are present
    await expect(page.getByRole('button', { name: /Test Parser/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Clear/ })).toBeVisible();
  });
}); 