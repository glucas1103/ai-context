import { test, expect } from '@playwright/test'

// Test du parcours complet d'analyse de dépôt
test.describe('Repository Analysis Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock des appels API pour éviter les dépendances externes
    await page.route('**/api/github/repos', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          repos: [
            {
              id: 1,
              name: 'test-repo',
              fullName: 'testuser/test-repo',
              description: 'Repository de test pour l\'analyse',
              url: 'https://github.com/testuser/test-repo',
              isPrivate: false,
              owner: {
                login: 'testuser',
                avatarUrl: 'https://github.com/testuser.png'
              },
              updatedAt: '2024-01-15T10:00:00Z',
              language: 'TypeScript',
              stars: 42,
              size: 1024
            }
          ],
          total: 1
        })
      })
    })

    await page.route('**/api/workspaces', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'workspace-123',
              name: 'test-repo',
              url: 'https://github.com/testuser/test-repo',
              created_at: '2024-01-15T10:00:00Z'
            }
          })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'workspace-123',
                name: 'test-repo',
                url: 'https://github.com/testuser/test-repo',
                created_at: '2024-01-15T10:00:00Z'
              }
            ]
          })
        })
      }
    })

    await page.route('**/api/workspaces/workspace-123/analyze', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            knowledgeBaseId: 'kb-123',
            fileCount: 5,
            structure: [
              {
                id: 'src',
                name: 'src',
                path: 'src',
                type: 'directory',
                children: [
                  {
                    id: 'src/index.ts',
                    name: 'index.ts',
                    path: 'src/index.ts',
                    type: 'file',
                    size: 1024,
                    language: 'typescript'
                  }
                ]
              },
              {
                id: 'README.md',
                name: 'README.md',
                path: 'README.md',
                type: 'file',
                size: 512,
                language: 'markdown'
              }
            ]
          }
        })
      })
    })

    await page.route('**/api/workspaces/workspace-123/tree', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            structure: [
              {
                id: 'src',
                name: 'src',
                path: 'src',
                type: 'directory',
                children: [
                  {
                    id: 'src/index.ts',
                    name: 'index.ts',
                    path: 'src/index.ts',
                    type: 'file',
                    size: 1024,
                    language: 'typescript'
                  }
                ]
              },
              {
                id: 'README.md',
                name: 'README.md',
                path: 'README.md',
                type: 'file',
                size: 512,
                language: 'markdown'
              }
            ]
          }
        })
      })
    })

    await page.route('**/api/workspaces/workspace-123/file-content**', async route => {
      const url = new URL(route.request().url())
      const path = url.searchParams.get('path')
      
      let content = ''
      if (path === 'src/index.ts') {
        content = `export function hello(name: string): string {
  return \`Hello, \${name}!\`
}

console.log(hello('World'))`
      } else if (path === 'README.md') {
        content = `# Test Repository

This is a test repository for AIcontext analysis.

## Features

- TypeScript support
- Modern tooling
- Test coverage`
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            path,
            content
          }
        })
      })
    })

    // Mock de l'authentification
    await page.addInitScript(() => {
      // Simuler un utilisateur connecté
      window.localStorage.setItem('sb-ettslixliqlkakularea-auth-token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User',
            avatar_url: 'https://github.com/testuser.png'
          }
        }
      }))
    })
  })

  test('should complete repository analysis workflow', async ({ page }) => {
    // 1. Aller à la page des dépôts
    await page.goto('/repos')

    // Vérifier que la page se charge
    await expect(page.locator('h2')).toContainText('Vos Dépôts GitHub')

    // 2. Vérifier qu'on voit le dépôt de test
    await expect(page.locator('[data-testid="repo-card"]').first()).toBeVisible()
    await expect(page.locator('h3')).toContainText('test-repo')

    // 3. Cliquer sur le bouton "Analyser"
    const analyzeButton = page.locator('button', { hasText: 'Analyser' }).first()
    await expect(analyzeButton).toBeVisible()
    
    // Vérifier l'état de chargement
    await analyzeButton.click()
    await expect(page.locator('button', { hasText: 'Analyse...' })).toBeVisible()

    // 4. Attendre la redirection vers la vue de contexte
    await page.waitForURL('**/workspaces/workspace-123/context')

    // 5. Vérifier que la vue triple panneau se charge
    await expect(page.locator('h1')).toContainText('test-repo')
    await expect(page.locator('h2', { hasText: 'Arborescence' })).toBeVisible()

    // 6. Vérifier que l'arborescence contient les fichiers attendus
    await expect(page.locator('text=src')).toBeVisible()
    await expect(page.locator('text=README.md')).toBeVisible()

    // 7. Cliquer sur un fichier pour l'ouvrir
    await page.locator('text=index.ts').click()

    // 8. Vérifier que le contenu du fichier s'affiche dans Monaco Editor
    await expect(page.locator('[data-testid="file-viewer"]')).toBeVisible()
    
    // Attendre que Monaco Editor charge le contenu
    await page.waitForTimeout(1000)
    
    // 9. Vérifier les informations du fichier sélectionné
    await expect(page.locator('text=src/index.ts')).toBeVisible()
    await expect(page.locator('text=typescript')).toBeVisible()

    // 10. Tester la sélection d'un autre fichier
    await page.locator('text=README.md').click()
    await expect(page.locator('text=README.md')).toBeVisible()
    await expect(page.locator('text=markdown')).toBeVisible()
  })

  test('should handle search in repository list', async ({ page }) => {
    await page.goto('/repos')

    // Attendre que la page se charge
    await expect(page.locator('h2')).toContainText('Vos Dépôts GitHub')

    // Utiliser la barre de recherche
    const searchInput = page.locator('input[placeholder*="Rechercher"]')
    await searchInput.fill('test')

    // Vérifier que le résultat est filtré
    await expect(page.locator('text=1 dépôt trouvé pour "test"')).toBeVisible()

    // Recherche qui ne retourne rien
    await searchInput.fill('inexistant')
    await expect(page.locator('text=Aucun dépôt trouvé pour "inexistant"')).toBeVisible()
  })

  test('should handle navigation back to repos', async ({ page }) => {
    // Aller directement à la vue de contexte
    await page.goto('/workspaces/workspace-123/context')

    // Vérifier que la page se charge
    await expect(page.locator('h1')).toContainText('test-repo')

    // Cliquer sur "Retour aux dépôts"
    await page.locator('button', { hasText: 'Retour aux dépôts' }).click()

    // Vérifier la redirection
    await page.waitForURL('**/repos')
    await expect(page.locator('h2')).toContainText('Vos Dépôts GitHub')
  })

  test('should show loading states appropriately', async ({ page }) => {
    await page.goto('/repos')

    // Vérifier l'état de chargement initial (si nécessaire)
    await expect(page.locator('h2')).toContainText('Vos Dépôts GitHub')

    // Simuler un délai dans l'analyse
    await page.route('**/api/workspaces/workspace-123/analyze', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { knowledgeBaseId: 'kb-123', fileCount: 5 }
        })
      })
    })

    // Cliquer sur analyser et vérifier l'état de chargement
    const analyzeButton = page.locator('button', { hasText: 'Analyser' }).first()
    await analyzeButton.click()

    // Vérifier que le bouton montre l'état de chargement
    await expect(page.locator('button', { hasText: 'Analyse...' })).toBeVisible()
    await expect(page.locator('.animate-spin')).toBeVisible()
  })

  test('should handle errors gracefully', async ({ page }) => {
    // Mock d'une erreur d'analyse
    await page.route('**/api/workspaces/workspace-123/analyze', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            message: 'Erreur lors de l\'analyse du dépôt',
            code: 'analysis_error'
          }
        })
      })
    })

    await page.goto('/repos')

    // Cliquer sur analyser
    const analyzeButton = page.locator('button', { hasText: 'Analyser' }).first()
    await analyzeButton.click()

    // Vérifier que l'erreur s'affiche
    await expect(page.locator('.bg-red-900')).toBeVisible()
    await expect(page.locator('text=Erreur lors de l\'analyse du dépôt')).toBeVisible()
  })
})
