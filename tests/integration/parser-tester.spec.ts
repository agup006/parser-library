import { test, expect } from '@playwright/test';

test.describe('Parser Tester Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Initial Page Load', () => {
    test('should display main components on page load', async ({ page }) => {
      // Check main title
      await expect(page.getByText('Fluent Bit Parser Tester')).toBeVisible();
      
      // Check sidebar
      await expect(page.getByText('📚 Parser Library')).toBeVisible();
      
      // Check main form
      await expect(page.getByText('Parser Configuration')).toBeVisible();
      await expect(page.getByLabel('Regex Pattern *')).toBeVisible();
      await expect(page.getByLabel('🕐 Time Format (optional)')).toBeVisible();
      await expect(page.getByLabel('Test String *')).toBeVisible();
      
      // Check buttons
      await expect(page.getByRole('button', { name: 'Test Parser' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();
      
      // Check footer
      await expect(page.getByText('About This Tool')).toBeVisible();
    });

    test('should show web logs category expanded by default', async ({ page }) => {
      await expect(page.getByText('Apache Common Log')).toBeVisible();
      await expect(page.getByText('Apache Combined Log')).toBeVisible();
      await expect(page.getByText('Nginx Access Log')).toBeVisible();
      await expect(page.getByText('IIS Log')).toBeVisible();
    });

    test('should have Apache Common Log selected by default', async ({ page }) => {
      const apacheButton = page.getByText('Apache Common Log');
      await expect(apacheButton).toBeVisible();
      
      // Check that the form is populated with Apache log data
      const regexInput = page.getByLabel('Regex Pattern *');
      await expect(regexInput).toHaveValue(/.*\(\?\<host\>.*\(\?\<user\>.*\(\?\<time\>.*/);
    });
  });

  test.describe('Pattern Library Navigation', () => {
    test('should expand and collapse categories', async ({ page }) => {
      // System logs should be collapsed initially
      await expect(page.getByText('Standard Syslog')).not.toBeVisible();
      
      // Click to expand system logs
      await page.getByText('🖥️ System Logs').click();
      await expect(page.getByText('Standard Syslog')).toBeVisible();
      await expect(page.getByText('Auth.log')).toBeVisible();
      await expect(page.getByText('Kernel Log')).toBeVisible();
      
      // Click to collapse
      await page.getByText('🖥️ System Logs').click();
      await expect(page.getByText('Standard Syslog')).not.toBeVisible();
    });

    test('should load different patterns when clicked', async ({ page }) => {
      // Click on Nginx pattern
      await page.getByText('Nginx Access Log').click();
      
      // Check that form is updated
      const regexInput = page.getByLabel('Regex Pattern *');
      const timeFormatInput = page.getByLabel('🕐 Time Format (optional)');
      const testStringInput = page.getByLabel('Test String *');
      
      await expect(regexInput).toHaveValue(/.*\(\?\<remote\>.*\(\?\<host\>.*/);
      await expect(timeFormatInput).toHaveValue('%d/%b/%Y:%H:%M:%S %z');
      await expect(testStringInput).toHaveValue(/.*192\.168\.1\.1 example\.com.*/);
    });

    test('should navigate through all categories', async ({ page }) => {
      // Test System Logs
      await page.getByText('🖥️ System Logs').click();
      await page.getByText('Standard Syslog').click();
      
      let regexInput = page.getByLabel('Regex Pattern *');
      await expect(regexInput).toHaveValue(/.*\(\?\<time\>.*\(\?\<host\>.*/);
      
      // Test Application Logs
      await page.getByText('📱 Application Logs').click();
      await page.getByText('JSON Structured').click();
      
      regexInput = page.getByLabel('Regex Pattern *');
      await expect(regexInput).toHaveValue('/^(?<log>.*)$/');
      
      // Test Database Logs
      await page.getByText('🗄️ Database Logs').click();
      await page.getByText('MySQL Error Log').click();
      
      regexInput = page.getByLabel('Regex Pattern *');
      await expect(regexInput).toHaveValue(/.*\(\?\<time\>.*\(\?\<thread_id\>.*/);
    });
  });

  test.describe('Form Validation', () => {
    test('should show validation error for empty regex', async ({ page }) => {
      // Clear the regex input
      const regexInput = page.getByLabel('Regex Pattern *');
      await regexInput.clear();
      
      // Click test button
      await page.getByRole('button', { name: 'Test Parser' }).click();
      
      // Check for error message
      await expect(page.getByText('Regex pattern is required')).toBeVisible();
    });

    test('should show validation error for empty test string', async ({ page }) => {
      // Clear the test string input
      const testStringInput = page.getByLabel('Test String *');
      await testStringInput.clear();
      
      // Click test button
      await page.getByRole('button', { name: 'Test Parser' }).click();
      
      // Check for error message
      await expect(page.getByText('Test string is required')).toBeVisible();
    });

    test('should show validation error for invalid regex', async ({ page }) => {
      // Enter invalid regex
      const regexInput = page.getByLabel('Regex Pattern *');
      await regexInput.clear();
      await regexInput.fill('/[invalid regex(');
      
      // Click test button
      await page.getByRole('button', { name: 'Test Parser' }).click();
      
      // Check for error message
      await expect(page.getByText(/Invalid regex pattern/)).toBeVisible();
    });
  });

  test.describe('Parser Testing Workflow', () => {
    test('should successfully test Apache log pattern', async ({ page }) => {
      // Use default Apache pattern (already loaded)
      
      // Mock the API response
      await page.route('/api/parser', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: {
              errors: [],
              parsed: {
                host: '127.0.0.1',
                user: 'frank',
                time: '10/Oct/2000:13:55:36 -0700',
                method: 'GET',
                path: '/apache_pb.gif',
                code: '200',
                size: '2326'
              },
              parsed_time: '2000/10/10 20:55:36 +0000'
            }
          })
        });
      });
      
      // Click test button
      await page.getByRole('button', { name: 'Test Parser' }).click();
      
      // Wait for results
      await expect(page.getByText('✅')).toBeVisible();
      await expect(page.getByText('Parser Results')).toBeVisible();
      await expect(page.getByText('Parsed Timestamp')).toBeVisible();
      await expect(page.getByText('2000/10/10 20:55:36 +0000')).toBeVisible();
      await expect(page.getByText('Extracted Fields (6)')).toBeVisible();
      await expect(page.getByText('127.0.0.1')).toBeVisible();
      await expect(page.getByText('frank')).toBeVisible();
    });

    test('should handle parsing errors from API', async ({ page }) => {
      // Mock API response with errors
      await page.route('/api/parser', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: {
              errors: ['Failed to parse timestamp', 'Invalid regex pattern'],
              parsed: {},
              parsed_time: undefined
            }
          })
        });
      });
      
      // Click test button
      await page.getByRole('button', { name: 'Test Parser' }).click();
      
      // Check for error display
      await expect(page.getByText('⚠️')).toBeVisible();
      await expect(page.getByText('Parsing Errors')).toBeVisible();
      await expect(page.getByText('Failed to parse timestamp')).toBeVisible();
      await expect(page.getByText('Invalid regex pattern')).toBeVisible();
    });

    test('should handle API network errors', async ({ page }) => {
      // Mock network error
      await page.route('/api/parser', async route => {
        await route.abort('failed');
      });
      
      // Click test button
      await page.getByRole('button', { name: 'Test Parser' }).click();
      
      // Check for network error message
      await expect(page.getByText(/Network error/)).toBeVisible();
    });

    test('should show loading state during API call', async ({ page }) => {
      // Mock slow API response
      await page.route('/api/parser', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: { errors: [], parsed: {}, parsed_time: undefined }
          })
        });
      });
      
      // Click test button
      await page.getByRole('button', { name: 'Test Parser' }).click();
      
      // Check loading state
      await expect(page.getByText('⏳')).toBeVisible();
      await expect(page.getByText('Testing...')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Testing...' })).toBeDisabled();
      
      // Wait for completion
      await expect(page.getByText('Testing...')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Form Actions', () => {
    test('should clear form when clear button is clicked', async ({ page }) => {
      // Verify form has initial values
      const regexInput = page.getByLabel('Regex Pattern *');
      const timeFormatInput = page.getByLabel('🕐 Time Format (optional)');
      const testStringInput = page.getByLabel('Test String *');
      
      await expect(regexInput).not.toHaveValue('');
      await expect(timeFormatInput).not.toHaveValue('');
      await expect(testStringInput).not.toHaveValue('');
      
      // Click clear button
      await page.getByRole('button', { name: 'Clear' }).click();
      
      // Verify form is cleared
      await expect(regexInput).toHaveValue('');
      await expect(timeFormatInput).toHaveValue('');
      await expect(testStringInput).toHaveValue('');
    });

    test('should clear results when clear button is clicked', async ({ page }) => {
      // First get some results
      await page.route('/api/parser', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: {
              errors: [],
              parsed: { test: 'value' },
              parsed_time: '2023-01-01T12:00:00Z'
            }
          })
        });
      });
      
      await page.getByRole('button', { name: 'Test Parser' }).click();
      await expect(page.getByText('Parser Results')).toBeVisible();
      
      // Clear the form
      await page.getByRole('button', { name: 'Clear' }).click();
      
      // Results should be gone
      await expect(page.getByText('Parser Results')).not.toBeVisible();
      await expect(page.getByText('Ready to Test')).toBeVisible();
    });
  });

  test.describe('User Experience', () => {
    test('should have proper VSCode-style input styling', async ({ page }) => {
      const regexInput = page.getByLabel('Regex Pattern *');
      
      // Check for dark background
      const backgroundColor = await regexInput.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(backgroundColor).toBe('rgb(30, 30, 30)');
      
      // Check for monospace font
      const fontFamily = await regexInput.evaluate(el => 
        window.getComputedStyle(el).fontFamily
      );
      expect(fontFamily).toContain('Fira Code');
    });

    test('should show focus states on inputs', async ({ page }) => {
      const regexInput = page.getByLabel('Regex Pattern *');
      
      // Focus the input
      await regexInput.focus();
      
      // Check for focus styling
      const borderColor = await regexInput.evaluate(el => 
        window.getComputedStyle(el).borderColor
      );
      expect(borderColor).toBe('rgb(0, 122, 204)');
    });

    test('should be responsive and accessible', async ({ page }) => {
      // Check for proper labels
      await expect(page.getByLabel('Regex Pattern *')).toBeVisible();
      await expect(page.getByLabel('🕐 Time Format (optional)')).toBeVisible();
      await expect(page.getByLabel('Test String *')).toBeVisible();
      
      // Check for proper button roles
      await expect(page.getByRole('button', { name: 'Test Parser' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();
      
      // Check for helpful placeholder text
      await expect(page.getByPlaceholder('Enter your regex pattern...')).toBeVisible();
      await expect(page.getByPlaceholder('e.g., %d/%b/%Y:%H:%M:%S %z')).toBeVisible();
      await expect(page.getByPlaceholder('Enter the log line to test...')).toBeVisible();
    });
  });

  test.describe('End-to-End Workflows', () => {
    test('should complete full workflow: select pattern -> modify -> test -> clear', async ({ page }) => {
      // Step 1: Select a different pattern
      await page.getByText('🖥️ System Logs').click();
      await page.getByText('Standard Syslog').click();
      
      // Step 2: Modify the test string
      const testStringInput = page.getByLabel('Test String *');
      await testStringInput.clear();
      await testStringInput.fill('Oct 15 14:30:45 server sshd[5678]: Accepted password for user from 10.0.0.1 port 22 ssh2');
      
      // Step 3: Test the parser
      await page.route('/api/parser', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: {
              errors: [],
              parsed: {
                time: 'Oct 15 14:30:45',
                host: 'server',
                ident: 'sshd',
                pid: '5678',
                message: 'Accepted password for user from 10.0.0.1 port 22 ssh2'
              },
              parsed_time: '2023/10/15 14:30:45 +0000'
            }
          })
        });
      });
      
      await page.getByRole('button', { name: 'Test Parser' }).click();
      
      // Verify results
      await expect(page.getByText('Parser Results')).toBeVisible();
      await expect(page.getByText('server')).toBeVisible();
      await expect(page.getByText('sshd')).toBeVisible();
      await expect(page.getByText('5678')).toBeVisible();
      
      // Step 4: Clear everything
      await page.getByRole('button', { name: 'Clear' }).click();
      
      // Verify everything is cleared
      await expect(page.getByLabel('Regex Pattern *')).toHaveValue('');
      await expect(page.getByText('Parser Results')).not.toBeVisible();
      await expect(page.getByText('Ready to Test')).toBeVisible();
    });

    test('should handle multiple pattern switches correctly', async ({ page }) => {
      // Switch between multiple patterns and verify each loads correctly
      const patterns = [
        { category: '🌐 Web Logs', pattern: 'Nginx Access Log', expectedRegex: '(?<remote>' },
        { category: '📱 Application Logs', pattern: 'JSON Structured', expectedRegex: '(?<log>' },
        { category: '🗄️ Database Logs', pattern: 'PostgreSQL Log', expectedRegex: '(?<time>' }
      ];
      
      for (const { category, pattern, expectedRegex } of patterns) {
        // Expand category if needed
        if (!await page.getByText(pattern).isVisible()) {
          await page.getByText(category).click();
        }
        
        // Click pattern
        await page.getByText(pattern).click();
        
        // Verify regex is loaded
        const regexInput = page.getByLabel('Regex Pattern *');
        await expect(regexInput).toHaveValue(new RegExp(`.*${expectedRegex}.*`));
      }
    });

    test('should maintain state during error scenarios', async ({ page }) => {
      // Load a pattern
      await page.getByText('Nginx Access Log').click();
      
      // Modify the regex to be invalid
      const regexInput = page.getByLabel('Regex Pattern *');
      await regexInput.clear();
      await regexInput.fill('/[invalid');
      
      // Try to test (should fail validation)
      await page.getByRole('button', { name: 'Test Parser' }).click();
      await expect(page.getByText(/Invalid regex pattern/)).toBeVisible();
      
      // Fix the regex
      await regexInput.clear();
      await regexInput.fill('/^(?<test>.*)$/');
      
      // Mock API error
      await page.route('/api/parser', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      // Test again (should show API error)
      await page.getByRole('button', { name: 'Test Parser' }).click();
      await expect(page.getByText(/Server error/)).toBeVisible();
      
      // Verify form state is maintained
      await expect(regexInput).toHaveValue('/^(?<test>.*)$/');
    });
  });
}); 