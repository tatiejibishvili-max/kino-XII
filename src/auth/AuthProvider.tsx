import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { userMessage } from "../lib/userMessage";
import { launchPurchase } from "../purchase/launch";
import { setUnauthorizedHandler } from "../services/api";
import {
  AuthApiError,
  fetchCurrentAccount,
  loginWithPassword,
  logoutAccount,
  readStoredAccount,
  registerAccount,
  storeAccount,
  subscribeToComingSoon,
  updateProfile,
  type AuthAccount,
  type RegistrationInput,
} from "../services/auth";
import { AuthContext, type AuthModalMode, type PendingAction } from "./auth-context";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [account, setAccount] = useState<AuthAccount | null>(() => readStoredAccount());
  const [modal, setModal] = useState<AuthModalMode>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const pendingRef = useRef<PendingAction | null>(null);
  const runningRef = useRef(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    storeAccount(account);
  }, [account]);

  useEffect(() => {
    let active = true;
    fetchCurrentAccount()
      .then((next) => {
        if (active) setAccount(next);
      })
      .catch(() => {
        // A failed refresh leaves the stored profile until the next 401.
      });
    return () => {
      active = false;
    };
  }, []);

  const clearPending = useCallback(() => {
    pendingRef.current = null;
  }, []);

  const closeModal = useCallback(() => {
    if (submitting) return;
    setModal(null);
    setFormError(null);
    setFieldErrors({});
    clearPending();
  }, [clearPending, submitting]);

  const openLogin = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
    setModal("login");
  }, []);

  const openRegister = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
    setModal("register");
  }, []);

  const runPending = useCallback(
    async (action: PendingAction) => {
      if (runningRef.current) return;
      runningRef.current = true;
      setPendingActionId(action.type === "notify-movie" ? action.movieId : action.type);
      try {
        if (action.type === "navigate") {
          navigate(action.path);
          return;
        }
        if (action.type === "purchase") {
          launchPurchase(action.sessionId);
          return;
        }
        await subscribeToComingSoon(action.movieId);
      } catch (error) {
        if (error instanceof AuthApiError && error.status === 401 && action.type === "notify-movie") {
          pendingRef.current = action;
          setModal("login");
          setNotice("Your session expired. Sign in to finish notifying for this film.");
          return;
        }
        setNotice(userMessage(error, "The action could not be completed."));
      } finally {
        runningRef.current = false;
        setPendingActionId(null);
      }
    },
    [navigate],
  );

  const finishAuthenticated = useCallback(
    (next: AuthAccount) => {
      setAccount(next);
      setModal(null);
      setFormError(null);
      setFieldErrors({});
      const action = pendingRef.current;
      pendingRef.current = null;
      if (action) void runPending(action);
    },
    [runPending],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setFormError(null);
      setFieldErrors({});
      try {
        const next = await loginWithPassword(email, password);
        finishAuthenticated(next);
      } catch (error) {
        const details = error instanceof AuthApiError ? error.fieldErrors : {};
        setFieldErrors(details);
        if (Object.keys(details).length === 0) {
          setFormError(
            error instanceof AuthApiError && error.status === 401
              ? "The email or password is incorrect."
              : userMessage(error, "Login failed."),
          );
        }
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [finishAuthenticated],
  );

  const register = useCallback(
    async (input: RegistrationInput) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setFormError(null);
      setFieldErrors({});
      try {
        const result = await registerAccount(input);
        if (result.status === "authenticated") {
          finishAuthenticated(result.account);
        } else {
          setModal(null);
          pendingRef.current = null;
        }
      } catch (error) {
        const details = error instanceof AuthApiError ? error.fieldErrors : {};
        setFieldErrors(details);
        if (Object.keys(details).length === 0) {
          setFormError(userMessage(error, "Registration failed."));
        }
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [finishAuthenticated],
  );

  const logout = useCallback(() => {
    void logoutAccount();
    setAccount(null);
    clearPending();
    setModal(null);
  }, [clearPending]);

  const saveProfile = useCallback(async (input: { fullName: string; mobileNumber: string; dateOfBirth: string }) => {
    const next = await updateProfile(input);
    setAccount(next);
    return next;
  }, []);

  const requireAuth = useCallback(
    (action: PendingAction) => {
      if (account) {
        void runPending(action);
        return;
      }
      pendingRef.current = action;
      setFormError(null);
      setFieldErrors({});
      setModal("login");
    },
    [account, runPending],
  );

  const handleUnauthorized = useCallback(() => {
    setAccount(null);
    setModal((current) => current ?? "login");
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  const value = useMemo(
    () => ({
      account,
      modal,
      submitting,
      formError,
      fieldErrors,
      openLogin,
      openRegister,
      closeModal,
      login,
      register,
      logout,
      saveProfile,
      requireAuth,
      notice,
      pendingActionId,
      dismissNotice: () => setNotice(null),
    }),
    [account, closeModal, fieldErrors, formError, login, logout, modal, notice, openLogin, openRegister, pendingActionId, register, requireAuth, saveProfile, submitting],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
