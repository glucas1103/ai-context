import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '../page'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'

// Mock des hooks
jest.mock('@/hooks/useAuth')
jest.mock('next/navigation')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>

describe('LoginPage', () => {
  const mockPush = jest.fn()
  const mockReplace = jest.fn()
  const mockSignInWithGitHub = jest.fn()
  const mockGet = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      prefetch: jest.fn(),
    } as any)

    mockUseSearchParams.mockReturnValue({
      get: mockGet,
    } as any)

    mockUseAuth.mockReturnValue({
      loading: false,
      error: null,
      signInWithGitHub: mockSignInWithGitHub,
      isAuthenticated: false,
      user: null,
      signOut: jest.fn(),
    })
  })

  describe('Rendering', () => {
    it('should render login form with correct elements', () => {
      render(<LoginPage />)

      expect(screen.getByText('AIcontext')).toBeInTheDocument()
      expect(screen.getByText('Transformez votre codebase en documentation vivante')).toBeInTheDocument()
      expect(screen.getByText('Connectez-vous pour commencer')).toBeInTheDocument()
      expect(screen.getByText('Se connecter avec GitHub')).toBeInTheDocument()
      expect(screen.getByText('🔒 Vos données restent privées et sécurisées')).toBeInTheDocument()
    })

    it('should apply dark theme styles correctly', () => {
      render(<LoginPage />)

      const container = screen.getByRole('button', { name: /se connecter avec github/i }).closest('div')
      expect(container).toHaveClass('bg-gray-800')
    })
  })

  describe('Authentication State', () => {
    it('should redirect to repos if already authenticated', () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        error: null,
        signInWithGitHub: mockSignInWithGitHub,
        isAuthenticated: true,
        user: { id: '123', email: 'test@example.com' } as any,
        signOut: jest.fn(),
      })

      render(<LoginPage />)

      expect(mockReplace).toHaveBeenCalledWith('/repos')
    })

    it('should not redirect if not authenticated', () => {
      render(<LoginPage />)

      expect(mockReplace).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should display auth error from URL params', () => {
      mockGet.mockReturnValue('auth_error')

      render(<LoginPage />)

      expect(screen.getByText('Erreur lors de l\'authentification. Veuillez réessayer.')).toBeInTheDocument()
    })

    it('should display no_code error from URL params', () => {
      mockGet.mockReturnValue('no_code')

      render(<LoginPage />)

      expect(screen.getByText('Code d\'autorisation manquant. Veuillez réessayer la connexion.')).toBeInTheDocument()
    })

    it('should display unexpected_error from URL params', () => {
      mockGet.mockReturnValue('unexpected_error')

      render(<LoginPage />)

      expect(screen.getByText('Une erreur inattendue s\'est produite. Veuillez réessayer.')).toBeInTheDocument()
    })

    it('should display generic error for unknown error params', () => {
      mockGet.mockReturnValue('unknown_error')

      render(<LoginPage />)

      expect(screen.getByText('Une erreur s\'est produite lors de la connexion.')).toBeInTheDocument()
    })

    it('should display hook error but not "Auth session missing!"', () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        error: 'Some other error',
        signInWithGitHub: mockSignInWithGitHub,
        isAuthenticated: false,
        user: null,
        signOut: jest.fn(),
      })

      render(<LoginPage />)

      expect(screen.getByText('Some other error')).toBeInTheDocument()
    })

    it('should not display "Auth session missing!" error', () => {
      mockUseAuth.mockReturnValue({
        loading: false,
        error: 'Auth session missing!',
        signInWithGitHub: mockSignInWithGitHub,
        isAuthenticated: false,
        user: null,
        signOut: jest.fn(),
      })

      render(<LoginPage />)

      expect(screen.queryByText('Auth session missing!')).not.toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading state when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        loading: true,
        error: null,
        signInWithGitHub: mockSignInWithGitHub,
        isAuthenticated: false,
        user: null,
        signOut: jest.fn(),
      })

      render(<LoginPage />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(screen.getByText('Connexion en cours...')).toBeInTheDocument()
    })

    it('should show normal state when not loading', () => {
      render(<LoginPage />)

      const button = screen.getByRole('button')
      expect(button).not.toBeDisabled()
      expect(screen.getByText('Se connecter avec GitHub')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call signInWithGitHub when button is clicked', async () => {
      render(<LoginPage />)

      const button = screen.getByRole('button', { name: /se connecter avec github/i })
      fireEvent.click(button)

      expect(mockSignInWithGitHub).toHaveBeenCalledTimes(1)
    })

    it('should not allow clicking when loading', () => {
      mockUseAuth.mockReturnValue({
        loading: true,
        error: null,
        signInWithGitHub: mockSignInWithGitHub,
        isAuthenticated: false,
        user: null,
        signOut: jest.fn(),
      })

      render(<LoginPage />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      
      fireEvent.click(button)
      expect(mockSignInWithGitHub).not.toHaveBeenCalled()
    })
  })

  describe('URL Parameter Handling', () => {
    it('should handle null error parameter', () => {
      mockGet.mockReturnValue(null)

      render(<LoginPage />)

      expect(screen.queryByText(/erreur/i)).not.toBeInTheDocument()
    })

    it('should prioritize URL error over hook error', () => {
      mockGet.mockReturnValue('auth_error')
      mockUseAuth.mockReturnValue({
        loading: false,
        error: 'Hook error',
        signInWithGitHub: mockSignInWithGitHub,
        isAuthenticated: false,
        user: null,
        signOut: jest.fn(),
      })

      render(<LoginPage />)

      expect(screen.getByText('Erreur lors de l\'authentification. Veuillez réessayer.')).toBeInTheDocument()
      expect(screen.queryByText('Hook error')).not.toBeInTheDocument()
    })
  })
})
