/**
 * Tests pour le composant Message - Story 1.6.1
 * Test de la fonction formatTimestamp avec différents types de données
 */

import { render, screen } from '@testing-library/react';
import Message from './Message';
import { ChatMessage } from '@/types/chat/universal';

// Mock des dépendances
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: { children: string }) => (
    <pre data-testid="syntax-highlighter">{children}</pre>
  )
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {}
}));

describe('Message Component - formatTimestamp Tests', () => {
  const createMessage = (timestamp: Date | string): ChatMessage => ({
    id: 'test-message',
    role: 'user',
    content: 'Test message',
    timestamp,
    status: 'sent'
  });

  test('should handle valid Date object', () => {
    const validDate = new Date('2024-12-19T10:30:00Z');
    const message = createMessage(validDate);
    
    render(<Message message={message} />);
    
    // Vérifier que le timestamp s'affiche correctement (format HH:MM)
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  test('should handle valid date string', () => {
    const validDateString = '2024-12-19T10:30:00Z';
    const message = createMessage(validDateString);
    
    render(<Message message={message} />);
    
    // Vérifier que le timestamp s'affiche correctement (format HH:MM)
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  test('should handle invalid date string gracefully', () => {
    const invalidDateString = 'invalid-date';
    const message = createMessage(invalidDateString);
    
    render(<Message message={message} />);
    
    // Vérifier que l'erreur est gérée gracieusement
    expect(screen.getByText('--:--')).toBeInTheDocument();
  });

  test('should handle null timestamp gracefully', () => {
    const message = createMessage(null as any);
    
    render(<Message message={message} />);
    
    // Vérifier que l'erreur est gérée gracieusement
    expect(screen.getByText('--:--')).toBeInTheDocument();
  });

  test('should handle undefined timestamp gracefully', () => {
    const message = createMessage(undefined as any);
    
    render(<Message message={message} />);
    
    // Vérifier que l'erreur est gérée gracieusement
    expect(screen.getByText('--:--')).toBeInTheDocument();
  });

  test('should handle empty string timestamp gracefully', () => {
    const message = createMessage('');
    
    render(<Message message={message} />);
    
    // Vérifier que l'erreur est gérée gracieusement
    expect(screen.getByText('--:--')).toBeInTheDocument();
  });

  test('should display message content correctly', () => {
    const message = createMessage(new Date());
    
    render(<Message message={message} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  test('should display role icon correctly', () => {
    const message = createMessage(new Date());
    
    render(<Message message={message} />);
    
    expect(screen.getByText('👤')).toBeInTheDocument();
  });

  test('should display role name correctly', () => {
    const message = createMessage(new Date());
    
    render(<Message message={message} />);
    
    expect(screen.getByText('user')).toBeInTheDocument();
  });
});
