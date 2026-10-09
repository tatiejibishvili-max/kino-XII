import { createContext } from "react";

export interface PurchaseContextValue {
  sessionId: string | null;
  openPurchase: (sessionId: string) => void;
  closePurchase: () => void;
}

export const PurchaseContext = createContext<PurchaseContextValue | null>(null);
