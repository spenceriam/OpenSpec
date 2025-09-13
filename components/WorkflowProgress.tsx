'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Circle,
  ArrowRight,
  FileText,
  Layers,
  List,
  PlayCircle,
  PauseCircle,
  RotateCcw
} from 'lucide-react'
import { WorkflowPhase, ApprovalState, SpecWorkflowState } from '@/types'

interface WorkflowProgressProps {
  workflowState: SpecWorkflowState
  onPhaseSelect?: (phase: WorkflowPhase) => void
  onResetWorkflow?: () => void
  showNavigation?: boolean
  showResetButton?: boolean
  className?: string
}

const PHASE_CONFIG = {
  requirements: {
    title: 'Requirements',
    description: 'Analyze and define system requirements',
    icon: FileText,
    color: 'blue'
  },
  design: {
    title: 'Design',
    description: 'Create technical design and architecture',
    icon: Layers,
    color: 'purple'
  },
  tasks: {
    title: 'Tasks',
    description: 'Break down into implementation tasks',
    icon: List,
    color: 'green'
  }
} as const

const APPROVAL_CONFIG = {
  pending: {
    label: 'Pending',
    variant: 'secondary' as const,
    icon: Clock,
    color: 'text-muted-foreground'
  },
  approved: {
    label: 'Approved',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-green-600'
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive' as const,
    icon: AlertCircle,
    color: 'text-red-600'
  },
  needs_refinement: {
    label: 'Needs Refinement',
    variant: 'outline' as const,
    icon: RotateCcw,
    color: 'text-orange-600'
  }
}

