import { createContext } from "react";
import type { AuthAccount, RegistrationInput } from "../services/auth";

export type AuthModalMode = "login" | "register" | null;

export type PendingAction =
  | { type: "navigate"; path: string }
  | { type: "notify-movie"; movieId: string }
  | { type: "purchase"; sessionId: string };

export interface AuthContextValue {
  account: AuthAccount | null;
  modal: AuthModalMode;
  submitting: boolean;
  formError: string | null;
  fieldErrors: Record<string, string>;
  notice: string | null;
  pendingActionId: string | null;
  dismissNotice: () => void;
  openLogin: () => void;
  openRegister: () => void;
  closeModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegistrationInput) => Promise<void>;
  logout: () => void;
  saveProfile: (input: { fullName: string; mobileNumber: string; dateOfBirth: string }) => Promise<AuthAccount>;
  requireAuth: (action: PendingAction) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
