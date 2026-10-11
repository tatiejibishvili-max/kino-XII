import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogEntry {
  close: () => void;
  element: HTMLElement;
}

const dialogs: DialogEntry[] = [];
let previousOverflow: string | null = null;

function focusable(element: HTMLElement) {
  return [...element.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((item) => item.tabIndex !== -1);
}

function focusDialog(element: HTMLElement) {
  const preferred = element.querySelector<HTMLElement>("input:not([type='file']):not([disabled]), select:not([disabled]), textarea:not([disabled])");
  (preferred ?? focusable(element)[0])?.focus();
}

function onKeyDown(event: KeyboardEvent) {
  const top = dialogs[dialogs.length - 1];
  if (!top) return;
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    top.close();
    return;
  }
  if (event.key !== "Tab") return;
  const items = focusable(top.element);
  if (items.length === 0) {
    event.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  const outside = !(active instanceof Node) || !top.element.contains(active);
  if (event.shiftKey && (active === first || outside)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || outside)) {
    event.preventDefault();
    first.focus();
  }
}

function bindDialogKeys() {
  if (dialogs.length === 1) window.addEventListener("keydown", onKeyDown);
}

function unbindDialogKeys() {
  if (dialogs.length === 0) window.removeEventListener("keydown", onKeyDown);
}

/** One keyboard listener for the topmost dialog. Restores focus when that dialog closes. */
export function useDialog<T extends HTMLElement>(active: boolean, onClose: () => void) {
  const dialogRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!active) return;
    const element = dialogRef.current;
    if (!element) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (dialogs.length === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    const entry: DialogEntry = {
      element,
      close: () => onCloseRef.current(),
    };
    dialogs.push(entry);
    bindDialogKeys();
    focusDialog(element);
    return () => {
      const index = dialogs.indexOf(entry);
      if (index >= 0) dialogs.splice(index, 1);
      unbindDialogKeys();
      if (dialogs.length === 0) {
        document.body.style.overflow = previousOverflow ?? "";
        previousOverflow = null;
        previouslyFocused?.focus();
      } else {
        focusDialog(dialogs[dialogs.length - 1].element);
      }
    };
  }, [active]);

  return dialogRef;
}
