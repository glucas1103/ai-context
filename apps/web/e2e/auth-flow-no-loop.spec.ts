import { test, expect } from '@playwright/test'

test.describe('Authentication Flow - No Infinite Loop', () => {
  test('should not create infinite loop between login and repos', async ({ page }) => {
    // Aller sur la page de login
    await page.goto('http://localhost:3000/login')
    
    // Attendre que la page se charge
    await page.waitForLoadState('networkidle')
    
    // Vérifier qu'on est bien sur la page de login
    await expect(page).toHaveURL('http://localhost:3000/login')
    
    // Vérifier que le bouton de connexion GitHub est présent
    await expect(page.getByRole('button', { name: 'Se connecter avec GitHub' })).toBeVisible()
    
    // Attendre un peu pour s'assurer qu'il n'y a pas de redirection automatique
    await page.waitForTimeout(2000)
    
    // Vérifier qu'on est toujours sur la page de login
    await expect(page).toHaveURL('http://localhost:3000/login')
    
    // Aller sur la page repos (sans être connecté)
    await page.goto('http://localhost:3000/repos')
    
    // Attendre la redirection
    await page.waitForLoadState('networkidle')
    
    // Vérifier qu'on a été redirigé vers login
    await expect(page).toHaveURL('http://localhost:3000/login')
    
    // Attendre un peu pour s'assurer qu'il n'y a pas de boucle
    await page.waitForTimeout(2000)
    
    // Vérifier qu'on est toujours sur login
    await expect(page).toHaveURL('http://localhost:3000/login')
  })

  test('should handle authentication state changes correctly', async ({ page }) => {
    // Aller sur la page de login
    await page.goto('http://localhost:3000/login')
    
    // Attendre que la page se charge
    await page.waitForLoadState('networkidle')
    
    // Vérifier qu'on est sur login
    await expect(page).toHaveURL('http://localhost:3000/login')
    
    // Simuler un changement d'état d'authentification (mock)
    await page.evaluate(() => {
      // Simuler un utilisateur authentifié
      localStorage.setItem('supabase.auth.token', 'mock-token')
    })
    
    // Recharger la page pour simuler un changement d'état
    await page.reload()
    
    // Attendre que la page se recharge
    await page.waitForLoadState('networkidle')
    
    // Vérifier qu'on est toujours sur login (car le token mock n'est pas valide)
    await expect(page).toHaveURL('http://localhost:3000/login')
    
    // Attendre pour s'assurer qu'il n'y a pas de boucle
    await page.waitForTimeout(2000)
    
    // Vérifier qu'on est toujours sur login
    await expect(page).toHaveURL('http://localhost:3000/login')
  })

  test('should allow access to public pages without authentication', async ({ page }) => {
    // Tester l'accès à la page d'accueil
    await page.goto('http://localhost:3000/')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('http://localhost:3000/')
    
    // Tester l'accès à une page d'erreur
    await page.goto('http://localhost:3000/error')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('http://localhost:3000/error')
    
    // Tester l'accès au callback auth
    await page.goto('http://localhost:3000/auth/callback')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('http://localhost:3000/auth/callback')
  })

  test('should redirect protected pages to login', async ({ page }) => {
    const protectedPages = [
      '/repos',
      '/workspaces',
      '/workspaces/123/context',
      '/workspaces/123/documentation',
      '/workspaces/123/issues'
    ]
    
    for (const protectedPage of protectedPages) {
      await page.goto(`http://localhost:3000${protectedPage}`)
      await page.waitForLoadState('networkidle')
      
      // Vérifier qu'on a été redirigé vers login
      await expect(page).toHaveURL('http://localhost:3000/login')
      
      // Attendre un peu pour s'assurer qu'il n'y a pas de boucle
      await page.waitForTimeout(1000)
      
      // Vérifier qu'on est toujours sur login
      await expect(page).toHaveURL('http://localhost:3000/login')
    }
  })
})
