import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, type = "text", placeholder, ...rest }, ref) => {
    return (
      <div>
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          ref={ref}
          {...rest}
          className={`block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm
                     focus:border-primary focus:ring-primary dark:focus:border-secondary dark:focus:ring-secondary
                     px-4 py-2.5 ${error ? "border-red-500 focus:ring-red-500" : ""}`}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
