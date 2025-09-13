# Design Document

## Overview

OpenSpec is a Next.js 14 web application that replicates Kiro IDE's Spec Mode functionality using OpenRouter's API for AI model access. The system follows a three-phase workflow (Requirements → Design → Tasks) with iterative refinement capabilities, automatic Mermaid diagram generation, and browser-based storage. The architecture prioritizes simplicity, performance, and developer experience while maintaining compatibility with Vercel deployment.

## System Architecture

### High-Level Architecture
```mermaid
graph TB
    subgraph "Client Browser"
        UI[React Components]
        Storage[localStorage]
        Cache[Session Memory]
        Renderer[Mermaid Renderer]
    end
    
    subgraph "Next.js Application"
        Pages[App Router Pages]
        API[API Routes]
        SSR[Server Components]
        Middleware[Request Middleware]
    end
    
    subgraph "External Services"
        OR[OpenRouter API]
        Models[AI Models Pool]
    end
    
    UI --> Pages
    Pages --> API
    API --> Middleware
    Middleware --> OR
    OR --> Models
    UI --> Storage
    UI --> Cache
    UI --> Renderer
    Pages --> SSR
```

### User Flow Architecture
```mermaid
graph TD
    Start([User Visits OpenSpec])
    Start --> CheckStorage{Has Saved Work?}
    
    CheckStorage -->|Yes| Restore[Restore Session]
    CheckStorage -->|No| Setup[Setup Phase]
    
    Setup --> APIKey[Enter API Key]
    APIKey --> ModelSelect[Select AI Model]
    ModelSelect --> Input[Input Feature Description]
    
    Restore --> WorkflowCheck{Check Phase}
    Input --> Requirements[Requirements Phase]
    
    WorkflowCheck -->|Requirements| Requirements
    WorkflowCheck -->|Design| Design
    WorkflowCheck -->|Tasks| Tasks
    
    Requirements --> ReqReview{User Approval?}
    ReqReview -->|No| ReqRefine[Refine Requirements]
    ReqRefine --> Requirements
    ReqReview -->|Yes| Design[Design Phase]
    
    Design --> DesignReview{User Approval?}
    DesignReview -->|No| DesignRefine[Refine Design]
    DesignRefine --> Design
    DesignReview -->|Yes| Tasks[Tasks Phase]
    
    Tasks --> TaskReview{User Approval?}
    TaskReview -->|No| TaskRefine[Refine Tasks]
    TaskRefine --> Tasks
    TaskReview -->|Yes| Export[Export Options]
    
    Export --> Complete([Workflow Complete])
```

## Component Architecture

### Component Hierarchy
```mermaid
graph TD
    App[App Layout]
    App --> Header[Header Component]
    App --> Main[Main Application]
    App --> Footer[Footer Component]
    
    Main --> Warning[Storage Warning]
    Main --> Setup[Setup Section]
    Main --> Workflow[Workflow Manager]
    Main --> Preview[Preview Panel]
    
    Setup --> APIInput[API Key Input]
    Setup --> ModelSelector[Model Selector]
    Setup --> PromptInput[Prompt Input]
    Setup --> FileUpload[File Upload]
    
    Workflow --> PhaseIndicator[Phase Indicator]
    Workflow --> Controls[Control Panel]
    Workflow --> Export[Export Dialog]
    
    Preview --> MarkdownRenderer[Markdown Renderer]
    Preview --> MermaidRenderer[Mermaid Renderer]
    
    Controls --> GenerateBtn[Generate Button]
    Controls --> RefineBtn[Refine Button]
    Controls --> ApproveBtn[Approve Button]
```

