type PurchaseLauncher = (sessionId: string) => void;

let launcher: PurchaseLauncher | null = null;
let queuedSessionId: string | null = null;

export function setPurchaseLauncher(next: PurchaseLauncher | null) {
  launcher = next;
  if (next && queuedSessionId) {
    const sessionId = queuedSessionId;
    queuedSessionId = null;
    next(sessionId);
  }
}

export function launchPurchase(sessionId: string) {
  if (launcher) launcher(sessionId);
  else queuedSessionId = sessionId;
}
