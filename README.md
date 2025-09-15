# OpenSpec 🚀

**AI-Powered Specification Generation for Modern Development**

OpenSpec is an open-source web application that democratizes spec-driven development by replicating Kiro IDE's Spec Mode functionality. Generate comprehensive technical specifications using any AI model from OpenRouter's API, following a structured three-phase workflow with iterative refinement capabilities.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-API-orange?style=flat-square)](https://openrouter.ai/)

Live: https://www.openspec.app/

## ✨ Features

- 🤖 **AI-Powered Generation**: Use any AI model from OpenRouter's extensive catalog
- 📋 **Three-Phase Workflow**: Requirements → Design → Implementation Tasks
- 🔄 **Iterative Refinement**: Refine and improve each phase with AI assistance
- 📊 **Automatic Diagrams**: Generate Mermaid diagrams for architecture, workflows, and data models
- 💾 **Local Storage**: All data stays in your browser - no backend required
- 📤 **Multiple Export Options**: Markdown, HTML, PDF, and ZIP formats
- ♿ **Accessibility First**: WCAG 2.1 compliant with keyboard navigation
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🏗️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS + shadcn/ui components
- **Markdown**: react-markdown with syntax highlighting
- **Diagrams**: Mermaid.js for automatic diagram generation
- **AI Integration**: OpenRouter API for model access
- **Storage**: Browser localStorage (client-side only)
- **Testing**: Jest + React Testing Library + 100+ test cases

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- OpenRouter API key ([Get yours here](https://openrouter.ai/keys))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/openspec/openspec.git
   cd openspec
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open in browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

5. **Enter your OpenRouter API key**
   
   The application will prompt you to enter your OpenRouter API key on first use.

## 📖 Usage Guide

### Basic Workflow

1. **Setup** 🔧
   - Enter your OpenRouter API key
   - Select an AI model (Claude 3 Sonnet recommended)
   - Describe your feature or project
   - Upload context files (optional)

2. **Generate** ⚡
   - **Requirements Phase**: Generate comprehensive requirements
   - **Design Phase**: Create technical design specifications
   - **Tasks Phase**: Generate actionable implementation tasks

3. **Refine** 🎯
   - Request refinements for any phase
   - Iterate until satisfied
   - Approve each phase to progress

4. **Export** 📤
   - Choose from multiple formats
   - Include diagrams and metadata
   - Download as individual files or ZIP

### Supported File Types

- **Code**: `.ts`, `.js`, `.py`, `.go`, `.rs`, `.java`, `.cpp`, `.c#`
- **Markup**: `.md`, `.html`, `.xml`, `.json`, `.yaml`, `.toml`
- **Config**: `.env`, `.cfg`, `.ini`, `.conf`
- **Documentation**: `.txt`, `.rtf`

## 🧪 Testing

OpenSpec includes a comprehensive testing suite with 100+ test cases:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test suites
npm run test:unit        # Unit tests
npm run test:components  # Component tests
npm run test:integration # Integration tests

# CI/CD testing
npm run test:ci
```

### Test Coverage
- **Unit Tests**: Core utilities and hooks (25+ tests)
- **Component Tests**: UI components with user interactions (60+ tests)
- **Integration Tests**: OpenRouter API integration (20+ tests)
- **Accessibility Tests**: ARIA compliance and keyboard navigation
- **Error Handling**: Edge cases and error recovery

## 🏗️ Project Structure

```
openspec/
├── app/                     # Next.js 14 App Router
│   ├── page.tsx            # Main application page
│   ├── layout.tsx          # Root layout with metadata
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── ApiKeyInput.tsx     # API key management
│   ├── ModelSelector.tsx   # AI model selection
│   ├── PromptInput.tsx     # Feature description input
│   ├── WorkflowProgress.tsx # Progress indicator
│   ├── MarkdownPreview.tsx # Content preview
│   ├── ContentRefinement.tsx # Refinement interface
│   ├── ApprovalControls.tsx # Phase approval
│   ├── ExportDialog.tsx    # Export functionality
│   ├── ErrorBoundary.tsx   # Error handling
│   ├── Header.tsx          # Navigation header
│   └── Footer.tsx          # Site footer
├── lib/                    # Utility libraries
│   ├── openrouter/         # OpenRouter API client
│   ├── prompts/           # AI prompts for each phase
│   ├── diagram/           # Mermaid diagram utilities
│   ├── file-export.ts     # File export functionality
│   └── storage.ts         # Browser storage management
├── hooks/                  # Custom React hooks
│   └── useSpecWorkflow.ts  # Main workflow state
├── types/                  # TypeScript type definitions
├── __tests__/             # Test suites
│   ├── unit/              # Unit tests
│   ├── components/        # Component tests
│   └── integration/       # Integration tests
└── public/                # Static assets
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report

### Environment Setup

```bash
# Install dependencies
npm install

# Install additional shadcn/ui components (if needed)
npx shadcn@latest add [component-name]

# Run type checking
npx tsc --noEmit

# Run linting
npm run lint
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js configuration
- **Prettier**: Code formatting
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Consistent component patterns

## 🚢 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. No environment variables needed (client-side only)
3. Automatic deployments on push to main

### Other Platforms

```bash
# Build the application
npm run build

# Start production server
npm start
```

OpenSpec is a fully static Next.js application with no backend dependencies.

## 🔐 Security & Privacy

- **API Keys**: Stored only in browser memory, never persisted
- **No Backend**: All processing happens client-side
- **Local Storage**: Specifications stored locally in your browser
- **No Tracking**: No analytics or user tracking
- **HTTPS**: All API communications use secure protocols

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](.kiro/specs/openspec-web-app/CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

### Commit Convention

We use [Conventional Commits](https://conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Adding tests
- `refactor:` - Code refactoring
- `style:` - Formatting changes
- `chore:` - Maintenance tasks

## 📄 License

OpenSpec is open source software licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Inspired by**: [Kiro IDE](https://kiro.ai) Spec Mode functionality
- **Powered by**: [OpenRouter](https://openrouter.ai) for AI model access
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Diagrams**: [Mermaid.js](https://mermaid.js.org/)

## 📞 Support

- **Documentation**: Check the code comments and type definitions
- **Issues**: [GitHub Issues](https://github.com/openspec/openspec/issues)
- **Discussions**: [GitHub Discussions](https://github.com/openspec/openspec/discussions)
- **Contact**: Reach out to [@spencer_i_am](https://x.com/spencer_i_am) on X

---

**Made with ❤️ for open source agentic coding**

*Built to solve agentic coding needs for open source development.*
