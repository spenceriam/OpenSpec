# AGENTS.md

OpenSpec is a client-side Next.js 14 application that generates AI-powered technical specifications using OpenRouter's API. It implements a three-phase workflow: Requirements → Design → Implementation Tasks.

**Key characteristics:**
- Fully client-side: No backend required, all data stored in browser storage
- OpenRouter integration: Uses any AI model from OpenRouter's catalog via API
- Three-phase workflow: Structured specification generation with iterative refinement
- Professional export: Generates ZIP files with Markdown documents and Mermaid diagrams

## Setup commands

- Install deps: `npm install`
- Start dev server: `npm run dev`
- Build for production: `npm run build`
- Run tests: `npm test`
- Run specific tests: `npm run test:unit`, `npm run test:components`, `npm run test:integration`
- Lint code: `npm run lint`

## Code style

- TypeScript strict mode enabled
- Use shadcn/ui component patterns
- Follow Next.js 14 App Router conventions
- Prefer functional components and React hooks
- Use Tailwind CSS for styling
- Implement proper error boundaries for components
- NEVER log API keys to console or commit to repository
- Store API keys in sessionStorage only (cleared when browser closes)

## Architecture

**Core workflow:**
1. API Key Management: Secure OpenRouter API key validation and storage
2. Model Selection: Browse and select from 200+ AI models with filtering
3. Prompt Input: Feature description with optional context file uploads
4. Three-Phase Generation: Requirements → Design → Tasks with approval gates
5. Export System: Professional ZIP export with Markdown and Mermaid diagrams

**State management:**
- `useSpecWorkflow` hook: Central workflow state machine with timing/cost tracking
- Session persistence: API keys in sessionStorage, workflow data in localStorage
- Atomic operations: Prevent race conditions in approval/generation cycles

**Key files:**
- `app/page.tsx`: Main application orchestrator
- `hooks/useSpecWorkflow.ts`: Main workflow state machine
- `lib/openrouter/client.ts`: OpenRouter API client with retry logic
- `lib/prompts/`: AI prompts for each phase (500-1200 chars each)
- `components/`: React components following shadcn/ui patterns

## Development patterns

**OpenRouter API integration:**
```typescript
const workflow = useSpecWorkflow({ selectedModel })
await workflow.generateWithData(featureName, description, contextFiles)
await workflow.approveAndProceed()
```

**Token management (CRITICAL):**
- Total limit: 32,768 tokens per API call
- Server-side protection: Automatic token clamping with binary content stripping
- Client-side filtering: Context files pre-filtered to prevent overflow

**Component patterns:**
- Use error boundaries for all major components
- Mock OpenRouter API calls in tests with `jest.mock('@/lib/openrouter/client')`
- Follow shadcn/ui patterns for consistent UI

## Common tasks

**Adding workflow phases:**
1. Update `types/index.ts` for new WorkflowPhase
2. Modify `useSpecWorkflow.ts` state machine
3. Add corresponding prompts in `lib/prompts/`
4. Update UI components for new phase

**Debugging token overflow:**
```javascript
// Browser console debugging
const state = JSON.parse(localStorage.getItem('openspec-workflow-state') || '{}')
const tokens = Math.ceil(prompt.length / 3.7) // ~3.7 chars per token
```

**Export formats:**
1. Extend `ExportOptions` interface in `types/index.ts`
2. Update `lib/exportUtils.ts` ZIP generation

## Testing

**Test structure:**
- Unit tests: `__tests__/unit/` (54/54 pass consistently)
- Component tests: `__tests__/components/` (60+ tests)
- Integration tests: `__tests__/integration/` (20+ tests)

**E2E validation checklist:**
1. API Key Flow: Enter valid key (sk-or-v1-...), verify masking
2. Model Selection: Load models, select Claude 3 Sonnet
3. Three-Phase Workflow: Requirements → Design → Tasks with approvals
4. Export Functionality: Generate ZIP with all Markdown files and diagrams

**Test timeouts:** Allow 30+ seconds for full test suite execution

## Environment

- Node.js 18+ required for Next.js 14
- OpenRouter API key required for full functionality
- Browser localStorage must be enabled

## Troubleshooting

**ModelSelector not appearing:**
- Verify API key is valid (sk-or-v1-...)
- Check `useSimpleApiKeyStorage` state synchronization

**Build failures:**
- Use `npm run dev` in restricted networks (Google Fonts dependency)
- All functionality available in development mode

**Token overflow:**
- Server-side clamping should prevent this
- Check context file sizes (2KB per file, 5KB total limit)