### State Management Flow
```mermaid
stateDiagram-v2
    [*] --> Initial
    Initial --> APISetup : User enters API key
    APISetup --> ModelSelection : Valid key
    ModelSelection --> PromptInput : Model selected
    PromptInput --> Requirements : Start generation
    
    Requirements --> RequirementsReview : Generation complete
    RequirementsReview --> RequirementsRefine : User requests changes
    RequirementsRefine --> Requirements : Apply feedback
    RequirementsReview --> Design : User approves
    
    Design --> DesignReview : Generation complete
    DesignReview --> DesignRefine : User requests changes
    DesignRefine --> Design : Apply feedback
    DesignReview --> Tasks : User approves
    
    Tasks --> TasksReview : Generation complete
    TasksReview --> TasksRefine : User requests changes
    TasksRefine --> Tasks : Apply feedback
    TasksReview --> Complete : User approves
    
    Complete --> Export : User exports
    Export --> [*] : Download complete
    
    APISetup --> [*] : Invalid key
    RequirementsRefine --> [*] : Error
    DesignRefine --> [*] : Error
    TasksRefine --> [*] : Error
```

## Data Models

### Core Data Structures
```mermaid
erDiagram
    SpecState ||--|| WorkflowPhase : "current phase"
    SpecState ||--o{ ContextFile : "uploaded files"
    SpecState ||--|| ApprovalState : "phase approvals"
    
    SpecState {
        string featureName
        string description
        string requirements
        string design
        string tasks
        boolean isGenerating
        string error
        timestamp lastSaved
    }
    
    WorkflowPhase {
        enum phase "requirements|design|tasks|complete"
        boolean canProceed
        string content
        timestamp generatedAt
    }
    
    ContextFile {
        string id PK
        string name
        string type "text|image|code"
        string content
        number size
        timestamp uploadedAt
    }
    
    ApprovalState {
        boolean requirements
        boolean design
        boolean tasks
        timestamp approvedAt
    }
    
    OpenRouterModel {
        string id PK
        string name
        string description
        number contextLength
        decimal pricing
        boolean supportsVision
        string[] capabilities
    }
    
    ExportOptions {
        enum format "markdown|separate|diagrams"
        boolean includeMetadata
        string[] selectedPhases
    }
```

## API Design

### OpenRouter Integration
```mermaid
sequenceDiagram
    participant UI as User Interface
    participant API as Next.js API Route
    participant OR as OpenRouter API
    participant Model as AI Model
    
    UI->>API: POST /api/generate
    Note over UI,API: { model, prompt, context, phase }
    
    API->>API: Validate API key
    API->>API: Build system prompt
    API->>API: Format user context
    
    API->>OR: POST /chat/completions
    Note over API,OR: Authorization: Bearer {key}
    
    OR->>Model: Route to selected model
    Model->>OR: Generated response
    OR->>API: Response with content
    
    API->>API: Extract Mermaid diagrams
    API->>API: Format response
    
    API->>UI: Return formatted content
    Note over API,UI: { content, diagrams, metadata }
    
    alt Error Case
        OR->>API: Error response
        API->>UI: Error with retry option
    end
```

### API Endpoints

#### POST /api/generate
Generates content for the current workflow phase.

**Request:**
```typescript
interface GenerateRequest {
  model: string;
  phase: 'requirements' | 'design' | 'tasks';
  prompt: string;
  context?: Array<{
    type: 'text' | 'image';
    content: string;
    filename?: string;
  }>;
  refinement?: {
    currentContent: string;
    feedback: string;
  };
}
```

**Response:**
```typescript
interface GenerateResponse {
  content: string;
  diagrams: Array<{
    type: string;
    code: string;
    title?: string;
  }>;
  metadata: {
    model: string;
    tokensUsed: number;
    generatedAt: string;
  };
}
```

#### GET /api/models
Fetches available OpenRouter models.

**Response:**
```typescript
interface ModelsResponse {
  models: Array<{
    id: string;
    name: string;
    description: string;
    contextLength: number;
    pricing: {
      prompt: number;
      completion: number;
    };
    capabilities: string[];
  }>;
}
```

## Security Design

### API Key Management
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant SessionStorage
    participant APIRoute
    participant OpenRouter
    
    User->>Frontend: Enter API key
    Frontend->>SessionStorage: Store temporarily
    Frontend->>APIRoute: Test key validity
    APIRoute->>OpenRouter: Validate key
    OpenRouter->>APIRoute: Validation result
    
    alt Valid Key
        APIRoute->>Frontend: Success
        Frontend->>User: Enable workflow
    else Invalid Key
        APIRoute->>Frontend: Error
        Frontend->>SessionStorage: Clear key
        Frontend->>User: Request new key
    end
    
    Note over SessionStorage: Key cleared on browser close
