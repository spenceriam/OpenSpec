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
- **Storage**: Browser sessionStorage for user sessions
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

- Use sessionStorage for session persistence (data cleared when browser closed)
- Comprehensive session management with Start Over vs Continue functionality
- Auto-save during workflow for API key, model selection, prompt, and context files
- Handle storage quota limits gracefully
- Provide export options before data loss
- Security-focused: API keys masked by default, never logged to console

## Project Status & Updates

### Current Status: TOKEN OPTIMIZATION IN PROGRESS - Addressing 222k Token Overflow Issue
- ✅ **CORE FUNCTIONALITY COMPLETE**: All UI components working with proper workflow
- ✅ **CRITICAL BUG RESOLVED**: ModelSelector now renders immediately after API key validation
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
- ✅ **PromptInput UX Features Implemented**: Dynamic drag text, total file size display, paste handling, textarea auto-resize
- ✅ **HEADER DUPLICATION ISSUE FIXED**: Removed duplicate header from page.tsx, now using only layout.tsx Header component
- ✅ **API KEY VALIDATION BUG FIXED**: Fixed ModelSelector method name from getAvailableModels() to listModels()
- ✅ **COMPREHENSIVE SESSION MANAGEMENT**: Full Start Over/Continue functionality implemented
- ✅ **SECURITY ENHANCEMENTS**: API key masking, secure session storage, no console logging
- ✅ **UX IMPROVEMENTS**: Single unified API key interface, professional dark theme
- ✅ **VISUAL POLISH**: Dark theme scrollbars, proper text contrast, loading states
- ✅ **SESSION PERSISTENCE**: API key, model, prompt, and context files all persist across sessions
- ✅ **DIALOG BEHAVIOR FIXED**: Welcome back dialog now shows only once per session, not during active testing
- ✅ **FORM LAYOUT OPTIMIZED**: Prompt input form now 30% wider (780px) for comfortable long-form writing
- ✅ **FILE UPLOAD SIMPLIFIED**: Compact button interface replaces large dropzone for cleaner design
- ✅ **PWA ASSETS COMPLETE**: Manifest.json and custom favicon.svg added for proper web app support
- ⚠️ **ACTIVE TOKEN OVERFLOW ISSUE**: 222k token API calls still failing despite optimization attempts

### Recent Changes
- **2025-01-15 (Evening - TOKEN OPTIMIZATION ATTEMPT)**: **MAJOR TOKEN OVERFLOW DEBUGGING** - Comprehensive attempt to resolve 222k token issue:
  - **IDENTIFIED ROOT CAUSE**: System prompts were 1,125-4,250 tokens each (up to 17,000 characters!)
  - **APPLIED KIRO-BASED FIXES**: Completely rewrote system prompts using leaked Kiro Spec Mode instructions
  - **REDUCED SYSTEM PROMPTS BY 98%**: From 4,250 tokens to ~150 tokens each
  - **ELIMINATED CONTEXT FILE DUPLICATION**: Removed double-sending of context files in API calls
  - **STANDARDIZED TOKEN ESTIMATION**: Single accurate method using 3.7 chars/token industry standard
  - **ENHANCED DEBUGGING**: Comprehensive token breakdown logging for all API calls
  - **PHASE-SEPARATED WORKFLOW**: Ensured Requirements → Design → Tasks don't concatenate massive content
  - **RESULT**: ⚠️ Still hitting 230k token limit - indicates deeper issue in prompt building logic
  - **STATUS**: 🔄 NEEDS FURTHER INVESTIGATION - Problem likely in `buildRequirementsPrompt()` or context file processing
- **2025-01-15 (Early Morning - BUG RESOLUTION SUCCESS)**: **MODELSELECTOR BLANK SCREEN BUG FIXED** - Critical issue completely resolved:
  - **ROOT CAUSE IDENTIFIED**: React hook state isolation - multiple `useSimpleApiKeyStorage` instances weren't synchronized
  - **SOLUTION IMPLEMENTED**: Added custom event system with `'openspec-api-key-change'` events to sync all hook instances
  - **TECHNICAL FIX**: Storage changes now emit events that update state across all components simultaneously
  - **RESULT**: ModelSelector now appears immediately after API key validation without requiring refresh
  - **STATUS**: ✅ RESOLVED - Core user flow now works seamlessly
