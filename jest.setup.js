import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation
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
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Intersection Observer
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
  },
})

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url')
global.URL.revokeObjectURL = jest.fn()

// Mock File and FileList
global.File = class extends Blob {
  constructor(chunks, filename, options = {}) {
    super(chunks, options)
    this.name = filename
    this.lastModified = Date.now()
  }
}

// Mock FileReader
global.FileReader = class {
  constructor() {
    this.readyState = 0
    this.result = null
  }
  
  readAsText() {
    setTimeout(() => {
      this.readyState = 2
      this.result = 'mock file content'
      if (this.onload) this.onload({ target: this })
    }, 10)
  }
  
  readAsDataURL() {
    setTimeout(() => {
      this.readyState = 2
      this.result = 'data:text/plain;base64,bW9jayBmaWxlIGNvbnRlbnQ='
      if (this.onload) this.onload({ target: this })
    }, 10)
  }
}

// Mock ReadableStream
global.ReadableStream = class {
  constructor(options) {
    this.controller = {
      enqueue: jest.fn(),
      close: jest.fn()
    }
    if (options.start) {
      options.start(this.controller)
    }
  }
}

// Mock TextEncoder
global.TextEncoder = class {
  encode(str) {
    return new Uint8Array(Buffer.from(str, 'utf-8'))
  }
}

// Mock TextDecoder
global.TextDecoder = class {
  decode(buffer) {
    return Buffer.from(buffer).toString('utf-8')
  }
}

// Mock scrollIntoView for cmdk components
Element.prototype.scrollIntoView = jest.fn()

// Mock window.open for file preview functionality
Object.defineProperty(window, 'open', {
  writable: true,
  value: jest.fn(() => ({ document: { write: jest.fn() } }))
})
