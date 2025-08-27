import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    }
  },
  usePathname() {
    return ''
  },
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
  })),
}))

// Mock Supabase server
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
      exchangeCodeForSession: jest.fn(),
    },
  })),
}))

// Mock Next.js Request
global.Request = class MockRequest {
  constructor(url) {
    this.url = url
  }
}

// Mock Next.js Response
global.Response = class MockResponse {
  constructor(body, init) {
    this.body = body
    this.init = init
  }
  json() {
    return Promise.resolve(this.body)
  }
  text() {
    return Promise.resolve(JSON.stringify(this.body))
  }
}

// Mock fetch
global.fetch = jest.fn()

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(url, init = {}) {
      this.url = url
      this.method = init.method || 'GET'
      this.body = init.body
      this.headers = new Map()
      this.nextUrl = new URL(url)
    }
    
    json() {
      return Promise.resolve(JSON.parse(this.body || '{}'))
    }
    
    text() {
      return Promise.resolve(this.body || '')
    }
  },
  NextResponse: {
    json: jest.fn((data, init = {}) => {
      const response = {
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
        status: init.status || 200,
        headers: new Map(),
        ok: (init.status || 200) < 400
      }
      return response
    }),
    redirect: jest.fn((url, init = {}) => {
      const response = {
        status: init.status || 307,
        headers: new Map([['location', url]]),
        ok: false
      }
      return response
    })
  }
}))

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Reset all mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
  global.fetch.mockClear()
})
