/**
 * Service Claude Code Ultra-Simple - Story 1.6.2 RÉVISÉ
 * Utilise directement les fonctionnalités NATIVES de Claude Code SDK
 * 
 * PHILOSOPHIE: Laisser Claude Code SDK gérer l'investigation, le raisonnement et l'analyse
 */

import { claude } from '@instantlyeasy/claude-code-sdk-ts';

export interface SimpleClaudeCodeConfig {
  workspacePath: string;
  model?: 'sonnet' | 'opus' | 'haiku';
  tools?: ('Read' | 'Grep' | 'Glob' | 'LS')[];
  apiKey?: string;
}

/**
 * Service Claude Code Ultra-Simple
 * 3 méthodes maximum - Claude Code SDK gère tout le reste
 */
export class SimpleClaudeCodeService {
  private config: SimpleClaudeCodeConfig;

  constructor(config: SimpleClaudeCodeConfig) {
    this.config = {
      model: 'sonnet',
      tools: ['Read', 'Grep', 'Glob', 'LS'],
      ...config
    };
  }

  /**
   * Méthode principale : Envoyer un message à Claude Code
   * Claude Code SDK gère automatiquement :
   * - Investigation autonome
   * - Raisonnement multi-étapes
   * - Utilisation des outils appropriés
   * - Métadonnées d'investigation
   */
  async sendMessage(message: string): Promise<string> {
    try {
      const modelName = this.getModelName();
      
      // Configuration pour utiliser une API key si fournie
      if (this.config.apiKey) {
        // Assurer que l'API key est définie dans l'environnement
        process.env.ANTHROPIC_API_KEY = this.config.apiKey;
      }
      
      // Définir le chemin du CLI Claude Code si nécessaire
      const homeDir = process.env.HOME || process.env.USERPROFILE || '/Users/lucasgaillard';
      const claudeCliPath = `${homeDir}/.npm-global/bin/claude`;
      
      // Ajouter le dossier npm global au PATH si nécessaire
      if (!process.env.PATH?.includes(`${homeDir}/.npm-global/bin`)) {
        process.env.PATH = `${homeDir}/.npm-global/bin:${process.env.PATH}`;
      }
      
      // Vérifier que la clé API est bien définie
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('API key Claude manquante. Configurez ANTHROPIC_API_KEY.');
      }
      
      const claudeInstance = claude();
      
      return await claudeInstance
        .allowTools(...(this.config.tools || ['Read', 'Grep', 'Glob', 'LS']))
        .withModel(modelName)
        .inDirectory(this.config.workspacePath)
        .withTimeout(30000)
        .query(message)
        .asText();
        
    } catch (error) {
      console.error('Erreur Claude Code SDK:', error);
      
      // Messages d'erreur plus explicites
      if (error instanceof Error) {
        if (error.message.includes('Claude Code CLI not found') || error.message.includes('CLINotFoundError')) {
          const homeDir = process.env.HOME || process.env.USERPROFILE || '/Users/lucasgaillard';
          throw new Error(`Claude Code CLI non trouvé dans PATH. CLI disponible à: ${homeDir}/.npm-global/bin/claude. Ajoutez ce dossier à votre PATH ou reinstallez avec: npm install -g @anthropic-ai/claude-code`);
        }
        if (error.message.includes('authentication') || error.message.includes('API key')) {
          throw new Error('API key Claude manquante ou invalide. Configurez ANTHROPIC_API_KEY.');
        }
      }
      
      throw new Error(`Erreur lors de l'envoi du message: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Analyse spécialisée de fichier
   * Claude Code SDK détermine automatiquement les actions nécessaires
   */
  async analyzeFile(filePath: string): Promise<string> {
    const analysisQuery = `Analyse ce fichier en détail: ${filePath}
    
Identifie:
- La complexité et la structure du code
- Les dépendances et imports
- Les fonctions et classes principales
- Les problèmes potentiels
- Les suggestions d'amélioration`;

    return this.sendMessage(analysisQuery);
  }

  /**
   * Génération de documentation
   * Claude Code SDK explore automatiquement la codebase pertinente
   */
  async generateDocumentation(query: string): Promise<string> {
    const docQuery = `Génère une documentation structurée pour: ${query}
    
Instructions:
- Explore automatiquement la codebase pertinente
- Identifie les patterns et architectures
- Crée une documentation markdown structurée
- Inclus des exemples de code pratiques
- Ajoute des diagrammes Mermaid si approprié`;

    return this.sendMessage(docQuery);
  }

  /**
   * Convertir le nom de modèle pour Claude Code SDK
   */
  private getModelName(): string {
    switch (this.config.model) {
      case 'sonnet':
        return 'claude-3-5-sonnet-20241022';
      case 'opus':
        return 'claude-3-opus-20240229';
      case 'haiku':
        return 'claude-3-haiku-20240307';
      default:
        return 'claude-3-5-sonnet-20241022';
    }
  }
}

/**
 * Factory pour créer le service simplifié
 */
export function createSimpleClaudeCodeService(config: SimpleClaudeCodeConfig): SimpleClaudeCodeService {
  return new SimpleClaudeCodeService(config);
}

/**
 * Instance globale pour utilisation dans l'app
 */
let globalService: SimpleClaudeCodeService | null = null;

export function getOrCreateSimpleClaudeCodeService(config: SimpleClaudeCodeConfig): SimpleClaudeCodeService {
  if (!globalService || globalService['config'].workspacePath !== config.workspacePath) {
    globalService = createSimpleClaudeCodeService(config);
  }
  return globalService;
}
