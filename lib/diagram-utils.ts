// Diagram generation utilities for OpenSpec
// Handles diagram detection, parsing, classification, and persona-based generation

export interface DiagramInfo {
  id: string
  type: DiagramType
  title?: string
  content: string
  rawContent: string
  lineStart: number
  lineEnd: number
  personas?: string[]
  complexity: DiagramComplexity
  isValid: boolean
  errors?: string[]
}

export type DiagramType = 
  | 'flowchart' 
  | 'sequence' 
  | 'class' 
  | 'state' 
  | 'er' 
  | 'journey' 
  | 'gantt' 
  | 'pie' 
  | 'gitgraph' 
  | 'mindmap'
  | 'architecture'
  | 'userflow'
  | 'dataflow'
  | 'unknown'

export type DiagramComplexity = 'simple' | 'medium' | 'complex'

export interface DiagramPersona {
  name: string
  description: string
  preferredTypes: DiagramType[]
  complexityPreference: DiagramComplexity
  generationHints: string[]
}

// Predefined personas for diagram generation
export const DIAGRAM_PERSONAS: Record<string, DiagramPersona> = {
  developer: {
    name: 'Developer',
    description: 'Technical implementation focus',
    preferredTypes: ['flowchart', 'class', 'sequence', 'state'],
    complexityPreference: 'complex',
    generationHints: [
      'Include technical details and implementation specifics',
      'Show error handling and edge cases',
      'Use technical terminology and precise relationships',
      'Include data types and method signatures where relevant'
    ]
  },
  architect: {
    name: 'System Architect',
    description: 'High-level system design perspective',
    preferredTypes: ['architecture', 'sequence', 'er', 'flowchart'],
    complexityPreference: 'complex',
    generationHints: [
      'Focus on system boundaries and interfaces',
      'Show scalability and performance considerations',
      'Include integration points and dependencies',
      'Emphasize architectural patterns and principles'
    ]
  },
  product_manager: {
    name: 'Product Manager',
    description: 'User-focused business logic view',
    preferredTypes: ['userflow', 'journey', 'flowchart', 'pie'],
    complexityPreference: 'medium',
    generationHints: [
      'Emphasize user experience and business value',
      'Show user decision points and outcomes',
      'Include metrics and success criteria',
      'Focus on feature interactions and workflows'
    ]
  },
  business_analyst: {
    name: 'Business Analyst',
    description: 'Process and requirement analysis focus',
    preferredTypes: ['flowchart', 'journey', 'sequence', 'gantt'],
    complexityPreference: 'medium',
    generationHints: [
      'Show business process flows and decision logic',
      'Include stakeholder interactions',
      'Emphasize requirement traceability',
      'Focus on process optimization opportunities'
    ]
  },
  ux_designer: {
    name: 'UX Designer',
    description: 'User experience and interaction design',
    preferredTypes: ['userflow', 'journey', 'flowchart', 'state'],
    complexityPreference: 'simple',
    generationHints: [
      'Emphasize user interactions and experiences',
      'Show user interface states and transitions',
      'Include accessibility and usability considerations',
      'Focus on user goals and pain points'
    ]
  },
  stakeholder: {
    name: 'Executive/Stakeholder',
    description: 'High-level overview for decision makers',
    preferredTypes: ['pie', 'gantt', 'flowchart', 'architecture'],
    complexityPreference: 'simple',
    generationHints: [
      'Focus on high-level outcomes and business impact',
      'Show key decision points and alternatives',
      'Include resource and timeline considerations',
      'Emphasize ROI and strategic alignment'
    ]
  }
}

/**
 * Extracts and analyzes all diagrams from markdown content
 */
