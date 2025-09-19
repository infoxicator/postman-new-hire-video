import React, { forwardRef } from "react";
import { Spacing } from "./Spacing";
import { Spinner } from "./Spinner";
import { cn } from "~/lib/utils";

const ButtonForward: React.ForwardRefRenderFunction<
  HTMLButtonElement,
  {
    onClick?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    loading?: boolean;
    secondary?: boolean;
    className?: string;
    type?: "button" | "submit" | "reset";
  }
> = ({ onClick, disabled, children, loading, secondary, className, type = "button" }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "rounded-geist border border-transparent bg-[#ff6c37] px-geist font-geist h-11 text-sm font-semibold inline-flex items-center justify-center text-white shadow-[0_12px_30px_rgba(255,108,55,0.25)] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6c37] hover:bg-[#ff814f] disabled:bg-button-disabled-color disabled:text-disabled-text-color disabled:shadow-none disabled:cursor-not-allowed",
        secondary
          ? "bg-transparent text-foreground border-unfocused-border-color hover:border-[#ff6c37] hover:text-[#ff6c37]"
          : undefined,
        className,
      )}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {loading && (
        <>
          <Spinner size={20} color="#ffffff" />
          <Spacing />
        </>
      )}
      {children}
    </button>
  );
};

export const Button = forwardRef(ButtonForward);
