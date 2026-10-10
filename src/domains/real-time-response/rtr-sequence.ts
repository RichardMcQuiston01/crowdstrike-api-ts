/**
 * Tracks the next RTR command sequence id per session. The id is shared by the
 * read-only, active-responder, and admin execute endpoints, so one tracker is
 * injected into every RTR client that targets the same session.
 */
export class RtrSequenceTracker {
  private readonly nextBySession = new Map<string, number>();

  /**
   * Returns the sequence id to send for the session's next command and
   * advances the counter. An explicit caller-supplied id is honored and moves
   * the counter past it so later automatic ids never collide.
   */
  claim(sessionId: string, explicitId?: number): number {
    const next = this.nextBySession.get(sessionId) ?? 0;
    const id = explicitId ?? next;
    this.nextBySession.set(sessionId, Math.max(next, id + 1));
    return id;
  }

  /** Forgets a session's counter (call when the session is deleted). */
  reset(sessionId: string): void {
    this.nextBySession.delete(sessionId);
  }
}