export function analyzeDiagrams(markdown: string): DiagramInfo[] {
  const diagrams: DiagramInfo[] = []
  const lines = markdown.split('\n')
  
  // Find all mermaid code blocks
  const mermaidRegex = /```mermaid\s*$/
  const codeBlockEnd = /```\s*$/
  
  let inMermaidBlock = false
  let currentDiagram: string[] = []
  let blockStart = -1
  let diagramId = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    if (!inMermaidBlock && mermaidRegex.test(line)) {
      inMermaidBlock = true
      currentDiagram = []
      blockStart = i + 1
    } else if (inMermaidBlock && codeBlockEnd.test(line)) {
      // End of diagram block
      const diagramContent = currentDiagram.join('\n').trim()
      
      if (diagramContent) {
        const diagramInfo = parseDiagram(
          `diagram-${diagramId++}`,
          diagramContent,
          blockStart,
          i - 1
        )
        diagrams.push(diagramInfo)
      }
      
      inMermaidBlock = false
      currentDiagram = []
      blockStart = -1
    } else if (inMermaidBlock) {
      currentDiagram.push(line)
    }
  }
  
  return diagrams
}

/**
 * Parses individual diagram content and extracts metadata
 */
export function parseDiagram(
  id: string, 
  content: string, 
  lineStart: number, 
  lineEnd: number
): DiagramInfo {
  const type = classifyDiagramType(content)
  const title = extractDiagramTitle(content)
  const complexity = assessComplexity(content)
  const personas = suggestPersonas(type, complexity)
  const validation = validateDiagramSyntax(content)
  
  return {
    id,
    type,
    title,
    content: content.trim(),
    rawContent: content,
    lineStart,
    lineEnd,
    personas,
    complexity,
    isValid: validation.isValid,
    errors: validation.errors
  }
}

/**
 * Classifies diagram type based on content analysis
 */
export function classifyDiagramType(content: string): DiagramType {
  const firstLine = content.split('\n')[0].toLowerCase().trim()
  const fullContent = content.toLowerCase()
  
  // Direct type detection from syntax
  if (firstLine.includes('sequencediagram')) return 'sequence'
  if (firstLine.includes('classDiagram')) return 'class'
  if (firstLine.includes('statediagram')) return 'state'
  if (firstLine.includes('erdiagram')) return 'er'
  if (firstLine.includes('journey')) return 'journey'
  if (firstLine.includes('gantt')) return 'gantt'
  if (firstLine.includes('pie')) return 'pie'
  if (firstLine.includes('gitgraph')) return 'gitgraph'
  if (firstLine.includes('mindmap')) return 'mindmap'
  if (firstLine.includes('graph') || firstLine.includes('flowchart')) {
    // Further classify flowcharts by content
    if (fullContent.includes('user') && fullContent.includes('action')) {
      return 'userflow'
    }
    if (fullContent.includes('database') || fullContent.includes('api') || fullContent.includes('service')) {
      return 'architecture'
    }
    if (fullContent.includes('data') && (fullContent.includes('->') || fullContent.includes('-->'))) {
      return 'dataflow'
    }
    return 'flowchart'
  }
  
  return 'unknown'
}

/**
 * Extracts title from diagram content
 */
export function extractDiagramTitle(content: string): string | undefined {
  const lines = content.split('\n')
  
  // Look for title in first few lines
  for (const line of lines.slice(0, 3)) {
    const trimmed = line.trim()
    
    // Check for comment-style titles
    if (trimmed.startsWith('%%') && trimmed.length > 3) {
      return trimmed.substring(2).trim()
    }
    
    // Check for explicit title directives
    const titleMatch = trimmed.match(/title:\s*(.+)$/i)
    if (titleMatch) {
      return titleMatch[1].trim()
    }
  }
  
  // Extract from diagram type declaration
  const firstLine = lines[0]?.trim()
  if (firstLine) {
    const typeMatch = firstLine.match(/(?:graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie)\s+(.+)$/i)
    if (typeMatch && !typeMatch[1].includes('[') && !typeMatch[1].includes('{')) {
      return typeMatch[1].trim()
    }
  }
  
  return undefined
}

