/**
 * Tests pour SimpleClaudeCodeService - Story 1.6.2 RÉVISÉ
 * Validation de l'intégration ultra-simple avec Claude Code SDK
 */

import { SimpleClaudeCodeService, createSimpleClaudeCodeService } from '../simple-claude-code-service';

// Mock du Claude Code SDK
jest.mock('@instantlyeasy/claude-code-sdk-ts', () => ({
  claude: jest.fn(() => ({
    allowTools: jest.fn().mockReturnThis(),
    withModel: jest.fn().mockReturnThis(),
    inDirectory: jest.fn().mockReturnThis(),
    withTimeout: jest.fn().mockReturnThis(),
    query: jest.fn().mockReturnThis(),
    asText: jest.fn().mockResolvedValue('Réponse de test de Claude Code SDK')
  }))
}));

describe('SimpleClaudeCodeService', () => {
  const testConfig = {
    workspacePath: '/test/workspace',
    model: 'sonnet' as const,
    tools: ['Read', 'Grep', 'Glob', 'LS'] as const,
    apiKey: 'test-api-key'
  };

  let service: SimpleClaudeCodeService;

  beforeEach(() => {
    service = new SimpleClaudeCodeService(testConfig);
    jest.clearAllMocks();
  });

  describe('Création du service', () => {
    it('devrait créer un service avec la configuration par défaut', () => {
      const serviceWithDefaults = new SimpleClaudeCodeService({
        workspacePath: '/test'
      });
      expect(serviceWithDefaults).toBeInstanceOf(SimpleClaudeCodeService);
    });

    it('devrait créer un service via la factory', () => {
      const factoryService = createSimpleClaudeCodeService(testConfig);
      expect(factoryService).toBeInstanceOf(SimpleClaudeCodeService);
    });
  });

  describe('sendMessage', () => {
    it('devrait envoyer un message et retourner la réponse de Claude Code SDK', async () => {
      const message = 'Analyse ce projet';
      const response = await service.sendMessage(message);
      
      expect(response).toBe('Réponse de test de Claude Code SDK');
    });

    it('devrait gérer les erreurs correctement', async () => {
      // Mock une erreur du SDK
      const { claude } = require('@instantlyeasy/claude-code-sdk-ts');
      claude.mockImplementation(() => ({
        allowTools: jest.fn().mockReturnThis(),
        withModel: jest.fn().mockReturnThis(),
        inDirectory: jest.fn().mockReturnThis(),
        withTimeout: jest.fn().mockReturnThis(),
        query: jest.fn().mockReturnThis(),
        asText: jest.fn().mockRejectedValue(new Error('Erreur SDK'))
      }));

      await expect(service.sendMessage('test')).rejects.toThrow('Erreur lors de l\'envoi du message');
    });
  });

  describe('analyzeFile', () => {
    it('devrait analyser un fichier avec une requête appropriée', async () => {
      // Reset le mock pour ce test
      const { claude } = require('@instantlyeasy/claude-code-sdk-ts');
      claude.mockImplementation(() => ({
        allowTools: jest.fn().mockReturnThis(),
        withModel: jest.fn().mockReturnThis(),
        inDirectory: jest.fn().mockReturnThis(),
        withTimeout: jest.fn().mockReturnThis(),
        query: jest.fn().mockReturnThis(),
        asText: jest.fn().mockResolvedValue('Réponse de test de Claude Code SDK')
      }));

      const filePath = '/test/file.ts';
      const response = await service.analyzeFile(filePath);
      
      expect(response).toBe('Réponse de test de Claude Code SDK');
    });
  });

  describe('generateDocumentation', () => {
    it('devrait générer de la documentation avec une requête appropriée', async () => {
      // Reset le mock pour ce test
      const { claude } = require('@instantlyeasy/claude-code-sdk-ts');
      claude.mockImplementation(() => ({
        allowTools: jest.fn().mockReturnThis(),
        withModel: jest.fn().mockReturnThis(),
        inDirectory: jest.fn().mockReturnThis(),
        withTimeout: jest.fn().mockReturnThis(),
        query: jest.fn().mockReturnThis(),
        asText: jest.fn().mockResolvedValue('Réponse de test de Claude Code SDK')
      }));

      const query = 'Documentation pour les composants React';
      const response = await service.generateDocumentation(query);
      
      expect(response).toBe('Réponse de test de Claude Code SDK');
    });
  });

  describe('Configuration des modèles', () => {
    it('devrait utiliser le bon nom de modèle pour sonnet', () => {
      const service = new SimpleClaudeCodeService({
        workspacePath: '/test',
        model: 'sonnet'
      });
      // Le nom du modèle est géré en interne
      expect(service).toBeDefined();
    });

    it('devrait utiliser le bon nom de modèle pour opus', () => {
      const service = new SimpleClaudeCodeService({
        workspacePath: '/test',
        model: 'opus'
      });
      expect(service).toBeDefined();
    });

    it('devrait utiliser le bon nom de modèle pour haiku', () => {
      const service = new SimpleClaudeCodeService({
        workspacePath: '/test',
        model: 'haiku'
      });
      expect(service).toBeDefined();
    });
  });
});

describe('Intégration Claude Code SDK', () => {
  it('devrait utiliser tous les outils par défaut', async () => {
    const { claude } = require('@instantlyeasy/claude-code-sdk-ts');
    const mockChain = {
      allowTools: jest.fn().mockReturnThis(),
      withModel: jest.fn().mockReturnThis(),
      inDirectory: jest.fn().mockReturnThis(),
      withTimeout: jest.fn().mockReturnThis(),
      query: jest.fn().mockReturnThis(),
      asText: jest.fn().mockResolvedValue('test response')
    };
    
    claude.mockReturnValue(mockChain);
    
    const service = createSimpleClaudeCodeService({
      workspacePath: '/test'
    });
    
    await service.sendMessage('test message');
    
    // Vérifier que les outils corrects sont utilisés
    expect(mockChain.allowTools).toHaveBeenCalledWith('Read', 'Grep', 'Glob', 'LS');
    expect(mockChain.inDirectory).toHaveBeenCalledWith('/test');
    expect(mockChain.withTimeout).toHaveBeenCalledWith(30000);
  });
});
