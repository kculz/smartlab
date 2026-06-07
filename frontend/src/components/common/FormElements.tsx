import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  loadingText?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  loadingText = 'Loading...',
  children,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles =
    'px-4 py-2 rounded-full font-medium transition-all duration-300 ease-out transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-sky-400/60';
  const variants = {
    primary: 'primary-gradient hover:brightness-110 hover:shadow-lg hover:shadow-sky-500/25 disabled:opacity-50',
    secondary:
      'border border-white/15 bg-white/10 text-slate-100 hover:bg-white/15 disabled:opacity-50',
    danger: 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? loadingText : children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="mb-2 block text-sm font-medium text-slate-200/90">
          {label}
        </label>
      )}
      <input
        className={`w-full rounded-2xl border bg-slate-900/60 px-4 py-3 text-slate-100 placeholder:text-slate-400/80 transition-all duration-300 ease-out focus:border-sky-400/60 focus:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-sky-400/30 ${
          error ? 'border-red-400/80' : 'border-white/10'
        }`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`soft-card p-6 transition duration-300 ease-out hover:-translate-y-1 hover:border-white/20 hover:bg-slate-900/80 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface TableProps {
  columns: Array<{ key: string; label: string }>;
  data: any[];
  loading?: boolean;
}

export const Table: React.FC<TableProps> = ({ columns, data, loading = false }) => {
  if (loading) return <p className="text-center py-4">Loading...</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left font-semibold">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
