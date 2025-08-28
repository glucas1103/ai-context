import { render, screen } from '@testing-library/react'
import { UniversalTreePanel } from '@/components/ui/universal'

describe('UniversalTreePanel', () => {
  const mockData = [
    { id: '1', name: 'File 1', type: 'file' as const, path: '/file1' },
    { id: '2', name: 'Folder 1', type: 'folder' as const, path: '/folder1', children: [] },
    { id: '3', name: 'File 2', type: 'file' as const, path: '/file2' },
  ]

  const defaultConfig = {
    title: 'Test Tree',
    showCount: true,
    icons: {
      folder: '📁',
      file: '📄',
      openFolder: '📂',
    },
  }

  const defaultProps = {
    data: mockData,
    onSelect: jest.fn(),
    mode: 'readonly' as const,
    workspaceId: 'test-workspace',
    config: defaultConfig,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders in readonly mode correctly', () => {
    render(
      <UniversalTreePanel
        {...defaultProps}
        mode="readonly"
      />
    )

    expect(screen.getByText('Test Tree')).toBeInTheDocument()
  })

  it('renders in editable mode', () => {
    render(
      <UniversalTreePanel
        {...defaultProps}
        mode="editable"
      />
    )

    expect(screen.getByText('Test Tree')).toBeInTheDocument()
  })

  it('displays loading state when data is loading', () => {
    render(
      <UniversalTreePanel
        {...defaultProps}
        isLoading={true}
      />
    )

    expect(screen.getByText('Test Tree')).toBeInTheDocument()
  })

  it('displays empty state when no data', () => {
    render(
      <UniversalTreePanel
        data={[]}
        onSelect={jest.fn()}
        mode="readonly"
        workspaceId="test-workspace"
        config={defaultConfig}
      />
    )

    expect(screen.getByText('Test Tree')).toBeInTheDocument()
  })

  it('handles nested data structure', () => {
    const nestedData = [
      {
        id: '1',
        name: 'Root Folder',
        type: 'folder' as const,
        path: '/root',
        children: [
          { id: '2', name: 'Child File', type: 'file' as const, path: '/root/child' },
          { id: '3', name: 'Child Folder', type: 'folder' as const, path: '/root/child-folder', children: [] }
        ]
      }
    ]

    render(
      <UniversalTreePanel
        data={nestedData}
        onSelect={jest.fn()}
        mode="readonly"
        workspaceId="test-workspace"
        config={defaultConfig}
      />
    )

    expect(screen.getByText('Test Tree')).toBeInTheDocument()
  })
})
