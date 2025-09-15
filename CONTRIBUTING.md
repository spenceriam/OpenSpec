# Contributing to OpenSpec 🤝

Thank you for your interest in contributing to OpenSpec! We're excited to work with the community to build the best open-source specification generation tool.

OpenSpec democratizes spec-driven development by replicating Kiro IDE's Spec Mode functionality, allowing developers to generate comprehensive technical specifications using any AI model from OpenRouter's API.

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Setup](#-development-setup)
- [Development Workflow](#-development-workflow)
- [Code Style & Standards](#-code-style--standards)
- [Testing Guidelines](#-testing-guidelines)
- [Commit Convention](#-commit-convention)
- [Pull Request Process](#-pull-request-process)
- [Issue Reporting](#-issue-reporting)
- [Code Review Guidelines](#-code-review-guidelines)
- [Release Process](#-release-process)
- [Community & Support](#-community--support)

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. By participating in this project, you agree to abide by our Code of Conduct:

- **Be respectful**: Treat all community members with respect and kindness
- **Be inclusive**: Welcome newcomers and help them get up to speed
- **Be collaborative**: Work together towards common goals
- **Be constructive**: Provide helpful feedback and suggestions
- **Be professional**: Keep discussions focused and appropriate

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **Git** installed and configured
- **OpenRouter API key** for testing ([Get yours here](https://openrouter.ai/keys))
- Basic knowledge of **TypeScript**, **React**, and **Next.js**

### Areas for Contribution

We welcome contributions in several areas:

- 🐛 **Bug fixes** - Help resolve issues and improve stability
- ✨ **New features** - Add functionality that aligns with our roadmap
- 📚 **Documentation** - Improve guides, comments, and examples
- 🧪 **Testing** - Add test coverage and improve test quality
- 🎨 **UI/UX** - Enhance user experience and accessibility
- 🔧 **Performance** - Optimize performance and reduce bundle size
- 🌐 **Internationalization** - Add support for multiple languages

## 🛠 Development Setup

### 1. Fork & Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/OpenSpec.git
cd OpenSpec

# Add upstream remote
git remote add upstream https://github.com/spenceriam/OpenSpec.git
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm run lint  # Should complete without errors
npm test      # Should run test suite
```

### 3. Environment Setup

OpenSpec is a **client-side only** application with no backend. All configuration happens in the browser:

- **API Keys**: Managed in browser memory (sessionStorage)
- **No Environment Variables**: All configuration is client-side
- **No Database**: Uses browser localStorage for persistence

### 4. Start Development

```bash
# Start development server
npm run dev

# Open in browser
open http://localhost:3000
```

## 🔄 Development Workflow

### Branch Strategy

- **`main`** - Production-ready code, protected branch
- **`feature/description`** - New features
- **`fix/description`** - Bug fixes
- **`docs/description`** - Documentation updates
- **`test/description`** - Test improvements

### Development Process

1. **Sync with upstream**
   ```bash
   git checkout main
   git pull upstream main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes**
   - Write code following our [style guidelines](#-code-style--standards)
   - Add tests for new functionality
   - Update documentation as needed

4. **Test your changes**
   ```bash
   npm run lint        # Check code style
   npm test           # Run all tests
   npm run build      # Verify build works
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Use our [PR template](#-pull-request-process)
   - Link related issues
   - Request reviews from maintainers

## 🎨 Code Style & Standards

### TypeScript Guidelines

```typescript
// ✅ Good - Proper typing
interface WorkflowState {
  currentPhase: 'requirements' | 'design' | 'tasks'
  apiKey: string | null
  modelId: string | null
}

// ❌ Avoid - Using 'any'
const data: any = getWorkflowData()

// ✅ Good - JSDoc for complex functions
/**
 * Generates requirements specification using OpenRouter API
 * @param prompt - User's feature description
 * @param contextFiles - Optional context files
 * @returns Promise resolving to generated specification
 */
async function generateRequirements(
  prompt: string, 
  contextFiles?: ContextFile[]
): Promise<SpecificationResult>
```

### React/Next.js Patterns

```typescript
// ✅ Good - Server Component (default)
export default function StaticPage() {
  return <div>Static content</div>
}

// ✅ Good - Client Component (when needed)
'use client'
import { useState } from 'react'

export default function InteractiveComponent() {
  const [state, setState] = useState('')
  // ...
}

// ✅ Good - Custom hooks for logic
export function useSpecWorkflow() {
  // Complex state logic here
}
```

### Component Structure

```typescript
// ✅ Good - Component organization
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline'
  size?: 'default' | 'sm' | 'lg'
  // ... other props
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
export { Button }
```

### API Integration

```typescript
// ✅ Good - Proper error handling
try {
  const response = await openRouterClient.generateContent({
    model: selectedModel,
    messages: [...messages],
  })
  
  if (!response.choices?.[0]?.message?.content) {
    throw new Error('Invalid API response format')
  }
  
  return response
} catch (error) {
  console.error('API call failed:', error)
  throw new Error(`Generation failed: ${error.message}`)
}
```

### Styling Guidelines

- **Use Tailwind CSS** for all styling
- **Follow shadcn/ui patterns** for component consistency
- **Dark theme first** - ensure all components work in dark mode
- **Responsive design** - mobile-first approach
- **Accessibility** - proper ARIA labels and keyboard navigation

## 🧪 Testing Guidelines

### Test Structure

```typescript
// ✅ Good - Comprehensive component test
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ModelSelector } from '../ModelSelector'

describe('ModelSelector', () => {
  const mockProps = {
    apiKey: 'sk-or-v1-test-key',
    selectedModel: null,
    onModelSelect: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state initially', () => {
    render(<ModelSelector {...mockProps} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('selects model on click', async () => {
    render(<ModelSelector {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Claude 3 Sonnet')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Claude 3 Sonnet'))
    expect(mockProps.onModelSelect).toHaveBeenCalledWith('anthropic/claude-3-sonnet')
  })
})
```

### Testing Requirements

- **Unit Tests**: Test individual functions and utilities
- **Component Tests**: Test React components with user interactions
- **Integration Tests**: Test OpenRouter API integration (mocked)
- **Accessibility Tests**: Verify ARIA compliance and keyboard navigation
- **Error Handling**: Test edge cases and error recovery

### Test Commands

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit          # Unit tests only  
npm run test:components    # Component tests only
npm run test:integration   # Integration tests only

# Run in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# CI/CD testing
npm run test:ci
```

## 📝 Commit Convention

We use [Conventional Commits](https://conventionalcommits.org/) for clear commit history:

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- **feat**: New features
- **fix**: Bug fixes
- **docs**: Documentation changes
- **style**: Code formatting (no logic changes)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements
- **ci**: CI/CD changes

### Examples
```bash
# Good commit messages
git commit -m "feat: add model selection persistence"
git commit -m "fix: resolve API key validation bug"
git commit -m "docs: update contribution guidelines"
git commit -m "test: add ModelSelector integration tests"
git commit -m "refactor: extract OpenRouter client logic"

# Detailed commit with body
git commit -m "feat: implement ZIP export functionality

- Add ZIP file generation for all specification files
- Include Mermaid diagrams as separate files
- Support both individual and bulk export options

Fixes #123"
```

## 🔄 Pull Request Process

### PR Requirements

- [ ] **Descriptive title** following conventional commit format
- [ ] **Detailed description** explaining changes and motivation
- [ ] **Link related issues** using "Fixes #123" or "Relates to #123"
- [ ] **Tests added** for new functionality
- [ ] **Documentation updated** if needed
- [ ] **Screenshots** for UI changes
- [ ] **Breaking changes** clearly documented

### PR Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to change)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Component tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

### Review Process

1. **Automated Checks**: CI/CD runs linting, testing, and building
2. **Code Review**: At least one maintainer reviews the code
3. **Testing**: Reviewers test functionality manually if needed
4. **Approval**: Approved PRs can be merged
5. **Merge**: Squash and merge with conventional commit message

## 🐛 Issue Reporting

### Before Creating an Issue

- [ ] Search existing issues for duplicates
- [ ] Check [documentation](README.md) and [AGENTS.md](AGENTS.md)
- [ ] Verify issue exists in latest version
- [ ] Prepare reproduction steps

### Issue Templates

#### Bug Report
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 22]
- Node.js version: [e.g. 18.17.0]

**Additional context**
Any other context about the problem.
```

#### Feature Request
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

## ✅ Code Review Guidelines

### For Authors

- **Write clear PRs** with good descriptions
- **Keep changes focused** - one feature/fix per PR
- **Add tests** for new functionality
- **Update documentation** as needed
- **Respond to feedback** promptly and constructively

### For Reviewers

- **Be constructive** - suggest improvements, don't just point out problems
- **Ask questions** - understand the motivation and approach
- **Test functionality** - verify changes work as expected
- **Check edge cases** - consider error handling and unusual inputs
- **Approve when ready** - don't hold up good changes unnecessarily

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Logic is clear and well-documented
- [ ] Tests cover new functionality
- [ ] No obvious bugs or edge cases missed
- [ ] Performance considerations addressed
- [ ] Security implications considered
- [ ] Breaking changes properly documented

## 🚢 Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features (backward compatible)
- **PATCH** (0.0.1): Bug fixes (backward compatible)

### Release Workflow

1. **Version bump** in package.json
2. **Update changelog** with new features and fixes
3. **Create release** with GitHub Releases
4. **Deploy to production** (automated via Vercel)
5. **Announce** on community channels

## 🌟 Community & Support

### Getting Help

- **Documentation**: Check [README.md](README.md) and [AGENTS.md](AGENTS.md)
- **Issues**: [GitHub Issues](https://github.com/spenceriam/OpenSpec/issues) for bugs and feature requests
- **Discussions**: [GitHub Discussions](https://github.com/spenceriam/OpenSpec/discussions) for questions and ideas
- **Contact**: Reach out to [@spencer_i_am](https://x.com/spencer_i_am) on X

### Recognition

We appreciate all contributions! Contributors will be:

- **Listed** in our contributor documentation
- **Credited** in release notes for significant contributions
- **Invited** to join our contributor community
- **Recognized** on social media for major contributions

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions, ideas, and general discussion
- **X/Twitter**: Follow [@spencer_i_am](https://x.com/spencer_i_am) for updates
- **Email**: For security issues or private matters

## 📚 Additional Resources

- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **TypeScript Handbook**: [typescriptlang.org/docs](https://www.typescriptlang.org/docs/)
- **Tailwind CSS**: [tailwindcss.com/docs](https://tailwindcss.com/docs)
- **shadcn/ui**: [ui.shadcn.com](https://ui.shadcn.com/)
- **OpenRouter API**: [openrouter.ai/docs](https://openrouter.ai/docs)
- **Jest Testing**: [jestjs.io/docs](https://jestjs.io/docs/getting-started)
- **React Testing Library**: [testing-library.com/docs/react-testing-library/intro](https://testing-library.com/docs/react-testing-library/intro/)

---

**Thank you for contributing to OpenSpec!** 🎉

Together, we're building the future of spec-driven development. Every contribution, no matter how small, helps make OpenSpec better for developers worldwide.

*Made with ❤️ for open source agentic coding*