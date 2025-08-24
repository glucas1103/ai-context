import { GitHubAPI } from '../github-api'
import { callGitHubAPI } from '../token-utils'

// Mock the token-utils module
jest.mock('../token-utils', () => ({
  callGitHubAPI: jest.fn()
}))

const mockCallGitHubAPI = callGitHubAPI as jest.MockedFunction<typeof callGitHubAPI>

describe('GitHubAPI', () => {
  let githubAPI: GitHubAPI
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getSession: jest.fn(),
        refreshSession: jest.fn()
      }
    }
    githubAPI = new GitHubAPI(mockSupabase)
    jest.clearAllMocks()
  })

  describe('getUserRepos', () => {
    it('should fetch user repos with default options', async () => {
      const mockRepos = [
        {
          id: 1,
          name: 'test-repo',
          full_name: 'user/test-repo',
          description: 'Test repository',
          html_url: 'https://github.com/user/test-repo',
          private: false,
          owner: {
            login: 'user',
            avatar_url: 'https://github.com/user.png'
          },
          updated_at: '2023-01-01T00:00:00Z',
          language: 'JavaScript',
          stargazers_count: 10,
          size: 1000
        }
      ]

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockRepos)
      }

      mockCallGitHubAPI.mockResolvedValue(mockResponse as any)

      const result = await githubAPI.getUserRepos()

      expect(mockCallGitHubAPI).toHaveBeenCalledWith(
        mockSupabase,
        'https://api.github.com/user/repos?sort=updated&direction=desc&per_page=100&page=1'
      )
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 1,
        name: 'test-repo',
        fullName: 'user/test-repo',
        description: 'Test repository',
        url: 'https://github.com/user/test-repo',
        isPrivate: false,
        owner: {
          login: 'user',
          avatarUrl: 'https://github.com/user.png'
        },
        updatedAt: '2023-01-01T00:00:00Z',
        language: 'JavaScript',
        stars: 10,
        size: 1000
      })
    })

    it('should fetch user repos with custom options', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([])
      }

      mockCallGitHubAPI.mockResolvedValue(mockResponse as any)

      await githubAPI.getUserRepos({
        sort: 'created',
        direction: 'asc',
        per_page: 50,
        page: 2
      })

      expect(mockCallGitHubAPI).toHaveBeenCalledWith(
        mockSupabase,
        'https://api.github.com/user/repos?sort=created&direction=asc&per_page=50&page=2'
      )
    })

    it('should handle 401 error for token expired', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      }

      mockCallGitHubAPI.mockResolvedValue(mockResponse as any)

      await expect(githubAPI.getUserRepos()).rejects.toThrow('GitHub token expired or invalid')
    })

    it('should handle 403 error for rate limit', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      }

      mockCallGitHubAPI.mockResolvedValue(mockResponse as any)

      await expect(githubAPI.getUserRepos()).rejects.toThrow('GitHub rate limit exceeded')
    })

    it('should handle other API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      }

      mockCallGitHubAPI.mockResolvedValue(mockResponse as any)

      await expect(githubAPI.getUserRepos()).rejects.toThrow('GitHub API error: 500 Internal Server Error')
    })
  })

  describe('getRepo', () => {
    it('should fetch repo information', async () => {
      const mockRepo = {
        id: 1,
        name: 'test-repo',
        full_name: 'user/test-repo',
        description: 'Test repository',
        html_url: 'https://github.com/user/test-repo',
        private: false,
        owner: {
          login: 'user',
          avatar_url: 'https://github.com/user.png'
        },
        updated_at: '2023-01-01T00:00:00Z',
        language: 'JavaScript',
        stargazers_count: 10,
        size: 1000
      }

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockRepo)
      }

      mockCallGitHubAPI.mockResolvedValue(mockResponse as any)

      const result = await githubAPI.getRepo('user', 'test-repo')

      expect(mockCallGitHubAPI).toHaveBeenCalledWith(
        mockSupabase,
        'https://api.github.com/repos/user/test-repo'
      )
      expect(result).toEqual(mockRepo)
    })

    it('should handle 404 error for repo not found', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }

      mockCallGitHubAPI.mockResolvedValue(mockResponse as any)

      await expect(githubAPI.getRepo('user', 'nonexistent')).rejects.toThrow('Repository not found')
    })
  })

  describe('getRepoTree', () => {
    it('should fetch repo tree with default parameters', async () => {
      const mockTree = [
        {
          name: 'README.md',
          path: 'README.md',
          type: 'file'
        }
      ]

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockTree)
      }

      mockCallGitHubAPI.mockResolvedValue(mockResponse as any)

      const result = await githubAPI.getRepoTree('user', 'test-repo')

      expect(mockCallGitHubAPI).toHaveBeenCalledWith(
        mockSupabase,
        'https://api.github.com/repos/user/test-repo/contents/?ref=main'
      )
      expect(result).toEqual(mockTree)
    })

    it('should fetch repo tree with custom parameters', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([])
      }

      mockCallGitHubAPI.mockResolvedValue(mockResponse as any)

      await githubAPI.getRepoTree('user', 'test-repo', 'src', 'develop')

      expect(mockCallGitHubAPI).toHaveBeenCalledWith(
        mockSupabase,
        'https://api.github.com/repos/user/test-repo/contents/src?ref=develop'
      )
    })

    it('should handle 404 error for path not found', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }

      mockCallGitHubAPI.mockResolvedValue(mockResponse as any)

      await expect(githubAPI.getRepoTree('user', 'test-repo', 'nonexistent')).rejects.toThrow('Path not found in repository')
    })
  })

  describe('getFileContent', () => {
    it('should fetch and decode file content', async () => {
      const mockFile = {
        name: 'README.md',
        path: 'README.md',
        content: 'SGVsbG8gV29ybGQ=', // Base64 encoded "Hello World"
        encoding: 'base64'
      }

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockFile)
      }

      mockCallGitHubAPI.mockResolvedValue(mockResponse as any)

      const result = await githubAPI.getFileContent('user', 'test-repo', 'README.md')

      expect(mockCallGitHubAPI).toHaveBeenCalledWith(
        mockSupabase,
        'https://api.github.com/repos/user/test-repo/contents/README.md?ref=main'
      )
      expect(result.content).toBe('Hello World')
    })

    it('should handle file not found', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }

      mockCallGitHubAPI.mockResolvedValue(mockResponse as any)

      await expect(githubAPI.getFileContent('user', 'test-repo', 'nonexistent.md')).rejects.toThrow('File not found')
    })
  })

  describe('hasRepoAccess', () => {
    it('should return true if user has access', async () => {
      const mockRepo = { id: 1, name: 'test-repo' }
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockRepo)
      }

      mockCallGitHubAPI.mockResolvedValue(mockResponse as any)

      const result = await githubAPI.hasRepoAccess('user', 'test-repo')

      expect(result).toBe(true)
    })

    it('should return false if repo not found', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }

      mockCallGitHubAPI.mockResolvedValue(mockResponse as any)

      const result = await githubAPI.hasRepoAccess('user', 'nonexistent')

      expect(result).toBe(false)
    })

    it('should throw error for other API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      }

      mockCallGitHubAPI.mockResolvedValue(mockResponse as any)

      await expect(githubAPI.hasRepoAccess('user', 'test-repo')).rejects.toThrow('GitHub API error: 500 Internal Server Error')
    })
  })
})
