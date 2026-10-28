import { useCallback, useContext } from "react";
import { PurchaseContext } from "./purchase-context";

export function usePurchase() {
  const value = useContext(PurchaseContext);
  if (!value) throw new Error("usePurchase must be used within PurchaseProvider");
  return value;
}

export function useStartPurchase() {
  const { openPurchase } = usePurchase();
  return useCallback((sessionId: string) => openPurchase(sessionId), [openPurchase]);
}
