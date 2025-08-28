import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatTabBar } from '../ChatTabBar'
import type { ChatTab } from '@/types/chat/universal'

const mockTabs: ChatTab[] = [
  {
    id: 'tab-1',
    sessionId: 'session-1',
    title: 'Analyse 1',
    type: 'analysis',
    isActive: true,
    isDirty: false,
    lastActivity: new Date(),
    context: {},
    tabOrder: 0
  },
  {
    id: 'tab-2',
    sessionId: 'session-2',
    title: 'Documentation 1',
    type: 'documentation',
    isActive: false,
    isDirty: true,
    lastActivity: new Date(),
    context: {},
    tabOrder: 1
  }
]

const mockProps = {
  tabs: mockTabs,
  activeTabId: 'tab-1',
  onTabSwitch: jest.fn(),
  onTabClose: jest.fn(),
  onTabAdd: jest.fn(),
  onTabRename: jest.fn()
}

describe('ChatTabBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('devrait afficher tous les onglets', () => {
    render(<ChatTabBar {...mockProps} />)
    
    expect(screen.getByText('Analyse 1')).toBeInTheDocument()
    expect(screen.getByText('Documentation 1')).toBeInTheDocument()
  })

  it('devrait mettre en évidence l\'onglet actif', () => {
    render(<ChatTabBar {...mockProps} />)
    
    const activeTab = screen.getByText('Analyse 1').closest('div')
    expect(activeTab).toHaveClass('bg-gray-700')
  })

  it('devrait afficher l\'indicateur dirty', () => {
    render(<ChatTabBar {...mockProps} />)
    
    // L'onglet Documentation 1 est marqué comme dirty
    const dirtyTab = screen.getByText('Documentation 1').parentElement
    expect(dirtyTab).toHaveTextContent('•')
  })

  it('devrait pouvoir changer d\'onglet', () => {
    render(<ChatTabBar {...mockProps} />)
    
    fireEvent.click(screen.getByText('Documentation 1'))
    expect(mockProps.onTabSwitch).toHaveBeenCalledWith('tab-2')
  })

  it('devrait pouvoir ajouter un nouvel onglet', () => {
    render(<ChatTabBar {...mockProps} />)
    
    const addButton = screen.getByTitle('Ajouter un nouvel onglet')
    fireEvent.click(addButton)
    expect(mockProps.onTabAdd).toHaveBeenCalled()
  })

  it('devrait pouvoir fermer un onglet', () => {
    render(<ChatTabBar {...mockProps} />)
    
    // Hover sur l'onglet pour révéler le bouton de fermeture
    const tab = screen.getByText('Documentation 1').closest('div')
    fireEvent.mouseEnter(tab!)
    
    const closeButton = screen.getByTitle('Fermer l\'onglet')
    fireEvent.click(closeButton)
    expect(mockProps.onTabClose).toHaveBeenCalledWith('tab-2')
  })

  it('devrait pouvoir renommer un onglet', () => {
    render(<ChatTabBar {...mockProps} />)
    
    // Hover sur l'onglet pour révéler le bouton d'édition
    const tab = screen.getByText('Analyse 1').closest('div')
    fireEvent.mouseEnter(tab!)
    
    const editButton = screen.getByTitle('Renommer l\'onglet')
    fireEvent.click(editButton)
    
    // Un input devrait apparaître
    const input = screen.getByDisplayValue('Analyse 1')
    expect(input).toBeInTheDocument()
    
    // Changer le nom
    fireEvent.change(input, { target: { value: 'Nouveau nom' } })
    fireEvent.blur(input)
    
    expect(mockProps.onTabRename).toHaveBeenCalledWith('tab-1', 'Nouveau nom')
  })

  it('devrait afficher les icônes appropriées selon le type', () => {
    render(<ChatTabBar {...mockProps} />)
    
    // Vérifier les icônes (émojis)
    expect(screen.getByText('🔍')).toBeInTheDocument() // Analysis
    expect(screen.getByText('📝')).toBeInTheDocument() // Documentation
  })

  it('ne devrait pas afficher le bouton fermer pour le dernier onglet', () => {
    const singleTabProps = {
      ...mockProps,
      tabs: [mockTabs[0]]
    }
    
    render(<ChatTabBar {...singleTabProps} />)
    
    const tab = screen.getByText('Analyse 1').closest('div')
    fireEvent.mouseEnter(tab!)
    
    // Pas de bouton de fermeture pour un seul onglet
    expect(screen.queryByTitle('Fermer l\'onglet')).not.toBeInTheDocument()
  })

  it('devrait gérer les touches clavier lors de l\'édition', () => {
    render(<ChatTabBar {...mockProps} />)
    
    // Entrer en mode édition
    const tab = screen.getByText('Analyse 1').closest('div')
    fireEvent.mouseEnter(tab!)
    
    const editButton = screen.getByTitle('Renommer l\'onglet')
    fireEvent.click(editButton)
    
    const input = screen.getByDisplayValue('Analyse 1')
    
    // Test Escape (annuler)
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByDisplayValue('Analyse 1')).not.toBeInTheDocument()
    
    // Re-entrer en mode édition
    fireEvent.click(editButton)
    const newInput = screen.getByDisplayValue('Analyse 1')
    
    // Test Enter (sauvegarder)
    fireEvent.change(newInput, { target: { value: 'Nom modifié' } })
    fireEvent.keyDown(newInput, { key: 'Enter' })
    
    expect(mockProps.onTabRename).toHaveBeenCalledWith('tab-1', 'Nom modifié')
  })
})
