import type { Extraction, Issue, ReviewState, ReviewStatus, ManagerOverride } from './types'

export function computeReviewStatus(
  state: ReviewState,
  extraction: Extraction | null,
  issues: Issue[],
  override?: ManagerOverride,
): ReviewStatus {
  if (!extraction) {
    return {
      state: 'PENDING',
      canExport: false,
      canApprove: false,
      requiresOverride: false,
      blockingReason: 'No document loaded',
    }
  }

  const errors = issues.filter((i) => i.severity === 'error')
  const hasErrors = errors.length > 0
  const hasWarnings = issues.some((i) => i.severity === 'warn')
  const hasOverride = Boolean(override && override.reason.trim().length >= 5)

  if (state === 'EXPORTED') {
    return {
      state: 'EXPORTED',
      canExport: false,
      canApprove: false,
      requiresOverride: false,
    }
  }

  if (state === 'APPROVED') {
    return {
      state: 'APPROVED',
      canExport: true,
      canApprove: false,
      requiresOverride: false,
      managerOverride: override,
    }
  }

  if (hasErrors && !hasOverride) {
    return {
      state: 'FLAGGED',
      canExport: false,
      canApprove: false,
      requiresOverride: true,
      blockingReason: `Blocked: ${errors[0].message} (Manager override required to bypass).`,
      managerOverride: override,
    }
  }

  if (hasWarnings) {
    return {
      state: 'FLAGGED',
      canExport: false,
      canApprove: true,
      requiresOverride: false,
      blockingReason: 'Document has open warnings to inspect.',
      managerOverride: override,
    }
  }

  return {
    state: 'VALIDATED',
    canExport: false,
    canApprove: true,
    requiresOverride: false,
    managerOverride: override,
  }
}
