import { render, screen } from '@testing-library/react'
import { ThreePanelsLayout } from '@/components/layout'

describe('ThreePanelsLayout', () => {
  const defaultProps = {
    leftPanel: <div>Tree Content</div>,
    centerPanel: <div>Content</div>,
    rightPanel: <div>Chat Content</div>,
  }

  it('renders three panels with correct structure', () => {
    render(<ThreePanelsLayout {...defaultProps} />)

    expect(screen.getByText('Tree Content')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Chat Content')).toBeInTheDocument()
  })

  it('supports custom panel sizes', () => {
    const customConfig = {
      defaultSizes: [20, 60, 20] as [number, number, number]
    }
    render(
      <ThreePanelsLayout
        {...defaultProps}
        config={customConfig}
      />
    )

    expect(screen.getByText('Tree Content')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Chat Content')).toBeInTheDocument()
  })

  it('applies custom className when provided', () => {
    render(
      <ThreePanelsLayout
        {...defaultProps}
        className="custom-layout"
      />
    )

    const container = screen.getByTestId('panel-group').parentElement
    expect(container).toHaveClass('custom-layout')
  })

  it('handles empty content gracefully', () => {
    const propsWithEmptyContent = {
      leftPanel: null,
      centerPanel: undefined,
      rightPanel: <div>Right Content</div>,
    }

    render(<ThreePanelsLayout {...propsWithEmptyContent} />)

    expect(screen.getByText('Right Content')).toBeInTheDocument()
  })

  it('supports custom default sizes', () => {
    const defaultSizes = [25, 50, 25] as [number, number, number]
    render(
      <ThreePanelsLayout
        {...defaultProps}
        config={{ defaultSizes }}
      />
    )

    expect(screen.getByText('Tree Content')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Chat Content')).toBeInTheDocument()
  })

  it('renders with minimum panel sizes', () => {
    render(
      <ThreePanelsLayout
        {...defaultProps}
        config={{ minSizes: [10, 30, 10] as [number, number, number] }}
      />
    )

    expect(screen.getByText('Tree Content')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Chat Content')).toBeInTheDocument()
  })

  it('supports persistence key', () => {
    render(
      <ThreePanelsLayout
        {...defaultProps}
        config={{ persistKey: 'test-layout' }}
      />
    )

    expect(screen.getByText('Tree Content')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Chat Content')).toBeInTheDocument()
  })
})
