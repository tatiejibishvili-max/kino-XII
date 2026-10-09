import { useCallback, useContext } from "react";
import { useAuth } from "../auth/useAuth";
import { PurchaseContext } from "./purchase-context";

export function usePurchase() {
  const value = useContext(PurchaseContext);
  if (!value) throw new Error("usePurchase must be used within PurchaseProvider");
  return value;
}

export function useStartPurchase() {
  const { requireAuth } = useAuth();
  return useCallback((sessionId: string) => requireAuth({ type: "purchase", sessionId }), [requireAuth]);
}
