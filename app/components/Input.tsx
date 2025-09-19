import React, { useCallback } from "react";

export const Input: React.FC<{
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  type?: React.HTMLInputTypeAttribute;
}> = ({ text, setText, disabled, placeholder, className, type = "text" }) => {
  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      setText(e.currentTarget.value);
    },
    [setText],
  );

  return (
    <input
      className={`leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#ff6c37] shadow-[0_1px_2px_rgba(15,15,18,0.08)] placeholder:text-[#9f9f9f] ${className ?? ""}`}
      type={type}
      disabled={disabled}
      name="title"
      placeholder={placeholder}
      value={text}
      onChange={onChange}
    />
  );
};
