import React from 'react';

interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  fullWidth?: boolean;
  helperText?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({ 
  label, 
  error, 
  fullWidth = false, 
  className = '', 
  helperText,
  ...props 
}) => {
  return (
    <div className={`flex flex-col gap-2 mb-4 ${fullWidth ? 'w-full' : ''} ${className}`}>
      <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
        {label}
        {props.required && <span className="text-red-500">*</span>}
      </label>
      <input
        className={`
          w-full px-4 py-2.5 rounded-lg border 
          bg-white text-gray-900 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          transition-all duration-200
          ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}
          disabled:bg-gray-100 disabled:text-gray-500
        `}
        {...props}
      />
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
};

interface SelectGroupProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const SelectGroup: React.FC<SelectGroupProps> = ({ 
  label, 
  options, 
  className = '',
  error,
  ...props 
}) => {
  return (
    <div className={`flex flex-col gap-2 mb-4 w-full ${className}`}>
      <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
        {label}
        {props.required && <span className="text-red-500">*</span>}
      </label>
      <select
        className={`
          w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900 
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent 
          transition-all duration-200
          ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}
        `}
        {...props}
      >
        <option value="" disabled>-- اختر --</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
};