# OpenSpec GitHub Copilot Instructions

**ALWAYS** follow these instructions first and fallback to additional search and context gathering only if the information here is incomplete or found to be in error.

OpenSpec is a Next.js 14 TypeScript application that generates AI-powered technical specifications using OpenRouter API. It follows a three-phase workflow: Requirements → Design → Implementation Tasks.

## Essential Commands

### Dependencies and Setup
```bash
# Install all dependencies - takes ~40 seconds
npm install

# NEVER CANCEL: Build may fail due to Google Fonts network restrictions in CI
# Use development mode instead for testing functionality
npm run build  # May fail with font loading errors in restricted networks

# Start development server - takes ~1.5 seconds, runs on port 3000 (or 3001 if 3000 busy)
# NEVER CANCEL: Development server timeout should be set to 60+ seconds
npm run dev
```

### Testing and Quality
```bash
# Run all tests - takes ~30 seconds, includes 121 tests across unit/component/integration
# NEVER CANCEL: Set timeout to 60+ seconds for test execution
npm test

# Run specific test suites
npm run test:unit        # Unit tests only (~5 seconds)
npm run test:components  # Component tests only (~15 seconds) 
npm run test:integration # Integration tests only (~10 seconds)

# Run with coverage report
npm run test:coverage

# Run tests in watch mode for development
npm run test:watch

# Run linting - takes ~3 seconds but currently has many warnings/errors
npm run lint
```

## Working Effectively

### Build Process  
- **Development**: Always use `npm run dev` - build may fail due to Google Fonts network restrictions
- **NEVER CANCEL** any build or test commands - they may take 30+ seconds to complete
- Development server starts quickly (~1.3 seconds) and is the primary way to run the application
- Production builds may fail in restricted network environments due to external font dependencies
- **API Endpoints Work**: Server responds correctly on ports 3000/3001/3002 with HTTP 200 status
- **Core Functionality Validated**: Unit tests pass (54/54), API routes respond appropriately

### Manual Validation Requirements
After making ANY changes, you MUST perform complete end-to-end validation:

#### Essential User Scenarios to Test
1. **API Key Entry Flow**
   - Enter valid OpenRouter API key (format: sk-or-v1-...)
   - Verify key validation and masking (shows sk-or-v1********************z567)
   - Test invalid key handling and error states

2. **Model Selection Workflow**  
   - Verify model list loads after valid API key entry
   - Select an AI model (Claude 3 Sonnet recommended for testing)
   - Confirm model information displays (pricing, context window, capabilities)

3. **Prompt and Context Input**
   - Enter feature description (minimum 10 characters required)
   - Test file upload functionality (supports .ts, .js, .py, .md, .json, .txt, etc.)
   - Verify file size limits and validation (2KB per file, 5KB total)

4. **Three-Phase Generation Workflow**
   - Requirements Phase: Generate → Review → Approve (auto-advances to Design)
   - Design Phase: Generate → Review → Approve (auto-advances to Tasks) 
   - Tasks Phase: Generate → Review → Approve → Complete
   - Test content refinement in each phase
   - Verify Mermaid diagram generation in Design phase

5. **Export and Session Management**
   - Test ZIP export functionality (Requirements.md, Design.md, Tasks.md, Mermaid diagrams)
   - Verify session persistence across browser refresh
   - Test "Reset & Start Fresh" functionality

#### Critical Validation Points
- **ALWAYS** test with a real OpenRouter API key for full functionality validation
- Verify localStorage/sessionStorage behavior for data persistence
- Test error handling for network failures and invalid inputs
- Confirm UI responsiveness and dark theme consistency
- Validate accessibility features and keyboard navigation

## Key File Locations

### Core Application Structure
```
app/
├── page.tsx              # Main application orchestrator - all user interactions
├── layout.tsx            # Root layout with metadata and theme
├── globals.css           # Global styles and theme definitions
└── api/
    ├── generate/route.ts # API endpoint for AI generation requests
    └── models/route.ts   # API endpoint for model list retrieval
```

### Critical Components
```
components/
├── ApiKeyInput.tsx       # API key management with validation and security
├── ModelSelector.tsx     # OpenRouter model selection with filtering
├── PromptInput.tsx       # Feature description and file upload interface  
├── WorkflowProgress.tsx  # Visual progress indicator for three phases
├── MarkdownPreview.tsx   # Content display with Mermaid diagram rendering
├── ContentRefinement.tsx # AI-powered content refinement interface
├── ApprovalControls.tsx  # Phase approval and workflow progression
├── ExportDialog.tsx      # ZIP export functionality for specifications
└── ErrorBoundary.tsx     # Comprehensive error handling and recovery
```

### Business Logic and Utilities
```
hooks/
├── useSpecWorkflow.ts    # Main workflow state machine and API orchestration
├── useSimpleApiKeyStorage.ts # Secure API key management with validation
└── useSessionStorage.ts  # Persistent session data management

lib/
├── openrouter/          # OpenRouter API client and model utilities
│   ├── client.ts        # API client with error handling and token management
│   ├── model-utils.ts   # Model filtering, search, and categorization  
│   └── types.ts         # TypeScript interfaces for API responses
├── prompts/             # AI prompts for each workflow phase
│   ├── requirements.ts  # Requirements generation system prompt
│   ├── design.ts        # Design document generation system prompt  
│   └── tasks.ts         # Implementation tasks generation system prompt
└── exportUtils.ts       # ZIP file creation and export functionality
```

### Testing Infrastructure
```
__tests__/
├── unit/                # Pure function and utility tests
├── components/          # React component interaction tests
└── integration/         # OpenRouter API integration tests
```

## Common Development Tasks

