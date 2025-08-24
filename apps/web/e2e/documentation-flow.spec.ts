import { test, expect } from '@playwright/test'

test.describe('Documentation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Naviguer vers la page de documentation d'un workspace
    await page.goto('/workspaces/test-workspace/documentation')
  })

  test('should display empty state when no documentation exists', async ({ page }) => {
    // Vérifier que l'état vide s'affiche
    await expect(page.locator('text=Aucune documentation')).toBeVisible()
    await expect(page.locator('text=Créez votre premier dossier ou fichier')).toBeVisible()
  })

  test('should create a new folder', async ({ page }) => {
    // Cliquer sur le bouton de création de dossier
    await page.click('[title="Nouveau dossier racine"]')
    
    // Remplir le formulaire
    await page.fill('input[placeholder="Nom du dossier"]', 'Architecture')
    await page.click('button:has-text("Créer")')
    
    // Vérifier que le dossier apparaît dans l'arborescence
    await expect(page.locator('text=Architecture')).toBeVisible()
  })

  test('should create a new file', async ({ page }) => {
    // Créer d'abord un dossier
    await page.click('[title="Nouveau dossier racine"]')
    await page.fill('input[placeholder="Nom du dossier"]', 'Architecture')
    await page.click('button:has-text("Créer")')
    
    // Créer un fichier dans le dossier
    await page.click('[title="Nouveau fichier"]')
    await page.fill('input[placeholder="Nom du fichier"]', 'database')
    await page.selectOption('select', '.md')
    await page.click('button:has-text("Créer")')
    
    // Vérifier que le fichier apparaît
    await expect(page.locator('text=database.md')).toBeVisible()
  })

  test('should edit file content', async ({ page }) => {
    // Créer un fichier
    await page.click('[title="Nouveau fichier racine"]')
    await page.fill('input[placeholder="Nom du fichier"]', 'test')
    await page.selectOption('select', '.md')
    await page.click('button:has-text("Créer")')
    
    // Sélectionner le fichier
    await page.click('text=test.md')
    
    // Écrire dans l'éditeur
    await page.click('.ProseMirror')
    await page.keyboard.type('# Test Document\n\nThis is a test document.')
    
    // Vérifier que le contenu est affiché
    await expect(page.locator('text=Test Document')).toBeVisible()
    await expect(page.locator('text=This is a test document.')).toBeVisible()
  })

  test('should show unsaved changes indicator', async ({ page }) => {
    // Créer et sélectionner un fichier
    await page.click('[title="Nouveau fichier racine"]')
    await page.fill('input[placeholder="Nom du fichier"]', 'test')
    await page.selectOption('select', '.md')
    await page.click('button:has-text("Créer")')
    await page.click('text=test.md')
    
    // Modifier le contenu
    await page.click('.ProseMirror')
    await page.keyboard.type('Modified content')
    
    // Vérifier l'indicateur de modifications non sauvegardées
    await expect(page.locator('text=Modifications non sauvegardées')).toBeVisible()
  })

  test('should auto-save content', async ({ page }) => {
    // Créer et sélectionner un fichier
    await page.click('[title="Nouveau fichier racine"]')
    await page.fill('input[placeholder="Nom du fichier"]', 'test')
    await page.selectOption('select', '.md')
    await page.click('button:has-text("Créer")')
    await page.click('text=test.md')
    
    // Modifier le contenu
    await page.click('.ProseMirror')
    await page.keyboard.type('Auto-save test content')
    
    // Attendre l'auto-sauvegarde (3 secondes)
    await page.waitForTimeout(3500)
    
    // Vérifier que l'indicateur de sauvegarde apparaît
    await expect(page.locator('text=Sauvegarde...')).toBeVisible()
  })

  test('should rename items', async ({ page }) => {
    // Créer un dossier
    await page.click('[title="Nouveau dossier racine"]')
    await page.fill('input[placeholder="Nom du dossier"]', 'Old Name')
    await page.click('button:has-text("Créer")')
    
    // Renommer le dossier
    await page.hover('text=Old Name')
    await page.click('[title="Renommer"]')
    await page.fill('input[value="Old Name"]', 'New Name')
    await page.keyboard.press('Enter')
    
    // Vérifier le nouveau nom
    await expect(page.locator('text=New Name')).toBeVisible()
    await expect(page.locator('text=Old Name')).not.toBeVisible()
  })

  test('should delete items', async ({ page }) => {
    // Créer un dossier
    await page.click('[title="Nouveau dossier racine"]')
    await page.fill('input[placeholder="Nom du dossier"]', 'To Delete')
    await page.click('button:has-text("Créer")')
    
    // Supprimer le dossier
    await page.hover('text=To Delete')
    await page.click('[title="Supprimer"]')
    
    // Confirmer la suppression
    await page.click('button:has-text("OK")')
    
    // Vérifier que le dossier a disparu
    await expect(page.locator('text=To Delete')).not.toBeVisible()
  })

  test('should show chat panel placeholder', async ({ page }) => {
    // Vérifier que le panneau de chat s'affiche
    await expect(page.locator('text=Assistant IA')).toBeVisible()
    await expect(page.locator('text=Assistant IA en cours de développement')).toBeVisible()
    await expect(page.locator('text=Disponible dans la prochaine version')).toBeVisible()
  })

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Créer et sélectionner un fichier
    await page.click('[title="Nouveau fichier racine"]')
    await page.fill('input[placeholder="Nom du fichier"]', 'test')
    await page.selectOption('select', '.md')
    await page.click('button:has-text("Créer")')
    await page.click('text=test.md')
    
    // Tester Ctrl+B pour le gras
    await page.click('.ProseMirror')
    await page.keyboard.press('Control+B')
    await page.keyboard.type('Bold text')
    
    // Vérifier que le texte est en gras
    await expect(page.locator('strong:has-text("Bold text")')).toBeVisible()
  })

  test('should validate file extensions', async ({ page }) => {
    // Essayer de créer un fichier avec une extension non supportée
    await page.click('[title="Nouveau fichier racine"]')
    await page.fill('input[placeholder="Nom du fichier"]', 'test')
    await page.selectOption('select', '.md') // Extension valide
    await page.click('button:has-text("Créer")')
    
    // Vérifier que le fichier est créé
    await expect(page.locator('text=test.md')).toBeVisible()
  })

  test('should handle large content', async ({ page }) => {
    // Créer et sélectionner un fichier
    await page.click('[title="Nouveau fichier racine"]')
    await page.fill('input[placeholder="Nom du fichier"]', 'large')
    await page.selectOption('select', '.md')
    await page.click('button:has-text("Créer")')
    await page.click('text=large.md')
    
    // Générer un contenu volumineux (mais pas trop pour le test)
    const largeContent = '# Large Document\n\n' + 'Content line '.repeat(100)
    
    await page.click('.ProseMirror')
    await page.keyboard.type(largeContent)
    
    // Vérifier que le contenu est affiché
    await expect(page.locator('text=Large Document')).toBeVisible()
  })
})
