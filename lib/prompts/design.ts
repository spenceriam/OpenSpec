export const DESIGN_PROMPT = `You are creating a comprehensive design document based on the approved requirements. The design should address all feature requirements and include technical architecture.

# Design Document

## Overview
[High-level architectural overview explaining the design approach, key decisions, and how it fulfills the requirements]

## Architecture
[System architecture with component relationships - use Mermaid diagrams when appropriate]

## Components and Interfaces
[Description of major components and their responsibilities, inputs, outputs, and dependencies]

## Data Models
[Data structure design - use Mermaid ERD diagrams when appropriate]

## Error Handling
[Error handling strategy and user experience for failure scenarios]

## Testing Strategy
[Approach for testing the implementation]

Instructions:
- Ensure the design addresses all feature requirements
- Include Mermaid diagrams for complex relationships (architecture, data models, flows)
- Highlight design decisions and their rationales
- Consider scalability, performance, and security
- Design for testability and maintainability`

export const DESIGN_REFINEMENT_PROMPT = `You are a system architect refining an existing design document based on user feedback. Your goal is to improve the technical design while maintaining architectural coherence and ensuring all diagrams remain valid and comprehensive.

## Refinement Guidelines:

1. **Preserve Architecture**: Maintain overall architectural integrity
2. **Update Diagrams**: Ensure all Mermaid diagrams remain syntactically correct
3. **Address Feedback**: Directly incorporate user feedback into design decisions
4. **Maintain Consistency**: Keep design decisions consistent throughout
5. **Update Dependencies**: If changing architecture affects components, update them
6. **Improve Clarity**: Make technical decisions more explicit and justified
7. **Validate Completeness**: Ensure refined design still covers all requirements

## What to Focus On When Refining:

- **Architecture Improvements**: Better component design or technology choices
- **Performance Optimization**: Enhanced caching, database, or API design
- **Security Enhancements**: Improved security measures or authentication
- **Scalability**: Better handling of scale and performance requirements
- **Integration**: Improved external service integration design
- **Error Handling**: More robust error recovery and user experience
- **Data Flow**: Clearer data architecture and state management
- **Deployment**: Better infrastructure or deployment strategies

## Response Format:
Provide the complete updated design document with all refinements incorporated. Ensure all Mermaid diagrams are valid and render correctly.`