export function WorkflowProgress({
  workflowState,
  onPhaseSelect,
  onResetWorkflow,
  showNavigation = true,
  showResetButton = true,
  className = ''
}: WorkflowProgressProps) {
  const { currentPhase, phaseContent, approvals, isGenerating, lastUpdated } = workflowState

  // Calculate overall progress
  const calculateProgress = (): number => {
    const phaseOrder: WorkflowPhase[] = ['requirements', 'design', 'tasks']
    const currentPhaseIndex = phaseOrder.indexOf(currentPhase)
    const approvedPhases = phaseOrder.filter(phase => approvals[phase] === 'approved').length
    
    // Base progress on approved phases (0-100)
    let progress = (approvedPhases / phaseOrder.length) * 100
    
    // Add partial progress for current phase if it has content but isn't approved
    if (phaseContent[currentPhase] && approvals[currentPhase] !== 'approved') {
      progress += (1 / phaseOrder.length) * 50 // 50% for having content
    }
    
    return Math.min(100, Math.max(0, progress))
  }

  // Get phase status
  const getPhaseStatus = (phase: WorkflowPhase) => {
    const hasContent = !!phaseContent[phase]
    const approval = approvals[phase] || 'pending'
    const isActive = currentPhase === phase
    const isGeneratingThis = isGenerating && isActive
    
    return {
      hasContent,
      approval,
      isActive,
      isGeneratingThis,
      isCompleted: approval === 'approved',
      isAccessible: phase === 'requirements' || approvals.requirements === 'approved' || 
                   (phase === 'tasks' && approvals.design === 'approved')
    }
  }

  // Render phase step
  const renderPhaseStep = (phase: WorkflowPhase, index: number) => {
    const config = PHASE_CONFIG[phase]
    const status = getPhaseStatus(phase)
    const approvalConfig = APPROVAL_CONFIG[status.approval]
    const Icon = config.icon
    const StatusIcon = approvalConfig.icon
    
    const isClickable = showNavigation && onPhaseSelect && status.isAccessible && !isGenerating

    return (
      <div key={phase} className="flex items-center">
        {/* Step indicator */}
        <div
          className={`
            relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all cursor-pointer
            ${status.isActive 
              ? 'border-primary bg-primary text-primary-foreground' 
              : status.isCompleted
              ? 'border-green-600 bg-green-600 text-white'
              : status.hasContent
              ? 'border-orange-500 bg-orange-500 text-white'
              : 'border-muted bg-muted text-muted-foreground'
            }
            ${isClickable ? 'hover:scale-105' : ''}
            ${!status.isAccessible ? 'opacity-50' : ''}
          `}
          onClick={isClickable ? () => onPhaseSelect(phase) : undefined}
        >
          {status.isGeneratingThis ? (
            <div className="animate-spin">
              <Circle className="h-5 w-5" />
            </div>
          ) : status.isCompleted ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
          
          {/* Step number */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-background border rounded-full flex items-center justify-center text-xs font-semibold">
            {index + 1}
          </div>
        </div>

        {/* Connector arrow */}
        {index < Object.keys(PHASE_CONFIG).length - 1 && (
          <div className="flex-1 min-w-8 max-w-16 mx-4">
            <ArrowRight className={`h-5 w-5 mx-auto ${
              status.isCompleted ? 'text-green-600' : 'text-muted-foreground'
            }`} />
          </div>
        )}
      </div>
    )
  }

  // Render phase details
  const renderPhaseDetails = (phase: WorkflowPhase) => {
    const config = PHASE_CONFIG[phase]
    const status = getPhaseStatus(phase)
    const approvalConfig = APPROVAL_CONFIG[status.approval]
    const StatusIcon = approvalConfig.icon
    
    return (
      <div
        key={phase}
        className={`
          p-4 rounded-lg border transition-all
          ${status.isActive 
            ? 'border-primary bg-primary/5' 
            : status.isCompleted
            ? 'border-green-200 bg-green-50'
            : status.hasContent
            ? 'border-orange-200 bg-orange-50'
            : 'border-muted bg-muted/30'
          }
          ${!status.isAccessible ? 'opacity-50' : ''}
        `}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <config.icon className="h-4 w-4" />
            <h3 className="font-medium">{config.title}</h3>
            {status.isActive && (
              <Badge variant="default" className="text-xs">
                Current
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${approvalConfig.color}`} />
            <Badge variant={approvalConfig.variant} className="text-xs">
              {approvalConfig.label}
            </Badge>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-2">
          {config.description}
        </p>
        
        {/* Phase-specific status info */}
        {status.hasContent && (
          <div className="text-xs text-muted-foreground">
            Content generated • 
            {status.approval === 'needs_refinement' && ' Refinements pending'}
            {status.approval === 'pending' && ' Waiting for approval'}
            {status.approval === 'approved' && ' Ready for next phase'}
            {status.approval === 'rejected' && ' Needs regeneration'}
          </div>
        )}
        
        {status.isGeneratingThis && (
          <div className="flex items-center gap-2 text-xs text-primary mt-2">
            <div className="animate-pulse w-2 h-2 bg-primary rounded-full"></div>
            Generating content...
          </div>
        )}
      </div>
    )
  }

  const overallProgress = calculateProgress()
  const completedPhases = Object.values(approvals).filter(approval => approval === 'approved').length
  const totalPhases = Object.keys(PHASE_CONFIG).length

  return (
    <Card className={`workflow-progress ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Specification Workflow</CardTitle>
          {showResetButton && onResetWorkflow && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetWorkflow}
              disabled={isGenerating}
            >
              <RotateCcw className="h-3 w-3 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">
              {completedPhases}/{totalPhases} phases complete
            </span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <div className="text-xs text-muted-foreground">
            {Math.round(overallProgress)}% complete
          </div>
        </div>

        {/* Phase steps visualization */}
        <div className="flex items-center justify-between px-4">
          {(Object.keys(PHASE_CONFIG) as WorkflowPhase[]).map((phase, index) => 
            renderPhaseStep(phase, index)
          )}
        </div>

        {/* Phase details */}
        <div className="space-y-3">
          {(Object.keys(PHASE_CONFIG) as WorkflowPhase[]).map(renderPhaseDetails)}
        </div>

        {/* Workflow status */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Status</span>
            {isGenerating ? (
              <div className="flex items-center gap-2 text-primary">
                <PauseCircle className="h-4 w-4" />
                <span>Generating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <PlayCircle className="h-4 w-4" />
                <span>Ready</span>
              </div>
            )}
          </div>
          
          {lastUpdated && (
            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </div>
          )}
        </div>

        {/* Navigation hints */}
        {showNavigation && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div>• Click on accessible phases to navigate between steps</div>
            <div>• Each phase must be approved before proceeding to the next</div>
            <div>• Use refinement options to improve content quality</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default WorkflowProgress