/**
 * Assesses diagram complexity based on content analysis
 */
export function assessComplexity(content: string): DiagramComplexity {
  const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('%%'))
  const nodeCount = (content.match(/\[[^\]]+\]|\([^)]+\)|\{[^}]+\}/g) || []).length
  const connectionCount = (content.match(/-->|->|\|\||==>/g) || []).length
  const subgraphCount = (content.match(/subgraph/gi) || []).length
  
  // Complexity scoring
  let score = 0
  score += lines.length * 0.5
  score += nodeCount * 2
  score += connectionCount * 1.5
  score += subgraphCount * 5
  
  if (score < 15) return 'simple'
  if (score < 50) return 'medium'
  return 'complex'
}

/**
 * Suggests relevant personas based on diagram type and complexity
 */
export function suggestPersonas(type: DiagramType, complexity: DiagramComplexity): string[] {
  const suggestions: string[] = []
  
  for (const [key, persona] of Object.entries(DIAGRAM_PERSONAS)) {
    if (persona.preferredTypes.includes(type)) {
      suggestions.push(key)
    }
  }
  
  // Always include architect for complex diagrams
  if (complexity === 'complex' && !suggestions.includes('architect')) {
    suggestions.push('architect')
  }
  
  // Always include stakeholder for simple diagrams
  if (complexity === 'simple' && !suggestions.includes('stakeholder')) {
    suggestions.push('stakeholder')
  }
  
  return suggestions.length > 0 ? suggestions : ['developer']
}

/**
 * Validates diagram syntax for common errors
 */
