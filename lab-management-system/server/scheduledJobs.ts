import { getAllClearanceRequests, notifyUsersByRole } from "./db";
import { notifyOwner } from "./_core/notification";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // every 24 hours

// ─── Transient Error Detection ────────────────────────────────────────────────
const RETRYABLE_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "PROTOCOL_CONNECTION_LOST",
  "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR",
]);

/**
 * Returns true if the error (or any of its nested causes) is a transient
 * network/connection error that is safe to retry.
 *
 * Drizzle wraps the original mysql2 error inside a `DrizzleQueryError`,
 * so we walk the `.cause` chain to find the real error code.
 */
function isRetryableError(err: unknown): boolean {
  let current: unknown = err;
  while (current != null && typeof current === "object") {
    const code = (current as NodeJS.ErrnoException).code;
    if (code && RETRYABLE_CODES.has(code)) return true;
    // Walk the cause chain (DrizzleQueryError wraps the original error)
    current = (current as { cause?: unknown }).cause ?? null;
  }
  return false;
}

/**
 * Returns the deepest error code found in the cause chain, or undefined.
 */
function getRootCode(err: unknown): string | undefined {
  let current: unknown = err;
  let lastCode: string | undefined;
  while (current != null && typeof current === "object") {
    const code = (current as NodeJS.ErrnoException).code;
    if (code) lastCode = code;
    current = (current as { cause?: unknown }).cause ?? null;
  }
  return lastCode;
}

// ─── Retry Helper ─────────────────────────────────────────────────────────────
/**
 * Executes `fn` up to `maxAttempts` times with exponential backoff.
 * Only retries on transient network errors.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 2000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      if (!isRetryableError(err) || attempt === maxAttempts) {
        throw err;
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1); // 2s → 4s → 8s
      console.warn(
        `[ScheduledJobs] Attempt ${attempt}/${maxAttempts} failed (${getRootCode(err)}). Retrying in ${delay}ms…`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

// ─── Job: Check Overdue Payments ──────────────────────────────────────────────
async function checkOverduePayments() {
  try {
    const allRequests = await withRetry(() => getAllClearanceRequests());
    const now = Date.now();
    const overdue = allRequests.filter(
      (r) =>
        r.status === "payment_ordered" &&
        r.paymentOrderDate &&
        now - new Date(r.paymentOrderDate).getTime() > THREE_DAYS_MS
    );

    for (const req of overdue) {
      const daysLate = Math.floor(
        (now - new Date(req.paymentOrderDate!).getTime()) /
          (24 * 60 * 60 * 1000)
      );
      const title = `تأخر في سداد أمر الدفع ${req.paymentOrderNumber}`;
      const message = `طلب براءة الذمة للمقاول "${req.contractorName}" - عقد: ${req.contractNumber} - مضى على إصدار أمر الدفع ${daysLate} يوماً دون استلام السداد. المبلغ: ${req.totalAmount} درهم`;

      await withRetry(() =>
        notifyUsersByRole("qc_inspector", title, message, undefined, "action_required")
      );
      await withRetry(() =>
        notifyUsersByRole("accountant", title, message, undefined, "action_required")
      );

      try {
        await notifyOwner({ title, content: message });
      } catch {
        // Owner notification is best-effort; never block the job
      }
    }

    if (overdue.length > 0) {
      console.log(
        `[ScheduledJobs] Payment delay check: ${overdue.length} overdue order(s) — notifications sent`
      );
    }
  } catch (err: unknown) {
    // After all retries are exhausted, log a concise warning for transient
    // errors instead of a full stack trace to keep the logs clean.
    if (isRetryableError(err)) {
      const code = getRootCode(err);
      console.warn(
        `[ScheduledJobs] checkOverduePayments skipped — DB connection unavailable (${code ?? "unknown"}). Will retry on next scheduled run.`
      );
    } else {
      console.error("[ScheduledJobs] Error in checkOverduePayments:", err);
    }
  }
}

// ─── Scheduler ────────────────────────────────────────────────────────────────
export function startScheduledJobs() {
  // Run once after 5 minutes of server start, then every 24 hours
  setTimeout(() => {
    checkOverduePayments();
    setInterval(checkOverduePayments, CHECK_INTERVAL_MS);
  }, 5 * 60 * 1000);

  console.log("[ScheduledJobs] Payment delay check scheduled (every 24h)");
}
