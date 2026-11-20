
const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'border border-slate-300 bg-white hover:bg-slate-50',
};

export default function Button({ variant = 'primary', type = 'button', className = '', ...props }) {
  return (
    <button
      type={type}
      className={
        `min-h-11 px-4 py-2 text-sm font-bold rounded-xl transition-colors ` +
        `disabled:opacity-40 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`
      }
      {...props}
    />
  );
}