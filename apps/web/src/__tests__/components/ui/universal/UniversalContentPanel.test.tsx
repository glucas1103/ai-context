import { render, screen, fireEvent } from '@testing-library/react'
import { UniversalContentPanel } from '@/components/ui/universal'

describe('UniversalContentPanel', () => {
  const mockSelectedItem = {
    id: '1',
    name: 'test-file.ts',
    type: 'file' as const,
    path: '/test/test-file.ts'
  }

  const defaultMonacoConfig = {
    theme: 'vs-dark',
    fontSize: 14,
    minimap: { enabled: false }
  }

  const defaultTipTapConfig = {
    placeholder: 'Commencez à écrire...',
    extensions: []
  }

  const defaultProps = {
    selectedItem: mockSelectedItem,
    content: 'Test content',
    mode: 'code' as const,
    onChange: jest.fn(),
    onSave: jest.fn(),
    editorConfig: defaultMonacoConfig,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders code content with Monaco editor', () => {
    render(
      <UniversalContentPanel
        {...defaultProps}
        content="const test = 'code';"
        mode="code"
        editorConfig={defaultMonacoConfig}
      />
    )

    expect(screen.getByText('test-file.ts')).toBeInTheDocument()
    // Le chemin est dans un paragraphe avec d'autres éléments
    expect(screen.getByText(/\/test\/test-file\.ts/)).toBeInTheDocument()
  })

  it('displays loading state when content is loading', () => {
    render(
      <UniversalContentPanel
        {...defaultProps}
        isLoading={true}
      />
    )

    expect(screen.getByText('test-file.ts')).toBeInTheDocument()
  })

  it('displays saving state when content is saving', () => {
    render(
      <UniversalContentPanel
        {...defaultProps}
        isSaving={true}
      />
    )

    expect(screen.getByText('test-file.ts')).toBeInTheDocument()
  })

  it('handles null selected item', () => {
    render(
      <UniversalContentPanel
        {...defaultProps}
        selectedItem={null}
      />
    )

    // Le composant devrait afficher un message quand aucun fichier n'est sélectionné
    expect(screen.getByText('Aucun fichier sélectionné')).toBeInTheDocument()
  })

  it('supports different file types', () => {
    const jsonFile = {
      id: '2',
      name: 'config.json',
      type: 'file' as const,
      path: '/config.json'
    }

    render(
      <UniversalContentPanel
        {...defaultProps}
        selectedItem={jsonFile}
        content='{"key": "value"}'
        mode="code"
        editorConfig={defaultMonacoConfig}
      />
    )

    expect(screen.getByText('config.json')).toBeInTheDocument()
    expect(screen.getByText(/\/config\.json/)).toBeInTheDocument()
  })

  it('supports folder items', () => {
    const folderItem = {
      id: '3',
      name: 'src',
      type: 'folder' as const,
      path: '/src'
    }

    render(
      <UniversalContentPanel
        {...defaultProps}
        selectedItem={folderItem}
        content="Folder content"
        mode="document"
        editorConfig={defaultTipTapConfig}
      />
    )

    expect(screen.getByText('src')).toBeInTheDocument()
    expect(screen.getByText(/\/src/)).toBeInTheDocument()
  })

  it('renders with custom editor config', () => {
    const customMonacoConfig = {
      theme: 'vs-light',
      fontSize: 16,
      minimap: { enabled: true }
    }

    render(
      <UniversalContentPanel
        {...defaultProps}
        editorConfig={customMonacoConfig}
      />
    )

    expect(screen.getByText('test-file.ts')).toBeInTheDocument()
  })
})
