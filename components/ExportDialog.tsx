'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Download,
  FileText,
  BarChart3,
  Package,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Archive,
  FileImage,
  Code,
  Eye,
  Calendar
} from 'lucide-react'
import { SpecWorkflowState, ExportFormat, ExportOptions } from '@/types'
import { analyzeDiagrams, DiagramInfo } from '@/lib/diagram-utils'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowState: SpecWorkflowState
  onExport: (options: ExportOptions) => void
  isExporting?: boolean
}

type ExportType = 'individual' | 'combined' | 'diagrams-only'
type ExportQuality = 'standard' | 'high'
type ExportTheme = 'light' | 'dark' | 'neutral'

export function ExportDialog({
  open,
  onOpenChange,
  workflowState,
  onExport,
  isExporting = false
}: ExportDialogProps) {
  const [exportType, setExportType] = useState<ExportType>('combined')
  const [selectedPhases, setSelectedPhases] = useState<string[]>(['requirements', 'design', 'tasks'])
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includeDiagrams, setIncludeDiagrams] = useState(true)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('markdown')
  const [diagramFormat, setDiagramFormat] = useState<'svg' | 'mermaid' | 'both'>('svg')
  const [quality, setQuality] = useState<ExportQuality>('standard')
  const [theme, setTheme] = useState<ExportTheme>('light')
  const [createZip, setCreateZip] = useState(false)
  const [includeTimestamp, setIncludeTimestamp] = useState(true)

  // Analyze available content and diagrams
  const contentAnalysis = useMemo(() => {
    const { phaseContent, approvals } = workflowState
    const analysis = {
      availablePhases: [] as string[],
      approvedPhases: [] as string[],
      totalDiagrams: 0,
      diagramsByPhase: {} as Record<string, DiagramInfo[]>,
      totalWords: 0,
      hasContent: false
    }

    for (const [phase, content] of Object.entries(phaseContent)) {
      if (content && content.trim()) {
        analysis.availablePhases.push(phase)
        analysis.totalWords += content.split(/\s+/).length

        if (approvals[phase as keyof typeof approvals] === 'approved') {
          analysis.approvedPhases.push(phase)
        }

        // Analyze diagrams in this phase
        const diagrams = analyzeDiagrams(content)
        if (diagrams.length > 0) {
          analysis.diagramsByPhase[phase] = diagrams
          analysis.totalDiagrams += diagrams.length
        }
      }
    }

    analysis.hasContent = analysis.availablePhases.length > 0

    return analysis
  }, [workflowState])

  const handlePhaseToggle = (phase: string, checked: boolean) => {
    setSelectedPhases(prev => 
      checked 
        ? [...prev, phase]
        : prev.filter(p => p !== phase)
    )
  }

  const handleExport = () => {
    const exportOptions: ExportOptions = {
      type: exportType,
      format: exportFormat,
      phases: exportType === 'diagrams-only' ? contentAnalysis.availablePhases : selectedPhases,
      includeMetadata,
      includeDiagrams,
      diagramFormat: diagramFormat,
      quality,
      theme,
      createZip: createZip || exportType === 'individual',
      includeTimestamp,
      timestamp: new Date().toISOString()
    }

    onExport(exportOptions)
  }

  // Calculate estimated file sizes
  const estimatedSize = useMemo(() => {
    let baseSize = 0
    
    selectedPhases.forEach(phase => {
      const content = workflowState.phaseContent[phase as keyof typeof workflowState.phaseContent]
      if (content) {
        baseSize += content.length
      }
    })

    // Add diagram size estimates
    if (includeDiagrams && diagramFormat === 'svg') {
      baseSize += contentAnalysis.totalDiagrams * 5000 // Rough SVG size estimate
    }

    const sizeInKB = Math.ceil(baseSize / 1024)
    return sizeInKB < 1024 ? `${sizeInKB} KB` : `${(sizeInKB / 1024).toFixed(1)} MB`
  }, [selectedPhases, workflowState.phaseContent, includeDiagrams, diagramFormat, contentAnalysis.totalDiagrams])

  const canExport = selectedPhases.length > 0 && contentAnalysis.hasContent && !isExporting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Specification
          </DialogTitle>
          <DialogDescription>
            Choose your export format and options. Exported files will include all selected phases and diagrams.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Content Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">{contentAnalysis.availablePhases.length} Phases</div>
                  <div className="text-muted-foreground">
                    {contentAnalysis.approvedPhases.length} approved
                  </div>
                </div>
                <div>
                  <div className="font-medium">{contentAnalysis.totalWords} Words</div>
                  <div className="text-muted-foreground">Total content</div>
                </div>
                <div>
                  <div className="font-medium">{contentAnalysis.totalDiagrams} Diagrams</div>
                  <div className="text-muted-foreground">Across all phases</div>
                </div>
                <div>
                  <div className="font-medium">{estimatedSize}</div>
                  <div className="text-muted-foreground">Estimated size</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Type */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Type</Label>
            <RadioGroup value={exportType} onValueChange={(value) => setExportType(value as ExportType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Individual Files
                  <Badge variant="secondary" className="text-xs">Separate files per phase</Badge>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="combined" id="combined" />
                <Label htmlFor="combined" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Combined Document
                  <Badge variant="secondary" className="text-xs">Single comprehensive file</Badge>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="diagrams-only" id="diagrams-only" />
                <Label htmlFor="diagrams-only" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Diagrams Only
                  <Badge variant="secondary" className="text-xs">Just the visual diagrams</Badge>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Phase Selection */}
          {exportType !== 'diagrams-only' && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Select Phases</Label>
              <div className="space-y-2">
                {contentAnalysis.availablePhases.map(phase => {
                  const isApproved = contentAnalysis.approvedPhases.includes(phase)
                  const diagramCount = contentAnalysis.diagramsByPhase[phase]?.length || 0
                  
                  return (
                    <div key={phase} className="flex items-center space-x-2">
                      <Checkbox
                        id={phase}
                        checked={selectedPhases.includes(phase)}
                        onCheckedChange={(checked) => handlePhaseToggle(phase, checked as boolean)}
                      />
                      <Label htmlFor={phase} className="flex items-center gap-2 flex-1">
                        <span className="capitalize font-medium">{phase}</span>
                        {isApproved && <CheckCircle className="h-3 w-3 text-green-600" />}
                        {diagramCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {diagramCount} diagram{diagramCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </Label>
                    </div>
                  )
                })}
              </div>
              {contentAnalysis.approvedPhases.length !== contentAnalysis.availablePhases.length && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Some phases are not yet approved. Consider completing the workflow before exporting.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <Separator />

          {/* Format Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-base font-medium">Export Format</Label>
              <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="markdown">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Markdown (.md)
                    </div>
                  </SelectItem>
                  <SelectItem value="html">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      HTML (.html)
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF (.pdf)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {includeDiagrams && (
              <div className="space-y-3">
                <Label className="text-base font-medium">Diagram Format</Label>
                <Select value={diagramFormat} onValueChange={(value) => setDiagramFormat(value as typeof diagramFormat)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="svg">
                      <div className="flex items-center gap-2">
                        <FileImage className="h-4 w-4" />
                        SVG Images
                      </div>
                    </SelectItem>
                    <SelectItem value="mermaid">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Mermaid Code
                      </div>
                    </SelectItem>
                    <SelectItem value="both">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Both Formats
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          {/* Additional Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Additional Options
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="metadata" 
                    checked={includeMetadata}
                    onCheckedChange={setIncludeMetadata}
                  />
                  <Label htmlFor="metadata">Include metadata</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="diagrams" 
                    checked={includeDiagrams}
                    onCheckedChange={setIncludeDiagrams}
                  />
                  <Label htmlFor="diagrams">Include diagrams</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="timestamp" 
                    checked={includeTimestamp}
                    onCheckedChange={setIncludeTimestamp}
                  />
                  <Label htmlFor="timestamp">Include timestamp</Label>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="zip" 
                    checked={createZip}
                    onCheckedChange={setCreateZip}
                    disabled={exportType === 'individual'}
                  />
                  <Label htmlFor="zip">Create ZIP archive</Label>
                </div>
                <div className="space-y-2">
                  <Label>Quality</Label>
                  <Select value={quality} onValueChange={(value) => setQuality(value as ExportQuality)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="high">High Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Export Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>Type:</strong> {exportType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                <div><strong>Phases:</strong> {exportType === 'diagrams-only' ? 'All available' : selectedPhases.join(', ')}</div>
                <div><strong>Format:</strong> {exportFormat.toUpperCase()}</div>
                {includeDiagrams && <div><strong>Diagrams:</strong> {diagramFormat.toUpperCase()}</div>}
                <div><strong>Estimated size:</strong> {estimatedSize}</div>
                {includeTimestamp && (
                  <div><strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {!canExport && contentAnalysis.hasContent && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select at least one phase to export.
              </AlertDescription>
            </Alert>
          )}

          {!contentAnalysis.hasContent && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No content available to export. Generate some content first.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={!canExport}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Specification
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExportDialog