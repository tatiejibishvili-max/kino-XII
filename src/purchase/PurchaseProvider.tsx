import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { setPurchaseLauncher } from "./launch";
import { PurchaseContext } from "./purchase-context";

export default function PurchaseProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const openPurchase = useCallback((nextSessionId: string) => {
    setSessionId(nextSessionId);
  }, []);

  const closePurchase = useCallback(() => {
    setSessionId(null);
  }, []);

  useEffect(() => {
    setPurchaseLauncher(openPurchase);
    return () => setPurchaseLauncher(null);
  }, [openPurchase]);

  const value = useMemo(
    () => ({ sessionId, openPurchase, closePurchase }),
    [closePurchase, openPurchase, sessionId],
  );

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}
