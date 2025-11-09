import React from "react";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  id: string;
  children: React.ReactNode;
  error?: string;
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, id, children, error, className, ...props }, ref) => {
    return (
      <div className={`flex flex-col space-y-1 ${className}`}>
        <label htmlFor={id} className="font-medium text-gray-700">
          {label}
        </label>
        <select
          id={id}
          ref={ref}
          className={`border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
            error ? "border-red-500" : ""
          }`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