```

### Data Protection Strategy
- **API Keys**: Stored only in sessionStorage, cleared on browser close
- **Generated Content**: Stored in localStorage with clear warnings about persistence
- **File Uploads**: Processed client-side, never sent to server permanently
- **CORS**: Configured for Vercel deployment domain only
- **Rate Limiting**: Implemented at API route level to prevent abuse

## Error Handling Strategy

### Error Categories and Recovery
```mermaid
graph TD
    Error[Error Occurred]
    Error --> APIError{API Error?}
    Error --> NetworkError{Network Error?}
    Error --> ValidationError{Validation Error?}
    Error --> StorageError{Storage Error?}
    
    APIError -->|Invalid Key| KeyPrompt[Prompt for new API key]
    APIError -->|Rate Limited| RetryDelay[Show retry with delay]
    APIError -->|Model Error| ModelSwitch[Suggest model switch]
    
    NetworkError --> RetryButton[Show retry button]
    NetworkError --> OfflineMode[Enable offline mode]
    
    ValidationError --> FormFeedback[Show inline validation]
    ValidationError --> InputCorrection[Guide input correction]
    
    StorageError --> StorageWarning[Show storage warning]
    StorageError --> ExportPrompt[Prompt immediate export]
    
    KeyPrompt --> Recovery[Resume workflow]
    RetryDelay --> Recovery
    ModelSwitch --> Recovery
    RetryButton --> Recovery
    OfflineMode --> Recovery
    FormFeedback --> Recovery
    InputCorrection --> Recovery
    StorageWarning --> Recovery
    ExportPrompt --> Recovery
```

### Error Recovery Mechanisms
1. **Automatic Retry**: Network errors with exponential backoff
2. **Graceful Degradation**: Continue with cached content when API fails
3. **User Guidance**: Clear error messages with actionable steps
4. **State Preservation**: Maintain user work during error recovery
5. **Fallback Options**: Alternative models when primary fails

## Performance Considerations

### Optimization Strategy
```mermaid
graph LR
    subgraph "Frontend Optimizations"
        LazyLoad[Lazy Loading]
        CodeSplit[Code Splitting]
        Memoization[React Memoization]
        VirtualScroll[Virtual Scrolling]
    end
    
    subgraph "API Optimizations"
        Caching[Response Caching]
        Compression[Gzip Compression]
        Streaming[Streaming Responses]
        RateLimit[Rate Limiting]
    end
    
    subgraph "Storage Optimizations"
        LocalCache[localStorage Cache]
        Compression2[Content Compression]
        Cleanup[Automatic Cleanup]
        Batching[Batch Operations]
    end
    
    LazyLoad --> UserExperience[Better UX]
    CodeSplit --> UserExperience
    Memoization --> UserExperience
    VirtualScroll --> UserExperience
    
    Caching --> Performance[Better Performance]
    Compression --> Performance
    Streaming --> Performance
    RateLimit --> Performance
    
    LocalCache --> Reliability[Better Reliability]
    Compression2 --> Reliability
    Cleanup --> Reliability
    Batching --> Reliability
