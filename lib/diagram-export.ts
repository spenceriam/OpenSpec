// Diagram export utilities for OpenSpec
// Handles SVG export, batch exports, and Mermaid code export functionality

import { DiagramInfo } from './diagram-utils'

export interface ExportOptions {
  format: 'svg' | 'mermaid' | 'both'
  includeMetadata: boolean
  includeTitle: boolean
  quality: 'standard' | 'high'
  theme?: 'light' | 'dark' | 'neutral'
  backgroundColor?: string
  downloadAsZip?: boolean
}

export interface ExportedDiagram {
  id: string
  title: string
  format: string
  content: string | ArrayBuffer
  filename: string
  mimeType: string
  size: number
}

export interface ExportResult {
  success: boolean
  diagrams: ExportedDiagram[]
  errors: string[]
  totalSize: number
  downloadUrl?: string
}

/**
 * Exports a single diagram to SVG format
 */
export async function exportDiagramToSVG(
  diagram: DiagramInfo,
  options: Partial<ExportOptions> = {}
): Promise<{ success: boolean; svg?: string; error?: string }> {
  try {
    const defaultOptions: ExportOptions = {
      format: 'svg',
      includeMetadata: true,
      includeTitle: true,
      quality: 'standard',
      theme: 'light',
      downloadAsZip: false
    }
    
    const exportOptions = { ...defaultOptions, ...options }
    
    // Dynamic import to avoid SSR issues
    const { default: mermaid } = await import('mermaid')
    
    // Configure Mermaid for export
    const config = getMermaidExportConfig(exportOptions)
    mermaid.initialize(config)
    
    // Generate unique ID for rendering
    const renderId = `export-${diagram.id}-${Date.now()}`
    
    // Render diagram to SVG
    const result = await mermaid.render(renderId, diagram.content)
    let svg = result.svg
    
    // Add metadata as comments if requested
    if (exportOptions.includeMetadata) {
      const metadata = generateSVGMetadata(diagram)
      svg = svg.replace('<svg', `${metadata}\n<svg`)
    }
    
    // Add title if requested and not already present
    if (exportOptions.includeTitle && diagram.title && !svg.includes('<title>')) {
      svg = svg.replace('<svg', `<svg>\n<title>${escapeXML(diagram.title)}</title>`)
      svg = svg.replace('<svg>', '<svg')
    }
    
    // Apply theme and background if specified
    if (exportOptions.backgroundColor) {
      svg = applyBackgroundColor(svg, exportOptions.backgroundColor)
    }
    
    return { success: true, svg }
  } catch (error) {
    console.error('SVG export error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to export diagram to SVG' 
    }
  }
}

/**
 * Exports multiple diagrams with various options
 */