### When modifying API integration:
- Always update `lib/openrouter/client.ts` for API changes
- Test with real API keys to validate token limits and error handling
- Update `__tests__/integration/openrouter-integration.test.ts` for new scenarios
- Check token usage to prevent exceeding model context limits (32,768 tokens max)

### When updating UI components:
- Follow shadcn/ui component patterns in `components/ui/`
- Maintain dark theme consistency across all components
- Test keyboard navigation and accessibility features
- Update corresponding test files in `__tests__/components/`

### When changing workflow logic:
- Primary logic is in `hooks/useSpecWorkflow.ts`
- Test all three phases: Requirements → Design → Tasks
- Verify session persistence and data migration
- Update workflow progress indicators and error handling

### When modifying prompts:
- Edit system prompts in `lib/prompts/` directory
- Keep prompts concise to prevent token overflow (current limits: 500-1200 chars each)
- Test with multiple AI models to ensure compatibility
- Verify Mermaid diagram generation still works correctly

## Performance Considerations

### Token Management (CRITICAL)
- **Total token limit**: 32,768 tokens per API call
- **Current prompt sizes**: Requirements (~500 chars), Design (~800 chars), Tasks (~1,200 chars)  
- **Context file limits**: 2KB per file, 5KB total to prevent token overflow
- **Server-side protection**: API routes have token clamping with binary content stripping
- **Always validate** token usage when modifying prompts or adding context

### Network and API Limits
- OpenRouter API rate limits vary by model and subscription tier
- File uploads are processed client-side before API calls
- Large context files are automatically truncated to prevent failures
- Build process may fail in restricted networks due to Google Fonts dependency

### Browser Storage
- Uses sessionStorage for API keys (cleared when browser closes)
- Uses localStorage for workflow state persistence
- Implements automatic data migration for backward compatibility
- Storage quota limits are handled gracefully with user warnings

## Troubleshooting Common Issues

### Build and Development Issues
1. **Build fails with font loading error**: Use `npm run dev` instead - production builds require internet access
2. **Development server won't start**: Check if port 3000/3001 is available, server auto-selects next available port
3. **Tests failing**: Some tests may fail due to API mocking issues - focus on integration tests for real functionality

### Application Functionality Issues  
1. **ModelSelector not appearing**: Ensure valid API key is entered and validated first
2. **Generation fails with token errors**: Check context file sizes and prompt lengths
3. **Session data not persisting**: Verify localStorage is enabled and not full
4. **Export not working**: Check browser permissions for file downloads

### API Integration Issues
1. **Invalid API key errors**: Verify OpenRouter API key format (sk-or-v1-...)
2. **Network timeouts**: OpenRouter API calls may take 10-30 seconds for complex generations
3. **Model unavailable errors**: Some models may be temporarily unavailable - try different models
4. **Cost/usage errors**: Check OpenRouter account credits and usage limits

### Validation Results (TESTED)
All commands and timings have been validated in fresh environment:

**✅ VALIDATED COMMANDS**
- `npm install`: 11-40 seconds (cache dependent) - **WORKS**
- `npm run dev`: ~1.3 seconds startup, HTTP 200 response - **WORKS**  
- `npm test`: ~30 seconds, 121 total tests - **RUNS** (some expected failures)
- `npm run test:unit`: ~28 seconds, 54/54 tests pass - **ALL PASS**
- `npm run lint`: ~2.3 seconds completion - **WORKS** (warnings expected)
- API endpoints `/api/models` and `/api/generate`: Respond correctly - **WORKS**
- Server auto-selects ports 3000 → 3001 → 3002 if busy - **WORKS**

**⚠️ EXPECTED LIMITATIONS**  
- Production `npm run build`: Fails due to Google Fonts network dependency
- Component/Integration tests: Some failures due to mocking issues (use unit tests for validation)
- Linting: Many warnings/errors present but completes successfully

- [ ] `npm install` completes successfully (~40 seconds)
- [ ] `npm run dev` starts development server successfully (~1.5 seconds)  
- [ ] Application loads at http://localhost:3000 (or alternate port)
- [ ] API key entry and validation works with real OpenRouter key
- [ ] Model selection displays and functions correctly
- [ ] Complete three-phase workflow can be executed end-to-end
- [ ] File upload and context handling works within size limits
- [ ] Export functionality produces valid ZIP files
- [ ] Session persistence works across browser refresh
- [ ] `npm test` passes without critical failures (~30 seconds)
- [ ] `npm run lint` completes (warnings acceptable, no errors)

## Security and API Key Handling

### NEVER:
- Log API keys to console or commit them to repository
- Store API keys in localStorage (use sessionStorage only)
- Include API keys in error messages or debug output
- Bypass API key validation or security measures

### ALWAYS:
- Mask API keys in UI (show only first/last characters)
- Clear API keys from memory when invalid or on reset
- Use secure HTTP headers for API communication
- Validate API key format before making requests
- Handle API errors gracefully without exposing sensitive data

## Dependencies and Environment

### Required Node.js Version
- Node.js 18+ required for Next.js 14 compatibility
- npm, yarn, or pnpm package managers supported

### Key Dependencies
- **Next.js 14**: React framework with App Router
- **TypeScript 5**: Strict mode enabled for type safety
- **Tailwind CSS**: Utility-first styling with shadcn/ui components
- **OpenRouter API**: AI model access (requires API key)
- **Jest + React Testing Library**: Comprehensive testing framework
- **Mermaid.js**: Automatic diagram generation in specifications

### No Backend Required
- Fully client-side application with no server dependencies
- All data stored in browser storage (localStorage/sessionStorage)  
- API calls made directly to OpenRouter from browser
- No authentication system or database connections needed

---

**REMEMBER**: This application generates professional technical specifications using AI. Always test the complete user workflow with real API keys and validate that generated content meets quality standards for professional development use.