export function validateDiagramSyntax(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const lines = content.split('\n')
  
  // Check for empty content
  if (!content.trim()) {
    errors.push('Diagram content is empty')
    return { isValid: false, errors }
  }
  
  // Check for valid diagram type
  const firstLine = lines[0]?.trim().toLowerCase()
  const validStarters = [
    'graph', 'flowchart', 'sequencediagram', 'classdiagram',
    'statediagram', 'erdiagram', 'journey', 'gantt', 'pie',
    'gitgraph', 'mindmap'
  ]
  
  const hasValidStart = validStarters.some(starter => 
    firstLine?.startsWith(starter) || firstLine?.includes(starter)
  )
  
  if (!hasValidStart && !firstLine?.includes('%%{')) {
    errors.push('Diagram must start with a valid diagram type')
  }
  
  // Check bracket balance
  const brackets = { '[': ']', '(': ')', '{': '}' }
  const stack: string[] = []
  
  for (const line of lines) {
    for (const char of line) {
      if (char in brackets) {
        stack.push(char)
      } else if (Object.values(brackets).includes(char)) {
        const last = stack.pop()
        if (!last || brackets[last as keyof typeof brackets] !== char) {
          errors.push(`Mismatched brackets: found '${char}' without matching opening bracket`)
        }
      }
    }
  }
  
  if (stack.length > 0) {
    errors.push(`Unclosed brackets: ${stack.join(', ')}`)
  }
  
  // Check for common syntax issues
  const content_lower = content.toLowerCase()
  if (content_lower.includes('sequencediagram') && !content_lower.includes('participant')) {
    if (!content.includes('->') && !content.includes('->>')) {
      errors.push('Sequence diagrams should define participants or interactions')
    }
  }
  
  if (content_lower.includes('erdiagram') && !content.includes('||') && !content.includes('}|')) {
    errors.push('ER diagrams should define entity relationships')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generates diagram suggestions based on persona and context
 */
export function generateDiagramSuggestions(
  persona: string,
  context: string,
  existingDiagrams: DiagramInfo[]
): { type: DiagramType; title: string; reasoning: string }[] {
  const personaData = DIAGRAM_PERSONAS[persona]
  if (!personaData) {
    return []
  }
  
  const suggestions: { type: DiagramType; title: string; reasoning: string }[] = []
  const existingTypes = existingDiagrams.map(d => d.type)
  const contextLower = context.toLowerCase()
  
  for (const preferredType of personaData.preferredTypes) {
    if (existingTypes.includes(preferredType)) {
      continue // Skip if already exists
    }
    
    let title = ''
    let reasoning = ''
    
    switch (preferredType) {
      case 'flowchart':
        title = 'Process Flow Diagram'
        reasoning = 'Shows the logical flow of the described process or system'
        break
      case 'sequence':
        title = 'Interaction Sequence Diagram'
        reasoning = 'Illustrates how components interact over time'
        break
      case 'architecture':
        title = 'System Architecture Diagram'
        reasoning = 'Provides high-level view of system components and relationships'
        break
      case 'userflow':
        title = 'User Journey Flow'
        reasoning = 'Maps out user interactions and decision points'
        break
      case 'er':
        title = 'Entity Relationship Diagram'
        reasoning = 'Shows data model relationships and structure'
        break
      case 'state':
        title = 'State Machine Diagram'
        reasoning = 'Represents system states and transitions'
        break
      default:
        title = `${preferredType.charAt(0).toUpperCase() + preferredType.slice(1)} Diagram`
        reasoning = `Recommended for ${persona} persona`
    }
    
    suggestions.push({
      type: preferredType,
      title,
      reasoning
    })
  }
  
  return suggestions.slice(0, 3) // Limit to top 3 suggestions
}

/**
 * Formats diagram for export with metadata
 */
export function formatDiagramForExport(diagram: DiagramInfo, includeMetadata: boolean = true): string {
  let output = ''
  
  if (includeMetadata) {
    output += `<!-- Diagram: ${diagram.id} -->\n`
    output += `<!-- Type: ${diagram.type} -->\n`
    if (diagram.title) {
      output += `<!-- Title: ${diagram.title} -->\n`
    }
    output += `<!-- Complexity: ${diagram.complexity} -->\n`
    if (diagram.personas) {
      output += `<!-- Personas: ${diagram.personas.join(', ')} -->\n`
    }
    output += '\n'
  }
  
  if (diagram.title && !diagram.content.includes(diagram.title)) {
    output += `# ${diagram.title}\n\n`
  }
  
  output += '```mermaid\n'
  output += diagram.content
  output += '\n```\n'
  
  return output
}

/**
 * Counts diagrams by type
 */
export function getDiagramStatistics(diagrams: DiagramInfo[]): Record<string, number> {
  const stats: Record<string, number> = {}
  
  for (const diagram of diagrams) {
    stats[diagram.type] = (stats[diagram.type] || 0) + 1
  }
  
  return stats
}

/**
 * Filters diagrams by criteria
 */
export function filterDiagrams(
  diagrams: DiagramInfo[],
  criteria: {
    types?: DiagramType[]
    complexity?: DiagramComplexity[]
    personas?: string[]
    isValid?: boolean
  }
): DiagramInfo[] {
  return diagrams.filter(diagram => {
    if (criteria.types && !criteria.types.includes(diagram.type)) {
      return false
    }
    
    if (criteria.complexity && !criteria.complexity.includes(diagram.complexity)) {
      return false
    }
    
    if (criteria.personas && (!diagram.personas || 
        !criteria.personas.some(p => diagram.personas!.includes(p)))) {
      return false
    }
    
    if (criteria.isValid !== undefined && diagram.isValid !== criteria.isValid) {
      return false
    }
    
    return true
  })
}

export default {
  analyzeDiagrams,
  parseDiagram,
  classifyDiagramType,
  extractDiagramTitle,
  assessComplexity,
  suggestPersonas,
  validateDiagramSyntax,
  generateDiagramSuggestions,
  formatDiagramForExport,
  getDiagramStatistics,
  filterDiagrams,
  DIAGRAM_PERSONAS
}