'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'

interface MermaidRendererProps {
  chart: string
  id?: string
  className?: string
  onError?: (error: string) => void
  onRender?: (svg: string) => void
}

interface MermaidAPI {
  initialize: (config: any) => void
  render: (id: string, definition: string) => Promise<{ svg: string; bindFunctions?: (element: Element) => void }>
}

export function MermaidRenderer({ 
  chart, 
  id = `mermaid-${Math.random().toString(36).substr(2, 9)}`, 
  className = '',
  onError,
  onRender
}: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mermaid, setMermaid] = useState<MermaidAPI | null>(null)

  // Initialize Mermaid
  useEffect(() => {
    let mounted = true

    const initializeMermaid = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Dynamic import to avoid SSR issues
        const { default: mermaidAPI } = await import('mermaid')
        
        if (!mounted) return

        // Configure Mermaid
        mermaidAPI.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 14,
          themeVariables: {
            primaryColor: '#3b82f6',
            primaryTextColor: '#1f2937',
            primaryBorderColor: '#6366f1',
            lineColor: '#6b7280',
            secondaryColor: '#f3f4f6',
            tertiaryColor: '#ffffff',
            background: '#ffffff',
            mainBkg: '#ffffff',
            secondBkg: '#f9fafb',
            tertiaryBkg: '#f3f4f6'
          },
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis'
          },
          sequence: {
            useMaxWidth: true,
            mirrorActors: false,
            bottomMarginAdj: 1
          },
          gantt: {
            useMaxWidth: true,
            leftPadding: 75,
            rightPadding: 20
          },
          er: {
            useMaxWidth: true,
            entityPadding: 15,
            stroke: '#6b7280'
          },
          state: {
            useMaxWidth: true
          },
          pie: {
            useMaxWidth: true
          },
          journey: {
            useMaxWidth: true
          }
        })

        setMermaid(mermaidAPI)
      } catch (err) {
        console.error('Failed to initialize Mermaid:', err)
        if (mounted) {
          const errorMessage = 'Failed to initialize diagram renderer'
          setError(errorMessage)
          onError?.(errorMessage)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeMermaid()

    return () => {
      mounted = false
    }
  }, [onError])

  // Render diagram when chart or mermaid changes
  useEffect(() => {
    if (!mermaid || !chart.trim() || !containerRef.current) {
      return
    }

    let mounted = true

    const renderDiagram = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Clear previous content
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
        }

        // Validate chart syntax
        if (!isValidMermaidSyntax(chart)) {
          throw new Error('Invalid Mermaid syntax detected')
        }

        // Render the diagram
        const { svg, bindFunctions } = await mermaid.render(id, chart.trim())
        
        if (!mounted || !containerRef.current) return

        // Insert the SVG
        containerRef.current.innerHTML = svg

        // Apply event bindings if provided
        if (bindFunctions) {
          const svgElement = containerRef.current.querySelector('svg')
          if (svgElement) {
            bindFunctions(svgElement)
          }
        }

        // Make SVG responsive
        const svgElement = containerRef.current.querySelector('svg')
        if (svgElement) {
          svgElement.style.maxWidth = '100%'
          svgElement.style.height = 'auto'
          svgElement.removeAttribute('width')
          
          // Preserve aspect ratio
          const viewBox = svgElement.getAttribute('viewBox')
          if (!viewBox) {
            const bbox = svgElement.getBBox()
            svgElement.setAttribute('viewBox', `0 0 ${bbox.width} ${bbox.height}`)
          }
        }

        onRender?.(svg)
      } catch (err) {
        console.error('Mermaid render error:', err)
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to render diagram'
          setError(errorMessage)
          onError?.(errorMessage)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    renderDiagram()

    return () => {
      mounted = false
    }
  }, [mermaid, chart, id, onError, onRender])

  // Basic syntax validation
  const isValidMermaidSyntax = (chartDefinition: string): boolean => {
    const trimmed = chartDefinition.trim()
    if (!trimmed) return false

    // Check for common Mermaid diagram types
    const diagramTypes = [
      'graph', 'flowchart', 'sequenceDiagram', 'classDiagram',
      'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie',
      'gitgraph', 'mindmap', 'timeline', 'sankey'
    ]

    const firstLine = trimmed.split('\n')[0].toLowerCase()
    const hasValidStart = diagramTypes.some(type => 
      firstLine.includes(type) || firstLine.startsWith(type)
    )

    // Additional checks
    if (!hasValidStart && !firstLine.includes('%%{')) {
      return false
    }

    // Check for obvious syntax errors
    const lines = trimmed.split('\n')
    let braceCount = 0
    let parenCount = 0
    let bracketCount = 0

    for (const line of lines) {
      // Skip comments
      if (line.trim().startsWith('%%')) continue

      // Count brackets for basic balance check
      braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
      parenCount += (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length
      bracketCount += (line.match(/\[/g) || []).length - (line.match(/\]/g) || []).length
    }

    // Allow slight imbalance as Mermaid is forgiving
    return Math.abs(braceCount) <= 2 && Math.abs(parenCount) <= 2 && Math.abs(bracketCount) <= 2
  }

  if (error) {
    return (
      <div className={`mermaid-error ${className}`}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Diagram Error:</strong> {error}
            <details className="mt-2 text-xs opacity-75">
              <summary className="cursor-pointer">Chart Definition</summary>
              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                {chart}
              </pre>
            </details>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={`mermaid-container ${className}`}>
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Rendering diagram...</span>
        </div>
      )}
      <div
        ref={containerRef}
        className="mermaid-chart"
        style={{ 
          display: isLoading ? 'none' : 'block',
          minHeight: isLoading ? '0' : '200px'
        }}
      />
    </div>
  )
}

