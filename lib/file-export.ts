// File export utilities for OpenSpec
// Handles markdown generation, file downloads, and combined exports

import { ExportOptions, SpecWorkflowState, WorkflowPhase } from '@/types'
import { analyzeDiagrams } from './diagram-utils'
import { exportMultipleDiagrams, exportDiagramToSVG, exportDiagramToMermaidCode } from './diagram-export'

export interface ExportResult {
  success: boolean
  files: ExportedFile[]
  errors: string[]
  totalSize: number
  downloadUrl?: string
}

export interface ExportedFile {
  name: string
  content: string | Blob
  mimeType: string
  size: number
  type: 'markdown' | 'html' | 'pdf' | 'svg' | 'mermaid' | 'zip'
}

const PHASE_TITLES = {
  requirements: 'Requirements Specification',
  design: 'Technical Design Document', 
  tasks: 'Implementation Tasks'
}

const PHASE_DESCRIPTIONS = {
  requirements: 'This document outlines the functional and non-functional requirements for the system.',
  design: 'This document provides the technical design and architecture for implementing the requirements.',
  tasks: 'This document breaks down the design into actionable implementation tasks.'
}

/**
 * Export specification content based on provided options
 */
export async function exportSpecification(
  workflowState: SpecWorkflowState,
  options: ExportOptions
): Promise<ExportResult> {
  try {
    const files: ExportedFile[] = []
    const errors: string[] = []
    let totalSize = 0

    switch (options.type) {
      case 'individual':
        const individualFiles = await exportIndividualFiles(workflowState, options)
        files.push(...individualFiles.files)
        errors.push(...individualFiles.errors)
        totalSize += individualFiles.totalSize
        break

      case 'combined':
        const combinedFile = await exportCombinedDocument(workflowState, options)
        if (combinedFile) {
          files.push(combinedFile)
          totalSize += combinedFile.size
        } else {
          errors.push('Failed to create combined document')
        }
        break

      case 'diagrams-only':
        const diagramFiles = await exportDiagramsOnly(workflowState, options)
        files.push(...diagramFiles.files)
        errors.push(...diagramFiles.errors)
        totalSize += diagramFiles.totalSize
        break
    }

    // Create ZIP if requested
    let downloadUrl: string | undefined
    if (options.createZip && files.length > 1) {
      try {
        downloadUrl = await createZipDownload(files, options)
      } catch (error) {
        errors.push(`Failed to create ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } else if (files.length === 1 && !options.createZip) {
      // Create download URL for single file
      downloadUrl = createSingleFileDownload(files[0])
    }

    return {
      success: errors.length === 0,
      files,
      errors,
      totalSize,
      downloadUrl
    }
  } catch (error) {
    return {
      success: false,
      files: [],
      errors: [error instanceof Error ? error.message : 'Export failed'],
      totalSize: 0
    }
  }
}

/**
 * Export individual files for each phase
 */
async function exportIndividualFiles(
  workflowState: SpecWorkflowState,
  options: ExportOptions
): Promise<{ files: ExportedFile[]; errors: string[]; totalSize: number }> {
  const files: ExportedFile[] = []
  const errors: string[] = []
  let totalSize = 0

  for (const phase of options.phases) {
    const content = workflowState.phaseContent[phase as WorkflowPhase]
    if (!content) continue

    try {
      const file = await generatePhaseFile(phase, content, options)
      if (file) {
        files.push(file)
        totalSize += file.size
      }
    } catch (error) {
      errors.push(`Failed to export ${phase}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Export diagrams separately if requested
  if (options.includeDiagrams) {
    try {
      const diagramFiles = await exportAllDiagrams(workflowState, options)
      files.push(...diagramFiles)
      totalSize += diagramFiles.reduce((sum, file) => sum + file.size, 0)
    } catch (error) {
      errors.push(`Failed to export diagrams: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return { files, errors, totalSize }
}

/**
 * Export combined document with all phases
 */
async function exportCombinedDocument(
  workflowState: SpecWorkflowState,
  options: ExportOptions
): Promise<ExportedFile | null> {
  try {
    let combinedContent = ''

    // Add header
    if (options.includeMetadata) {
      combinedContent += generateDocumentHeader(options)
      combinedContent += '\n\n'
    }

    // Add table of contents
    combinedContent += generateTableOfContents(options.phases)
    combinedContent += '\n\n'

    // Add each phase
    for (let i = 0; i < options.phases.length; i++) {
      const phase = options.phases[i]
      const content = workflowState.phaseContent[phase as WorkflowPhase]
      
      if (content) {
        if (i > 0) {
          combinedContent += '\n\n---\n\n'
        }

        combinedContent += generatePhaseSection(phase, content, options)
      }
    }

    // Add footer
    if (options.includeMetadata) {
      combinedContent += '\n\n---\n\n'
      combinedContent += generateDocumentFooter(options)
    }

    const filename = generateFilename('complete-specification', options)
    const content_blob = options.format === 'html' 
      ? await convertMarkdownToHtml(combinedContent)
      : options.format === 'pdf'
      ? await convertMarkdownToPdf(combinedContent)
      : combinedContent

    const mimeType = getMimeType(options.format)
    const size = typeof content_blob === 'string' 
      ? new Blob([content_blob]).size 
      : content_blob.size

    return {
      name: filename,
      content: content_blob,
      mimeType,
      size,
      type: options.format
    }
  } catch (error) {
    console.error('Combined export error:', error)
    return null
  }
}

/**
 * Export only diagrams from all phases
 */
async function exportDiagramsOnly(
  workflowState: SpecWorkflowState,
  options: ExportOptions
): Promise<{ files: ExportedFile[]; errors: string[]; totalSize: number }> {
  const files: ExportedFile[] = []
  const errors: string[] = []
  let totalSize = 0

  try {
    const allDiagrams = await exportAllDiagrams(workflowState, options)
    files.push(...allDiagrams)
    totalSize = allDiagrams.reduce((sum, file) => sum + file.size, 0)
  } catch (error) {
    errors.push(`Failed to export diagrams: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return { files, errors, totalSize }
}

/**
 * Generate file for a specific phase
 */
async function generatePhaseFile(
  phase: string,
  content: string,
  options: ExportOptions
): Promise<ExportedFile | null> {
  try {
    let processedContent = content

    // Add phase header if metadata is enabled
    if (options.includeMetadata) {
      const header = generatePhaseHeader(phase, options)
      processedContent = header + '\n\n' + processedContent
    }

    // Process content based on format
    const fileContent = options.format === 'html'
      ? await convertMarkdownToHtml(processedContent)
      : options.format === 'pdf'
      ? await convertMarkdownToPdf(processedContent)
      : processedContent

    const filename = generateFilename(phase, options)
    const mimeType = getMimeType(options.format)
    const size = typeof fileContent === 'string' 
      ? new Blob([fileContent]).size 
      : fileContent.size

    return {
      name: filename,
      content: fileContent,
      mimeType,
      size,
      type: options.format
    }
  } catch (error) {
    console.error(`Phase file generation error for ${phase}:`, error)
    return null
  }
}

/**
 * Export all diagrams from workflow state
 */
async function exportAllDiagrams(
  workflowState: SpecWorkflowState,
  options: ExportOptions
): Promise<ExportedFile[]> {
  const files: ExportedFile[] = []
  let diagramCounter = 1

  for (const phase of options.phases) {
    const content = workflowState.phaseContent[phase as WorkflowPhase]
    if (!content) continue

    const diagrams = analyzeDiagrams(content)
    
    for (const diagram of diagrams) {
      const diagramName = diagram.title || `${phase}-diagram-${diagramCounter++}`
      
      try {
        if (options.diagramFormat === 'svg' || options.diagramFormat === 'both') {
          const svgResult = await exportDiagramToSVG(diagram, {
            quality: options.quality,
            theme: options.theme,
            includeMetadata: options.includeMetadata
          })
          
          if (svgResult.success && svgResult.svg) {
            files.push({
              name: `${sanitizeFilename(diagramName)}.svg`,
              content: svgResult.svg,
              mimeType: 'image/svg+xml',
              size: new Blob([svgResult.svg]).size,
              type: 'svg'
            })
          }
        }

        if (options.diagramFormat === 'mermaid' || options.diagramFormat === 'both') {
          const mermaidCode = exportDiagramToMermaidCode(diagram, {
            includeMetadata: options.includeMetadata
          })
          
          files.push({
            name: `${sanitizeFilename(diagramName)}.mmd`,
            content: mermaidCode,
            mimeType: 'text/plain',
            size: new Blob([mermaidCode]).size,
            type: 'mermaid'
          })
        }
      } catch (error) {
        console.error(`Diagram export error for ${diagramName}:`, error)
      }
    }
  }

  return files
}

/**
 * Generate document header with metadata
 */
function generateDocumentHeader(options: ExportOptions): string {
  let header = `# Complete Specification Document\n\n`
  
  if (options.includeTimestamp) {
    header += `**Generated:** ${new Date().toLocaleString()}\n\n`
  }
  
  header += `**Phases Included:** ${options.phases.join(', ')}\n\n`
  
  if (options.includeDiagrams) {
    header += `**Diagrams:** Included (${options.diagramFormat})\n\n`
  }
  
  header += `**Export Format:** ${options.format.toUpperCase()}\n\n`
  
  header += `This document contains the complete specification including all selected phases and diagrams.\n\n`
  
  return header
}

/**
 * Generate table of contents
 */
function generateTableOfContents(phases: string[]): string {
  let toc = `## Table of Contents\n\n`
  
  phases.forEach((phase, index) => {
    const title = PHASE_TITLES[phase as keyof typeof PHASE_TITLES] || phase
    toc += `${index + 1}. [${title}](#${phase.toLowerCase().replace(/\s+/g, '-')})\n`
  })
  
  return toc
}

/**
 * Generate phase section for combined document
 */
function generatePhaseSection(phase: string, content: string, options: ExportOptions): string {
  const title = PHASE_TITLES[phase as keyof typeof PHASE_TITLES] || phase
  const description = PHASE_DESCRIPTIONS[phase as keyof typeof PHASE_DESCRIPTIONS] || ''
  
  let section = `## ${title} {#${phase.toLowerCase().replace(/\s+/g, '-')}}\n\n`
  
  if (description && options.includeMetadata) {
    section += `${description}\n\n`
  }
  
  section += content
  
  return section
}

/**
 * Generate phase header for individual files
 */
function generatePhaseHeader(phase: string, options: ExportOptions): string {
  const title = PHASE_TITLES[phase as keyof typeof PHASE_TITLES] || phase
  const description = PHASE_DESCRIPTIONS[phase as keyof typeof PHASE_DESCRIPTIONS] || ''
  
  let header = `# ${title}\n\n`
  
  if (description) {
    header += `${description}\n\n`
  }
  
  if (options.includeTimestamp) {
    header += `**Generated:** ${new Date().toLocaleString()}\n\n`
  }
  
  header += `**Phase:** ${phase}\n`
  
  return header
}

/**
 * Generate document footer
 */
function generateDocumentFooter(options: ExportOptions): string {
  let footer = `## Document Information\n\n`
  
  footer += `- **Generated by:** OpenSpec\n`
  footer += `- **Export Type:** ${options.type}\n`
  footer += `- **Format:** ${options.format.toUpperCase()}\n`
  
  if (options.includeTimestamp) {
    footer += `- **Generated on:** ${new Date().toLocaleString()}\n`
  }
  
  footer += `\n*This document was automatically generated from the specification workflow.*`
  
  return footer
}

/**
 * Generate appropriate filename
 */
function generateFilename(baseName: string, options: ExportOptions): string {
  const sanitized = sanitizeFilename(baseName)
  const timestamp = options.includeTimestamp 
    ? `-${new Date().toISOString().slice(0, 10)}`
    : ''
  
  const extension = getFileExtension(options.format)
  
  return `${sanitized}${timestamp}${extension}`
}

/**
 * Sanitize filename for cross-platform compatibility
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9\-_\s]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 50)
}

/**
 * Get file extension for format
 */
function getFileExtension(format: string): string {
  switch (format) {
    case 'html': return '.html'
    case 'pdf': return '.pdf'
    case 'markdown': 
    default: return '.md'
  }
}

/**
 * Get MIME type for format
 */
function getMimeType(format: string): string {
  switch (format) {
    case 'html': return 'text/html'
    case 'pdf': return 'application/pdf'
    case 'markdown':
    default: return 'text/markdown'
  }
}

/**
 * Convert markdown to HTML (placeholder implementation)
 */
async function convertMarkdownToHtml(markdown: string): Promise<string> {
  // This is a simplified implementation
  // In a real app, you'd use a library like marked or remark
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Specification Document</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1, h2, h3 { color: #2563eb; }
    code { background: #f1f5f9; padding: 0.125rem 0.25rem; border-radius: 0.25rem; }
    pre { background: #f1f5f9; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
    blockquote { border-left: 4px solid #e5e7eb; padding-left: 1rem; margin-left: 0; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #e5e7eb; padding: 0.5rem; text-align: left; }
    th { background: #f9fafb; }
  </style>
</head>
<body>
  <div class="content">
    ${markdown.replace(/\n/g, '<br>')}
  </div>
</body>
</html>`
  
  return html
}

/**
 * Convert markdown to PDF (placeholder implementation)
 */
async function convertMarkdownToPdf(markdown: string): Promise<Blob> {
  // This is a placeholder - in a real implementation, you'd use:
  // - puppeteer to convert HTML to PDF
  // - jsPDF with markdown parsing
  // - A server-side service
  
  const htmlContent = await convertMarkdownToHtml(markdown)
  return new Blob([htmlContent], { type: 'application/pdf' })
}

/**
 * Create download URL for single file
 */
function createSingleFileDownload(file: ExportedFile): string {
  const content = typeof file.content === 'string' 
    ? new Blob([file.content], { type: file.mimeType })
    : file.content
    
  return URL.createObjectURL(content)
}

/**
 * Create ZIP download with multiple files
 */
async function createZipDownload(files: ExportedFile[], options: ExportOptions): Promise<string> {
  try {
    // Dynamic import for ZIP functionality
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    // Add files to ZIP
    for (const file of files) {
      const content = typeof file.content === 'string' ? file.content : file.content
      zip.file(file.name, content)
    }
    
    // Add export metadata
    const metadata = {
      exportDate: new Date().toISOString(),
      exportType: options.type,
      format: options.format,
      phases: options.phases,
      totalFiles: files.length,
      files: files.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size
      }))
    }
    
    zip.file('export-info.json', JSON.stringify(metadata, null, 2))
    
    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const timestamp = options.includeTimestamp 
      ? new Date().toISOString().slice(0, 10)
      : ''
    
    // Create download URL
    const url = URL.createObjectURL(zipBlob)
    return url
  } catch (error) {
    console.error('ZIP creation error:', error)
    throw new Error('Failed to create ZIP file')
  }
}

/**
 * Download exported files
 */
export function downloadExportedFiles(exportResult: ExportResult, baseName: string = 'specification'): void {
  if (exportResult.downloadUrl) {
    // Download ZIP or single file
    const link = document.createElement('a')
    link.href = exportResult.downloadUrl
    link.download = exportResult.files.length > 1 
      ? `${baseName}-export.zip`
      : exportResult.files[0]?.name || `${baseName}.md`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(exportResult.downloadUrl!)
    }, 1000)
  } else {
    // Download individual files with delays
    exportResult.files.forEach((file, index) => {
      setTimeout(() => {
        const url = createSingleFileDownload(file)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        URL.revokeObjectURL(url)
      }, index * 100)
    })
  }
}

export default {
  exportSpecification,
  downloadExportedFiles
}