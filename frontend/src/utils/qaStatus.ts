// DSIP returns questionStatus as an enum code (COMPLETED, IN_PROGRESS,
// ADMIN_FORWARD_TO_TOPOC) and a readable label in questionStatusDisplay.
interface QAStatusFields {
  questionStatus?: string;
  questionStatusDisplay?: string;
}

export const isAnswered = (qa: QAStatusFields): boolean =>
  qa.questionStatus === 'COMPLETED';

export const statusLabel = (qa: QAStatusFields): string =>
  qa.questionStatusDisplay || qa.questionStatus || 'Pending';
