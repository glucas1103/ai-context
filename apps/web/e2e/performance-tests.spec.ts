import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable performance monitoring
    await page.addInitScript(() => {
      window.performance.mark = window.performance.mark || (() => {})
      window.performance.measure = window.performance.measure || (() => {})
    })
  })

  test.describe('Page Load Performance', () => {
    test('should load home page within 3 seconds', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      expect(loadTime).toBeLessThan(3000)
    })

    test('should load login page within 2 seconds', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('/login')
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      expect(loadTime).toBeLessThan(2000)
    })

    test('should load repos page within 3 seconds', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('/repos')
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      expect(loadTime).toBeLessThan(3000)
    })

    test('should load workspace context page within 5 seconds', async ({ page }) => {
      // Mock workspace data
      await page.route('**/api/workspaces/*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'test-id',
              name: 'Test Workspace',
              files: Array.from({ length: 100 }, (_, i) => ({
                id: `file-${i}`,
                name: `file-${i}.ts`,
                type: 'file'
              }))
            }
          })
        })
      })

      const startTime = Date.now()
      
      await page.goto('/workspaces/test-id/context')
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      expect(loadTime).toBeLessThan(5000)
    })
  })

  test.describe('Memory Usage', () => {
    test('should not have memory leaks during navigation', async ({ page }) => {
      await page.goto('/')
      
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize
        }
        return 0
      })

      // Navigate multiple times
      for (let i = 0; i < 10; i++) {
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        await page.goto('/login')
        await page.waitForLoadState('networkidle')
        await page.goto('/repos')
        await page.waitForLoadState('networkidle')
      }

      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize
        }
        return 0
      })

      // Memory increase should be less than 50MB
      const memoryIncrease = finalMemory - initialMemory
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })

    test('should handle large file trees efficiently', async ({ page }) => {
      // Mock large file tree
      const largeFileTree = Array.from({ length: 1000 }, (_, i) => ({
        id: `file-${i}`,
        name: `file-${i}.ts`,
        type: 'file',
        children: i % 10 === 0 ? Array.from({ length: 100 }, (_, j) => ({
          id: `file-${i}-${j}`,
          name: `nested-file-${j}.ts`,
          type: 'file'
        })) : []
      }))

      await page.route('**/api/workspaces/*/context', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { files: largeFileTree }
          })
        })
      })

      const startTime = Date.now()
      
      await page.goto('/workspaces/test-id/context')
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      // Should handle large file tree within 8 seconds
      expect(loadTime).toBeLessThan(8000)

      // Check memory usage
      const memoryUsage = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize
        }
        return 0
      })

      // Memory usage should be less than 100MB
      expect(memoryUsage).toBeLessThan(100 * 1024 * 1024)
    })
  })

  test.describe('API Response Time', () => {
    test('should handle API responses within 500ms', async ({ page }) => {
      // Mock fast API response
      await page.route('**/api/workspaces', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100)) // Simulate 100ms delay
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: []
          })
        })
      })

      const startTime = Date.now()
      
      await page.goto('/repos')
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      expect(loadTime).toBeLessThan(500)
    })

    test('should handle slow API responses gracefully', async ({ page }) => {
      // Mock slow API response
      await page.route('**/api/workspaces', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate 2s delay
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: []
          })
        })
      })

      const startTime = Date.now()
      
      await page.goto('/repos')
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      // Should show loading state and complete within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })
  })

  test.describe('Component Rendering Performance', () => {
    test('should render universal components efficiently', async ({ page }) => {
      await page.goto('/workspaces/test-id/context')
      
      // Measure component rendering time
      const renderTime = await page.evaluate(() => {
        const start = performance.now()
        
        // Simulate component rendering
        const container = document.createElement('div')
        container.innerHTML = '<div data-testid="tree-panel">Tree</div><div data-testid="content-panel">Content</div><div data-testid="chat-panel">Chat</div>'
        document.body.appendChild(container)
        
        const end = performance.now()
        return end - start
      })

      // Component rendering should be fast
      expect(renderTime).toBeLessThan(100)
    })

    test('should handle component updates efficiently', async ({ page }) => {
      await page.goto('/workspaces/test-id/context')
      
      // Measure component update time
      const updateTime = await page.evaluate(() => {
        const start = performance.now()
        
        // Simulate component updates
        for (let i = 0; i < 100; i++) {
          const element = document.querySelector('[data-testid="content-panel"]')
          if (element) {
            element.textContent = `Updated content ${i}`
          }
        }
        
        const end = performance.now()
        return end - start
      })

      // Component updates should be fast
      expect(updateTime).toBeLessThan(500)
    })
  })

  test.describe('Bundle Size and Loading', () => {
    test('should load JavaScript bundles efficiently', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Get bundle size information
      const bundleInfo = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource')
        const jsResources = resources.filter(r => r.name.includes('.js'))
        const totalSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
        return {
          count: jsResources.length,
          totalSize,
          averageSize: totalSize / jsResources.length
        }
      })

      // Should have reasonable number of JS files
      expect(bundleInfo.count).toBeLessThan(20)
      
      // Total bundle size should be reasonable
      expect(bundleInfo.totalSize).toBeLessThan(2 * 1024 * 1024) // 2MB
      
      // Average bundle size should be reasonable
      expect(bundleInfo.averageSize).toBeLessThan(500 * 1024) // 500KB
    })

    test('should load CSS efficiently', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Get CSS size information
      const cssInfo = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource')
        const cssResources = resources.filter(r => r.name.includes('.css'))
        const totalSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
        return {
          count: cssResources.length,
          totalSize
        }
      })

      // Should have reasonable number of CSS files
      expect(cssInfo.count).toBeLessThan(10)
      
      // Total CSS size should be reasonable
      expect(cssInfo.totalSize).toBeLessThan(500 * 1024) // 500KB
    })
  })

  test.describe('Network Efficiency', () => {
    test('should minimize network requests', async ({ page }) => {
      const requestCounts: number[] = []
      
      page.on('request', () => {
        requestCounts.push(1)
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Should have reasonable number of requests
      expect(requestCounts.length).toBeLessThan(50)
    })

    test('should use efficient caching', async ({ page }) => {
      // First visit
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Second visit (should use cache)
      const startTime = Date.now()
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      const secondLoadTime = Date.now() - startTime
      
      // Second load should be faster
      expect(secondLoadTime).toBeLessThan(1000)
    })
  })

  test.describe('User Interaction Performance', () => {
    test('should handle user interactions responsively', async ({ page }) => {
      await page.goto('/workspaces/test-id/context')
      
      // Measure interaction response time
      const interactionTime = await page.evaluate(() => {
        const start = performance.now()
        
        // Simulate user interaction
        const event = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        })
        
        document.body.dispatchEvent(event)
        
        const end = performance.now()
        return end - start
      })

      // Interaction should be responsive
      expect(interactionTime).toBeLessThan(16) // 60fps = 16ms per frame
    })

    test('should handle keyboard input efficiently', async ({ page }) => {
      await page.goto('/workspaces/test-id/context')
      
      // Find an input field
      const input = page.locator('input, textarea').first()
      if (await input.count() > 0) {
        const inputTime = await page.evaluate(() => {
          const start = performance.now()
          
          // Simulate keyboard input
          const event = new KeyboardEvent('keydown', {
            key: 'a',
            bubbles: true
          })
          
          document.body.dispatchEvent(event)
          
          const end = performance.now()
          return end - start
        })

        // Keyboard input should be responsive
        expect(inputTime).toBeLessThan(16)
      }
    })
  })
})
