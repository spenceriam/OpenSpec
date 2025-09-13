'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
  ArrowRight,
  AlertTriangle,
  Loader2,
  Clock,
  Zap,
  FileCheck,
  MessageSquare
} from 'lucide-react'
import { WorkflowPhase, ApprovalState } from '@/types'

interface ApprovalControlsProps {
  phase: WorkflowPhase
  content: string
  approvalState: ApprovalState
  canApprove?: boolean
  canReject?: boolean
  canRefine?: boolean
  canGenerate?: boolean
  canProgressToNext?: boolean
  isGenerating?: boolean
  nextPhase?: WorkflowPhase
  onApprove: () => void
  onReject: () => void
  onRequestRefinement: () => void
  onGenerate?: () => void
  onProgressToNext?: () => void
  className?: string
}

const PHASE_LABELS = {
  requirements: 'Requirements',
  design: 'Design',
  tasks: 'Tasks'
}

const APPROVAL_CONFIG = {
  pending: {
    label: 'Pending Review',
    description: 'Content is ready for approval',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  approved: {
    label: 'Approved',
    description: 'Content has been approved and ready for next phase',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  rejected: {
    label: 'Rejected',
    description: 'Content needs to be regenerated',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  needs_refinement: {
    label: 'Needs Refinement',
    description: 'Content needs improvements based on feedback',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  }
}

export function ApprovalControls({
  phase,
  content,
  approvalState,
  canApprove = true,
  canReject = true,
  canRefine = true,
  canGenerate = true,
  canProgressToNext = true,
  isGenerating = false,
  nextPhase,
  onApprove,
  onReject,
  onRequestRefinement,
  onGenerate,
  onProgressToNext,
  className = ''
}: ApprovalControlsProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null)

  const approvalConfig = APPROVAL_CONFIG[approvalState]
  const hasContent = content.trim().length > 0
  const isApproved = approvalState === 'approved'
  const isRejected = approvalState === 'rejected'
  const needsRefinement = approvalState === 'needs_refinement'
  const isPending = approvalState === 'pending'

  const handleActionWithConfirmation = (action: () => void, actionType: string) => {
    if (actionType === 'reject' || actionType === 'approve') {
      setShowConfirmDialog(actionType)
    } else {
      action()
    }
  }

  const executeAction = () => {
    switch (showConfirmDialog) {
      case 'approve':
        onApprove()
        break
      case 'reject':
        onReject()
        break
    }
    setShowConfirmDialog(null)
  }

  if (!hasContent && !isGenerating) {
    return (
      <Card className={`approval-controls ${className}`}>
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center text-muted-foreground">
              <FileCheck className="h-8 w-8 mx-auto mb-2" />
              <div>No content to review</div>
              <div className="text-xs mt-1">Generate content first</div>
            </div>
            {onGenerate && canGenerate && !isGenerating && (
              <Button onClick={onGenerate} className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Generate {PHASE_LABELS[phase]}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={`approval-controls ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                {PHASE_LABELS[phase]} Review
              </CardTitle>
              <CardDescription>
                Review the generated content and approve, request refinements, or reject
              </CardDescription>
            </div>
            <Badge 
              variant="secondary" 
              className={`${approvalConfig.color} ${approvalConfig.bgColor} ${approvalConfig.borderColor} border`}
            >
              {approvalConfig.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status description */}
          <div className={`p-3 rounded-lg ${approvalConfig.bgColor} ${approvalConfig.borderColor} border`}>
            <div className={`text-sm ${approvalConfig.color} font-medium mb-1`}>
              {approvalConfig.label}
            </div>
            <div className="text-sm text-muted-foreground">
              {approvalConfig.description}
            </div>
          </div>

          {/* Generation status */}
          {isGenerating && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Generating {PHASE_LABELS[phase].toLowerCase()} content. Please wait...
              </AlertDescription>
            </Alert>
          )}

          {/* Primary actions */}
          <div className="grid gap-3">
            {/* Approval actions */}
            {hasContent && !isGenerating && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Approve button */}
                {canApprove && !isApproved && (
                  <Button 
                    onClick={() => handleActionWithConfirmation(onApprove, 'approve')}
                    disabled={isGenerating}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve {PHASE_LABELS[phase]}
                  </Button>
                )}

                {/* Refinement button */}
                {canRefine && !isApproved && (
                  <Button 
                    variant="outline"
                    onClick={onRequestRefinement}
                    disabled={isGenerating}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Request Refinement
                  </Button>
                )}

                {/* Reject button */}
                {canReject && !isRejected && (
                  <Button 
                    variant="destructive"
                    onClick={() => handleActionWithConfirmation(onReject, 'reject')}
                    disabled={isGenerating}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject & Regenerate
                  </Button>
                )}
              </div>
            )}

            {/* Progress to next phase */}
            {isApproved && nextPhase && onProgressToNext && canProgressToNext && (
              <div className="pt-2 border-t">
                <Button 
                  onClick={onProgressToNext}
                  disabled={isGenerating}
                  size="lg"
                  className="w-full flex items-center gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  Continue to {PHASE_LABELS[nextPhase]}
                </Button>
              </div>
            )}

            {/* Regenerate button for rejected content */}
            {(isRejected || needsRefinement) && onGenerate && canGenerate && (
              <div className="pt-2 border-t">
                <Button 
                  onClick={onGenerate}
                  disabled={isGenerating}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      {isRejected ? 'Regenerate Content' : 'Apply Refinements'}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Action descriptions */}
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
              <div>• <strong>Approve:</strong> Mark content as complete and ready for next phase</div>
              <div>• <strong>Refine:</strong> Provide feedback to improve the current content</div>
              <div>• <strong>Reject:</strong> Discard content and regenerate from scratch</div>
            </div>

            {/* Workflow constraints */}
            {!isApproved && nextPhase && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  You must approve the {PHASE_LABELS[phase].toLowerCase()} before proceeding to {PHASE_LABELS[nextPhase].toLowerCase()}.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation dialogs */}
      <Dialog open={!!showConfirmDialog} onOpenChange={() => setShowConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showConfirmDialog === 'approve' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Approve {PHASE_LABELS[phase]}
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Reject {PHASE_LABELS[phase]}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {showConfirmDialog === 'approve' 
                ? `Are you sure you want to approve the ${PHASE_LABELS[phase].toLowerCase()} content? This will mark it as complete and allow progression to the next phase.`
                : `Are you sure you want to reject the ${PHASE_LABELS[phase].toLowerCase()} content? This will discard the current content and require regeneration.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={executeAction}
              variant={showConfirmDialog === 'approve' ? 'default' : 'destructive'}
              className="flex items-center gap-2"
            >
              {showConfirmDialog === 'approve' ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Reject & Regenerate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ApprovalControls