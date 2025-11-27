import { test, expect } from '@playwright/test';

test.describe('Header Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve carregar a página inicial sem erros de console', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');
    
    // Verificar que não há erros de console
    expect(consoleErrors).toHaveLength(0);
  });

  test('deve navegar para Home ao clicar no logo', async ({ page }) => {
    await page.goto('/whatsapp/send');
    await page.click('a[href="/"]');
    await expect(page).toHaveURL('/');
  });

  test.describe('Menu WhatsApp', () => {
    test('deve abrir dropdown do WhatsApp', async ({ page }) => {
      await page.click('button:has-text("WhatsApp")');
      await expect(page.locator('a[href="/whatsapp/send"]')).toBeVisible();
    });

    test('deve navegar para Envio em Massa', async ({ page }) => {
      await page.click('button:has-text("WhatsApp")');
      await page.click('a[href="/whatsapp/send"]');
      await expect(page).toHaveURL('/whatsapp/send');
    });

    test('deve navegar para Templates', async ({ page }) => {
      await page.click('button:has-text("WhatsApp")');
      await page.click('a[href="/whatsapp/templates"]');
      await expect(page).toHaveURL('/whatsapp/templates');
    });

    test('deve navegar para Campanhas', async ({ page }) => {
      await page.click('button:has-text("WhatsApp")');
      await page.click('a[href="/whatsapp/campaigns"]');
      await expect(page).toHaveURL('/whatsapp/campaigns');
    });

    test('deve navegar para Sessões WhatsApp', async ({ page }) => {
      await page.click('button:has-text("WhatsApp")');
      await page.click('a[href="/whatsapp/sessions"]');
      await expect(page).toHaveURL('/whatsapp/sessions');
    });

    test('deve navegar para Bloqueios', async ({ page }) => {
      await page.click('button:has-text("WhatsApp")');
      await page.click('a[href="/whatsapp/blocked"]');
      await expect(page).toHaveURL('/whatsapp/blocked');
    });

    test('deve navegar para Dashboard WhatsApp', async ({ page }) => {
      await page.click('button:has-text("WhatsApp")');
      await page.click('a[href="/whatsapp"]');
      await expect(page).toHaveURL('/whatsapp');
    });
  });

  test.describe('Menu Obsidian', () => {
    test('deve abrir dropdown do Obsidian', async ({ page }) => {
      await page.click('button:has-text("Obsidian")');
      await expect(page.locator('a[href="/obsidian/catalogar"]')).toBeVisible();
    });

    test('deve navegar para Catalogar Links', async ({ page }) => {
      await page.click('button:has-text("Obsidian")');
      await page.click('a[href="/obsidian/catalogar"]');
      await expect(page).toHaveURL('/obsidian/catalogar');
    });
  });

  test.describe('Menu Desktop', () => {
    test('deve navegar para Captura de Tela', async ({ page }) => {
      await page.click('a[href="/desktop/capture"]');
      await expect(page).toHaveURL('/desktop/capture');
    });
  });

  test.describe('Menu DeepSite', () => {
    test('deve navegar para Análise de Sites', async ({ page }) => {
      await page.click('a[href="/deepsite"]');
      await expect(page).toHaveURL('/deepsite');
    });
  });

  test.describe('Menu Sistema', () => {
    test('deve abrir dropdown do Sistema', async ({ page }) => {
      await page.click('button:has-text("Sistema")');
      await expect(page.locator('a[href="/auto-healing"]')).toBeVisible();
    });

    test('deve navegar para Auto-Healing', async ({ page }) => {
      await page.click('button:has-text("Sistema")');
      await page.click('a[href="/auto-healing"]');
      await expect(page).toHaveURL('/auto-healing');
    });

    test('deve navegar para Health Checks', async ({ page }) => {
      await page.click('button:has-text("Sistema")');
      await page.click('a[href="/health"]');
      await expect(page).toHaveURL('/health');
    });

    test('deve navegar para Configurar IAs', async ({ page }) => {
      await page.click('button:has-text("Sistema")');
      await page.click('a[href="/configurar-ias"]');
      await expect(page).toHaveURL('/configurar-ias');
    });
  });

  test('não deve ter erros de links aninhados', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('cannot contain a nested')) {
        consoleErrors.push(msg.text());
      }
    });

    // Navegar por várias páginas
    await page.click('button:has-text("WhatsApp")');
    await page.click('a[href="/whatsapp/send"]');
    await page.waitForLoadState('networkidle');
    
    await page.click('a[href="/"]');
    await page.waitForLoadState('networkidle');
    
    await page.click('a[href="/desktop/capture"]');
    await page.waitForLoadState('networkidle');
    
    // Verificar que não há erros de links aninhados
    expect(consoleErrors).toHaveLength(0);
  });
});

test.describe('Header Navigation - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('deve exibir botão do menu mobile', async ({ page }) => {
    await page.goto('/');
    // O MobileMenu usa um ícone Menu, não texto
    await expect(page.locator('button.md\\:hidden')).toBeVisible();
  });

  test('deve abrir drawer ao clicar no menu mobile', async ({ page }) => {
    await page.goto('/');
    // Clicar no botão do menu mobile
    await page.click('button.md\\:hidden');
    // Verificar que o Sheet foi aberto
    await expect(page.locator('text=Menu de Navegação')).toBeVisible();
  });

  test('deve navegar usando o menu mobile', async ({ page }) => {
    await page.goto('/');
    // Abrir menu mobile
    await page.click('button.md\\:hidden');
    // Aguardar Sheet abrir completamente
    await expect(page.locator('text=Menu de Navegação')).toBeVisible();
    // Expandir categoria WhatsApp dentro do Sheet
    await page.locator('[role="dialog"] button:has-text("WhatsApp")').click();
    // Clicar em Envio em Massa
    await page.locator('[role="dialog"] button:has-text("Envio em Massa")').click();
    // Verificar navegação
    await expect(page).toHaveURL('/whatsapp/send');
  });
});
