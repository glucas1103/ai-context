import { test, expect } from '@playwright/test'

test.describe('OAuth GitHub Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login')
  })

  test('should display login page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/AIcontext/)

    // Check main elements are present
    await expect(page.getByText('AIcontext')).toBeVisible()
    await expect(page.getByText('Transformez votre codebase en documentation vivante')).toBeVisible()
    await expect(page.getByText('Connectez-vous pour commencer')).toBeVisible()
    
    // Check GitHub login button
    const githubButton = page.getByRole('button', { name: /se connecter avec github/i })
    await expect(githubButton).toBeVisible()
    await expect(githubButton).toBeEnabled()

    // Check security message
    await expect(page.getByText('🔒 Vos données restent privées et sécurisées')).toBeVisible()
  })

  test('should apply dark theme correctly', async ({ page }) => {
    // Check that dark theme classes are applied
    const body = page.locator('body')
    const mainContainer = page.locator('.min-h-screen.bg-gray-900')
    
    await expect(mainContainer).toBeVisible()
    
    // Check button has correct styling
    const githubButton = page.getByRole('button', { name: /se connecter avec github/i })
    await expect(githubButton).toHaveClass(/bg-blue-600/)
  })

  test('should handle error states from URL parameters', async ({ page }) => {
    // Test different error scenarios
    const errorCases = [
      { param: 'auth_error', message: 'Erreur lors de l\'authentification. Veuillez réessayer.' },
      { param: 'no_code', message: 'Code d\'autorisation manquant. Veuillez réessayer la connexion.' },
      { param: 'unexpected_error', message: 'Une erreur inattendue s\'est produite. Veuillez réessayer.' },
      { param: 'unknown_error', message: 'Une erreur s\'est produite lors de la connexion.' },
    ]

    for (const errorCase of errorCases) {
      await page.goto(`/login?error=${errorCase.param}`)
      await expect(page.getByText(errorCase.message)).toBeVisible()
    }
  })

  test('should initiate OAuth flow when clicking GitHub button', async ({ page }) => {
    // Mock the OAuth redirect to avoid actual GitHub OAuth in tests
    await page.route('**/auth/v1/authorize*', async route => {
      // Simulate successful OAuth callback
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/auth/callback?code=test_code_123'
        }
      })
    })

    // Click the GitHub login button
    const githubButton = page.getByRole('button', { name: /se connecter avec github/i })
    await githubButton.click()

    // Wait for loading state
    await expect(page.getByText('Connexion en cours...')).toBeVisible()
    await expect(githubButton).toBeDisabled()
  })

  test('should redirect authenticated users to repos page', async ({ page }) => {
    // Mock authenticated state by setting up session storage
    await page.addInitScript(() => {
      // Simulate authenticated state
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock_token',
        user: { id: '123', email: 'test@example.com' }
      }))
    })

    // Mock API calls
    await page.route('**/auth/v1/user', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '123',
          email: 'test@example.com',
          user_metadata: { name: 'Test User' }
        })
      })
    })

    await page.goto('/login')
    
    // Should redirect to repos page
    await expect(page).toHaveURL('/repos')
  })

  test('should handle repos page after successful authentication', async ({ page }) => {
    // Mock authenticated session
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock_token',
        user: { id: '123', email: 'test@example.com' }
      }))
    })

    // Mock API responses
    await page.route('**/auth/v1/user', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '123',
          email: 'test@example.com',
          user_metadata: { name: 'Test User' }
        })
      })
    })

    await page.route('**/api/github/repos', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          repos: [
            {
              id: 1,
              name: 'test-repo',
              fullName: 'user/test-repo',
              description: 'Test repository',
              url: 'https://github.com/user/test-repo',
              isPrivate: false,
              owner: {
                login: 'user',
                avatarUrl: 'https://github.com/user.png'
              },
              updatedAt: '2023-01-01T00:00:00Z',
              language: 'TypeScript',
              stars: 10,
              size: 1024
            }
          ],
          total: 1
        })
      })
    })

    await page.goto('/repos')

    // Check repos page elements
    await expect(page.getByText('test-repo')).toBeVisible()
    await expect(page.getByText('Test repository')).toBeVisible()
    await expect(page.getByText('TypeScript')).toBeVisible()
  })

  test('should handle unauthorized access to repos page', async ({ page }) => {
    // Mock unauthenticated state
    await page.route('**/auth/v1/user', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { message: 'Auth session missing!' }
        })
      })
    })

    await page.goto('/repos')
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login')
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock authenticated session
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock_token',
        user: { id: '123', email: 'test@example.com' }
      }))
    })

    await page.route('**/auth/v1/user', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '123',
          email: 'test@example.com'
        })
      })
    })

    // Mock API error
    await page.route('**/api/github/repos', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            message: 'Token GitHub expiré ou invalide',
            code: 'github_token_invalid'
          }
        })
      })
    })

    await page.goto('/repos')

    // Should show error message
    await expect(page.getByText(/erreur/i)).toBeVisible()
  })

  test('should have responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')

    // Check that layout adapts to mobile
    const container = page.locator('.max-w-md')
    await expect(container).toBeVisible()

    // Check button is still accessible
    const githubButton = page.getByRole('button', { name: /se connecter avec github/i })
    await expect(githubButton).toBeVisible()
    await expect(githubButton).toBeEnabled()
  })

  test('should handle search functionality in repos page', async ({ page }) => {
    // Mock authenticated state and repos
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock_token',
        user: { id: '123', email: 'test@example.com' }
      }))
    })

    await page.route('**/auth/v1/user', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '123',
          email: 'test@example.com'
        })
      })
    })

    await page.route('**/api/github/repos', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          repos: [
            {
              id: 1,
              name: 'react-app',
              fullName: 'user/react-app',
              description: 'React application',
              url: 'https://github.com/user/react-app',
              isPrivate: false,
              owner: { login: 'user', avatarUrl: 'https://github.com/user.png' },
              updatedAt: '2023-01-01T00:00:00Z',
              language: 'JavaScript',
              stars: 5,
              size: 512
            },
            {
              id: 2,
              name: 'vue-app',
              fullName: 'user/vue-app',
              description: 'Vue application',
              url: 'https://github.com/user/vue-app',
              isPrivate: true,
              owner: { login: 'user', avatarUrl: 'https://github.com/user.png' },
              updatedAt: '2023-01-02T00:00:00Z',
              language: 'TypeScript',
              stars: 3,
              size: 256
            }
          ],
          total: 2
        })
      })
    })

    await page.goto('/repos')

    // Wait for repos to load
    await expect(page.getByText('react-app')).toBeVisible()
    await expect(page.getByText('vue-app')).toBeVisible()

    // Test search functionality
    const searchInput = page.getByPlaceholder(/rechercher/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill('react')
      
      // Should show only react-app
      await expect(page.getByText('react-app')).toBeVisible()
      await expect(page.getByText('vue-app')).not.toBeVisible()
    }
  })
})
