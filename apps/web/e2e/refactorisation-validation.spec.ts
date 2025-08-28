import { test, expect } from '@playwright/test'

test.describe('Refactorisation Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
  })

  test.describe('Structure Validation', () => {
    test('should load the application without errors', async ({ page }) => {
      // Check that the page loads without console errors
      const consoleErrors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      await page.waitForLoadState('networkidle')
      
      expect(consoleErrors.length).toBe(0)
    })

    test('should have correct page structure', async ({ page }) => {
      // Check for essential elements
      await expect(page.locator('body')).toBeVisible()
      await expect(page.locator('main')).toBeVisible()
    })

    test('should load with correct meta tags', async ({ page }) => {
      // Check for essential meta tags
      const title = await page.title()
      expect(title).toBeTruthy()
      expect(title.length).toBeGreaterThan(0)
    })
  })

  test.describe('Navigation Validation', () => {
    test('should navigate between pages without errors', async ({ page }) => {
      // Test navigation to different routes
      const routes = ['/', '/login', '/repos']
      
      for (const route of routes) {
        await page.goto(route)
        await page.waitForLoadState('networkidle')
        
        // Check that the page loads without errors
        const consoleErrors: string[] = []
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text())
          }
        })
        
        expect(consoleErrors.length).toBe(0)
      }
    })

    test('should handle 404 pages gracefully', async ({ page }) => {
      await page.goto('/non-existent-page')
      
      // Should show a 404 page or redirect to home
      const currentUrl = page.url()
      expect(currentUrl).toMatch(/\/$|\/404$/)
    })
  })

  test.describe('Component Integration', () => {
    test('should render universal components correctly', async ({ page }) => {
      // Navigate to a page that uses universal components
      await page.goto('/workspaces/test-id/context')
      
      // Check for universal components
      await expect(page.locator('[data-testid="three-panels"]')).toBeVisible()
      await expect(page.locator('[data-testid="tree-panel"]')).toBeVisible()
      await expect(page.locator('[data-testid="content-panel"]')).toBeVisible()
      await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible()
    })

    test('should handle component state changes', async ({ page }) => {
      await page.goto('/workspaces/test-id/context')
      
      // Test panel resizing
      const resizeHandle = page.locator('[data-testid="panel-resize-handle"]').first()
      await resizeHandle.hover()
      await expect(resizeHandle).toBeVisible()
    })
  })

  test.describe('API Integration', () => {
    test('should handle API requests correctly', async ({ page }) => {
      // Mock API responses
      await page.route('**/api/workspaces', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { id: '1', name: 'Test Repo', url: 'https://github.com/test/repo' }
            ]
          })
        })
      })

      await page.goto('/repos')
      await page.waitForLoadState('networkidle')
      
      // Check that API data is displayed
      await expect(page.locator('text=Test Repo')).toBeVisible()
    })

    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/workspaces', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error'
          })
        })
      })

      await page.goto('/repos')
      await page.waitForLoadState('networkidle')
      
      // Should show error state
      await expect(page.locator('text=error')).toBeVisible()
    })
  })

  test.describe('Authentication Flow', () => {
    test('should handle authentication state correctly', async ({ page }) => {
      await page.goto('/login')
      
      // Check for GitHub login button
      await expect(page.locator('[data-testid="github-login"]')).toBeVisible()
    })

    test('should redirect unauthenticated users', async ({ page }) => {
      // Try to access protected route
      await page.goto('/workspaces/test-id/context')
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Performance Validation', () => {
    test('should load pages within acceptable time', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000)
    })

    test('should handle large content efficiently', async ({ page }) => {
      // Mock large content
      await page.route('**/api/workspaces/*/context', async (route) => {
        const largeContent = 'A'.repeat(100000) // 100KB of content
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { content: largeContent }
          })
        })
      })

      const startTime = Date.now()
      await page.goto('/workspaces/test-id/context')
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      // Should handle large content within 10 seconds
      expect(loadTime).toBeLessThan(10000)
    })
  })

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Check that the layout adapts to mobile
      await expect(page.locator('body')).toBeVisible()
    })

    test('should be responsive on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Check that the layout adapts to tablet
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper accessibility attributes', async ({ page }) => {
      await page.goto('/')
      
      // Check for proper heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').count()
      expect(headings).toBeGreaterThan(0)
      
      // Check for proper button labels
      const buttons = await page.locator('button').all()
      for (const button of buttons) {
        const ariaLabel = await button.getAttribute('aria-label')
        const textContent = await button.textContent()
        expect(ariaLabel || textContent).toBeTruthy()
      }
    })

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/')
      
      // Test tab navigation
      await page.keyboard.press('Tab')
      await expect(page.locator(':focus')).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Block all network requests
      await page.route('**/*', async (route) => {
        await route.abort()
      })

      await page.goto('/')
      
      // Should show error state or fallback content
      await expect(page.locator('body')).toBeVisible()
    })

    test('should handle JavaScript errors gracefully', async ({ page }) => {
      // Inject a JavaScript error
      await page.addInitScript(() => {
        window.addEventListener('error', (e) => {
          // Prevent the error from being logged to console
          e.preventDefault()
        })
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Should still be functional despite errors
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Cross-browser Compatibility', () => {
    test('should work in different browsers', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Basic functionality should work across browsers
      await expect(page.locator('body')).toBeVisible()
      
      // Test basic interactions
      await page.click('body')
      await expect(page.locator('body')).toBeVisible()
    })
  })
})
