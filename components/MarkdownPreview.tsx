'use client'

import React, { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Eye, 
  Code, 
  FileText, 
  Maximize2, 
  Minimize2, 
  Copy, 
  CheckCircle,
  Sun,
  Moon,
  BarChart3
} from 'lucide-react'
import { MermaidRenderer, extractMermaidDiagrams, hasMermaidDiagrams, countMermaidDiagrams } from './MermaidRenderer'
import { analyzeDiagrams, DiagramInfo } from '@/lib/diagram-utils'

interface MarkdownPreviewProps {
  content: string
  title?: string
  showTitle?: boolean
  showDiagrams?: boolean
  showRawMarkdown?: boolean
  showStats?: boolean
  darkMode?: boolean
  className?: string
  onDiagramAnalysis?: (diagrams: DiagramInfo[]) => void
}

export function MarkdownPreview({
  content,
  title,
  showTitle = true,
  showDiagrams = true,
  showRawMarkdown = true,
  showStats = true,
  darkMode = false,
  className = '',
  onDiagramAnalysis
}: MarkdownPreviewProps) {
  const [activeTab, setActiveTab] = useState('preview')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(darkMode)
  const [copiedElements, setCopiedElements] = useState<Set<string>>(new Set())

  // Analyze content and diagrams
  const contentAnalysis = useMemo(() => {
    if (!content.trim()) {
      return {
        wordCount: 0,
        lineCount: 0,
        characterCount: 0,
        diagrams: [],
        diagramCount: 0,
        headings: [],
        codeBlocks: 0
      }
    }

    const lines = content.split('\n')
    const words = content.split(/\s+/).filter(word => word.length > 0)
    const headings = content.match(/^#{1,6}\s+.+$/gm) || []
    const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length
    
    // Extract and analyze diagrams
    const diagramData = extractMermaidDiagrams(content)
    const analyzedDiagrams = analyzeDiagrams(content)
    
    // Notify parent about diagram analysis
    if (onDiagramAnalysis && analyzedDiagrams.length > 0) {
      onDiagramAnalysis(analyzedDiagrams)
    }

    return {
      wordCount: words.length,
      lineCount: lines.length,
      characterCount: content.length,
      diagrams: diagramData,
      diagramCount: diagramData.length,
      headings: headings.map((h, i) => ({ id: `heading-${i}`, text: h })),
      codeBlocks,
      analyzedDiagrams
    }
  }, [content, onDiagramAnalysis])

  // Copy to clipboard functionality
  const copyToClipboard = async (text: string, elementId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedElements(prev => new Set([...prev, elementId]))
      setTimeout(() => {
        setCopiedElements(prev => {
          const newSet = new Set(prev)
          newSet.delete(elementId)
          return newSet
        })
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  // Custom components for react-markdown
  const components = {
    // Code blocks with syntax highlighting
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : 'text'
      
      if (!inline && language === 'mermaid') {
        // Render mermaid diagrams
        if (showDiagrams) {
          return (
            <div className="my-4">
              <MermaidRenderer 
                chart={String(children).replace(/\n$/, '')} 
                className="border rounded-lg p-4"
              />
            </div>
          )
        } else {
          // Show as code block if diagrams disabled
          return (
            <div className="relative group">
              <SyntaxHighlighter
                style={isDarkMode ? vscDarkPlus : vs}
                language="text"
                PreTag="div"
                className="rounded-md"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(String(children), `mermaid-${Math.random()}`)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )
        }
      }

      if (!inline && match) {
        const codeId = `code-${Math.random()}`
        return (
          <div className="relative group">
            <SyntaxHighlighter
              style={isDarkMode ? vscDarkPlus : vs}
              language={language}
              PreTag="div"
              className="rounded-md"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Badge variant="secondary" className="text-xs">
                {language}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => copyToClipboard(String(children), codeId)}
              >
                {copiedElements.has(codeId) ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        )
      }

      // Inline code
      return (
        <code 
          className={`bg-muted px-1.5 py-0.5 rounded text-sm font-mono ${className}`} 
          {...props}
        >
          {children}
        </code>
      )
    },

    // Tables with styling
    table({ children, ...props }: any) {
      return (
        <div className="overflow-x-auto my-4">
          <table className="w-full border-collapse border border-border rounded-lg" {...props}>
            {children}
          </table>
        </div>
      )
    },

    th({ children, ...props }: any) {
      return (
        <th className="border border-border bg-muted px-4 py-2 text-left font-semibold" {...props}>
          {children}
        </th>
      )
    },

    td({ children, ...props }: any) {
      return (
        <td className="border border-border px-4 py-2" {...props}>
          {children}
        </td>
      )
    },

    // Headings with anchor links
    h1: ({ children, ...props }: any) => (
      <h1 className="text-3xl font-bold mt-8 mb-4 pb-2 border-b border-border" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-2xl font-semibold mt-6 mb-3" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-xl font-semibold mt-5 mb-2" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 className="text-lg font-medium mt-4 mb-2" {...props}>
        {children}
      </h4>
    ),

    // Lists
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc list-inside my-3 space-y-1" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal list-inside my-3 space-y-1" {...props}>
        {children}
      </ol>
    ),

    // Blockquotes
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 bg-muted/50 rounded-r" {...props}>
        {children}
      </blockquote>
    ),

    // Links
    a: ({ children, href, ...props }: any) => (
      <a 
        className="text-primary hover:underline" 
        href={href}
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
      </a>
    ),

    // Paragraphs
    p: ({ children, ...props }: any) => (
      <p className="my-3 leading-relaxed" {...props}>
        {children}
      </p>
    )
  }

  if (!content.trim()) {
    return (
      <Card className={`markdown-preview ${className}`}>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2" />
            <div>No content to preview</div>
            <div className="text-xs mt-1">Content will appear here once generated</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const tabs = []
  if (showRawMarkdown) {
    tabs.push({ id: 'preview', label: 'Preview', icon: Eye })
    tabs.push({ id: 'markdown', label: 'Markdown', icon: Code })
  }
  if (showDiagrams && contentAnalysis.diagramCount > 0) {
    tabs.push({ id: 'diagrams', label: `Diagrams (${contentAnalysis.diagramCount})`, icon: BarChart3 })
  }

  return (
    <Card className={`markdown-preview ${className} ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            {showTitle && title && <CardTitle className="text-lg">{title}</CardTitle>}
            {showStats && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span>{contentAnalysis.wordCount} words</span>
                <span>{contentAnalysis.lineCount} lines</span>
                {contentAnalysis.diagramCount > 0 && (
                  <span>{contentAnalysis.diagramCount} diagrams</span>
                )}
                {contentAnalysis.codeBlocks > 0 && (
                  <span>{contentAnalysis.codeBlocks} code blocks</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="h-8 w-8 p-0"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(content, 'full-content')}
              className="h-8 w-8 p-0"
            >
              {copiedElements.has('full-content') ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {tabs.length > 1 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6 border-b">
              <TabsList className="grid w-full grid-cols-3">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>

            <TabsContent value="preview" className="px-6 pb-6 mt-0">
              <div className={`prose prose-sm max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={components}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </TabsContent>

            {showRawMarkdown && (
              <TabsContent value="markdown" className="px-6 pb-6 mt-0">
                <div className="relative">
                  <SyntaxHighlighter
                    language="markdown"
                    style={isDarkMode ? vscDarkPlus : vs}
                    className="rounded-lg"
                    wrapLongLines
                  >
                    {content}
                  </SyntaxHighlighter>
                </div>
              </TabsContent>
            )}

            {showDiagrams && contentAnalysis.diagramCount > 0 && (
              <TabsContent value="diagrams" className="px-6 pb-6 mt-0">
                <div className="space-y-6">
                  {contentAnalysis.diagrams.map((diagram, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      {diagram.title && (
                        <h3 className="font-semibold mb-3">{diagram.title}</h3>
                      )}
                      <MermaidRenderer 
                        chart={diagram.diagram}
                        id={`diagram-${index}`}
                      />
                      <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                        <span>Type: {diagram.type}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(diagram.diagram, `diagram-${index}`)}
                        >
                          {copiedElements.has(`diagram-${index}`) ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <div className="px-6 pb-6">
            <div className={`prose prose-sm max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={components}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MarkdownPreview