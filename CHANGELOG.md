# Changelog

All notable changes to OpenSpec will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.1-beta] - 2025-01-16

### Fixed
- **CRITICAL**: Workflow phase regression preventing progression from Requirements to Design
- currentStep interference causing UI to jump back to Step 1 after approval
- Added debugging logs for workflow phase transitions
- Stabilized workflow progression throughout all phases

## [0.5.0-beta] - 2025-01-16

### Added
- Version display in footer with git commit info on hover
- Comprehensive version utility system for future release management
- CHANGELOG.md for tracking version changes

### Fixed
- UI workflow improvements from recent development (see commit history for details)

### Changed
- Footer layout to accommodate version information in bottom left

## [0.5.0-beta] - 2025-01-16

### Added
- Comprehensive OpenSpec application with major workflow improvements
- Complete AI-powered specification workflow (Requirements → Design → Tasks)
- OpenRouter API integration with multiple model support
- Professional ZIP export functionality
- Real-time performance tracking and cost analysis
- Comprehensive session management and data persistence
- ApprovalButton component with instant feedback
- Smooth animations and transitions
- Auto-scroll to completion page
- Version tracking system with footer display
- CHANGELOG.md for proper release management

### Fixed
- **CRITICAL**: Eliminated 500ms setTimeout causing UI flickering in workflow buttons
- **CRITICAL**: Fixed "Generating Task0" display bugs with robust button text generation
- **CRITICAL**: Prevented currentStep state resets during workflow phase transitions
- **CRITICAL**: Restored missing workflow completion page with animations
- Atomic state transitions preventing button state flashing
- Race conditions in approveAndProceed function
- Button hover states and loading indicators
- Workflow phase synchronization issues

### Features
- **Three-Phase Workflow**: Requirements generation, technical design, implementation tasks
- **Multi-Model Support**: Integration with OpenRouter API for various AI models
- **Professional Export**: ZIP files with Requirements.md, Design.md, Tasks.md, and Mermaid diagrams
- **Performance Analytics**: Token usage, cost tracking, and timing analysis
- **Session Persistence**: Auto-save progress across browser sessions
- **Responsive Design**: Professional dark theme with smooth animations
- **Context File Support**: Upload and process multiple file types for context

### Technical
- Next.js 14 with App Router
- TypeScript with strict mode
- Tailwind CSS + shadcn/ui components
- React Testing Library for component tests
- Jest for unit testing
- Vercel deployment optimization

---

## Version Numbering Guide

OpenSpec follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions  
- **PATCH** version for backwards-compatible bug fixes
- **Pre-release** identifiers: `-alpha`, `-beta`, `-rc` for unstable versions

### Examples:
- `1.0.0` - Stable release
- `1.1.0` - New features added
- `1.1.1` - Bug fixes
- `2.0.0-beta` - Major version in beta testing