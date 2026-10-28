import { useEffect, useId } from "react";
import { useAuth } from "../../auth/useAuth";
import { useDialog } from "../../lib/useDialog";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export default function AuthModal() {
  const { modal, closeModal, openLogin, openRegister, notice, dismissNotice } = useAuth();
  const titleId = useId();
  const dialogRef = useDialog<HTMLDivElement>(Boolean(modal), closeModal);

  useEffect(() => {
    if (!modal) return;
    dialogRef.current?.querySelector<HTMLElement>("input:not([type='file'])")?.focus();
  }, [dialogRef, modal]);

  return (
    <>
      {notice ? (
        <div className="auth-notice" role="status">
          <p>{notice}</p>
          <button type="button" onClick={dismissNotice}>
            Dismiss
          </button>
        </div>
      ) : null}
      {modal ? (
        <div
          className={modal === "register" ? "auth-backdrop auth-backdrop--register" : "auth-backdrop"}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            ref={dialogRef}
            className={modal === "register" ? "auth-dialog auth-dialog--register" : "auth-dialog"}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="auth-close" aria-label="Close" onClick={closeModal}>
              ×
            </button>
            {modal === "login" ? (
              <LoginForm titleId={titleId} onSwitch={openRegister} />
            ) : (
              <RegisterForm titleId={titleId} onSwitch={openLogin} />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