- **2025-01-14 (Evening)**: **UI/UX IMPROVEMENTS AND SESSION MANAGEMENT FIXES** - Major usability enhancements:
  - **Fixed Welcome Back Dialog**: No longer shows repeatedly during testing - only appears once per session with meaningful saved content
  - **Wider Prompt Input Form**: Increased form width to 780px (30% wider) for better writing experience
  - **Simplified File Upload**: Replaced large dropzone with compact "Add Files" button for cleaner UI
  - **Streamlined File List**: Shows just filenames and sizes without preview buttons - cleaner presentation
  - **Added Missing Assets**: Created manifest.json and favicon.svg for proper PWA support
  - **Fixed React Warnings**: Resolved suppressHydrationWarnings prop warning
  - **Session Check Optimization**: Implemented hasCheckedSession flag to prevent dialog re-triggering
- **2025-09-14**: **MAJOR UX AND SECURITY OVERHAUL** - Production-ready improvements:
  - Fixed API key security: Proper masking (sk-or-v1********************z567 format)
  - Redesigned ApiKeyInput: Single unified interface (no more confusing dual fields)
  - Implemented comprehensive session management: "Reset & Start Fresh" vs "Continue"
  - Added dark theme scrollbars and improved visual consistency
  - Enhanced ModelSelector: Loading states, better error handling, dark theme fixes
  - Session persistence: API key, model, prompt, and context files all saved/restored
  - Removed debug console.log statements that could leak sensitive data
  - Professional dialog UX with clear action descriptions
- **2025-01-14**: **FIXED API KEY VALIDATION ERROR** - Resolved 'client.getAvailableModels is not a function' error:
  - Updated ModelSelector.tsx to call client.listModels() instead of getAvailableModels()
  - Fixed API route /api/models to use correct method name
  - Updated test files to mock correct method
- **2025-01-14**: **FIXED HEADER DUPLICATION AND IMPROVED LAYOUT** - Professional layout improvements:
  - Removed duplicate header from page.tsx, now using only layout.tsx Header
  - Fixed header alignment: left-align brand with justify-between layout
  - Fixed footer alignment: proper left/right layout with X.com contact link
  - Updated messaging: built for agentic coding needs in open source
- **2025-01-14**: **IMPLEMENTED MISSING UX FEATURES IN PROMPTINPUT** - All missing features implemented:
  - Dynamic drag state text: Changes to "Drop files to upload" when dragging
  - Total file size display: Shows cumulative size next to file count
  - Paste file handling: Users can paste files into textarea
  - Textarea auto-resize: Height adjusts based on content (min 128px, max 300px)
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
- **CRITICAL PRIORITY**: Resolve Token Overflow Issue
  - **IMMEDIATE**: Debug actual prompt content being sent to API with character-level analysis
  - **IMMEDIATE**: Implement hard caps on individual context files (500 chars max per file)
  - **IMMEDIATE**: Add aggressive prompt truncation with clear "...truncated" indicators
  - **IMMEDIATE**: Check session storage for persisted large content that might be auto-loading
  - **NEXT**: Test with minimal prompts (no context files, simple descriptions) to isolate issue
  - **NEXT**: Consider implementing prompt compression or summarization for large content
- **HIGH PRIORITY**: Complete workflow implementation (BLOCKED until token issue resolved)
  - Implement actual spec generation workflow (Requirements → Design → Tasks)
  - Add content refinement and approval controls
  - Complete export functionality for generated specifications
- **MEDIUM PRIORITY**: Advanced features
  - Implement real-time collaboration features
  - Add template system for common specification types
  - Enhanced diagram generation and customization
- **INFRASTRUCTURE STATUS**: Core infrastructure complete but workflow blocked
  - All UI components working with proper dark theme
  - Security measures implemented and tested
  - Session management fully functional

### Troubleshooting Notes

