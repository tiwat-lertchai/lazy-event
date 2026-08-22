// Queue Status
export type QueueStatus = "pending" | "printing" | "done" | "failed";

const VALID_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  pending: ["printing", "failed"],
  printing: ["done", "failed"],
  done: [], // Terminal state, no further transition allowed
  failed: ["pending"], // Allow retry from failed
};

export function canTransition(from: QueueStatus, to: QueueStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export class InvalidTransitionError extends Error {
  constructor(from: QueueStatus, to: QueueStatus) {
    super(`Cannot transition from "${from}" to "${to}"`);
    this.name = "InvalidTransitionError";
  }
}