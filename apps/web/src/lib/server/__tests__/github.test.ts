import { GitHubAPI, parseGitHubUrl, detectFileLanguage, shouldIncludeFile } from '../github'

// Mock fetch global
global.fetch = jest.fn()

describe('GitHubAPI', () => {
  let githubAPI: GitHubAPI

  beforeEach(() => {
    jest.clearAllMocks()
    githubAPI = new GitHubAPI('test-token')
  })

  describe('getUserRepos', () => {
    it('should fetch user repositories successfully', async () => {
      const mockRepos = [
        {
          id: 1,
          name: 'test-repo',
          full_name: 'owner/test-repo',
          description: 'Test repository',
          private: false,
          html_url: 'https://github.com/owner/test-repo',
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRepos),
      })

      const result = await githubAPI.getUserRepos()

      expect(result).toEqual(mockRepos)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/user/repos?sort=updated&per_page=100',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AIcontext-App',
          }),
        })
      )
    })

    it('should handle API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      await expect(githubAPI.getUserRepos()).rejects.toThrow('GitHub API error: 401 Unauthorized')
    })
  })

  describe('getRepositoryTree', () => {
    it('should fetch repository tree successfully', async () => {
      const mockTree = {
        sha: 'abc123',
        url: 'https://api.github.com/repos/owner/repo/git/trees/abc123',
        tree: [
          {
            path: 'src/index.ts',
            type: 'blob',
            sha: 'def456',
            size: 1024,
          },
        ],
        truncated: false,
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTree),
      })

      const result = await githubAPI.getRepositoryTree('owner', 'repo')

      expect(result).toEqual(mockTree)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/git/trees/HEAD?recursive=1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      )
    })

    it('should support non-recursive mode', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ tree: [] }),
      })

      await githubAPI.getRepositoryTree('owner', 'repo', false)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/git/trees/HEAD',
        expect.any(Object)
      )
    })
  })

  describe('getFileContent', () => {
    it('should fetch and decode base64 file content', async () => {
      const mockContent = 'console.log("Hello World")'
      const base64Content = Buffer.from(mockContent).toString('base64')

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: base64Content,
          encoding: 'base64',
        }),
      })

      const result = await githubAPI.getFileContent('owner', 'repo', 'src/index.js')

      expect(result).toBe(mockContent)
    })

    it('should handle non-base64 content', async () => {
      const mockContent = 'console.log("Hello World")'

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: mockContent,
          encoding: 'utf-8',
        }),
      })

      const result = await githubAPI.getFileContent('owner', 'repo', 'src/index.js')

      expect(result).toBe(mockContent)
    })
  })

  describe('hasRepositoryAccess', () => {
    it('should return true for accessible repository', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'test-repo' }),
      })

      const result = await githubAPI.hasRepositoryAccess('owner', 'repo')

      expect(result).toBe(true)
    })

    it('should return false for inaccessible repository', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      })

      const result = await githubAPI.hasRepositoryAccess('owner', 'repo')

      expect(result).toBe(false)
    })
  })
})

describe('parseGitHubUrl', () => {
  it('should parse HTTPS GitHub URLs', () => {
    const result = parseGitHubUrl('https://github.com/owner/repo')
    expect(result).toEqual({ owner: 'owner', repo: 'repo' })
  })

  it('should parse HTTPS GitHub URLs with .git suffix', () => {
    const result = parseGitHubUrl('https://github.com/owner/repo.git')
    expect(result).toEqual({ owner: 'owner', repo: 'repo' })
  })

  it('should parse SSH GitHub URLs', () => {
    const result = parseGitHubUrl('git@github.com:owner/repo.git')
    expect(result).toEqual({ owner: 'owner', repo: 'repo' })
  })

  it('should handle trailing slashes', () => {
    const result = parseGitHubUrl('https://github.com/owner/repo/')
    expect(result).toEqual({ owner: 'owner', repo: 'repo' })
  })

  it('should return null for invalid URLs', () => {
    const result = parseGitHubUrl('https://gitlab.com/owner/repo')
    expect(result).toBeNull()
  })

  it('should return null for malformed URLs', () => {
    const result = parseGitHubUrl('not-a-url')
    expect(result).toBeNull()
  })
})

describe('detectFileLanguage', () => {
  it('should detect TypeScript files', () => {
    expect(detectFileLanguage('index.ts')).toBe('typescript')
    expect(detectFileLanguage('component.tsx')).toBe('typescript')
  })

  it('should detect JavaScript files', () => {
    expect(detectFileLanguage('index.js')).toBe('javascript')
    expect(detectFileLanguage('component.jsx')).toBe('javascript')
  })

  it('should detect various languages', () => {
    expect(detectFileLanguage('script.py')).toBe('python')
    expect(detectFileLanguage('Main.java')).toBe('java')
    expect(detectFileLanguage('styles.css')).toBe('css')
    expect(detectFileLanguage('README.md')).toBe('markdown')
    expect(detectFileLanguage('config.json')).toBe('json')
    expect(detectFileLanguage('docker-compose.yml')).toBe('yaml')
  })

  it('should default to plaintext for unknown extensions', () => {
    expect(detectFileLanguage('unknown.xyz')).toBe('plaintext')
    expect(detectFileLanguage('no-extension')).toBe('plaintext')
  })

  it('should be case insensitive', () => {
    expect(detectFileLanguage('INDEX.TS')).toBe('typescript')
    expect(detectFileLanguage('MAIN.JAVA')).toBe('java')
  })
})

describe('shouldIncludeFile', () => {
  it('should include regular source files', () => {
    expect(shouldIncludeFile('src/index.ts')).toBe(true)
    expect(shouldIncludeFile('components/Button.tsx')).toBe(true)
    expect(shouldIncludeFile('README.md')).toBe(true)
    expect(shouldIncludeFile('package.json')).toBe(true)
  })

  it('should exclude node_modules', () => {
    expect(shouldIncludeFile('node_modules/react/index.js')).toBe(false)
    expect(shouldIncludeFile('path/node_modules/lib.js')).toBe(false)
  })

  it('should exclude git files', () => {
    expect(shouldIncludeFile('.git/config')).toBe(false)
    expect(shouldIncludeFile('.git/hooks/pre-commit')).toBe(false)
  })

  it('should exclude build directories', () => {
    expect(shouldIncludeFile('.next/static/file.js')).toBe(false)
    expect(shouldIncludeFile('dist/bundle.js')).toBe(false)
    expect(shouldIncludeFile('build/output.js')).toBe(false)
  })

  it('should exclude binary files', () => {
    expect(shouldIncludeFile('image.jpg')).toBe(false)
    expect(shouldIncludeFile('image.PNG')).toBe(false)
    expect(shouldIncludeFile('video.mp4')).toBe(false)
    expect(shouldIncludeFile('archive.zip')).toBe(false)
  })

  it('should exclude log and lock files', () => {
    expect(shouldIncludeFile('error.log')).toBe(false)
    expect(shouldIncludeFile('package-lock.json')).toBe(false)
    expect(shouldIncludeFile('yarn.lock')).toBe(false)
    expect(shouldIncludeFile('pnpm-lock.yaml')).toBe(false)
    expect(shouldIncludeFile('Gemfile.lock')).toBe(false)
  })

  it('should exclude cache directories', () => {
    expect(shouldIncludeFile('.cache/file')).toBe(false)
    expect(shouldIncludeFile('coverage/lcov.info')).toBe(false)
  })
})
