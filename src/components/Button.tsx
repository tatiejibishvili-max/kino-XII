import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "light" | "ghost" | "outline";
type ButtonSize = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={`btn btn--${variant} btn--${size} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