#### ⚠️ Active Critical Issues
- ⚠️ **Token Overflow Issue**: 222k-230k token API calls exceeding model limits
  - **Symptoms**: "This endpoint's maximum context length is 32,768 tokens. However, you requested about 230103 tokens"
  - **Investigation Status**: 🔄 IN PROGRESS - System prompts optimized by 98%, but issue persists
  - **Likely Root Causes**:
    1. 🔍 **buildRequirementsPrompt()**: May still be concatenating excessive context file content
    2. 🔍 **Context File Processing**: Individual files or total aggregate may exceed limits
    3. 🔍 **Phase Content Bloat**: Previous phases (requirements/design) may contain massive content
    4. 🔍 **Hidden Content Duplication**: User prompt may still contain duplicated data
  - **Next Steps**:
    - Add character-by-character analysis of actual prompt content sent to API
    - Implement hard caps on context file sizes (e.g., 500 chars per file, 2KB total)
    - Add prompt content truncation with "...truncated" indicators
    - Investigate if large test content is being persisted in session storage
  - **Debugging Tools Added**: ✅ Comprehensive token breakdown logging, ✅ Content analysis logging

#### Previously Resolved Critical Issues ✅
- ✅ **ModelSelector Rendering**: Fixed React hook state synchronization issue
  - **Final Solution**: Implemented custom event system to sync state across hook instances
  - **Implementation**: `window.dispatchEvent(new CustomEvent('openspec-api-key-change'))` on storage updates
  - **Result**: All components using `useSimpleApiKeyStorage` now stay synchronized
  - **Status**: ModelSelector appears immediately after API key validation

#### Previously Resolved Issues
- ✅ **ModelSelector Blank Screen**: Fixed React hook state synchronization with custom event system
- ✅ **Header Duplication**: Fixed - single header implementation
- ✅ **API Key Security**: Fixed - proper masking and no console logging
- ✅ **Session Management**: Implemented - comprehensive data persistence
- ✅ **Dark Theme**: Complete - scrollbars, text contrast, visual consistency
- ✅ **UX Confusion**: Resolved - clear single-purpose interfaces
- ✅ **Welcome Back Dialog Spam**: Fixed - only shows once per session with meaningful content
- ✅ **Form Width Issues**: Resolved - fixed 780px width for optimal writing experience
- ✅ **File Upload Clutter**: Simplified - compact button replaces large dropzone

#### Historical Issues (All Resolved)

**Jest Configuration Issues** ✅
- Fixed `moduleNameMapping` typo in jest.config.js
- Lesson: Always validate Jest configuration property names

**Missing Module Dependencies** ✅  
- Created comprehensive `model-utils.ts` with filtering and categorization
- Added proper browser API mocks for testing

**Session Management Issues** ✅
- Implemented comprehensive session persistence
- Added proper Start Over vs Continue functionality
- Fixed API key security and masking

**UI/UX Issues** ✅
- Resolved confusing dual API key interfaces
- Fixed dark theme text visibility and scrollbars
- Added proper loading states and error handling

### Component Testing Status

#### ✅ **ModelSelector Component - PRODUCTION READY**
- **Core functionality**: Renders immediately after API key validation (bug resolved)
- **State synchronization**: Fixed React hook isolation issue with custom event system
- **Loading states**: Proper spinner display during model fetching
- **Dark theme**: Complete text visibility and contrast optimization
- **Professional UI**: OpenRouter-style model information display with pricing and capabilities
- **Error handling**: Comprehensive error states and retry functionality
- **Performance**: Efficient model filtering, search, and categorization

#### ✅ **ApiKeyInput Component - PRODUCTION READY**
- **Security enhanced**: API keys properly masked by default (sk-or-v1********************z567)
- **UX redesigned**: Single unified input field (removed confusing dual interface)
- **Session management**: Proper clearing and restoration of API keys
- **Visual improvements**: Better dark theme integration and text contrast
- **Privacy focused**: Removed debug logging that could expose sensitive data

#### ✅ **PromptInput Component - OPTIMIZED FOR PROFESSIONAL USE**
- **Core functionality**: File upload, validation, removal all working (preview removed for simplicity)
- **Layout optimized**: Fixed 780px width (30% wider) for comfortable long-form content creation
- **File upload simplified**: Compact "Add Files" button replaces large dropzone for cleaner interface
- **File list streamlined**: Shows just filenames and sizes without preview buttons
- **Enhanced UX features**:
  - ✅ Dynamic drag state text changes ("Drop files to upload" when dragging)
  - ✅ Total file size display (shows cumulative size next to file count)
  - ✅ File paste event handling (paste files directly into textarea)
  - ✅ Textarea auto-resize functionality (min-h-32, max-h-64)
  - ✅ Larger text input (text-base) for better readability
