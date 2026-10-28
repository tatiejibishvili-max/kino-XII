import { createContext } from "react";
import type { PurchaseContextValue } from "../types/purchase";

export const PurchaseContext = createContext<PurchaseContextValue | null>(null);