```

### Caching Strategy
- **Model List**: Cache for 1 hour to reduce API calls
- **Generated Content**: Auto-save to localStorage every 30 seconds
- **Mermaid Diagrams**: Cache rendered SVGs to avoid re-rendering
- **API Responses**: Cache successful responses for session duration

## Testing Strategy

### Test Architecture
```mermaid
graph TD
    subgraph "Unit Tests"
        ComponentTests[Component Tests]
        HookTests[Hook Tests]
        UtilTests[Utility Tests]
        APITests[API Route Tests]
    end
    
    subgraph "Integration Tests"
        WorkflowTests[Workflow Integration]
        APIIntegration[OpenRouter Integration]
        StorageTests[Storage Integration]
    end
    
    subgraph "E2E Tests"
        UserJourney[Complete User Journey]
        ErrorScenarios[Error Scenarios]
        ExportFlow[Export Functionality]
    end
    
    ComponentTests --> TestRunner[Jest + Testing Library]
    HookTests --> TestRunner
    UtilTests --> TestRunner
    APITests --> TestRunner
    
    WorkflowTests --> Playwright[Playwright E2E]
    APIIntegration --> Playwright
    StorageTests --> Playwright
    
    UserJourney --> Cypress[Cypress Tests]
    ErrorScenarios --> Cypress
    ExportFlow --> Cypress
```

### Test Coverage Goals
- **Unit Tests**: 90% coverage for utilities and hooks
- **Component Tests**: 85% coverage for UI components
- **Integration Tests**: Cover all API integrations and workflows
- **E2E Tests**: Cover complete user journeys and error scenarios

## Deployment Architecture

### Vercel Deployment Strategy
```mermaid
graph TD
    subgraph "Development"
        LocalDev[Local Development]
        GitCommit[Git Commit]
    end
    
    subgraph "CI/CD Pipeline"
        VercelBuild[Vercel Build]
        Tests[Run Tests]
        TypeCheck[TypeScript Check]
        Lint[ESLint Check]
    end
    
    subgraph "Production"
        VercelEdge[Vercel Edge Network]
        CDN[Static Asset CDN]
        Analytics[Vercel Analytics]
    end
    
    LocalDev --> GitCommit
    GitCommit --> VercelBuild
    VercelBuild --> Tests
    Tests --> TypeCheck
    TypeCheck --> Lint
    Lint --> VercelEdge
    VercelEdge --> CDN
    VercelEdge --> Analytics
```

### Environment Configuration
- **Development**: Local development with hot reload
- **Preview**: Automatic preview deployments for PRs
- **Production**: Optimized build with edge caching
- **Environment Variables**: API keys and configuration via Vercel dashboard

## Technology Decisions

### Frontend Stack Rationale
- **Next.js 14**: App Router for modern React patterns, built-in optimization
- **Tailwind CSS**: Rapid UI development with consistent design system
- **shadcn/ui**: High-quality, accessible components with customization
- **react-markdown**: Reliable markdown rendering with plugin support
- **Mermaid**: Industry standard for diagram generation

### State Management Approach
- **React Hooks**: Built-in state management for component-level state
- **Custom Hooks**: Encapsulate complex logic (useSpecWorkflow, useLocalStorage)
- **Context API**: Share global state (API key, current model) when needed
- **localStorage**: Persist user work across sessions

### API Integration Strategy
- **OpenRouter**: Single API for multiple AI models, transparent pricing
- **Server-Side Proxy**: Hide API keys, add rate limiting, enable CORS
- **Error Handling**: Comprehensive error recovery and user feedback
- **Streaming**: Future enhancement for real-time generation feedback

## Accessibility Considerations

### WCAG 2.1 Compliance
- **Keyboard Navigation**: Full keyboard accessibility for all interactions
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 contrast ratio for all text
- **Focus Management**: Clear focus indicators and logical tab order
- **Alternative Text**: Descriptive alt text for generated diagrams

### Inclusive Design Features
- **Responsive Design**: Works on all device sizes and orientations
- **Reduced Motion**: Respect user preferences for animation
- **High Contrast Mode**: Support for high contrast themes
- **Font Scaling**: Support for user font size preferences

## Monitoring and Analytics

### Performance Monitoring
- **Vercel Analytics**: Built-in performance and usage analytics
- **Core Web Vitals**: Monitor LCP, FID, CLS metrics
- **Error Tracking**: Client-side error reporting and analysis
- **API Monitoring**: Track OpenRouter API response times and errors

### User Analytics
- **Usage Patterns**: Track workflow completion rates
- **Feature Adoption**: Monitor which features are most used
- **Error Rates**: Identify common user error scenarios
- **Export Metrics**: Track export format preferences