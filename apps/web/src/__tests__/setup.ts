import '@testing-library/jest-dom'
import React from 'react'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return {
      get: jest.fn(),
      has: jest.fn(),
      getAll: jest.fn(),
      forEach: jest.fn(),
      entries: jest.fn(),
      keys: jest.fn(),
      values: jest.fn(),
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
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
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
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  })),
}))

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: jest.fn(() => 'MonacoEditor'),
}))

// Mock TipTap Editor
jest.mock('@tiptap/react', () => ({
  useEditor: jest.fn(() => ({
    commands: {
      setContent: jest.fn(),
      focus: jest.fn(),
    },
    getHTML: jest.fn(() => '<p>Test content</p>'),
    getJSON: jest.fn(() => ({ type: 'doc', content: [] })),
    isDestroyed: false,
    destroy: jest.fn(),
  })),
}))

// Mock React Arborist
jest.mock('react-arborist', () => ({
  Tree: jest.fn(() => 'TreeComponent'),
}))

// Mock React Resizable Panels
jest.mock('react-resizable-panels', () => ({
  Panel: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'panel' }, children),
  PanelGroup: ({ children, className }: { children: React.ReactNode; className?: string }) => React.createElement('div', { 'data-testid': 'panel-group', className }, children),
  PanelResizeHandle: ({ className }: { className?: string }) => React.createElement('div', { 'data-testid': 'panel-resize-handle', className }),
}))

// Mock fetch
global.fetch = jest.fn()

// Mock Response global pour les tests API
global.Response = class Response {
  constructor(
    public body?: any,
    public init?: ResponseInit
  ) {}
  
  json() {
    return Promise.resolve(this.body)
  }
  
  get status() {
    return this.init?.status || 200
  }
  
  get ok() {
    return this.status >= 200 && this.status < 300
  }
} as any

// Mock NextResponse pour les tests API
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300
    }))
  },
  NextRequest: class NextRequest {
    constructor(public url: string, public init?: RequestInit) {}
    
    json() {
      return Promise.resolve(this.init?.body || {})
    }
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

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn()

// Reset all mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})
