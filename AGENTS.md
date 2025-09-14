# OpenSpec

OpenSpec is an open-source web application that democratizes spec-driven development by replicating Kiro IDE's Spec Mode functionality. It generates comprehensive technical specifications using any AI model from OpenRouter's API, following a structured three-phase workflow with iterative refinement capabilities.

## Setup commands

- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm start`
- Run linting: `npm run lint`
- Run tests: `npm test`

## Technology stack

- **Framework**: Next.js 14 with App Router
- **UI Components**: Tailwind CSS + shadcn/ui
- **Markdown**: react-markdown for rendering
- **Diagrams**: Mermaid.js for automatic diagram generation
- **Code Editor**: Monaco Editor (if implemented)
- **API**: OpenRouter API integration
- **Storage**: Browser localStorage only
- **Deployment**: Vercel-optimized

## Development environment

- Node.js 18+ required
- TypeScript strict mode enabled
- ESLint and Prettier for code formatting
- No backend - fully client-side application
- OpenRouter API key required for functionality

## Code style and conventions

### TypeScript Guidelines
- Use strict TypeScript configuration
- Prefer type interfaces over any
- Use proper typing for OpenRouter API responses
- Include JSDoc comments for complex functions

### React/Next.js Patterns
- Use App Router conventions (app/ directory)
- Prefer Server Components where possible
- Client Components only when necessary (API calls, localStorage)
- Use React hooks appropriately (useState, useEffect, custom hooks)

### Component Structure
- Follow shadcn/ui component patterns
- Use Tailwind CSS for styling
- Keep components focused and reusable
- Export components as named exports

### API Integration
- All OpenRouter API calls must be client-side
- Handle API errors gracefully with user feedback
- Use proper TypeScript interfaces for API responses
- Implement loading states and error boundaries

## File structure

```
├── app/                     # Next.js 14 App Router
│   ├── page.tsx            # Main application page
│   ├── layout.tsx          # Root layout with metadata
│   ├── globals.css         # Global styles
│   └── api/                # API routes (if needed)
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── spec-generator.tsx  # Main workflow orchestrator
│   ├── model-selector.tsx  # OpenRouter model selection
│   ├── prompt-input.tsx    # Text and file input interface
│   └── spec-preview.tsx    # Markdown + Mermaid preview
├── lib/                    # Utility libraries
│   ├── openrouter/         # OpenRouter API client
│   ├── prompts/            # AI prompts for each phase
│   ├── storage.ts          # localStorage management
│   └── utils.ts            # Helper functions
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
└── public/                 # Static assets
```

## Testing approach

- Write unit tests for utility functions
- Test React components with React Testing Library
- Mock OpenRouter API calls in tests
- Test localStorage functionality
- Use Jest for test runner
- Add integration tests for complete workflows

## Key workflows

### Spec Generation Process
1. User enters OpenRouter API key (session only)
2. User selects AI model from available options
3. User provides feature description and context files
4. Three-phase generation: Requirements → Design → Tasks
5. Each phase allows refinement before approval
6. Export capabilities for all generated specifications

### Development Workflow
- Follow semantic versioning for releases
- Use conventional commits for clear history
- Always test with actual OpenRouter API integration
- Verify localStorage warnings display correctly
- Test export functionality thoroughly

## Environment variables

No server-side environment variables needed. All configuration is client-side:
- OpenRouter API keys managed in browser memory only
- No authentication system required
- No database connections

## Build and deployment

### Local Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Vercel Deployment
- Connect repository to Vercel
- No environment variables needed
- Automatic deployments on main branch pushes
- Use Next.js build optimization

## Security considerations

- Never store API keys persistently
- Clear sensitive data on page unload
- Validate file uploads for supported types
- Implement proper error boundaries
- Use HTTPS for all API communications
- Follow OpenRouter API best practices

## Contribution guidelines

### Code Quality
- Run `npm run lint` before committing
- Follow existing code patterns
- Add TypeScript types for new features
- Update documentation for API changes

### Commit Messages
Follow conventional commit format:
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `style:` formatting changes
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance tasks

### Pull Request Process
1. Create feature branch from main
2. Make changes following code style guidelines
3. Add tests for new functionality
4. Update documentation if needed
5. Run full test suite
6. Submit PR with clear description

## AI Model Integration

### OpenRouter API Usage
- Support all available OpenRouter models
- Handle model-specific context limits
- Implement proper error handling for API failures
- Show real-time pricing and context information
- Filter models based on capability requirements

### Prompt Engineering
- Maintain separate prompts for each phase
- Follow Kiro Spec Mode format exactly
- Include diagram generation instructions
- Handle iterative refinement requests
- Preserve context between refinement cycles

## Browser Storage

- Use localStorage for session persistence
- Clear warnings about data volatility
- Implement auto-save during workflow
- Handle storage quota limits gracefully
- Provide export options before data loss

## Project Status & Updates

### Current Status: Core Functionality Complete with Simplified UI
- ✅ Repository initialized with README.md and project documentation
- ✅ AGENTS.md created following agents.md format
- ✅ Next.js 14 project setup complete
- ✅ shadcn/ui component library integration complete
- ✅ OpenRouter API client implementation complete
- ✅ Core workflow components created
- ✅ **CRITICAL BUG FIXED**: API key clearing on invalid validation now works properly
- ✅ **UI SIMPLIFIED**: Header and Footer components streamlined to essential branding only
- ✅ ModelSelector tests fully working (9/9 passing)
- ✅ **ApiKeyInput tests fully working (18/18 passing)** - All critical functionality verified
- ⚠️ PromptInput tests partially working (14/22 passing) - Some complex features need implementation

### Recent Changes
- **2025-01-13**: **FIXED CRITICAL API KEY SECURITY BUG** - Invalid API keys are now properly cleared from sessionStorage
- **2025-01-13**: **SIMPLIFIED UI COMPONENTS** - Removed complex navigation, dropdowns, newsletter signup, and clutter from Header/Footer
- **2025-01-13**: **RESOLVED PLACEHOLDER TEXT MISMATCH** - Fixed ApiKeyInput test to match actual component implementation
- **2025-09-13**: Created AGENTS.md as living documentation for coding agents
- **2025-09-13**: Added comprehensive project structure and guidelines
- **2025-09-13**: **FIXED CRITICAL LOOPING TEST BUG** - The test sessions were looping due to:
  1. Jest config typo: `moduleNameMapping` instead of `moduleNameMapper` causing module resolution failures
  2. Missing `model-utils.ts` file that ModelSelector component imports
  3. Missing Jest mocks for `scrollIntoView` and `window.open` APIs
  4. Incorrect test mocking structure (tests were mocking wrong modules)

### Next Steps
- **HIGH PRIORITY**: Complete PromptInput component implementation for remaining test failures
  - Implement drag state text changes ("Drop files to upload" when dragging)
  - Add total file size display functionality
  - Implement file paste event handling
  - Add textarea auto-resize functionality
- Complete integration tests for full workflow  
- Set up end-to-end testing with actual OpenRouter API
- Add error boundary components
- Deploy simplified UI to staging environment

### Troubleshooting Notes

#### Jest Configuration Issues
- **Problem**: Tests were looping infinitely during execution
- **Root Cause**: Typo in `jest.config.js` - used `moduleNameMapping` instead of `moduleNameMapper`
- **Solution**: Corrected the configuration property name
- **Lesson**: Always validate Jest configuration property names carefully

#### Missing Module Dependencies
- **Problem**: `ModelSelector` component imports from `@/lib/openrouter/model-utils` which didn't exist
- **Solution**: Created comprehensive `model-utils.ts` with filtering, searching, and categorization functions
- **Functions included**: `filterModels`, `searchModels`, `categorizeModels`, `formatPrice`, etc.

#### Browser API Mocks
- **Problem**: Tests failed on missing browser APIs (`scrollIntoView`, `window.open`)
- **Solution**: Added proper mocks in `jest.setup.js`
- **APIs mocked**: `Element.prototype.scrollIntoView`, `window.open`

#### Test Structure Mismatches
- **Problem**: Tests were mocking `@/lib/openrouter/models` but component uses `@/lib/openrouter/client`
- **Solution**: Updated test mocks to match actual component dependencies
- **Result**: ModelSelector tests now pass completely (9/9)

### Component Testing Status

#### ✅ ModelSelector Component
- All tests passing (9/9)
- Properly mocked dependencies
- Covers API key validation, model loading, selection, filtering, and error handling

#### ✅ **ApiKeyInput Component - FULLY WORKING**
- **All tests passing (18/18)** - Critical functionality verified
- **SECURITY BUG FIXED**: Invalid API keys are properly cleared from sessionStorage
- Covers validation, loading states, error handling, visibility toggle, and storage
- Fixed placeholder text test to match actual component implementation

#### ⚠️ PromptInput Component - PARTIALLY WORKING
- **14/22 tests passing** - Core functionality works
- **Failing tests require additional component features**:
  - Drag state text changes ("Drop files to upload" when dragging)
  - Total file size display
  - File paste event handling 
  - Textarea auto-resize functionality
- Successfully fixed: text selectors, file structure validation, error message matching

#### 📋 Other Components
- Storage utilities: Tests passing
- useSpecWorkflow hook: Tests passing
- OpenRouter integration: Tests passing

## Maintaining This Document

This AGENTS.md file should be updated throughout the project lifecycle:

1. **After major milestones** - Update project status and file structure
2. **When adding new dependencies** - Update setup commands and tech stack
3. **When establishing new patterns** - Add to code style and conventions
4. **When encountering common issues** - Add to troubleshooting section
5. **When changing deployment** - Update build and deployment instructions

Remember: OpenSpec is a client-side only application. All AI model interactions happen through OpenRouter API, and all data is stored locally in the user's browser.