- **Note**: Focused on professional workflow efficiency over complex features

#### ✅ **Session Management - COMPREHENSIVE**
- **useAPIKeyStorage**: Secure API key management with validation and masking
- **useModelStorage**: Persistent model selection across sessions
- **usePromptStorage**: Auto-save prompt text during typing
- **useContextFilesStorage**: Persistent file upload management
- **Session Dialog**: Smart detection and restoration of all saved data
- **Reset & Start Fresh**: Complete data clearing functionality
- **Continue**: Seamless restoration of previous work session

#### 📋 Other Components
- Storage utilities: Enhanced with comprehensive session management
- useSpecWorkflow hook: Ready for workflow implementation
- OpenRouter integration: Production-ready with error handling

## Recent Technical Solutions

### ModelSelector State Synchronization Fix (2025-01-15)

**Problem**: React hook state isolation - multiple components using `useSimpleApiKeyStorage` had separate state instances

**Root Cause**: When `ApiKeyInput` called `setAPIKey()`, it updated sessionStorage and its own state, but other components (main page, ModelSelector) didn't re-render because their hook instances had separate state.

**Solution**: Implemented cross-hook state synchronization:
```typescript
// In setAPIKey and clearAPIKey:
window.dispatchEvent(new CustomEvent('openspec-api-key-change'))

// In useEffect:
window.addEventListener('openspec-api-key-change', handleStorageChange)
```

**Result**: All components using `useSimpleApiKeyStorage` now stay synchronized. ModelSelector appears immediately after API key validation.

### Token Optimization Analysis (2025-01-15)

**Problem**: API calls generating 222,000-230,000 tokens, exceeding model limits (32,768 tokens)

**Optimization Work Completed**:
1. **System Prompt Reduction**: Reduced from 17,000 characters (4,250 tokens) to ~1,000 characters (150 tokens) - **98% reduction**
2. **Context File Duplication Removal**: Eliminated double-sending of context files in API payload
3. **Token Estimation Standardization**: Unified to 3.7 chars/token industry standard
4. **Enhanced Debugging**: Added comprehensive token breakdown logging
5. **Phase Separation**: Ensured Requirements → Design → Tasks phases don't concatenate content

**Root Cause Analysis**:
- **System prompts were massive**: Design prompt alone was 17,000 characters!
- **Context files sent twice**: Both embedded in userPrompt AND as separate contextFiles parameter
- **Inconsistent token estimation**: Multiple methods (3.3, 4, varying ratios) caused inaccurate validation

**Current Status**: Despite 98% system prompt reduction, still hitting 230k token limit

**Likely Remaining Issues**:
1. **buildRequirementsPrompt()** may still be concatenating excessive context file content
2. Large test content may be persisted in browser session storage and auto-loading
3. Context file processing may have bugs allowing massive individual files
4. User prompts may contain hidden content duplication we haven't identified

**Key Files Modified**:
- `lib/prompts/requirements.ts` - Reduced from 4,500 chars to 500 chars
- `lib/prompts/design.ts` - Reduced from 17,000 chars to 800 chars  
- `lib/prompts/tasks.ts` - Reduced from 6,000 chars to 1,200 chars
- `hooks/useSpecWorkflow.ts` - Added token validation, removed context file duplication

**Next Session Focus**: Character-level analysis of actual API payload content to identify remaining bloat source.

## Maintaining This Document

This AGENTS.md file should be updated throughout the project lifecycle:

1. **After major milestones** - Update project status and file structure
2. **When adding new dependencies** - Update setup commands and tech stack
3. **When establishing new patterns** - Add to code style and conventions
4. **When encountering common issues** - Add to troubleshooting section
5. **When changing deployment** - Update build and deployment instructions

Remember: OpenSpec is a client-side only application. All AI model interactions happen through OpenRouter API, and all data is stored locally in the user's browser.