export async function exportMultipleDiagrams(
  diagrams: DiagramInfo[],
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  const exportOptions: ExportOptions = {
    format: 'svg',
    includeMetadata: true,
    includeTitle: true,
    quality: 'standard',
    theme: 'light',
    downloadAsZip: false,
    ...options
  }
  
  const exportedDiagrams: ExportedDiagram[] = []
  const errors: string[] = []
  let totalSize = 0
  
  for (const diagram of diagrams) {
    try {
      if (exportOptions.format === 'svg' || exportOptions.format === 'both') {
        const svgResult = await exportDiagramToSVG(diagram, exportOptions)
        
        if (svgResult.success && svgResult.svg) {
          const svgSize = new Blob([svgResult.svg]).size
          totalSize += svgSize
          
          exportedDiagrams.push({
            id: diagram.id,
            title: diagram.title || diagram.id,
            format: 'svg',
            content: svgResult.svg,
            filename: generateFilename(diagram, 'svg'),
            mimeType: 'image/svg+xml',
            size: svgSize
          })
        } else if (svgResult.error) {
          errors.push(`SVG export failed for ${diagram.id}: ${svgResult.error}`)
        }
      }
      
      if (exportOptions.format === 'mermaid' || exportOptions.format === 'both') {
        const mermaidContent = exportDiagramToMermaidCode(diagram, exportOptions)
        const mermaidSize = new Blob([mermaidContent]).size
        totalSize += mermaidSize
        
        exportedDiagrams.push({
          id: diagram.id,
          title: diagram.title || diagram.id,
          format: 'mermaid',
          content: mermaidContent,
          filename: generateFilename(diagram, 'mmd'),
          mimeType: 'text/plain',
          size: mermaidSize
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown export error'
      errors.push(`Export failed for ${diagram.id}: ${errorMessage}`)
    }
  }
  
  let downloadUrl: string | undefined
  
  // Create ZIP file if requested and multiple files
  if (exportOptions.downloadAsZip && exportedDiagrams.length > 1) {
    try {
      downloadUrl = await createZipDownload(exportedDiagrams)
    } catch (error) {
      errors.push(`ZIP creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  return {
    success: errors.length === 0,
    diagrams: exportedDiagrams,
    errors,
    totalSize,
    downloadUrl
  }
}

/**
 * Exports diagram as Mermaid code with optional formatting
 */
export function exportDiagramToMermaidCode(
  diagram: DiagramInfo,
  options: Partial<ExportOptions> = {}
): string {
  const exportOptions: ExportOptions = {
    format: 'mermaid',
    includeMetadata: true,
    includeTitle: true,
    quality: 'standard',
    downloadAsZip: false,
    ...options
  }
  
  let output = ''
  
  // Add metadata as comments
  if (exportOptions.includeMetadata) {
    output += `%% Diagram: ${diagram.id}\n`
    output += `%% Type: ${diagram.type}\n`
    if (diagram.title) {
      output += `%% Title: ${diagram.title}\n`
    }
    output += `%% Complexity: ${diagram.complexity}\n`
    if (diagram.personas && diagram.personas.length > 0) {
      output += `%% Personas: ${diagram.personas.join(', ')}\n`
    }
    output += `%% Exported: ${new Date().toISOString()}\n`
    output += '\n'
  }
  
  // Add title if requested
  if (exportOptions.includeTitle && diagram.title && !diagram.content.includes(diagram.title)) {
    output += `%% ${diagram.title}\n`
  }
  
  output += diagram.content
  
  // Ensure proper line ending
  if (!output.endsWith('\n')) {
    output += '\n'
  }
  
  return output
}

/**
 * Downloads a single diagram file
 */
export function downloadDiagram(
  diagram: ExportedDiagram,
  filename?: string
): void {
  const finalFilename = filename || diagram.filename
  
  let blob: Blob
  if (typeof diagram.content === 'string') {
    blob = new Blob([diagram.content], { type: diagram.mimeType })
  } else {
    blob = new Blob([diagram.content], { type: diagram.mimeType })
  }
  
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = finalFilename
  
  // Trigger download
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up
  URL.revokeObjectURL(url)
}

/**
 * Downloads all diagrams from an export result
 */
export function downloadAllDiagrams(
  exportResult: ExportResult,
  useZip: boolean = true
): void {
  if (exportResult.downloadUrl && useZip) {
    // Download ZIP file
    const link = document.createElement('a')
    link.href = exportResult.downloadUrl
    link.download = `diagrams-export-${Date.now()}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } else {
    // Download individual files
    exportResult.diagrams.forEach((diagram, index) => {
      // Small delay between downloads to avoid browser blocking
      setTimeout(() => {
        downloadDiagram(diagram)
      }, index * 100)
    })
  }
}

/**
 * Creates a ZIP file containing multiple diagrams
 */
async function createZipDownload(diagrams: ExportedDiagram[]): Promise<string> {
  try {
    // Dynamic import for ZIP functionality
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    // Add diagrams to ZIP
    for (const diagram of diagrams) {
      if (typeof diagram.content === 'string') {
        zip.file(diagram.filename, diagram.content)
      } else {
        zip.file(diagram.filename, diagram.content)
      }
    }
    
    // Add metadata file
    const metadata = {
      exportDate: new Date().toISOString(),
      totalDiagrams: diagrams.length,
      formats: [...new Set(diagrams.map(d => d.format))],
      diagrams: diagrams.map(d => ({
        id: d.id,
        title: d.title,
        format: d.format,
        filename: d.filename,
        size: d.size
      }))
    }
    
    zip.file('export-metadata.json', JSON.stringify(metadata, null, 2))
    
    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    
    return url
  } catch (error) {
    console.error('ZIP creation error:', error)
    throw new Error('Failed to create ZIP file')
  }
}

/**
 * Generates Mermaid configuration for export
 */
function getMermaidExportConfig(options: ExportOptions) {
  const themeVariables = getThemeVariables(options.theme || 'light')
  
  return {
    startOnLoad: false,
    theme: options.theme || 'light',
    securityLevel: 'loose',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: options.quality === 'high' ? 16 : 14,
    themeVariables,
    flowchart: {
      useMaxWidth: false,
      htmlLabels: true,
      curve: 'basis'
    },
    sequence: {
      useMaxWidth: false,
      mirrorActors: false,
      bottomMarginAdj: 1
    },
    gantt: {
      useMaxWidth: false,
      leftPadding: 75,
      rightPadding: 20
    },
    er: {
      useMaxWidth: false,
      entityPadding: 15,
      stroke: themeVariables.lineColor
    },
    state: {
      useMaxWidth: false
    },
    pie: {
      useMaxWidth: false
    },
    journey: {
      useMaxWidth: false
    }
  }
}

/**
 * Gets theme variables for different themes
 */
function getThemeVariables(theme: string) {
  switch (theme) {
    case 'dark':
      return {
        primaryColor: '#3b82f6',
        primaryTextColor: '#f9fafb',
        primaryBorderColor: '#6366f1',
        lineColor: '#9ca3af',
        secondaryColor: '#374151',
        tertiaryColor: '#1f2937',
        background: '#111827',
        mainBkg: '#1f2937',
        secondBkg: '#374151',
        tertiaryBkg: '#4b5563'
      }
    case 'neutral':
      return {
        primaryColor: '#6b7280',
        primaryTextColor: '#374151',
        primaryBorderColor: '#9ca3af',
        lineColor: '#d1d5db',
        secondaryColor: '#f9fafb',
        tertiaryColor: '#ffffff',
        background: '#ffffff',
        mainBkg: '#ffffff',
        secondBkg: '#f9fafb',
        tertiaryBkg: '#f3f4f6'
      }
    default: // light
      return {
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
      }
  }
}

/**
 * Generates SVG metadata comments
 */
function generateSVGMetadata(diagram: DiagramInfo): string {
  const metadata = [
    `<!-- Diagram ID: ${diagram.id} -->`,
    `<!-- Type: ${diagram.type} -->`,
    diagram.title ? `<!-- Title: ${escapeXML(diagram.title)} -->` : null,
    `<!-- Complexity: ${diagram.complexity} -->`,
    diagram.personas && diagram.personas.length > 0 ? 
      `<!-- Personas: ${diagram.personas.join(', ')} -->` : null,
    `<!-- Exported: ${new Date().toISOString()} -->`
  ].filter(Boolean)
  
  return metadata.join('\n')
}

/**
 * Applies background color to SVG
 */
function applyBackgroundColor(svg: string, backgroundColor: string): string {
  // Add background rectangle as first element in SVG
  const backgroundRect = `<rect width="100%" height="100%" fill="${backgroundColor}"/>`
  
  return svg.replace(
    /(<svg[^>]*>)/,
    `$1\n${backgroundRect}`
  )
}

/**
 * Generates appropriate filename for diagram export
 */
function generateFilename(diagram: DiagramInfo, extension: string): string {
  const title = diagram.title || diagram.id
  const sanitized = title
    .replace(/[^a-zA-Z0-9\-_\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .toLowerCase()
    .substring(0, 50) // Limit length
  
  return `${sanitized}-${diagram.id}.${extension}`
}

/**
 * Escapes XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Gets export format statistics
 */
export function getExportStatistics(exportResult: ExportResult): {
  totalFiles: number
  formatBreakdown: Record<string, number>
  totalSizeMB: number
  avgSizeKB: number
} {
  const formatBreakdown: Record<string, number> = {}
  
  for (const diagram of exportResult.diagrams) {
    formatBreakdown[diagram.format] = (formatBreakdown[diagram.format] || 0) + 1
  }
  
  return {
    totalFiles: exportResult.diagrams.length,
    formatBreakdown,
    totalSizeMB: Math.round((exportResult.totalSize / 1024 / 1024) * 100) / 100,
    avgSizeKB: exportResult.diagrams.length > 0 ? 
      Math.round((exportResult.totalSize / 1024 / exportResult.diagrams.length) * 100) / 100 : 0
  }
}

export default {
  exportDiagramToSVG,
  exportMultipleDiagrams,
  exportDiagramToMermaidCode,
  downloadDiagram,
  downloadAllDiagrams,
  getExportStatistics
}