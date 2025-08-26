import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import LoginPage from '../page'

// Mock du hook useAuth
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}))

// Mock de next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams())
}))

describe('LoginPage', () => {
  const mockRouter = {
    replace: jest.fn(),
    push: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('should not redirect when loading', () => {
    const { useAuth } = require('@/hooks/useAuth')
    ;(useAuth as jest.Mock).mockReturnValue({
      loading: true,
      error: null,
      signInWithGitHub: jest.fn(),
      isAuthenticated: false,
      clearCorruptedSession: jest.fn()
    })

    render(<LoginPage />)
    
    expect(mockRouter.replace).not.toHaveBeenCalled()
  })

  it('should redirect to repos when authenticated', async () => {
    const { useAuth } = require('@/hooks/useAuth')
    ;(useAuth as jest.Mock).mockReturnValue({
      loading: false,
      error: null,
      signInWithGitHub: jest.fn(),
      isAuthenticated: true,
      clearCorruptedSession: jest.fn()
    })

    render(<LoginPage />)
    
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/repos')
    })
  })

  it('should not redirect multiple times when authenticated', async () => {
    const { useAuth } = require('@/hooks/useAuth')
    ;(useAuth as jest.Mock).mockReturnValue({
      loading: false,
      error: null,
      signInWithGitHub: jest.fn(),
      isAuthenticated: true,
      clearCorruptedSession: jest.fn()
    })

    const { rerender } = render(<LoginPage />)
    
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledTimes(1)
    })

    // Re-render pour simuler un re-render
    rerender(<LoginPage />)
    
    // Ne devrait pas appeler replace une deuxième fois
    expect(mockRouter.replace).toHaveBeenCalledTimes(1)
  })

  it('should show login button when not authenticated', () => {
    const { useAuth } = require('@/hooks/useAuth')
    ;(useAuth as jest.Mock).mockReturnValue({
      loading: false,
      error: null,
      signInWithGitHub: jest.fn(),
      isAuthenticated: false,
      clearCorruptedSession: jest.fn()
    })

    render(<LoginPage />)
    
    expect(screen.getByText('Se connecter avec GitHub')).toBeInTheDocument()
    expect(mockRouter.replace).not.toHaveBeenCalled()
  })
})
