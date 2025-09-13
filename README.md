# OpenSpec

OpenSpec is an open-source web application that democratizes spec-driven development by replicating Kiro IDE's Spec Mode functionality. Generate comprehensive technical specifications using any AI model from OpenRouter's API, following a structured three-phase workflow with iterative refinement capabilities.

## Features

### 🤖 AI-Powered Specification Generation
- **Multi-Model Support**: Access to all OpenRouter AI models with search and filtering
- **Three-Phase Workflow**: Requirements → Design → Tasks with approval gates
- **Iterative Refinement**: Perfect your specs with user feedback at each phase
- **Context-Aware**: Upload code files, documents, and images for better context

### 📊 Automatic Diagram Generation
- **Mermaid Integration**: Auto-generates architecture, user flow, sequence, and ERD diagrams
- **Persona-Based Diagrams**: Creates role-specific workflow diagrams
- **Visual Documentation**: Enhances specifications with visual representations

### 📝 Industry-Standard Formats
- **EARS Requirements**: Structured requirements using EARS format (WHEN/IF/THEN/SHALL)
- **User Stories**: Complete with acceptance criteria and hierarchical numbering
- **Comprehensive Design**: Architecture, components, data models, and testing strategy
- **Actionable Tasks**: Numbered checkbox lists for implementation planning

### 💾 Browser-Based Storage
- **Session Persistence**: Work is automatically saved to localStorage
- **Temporary Storage**: Clear warnings about data persistence
- **Export Options**: Download individual files or combined markdown with diagrams

### 🚀 Developer-Friendly
- **Next.js 14**: Modern React with App Router
- **Vercel Ready**: One-click deployment to Vercel
- **No Backend Required**: Fully client-side with OpenRouter API integration
- **Responsive Design**: Works on all devices and screen sizes

## Quick Start

### Prerequisites
- Node.js 18+ 
- OpenRouter API key ([Get one here](https://openrouter.ai/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/openspec.git
   cd openspec
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Usage

1. **Enter your OpenRouter API key** when prompted
2. **Select an AI model** from the available options
3. **Describe your feature** in the prompt input
4. **Upload context files** (optional) - code, docs, or images
5. **Follow the three-phase workflow**:
   - Review and refine Requirements
   - Approve and move to Design phase
   - Generate final Tasks for implementation
6. **Export your specifications** as markdown files

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/openspec)

Or manually:

```bash
npm run build
vercel --prod
```

### Environment Variables

No environment variables required - API keys are managed client-side for security.

## Architecture

OpenSpec follows a clean, modern architecture:

- **Frontend**: Next.js 14 with App Router, Tailwind CSS, shadcn/ui
- **AI Integration**: OpenRouter API for multi-model access
- **Storage**: Browser localStorage with session management
- **Diagrams**: Mermaid.js for automatic diagram generation
- **Export**: Client-side markdown generation with embedded diagrams

## Workflow Phases

### 1. Requirements Phase
- Generates EARS-formatted requirements
- Includes user stories with acceptance criteria
- Hierarchical numbering system
- Comprehensive functional coverage

### 2. Design Phase
- System architecture and components
- Automatic Mermaid diagram generation
- Data models with validation
- Error handling and testing strategy

### 3. Tasks Phase
- Numbered checkbox implementation tasks
- Maximum two-level hierarchy (1.1, 1.2, 2.1)
- References to specific requirements
- Complete development roadmap

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Standards

- TypeScript for type safety
- ESLint and Prettier for code formatting
- Jest and Testing Library for unit tests
- Playwright for E2E testing

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Kiro IDE's Spec Mode functionality
- Built with [OpenRouter](https://openrouter.ai/) for AI model access
- Powered by [Next.js](https://nextjs.org/) and [Vercel](https://vercel.com/)
- Diagrams generated with [Mermaid](https://mermaid.js.org/)

## Support

- 📖 [Documentation](https://github.com/yourusername/openspec/wiki)
- 🐛 [Report Issues](https://github.com/yourusername/openspec/issues)
- 💬 [Discussions](https://github.com/yourusername/openspec/discussions)
- 📧 [Contact](mailto:support@openspec.dev)

---

**Made with ❤️ for the developer community**