// Utility function to extract Mermaid diagrams from markdown
export function extractMermaidDiagrams(markdown: string): Array<{ diagram: string; type: string; title?: string }> {
  const diagrams: Array<{ diagram: string; type: string; title?: string }> = []
  
  // Regex to match ```mermaid code blocks
  const mermaidRegex = /```mermaid\s*\n([\s\S]*?)\n```/g
  let match

  while ((match = mermaidRegex.exec(markdown)) !== null) {
    const diagramContent = match[1].trim()
    if (diagramContent) {
      // Detect diagram type
      const firstLine = diagramContent.split('\n')[0].toLowerCase().trim()
      let type = 'unknown'
      
      if (firstLine.includes('graph') || firstLine.includes('flowchart')) type = 'flowchart'
      else if (firstLine.includes('sequencediagram')) type = 'sequence'
      else if (firstLine.includes('classdiagram')) type = 'class'
      else if (firstLine.includes('statediagram')) type = 'state'
      else if (firstLine.includes('erdiagram')) type = 'er'
      else if (firstLine.includes('journey')) type = 'journey'
      else if (firstLine.includes('gantt')) type = 'gantt'
      else if (firstLine.includes('pie')) type = 'pie'
      else if (firstLine.includes('gitgraph')) type = 'gitgraph'
      else if (firstLine.includes('mindmap')) type = 'mindmap'
      
      // Extract title if present (look for lines ending with diagram type)
      const titleMatch = diagramContent.match(/^.*?(?:graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie)\s+(.*)$/m)
      const title = titleMatch?.[1]?.trim()

      diagrams.push({
        diagram: diagramContent,
        type,
        title: title || undefined
      })
    }
  }

  return diagrams
}

// Utility function to validate if text contains Mermaid diagrams
export function hasMermaidDiagrams(text: string): boolean {
  return /```mermaid\s*\n[\s\S]*?\n```/.test(text)
}

// Utility function to count diagrams in text
export function countMermaidDiagrams(text: string): number {
  return extractMermaidDiagrams(text).length
}

export default MermaidRenderer