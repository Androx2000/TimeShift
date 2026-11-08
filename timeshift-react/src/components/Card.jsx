// White rounded container shared by Portal and Monitor sections.
export default function Card({ children, className = '' }) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 ${className}`}>
      {children}
    </section>
  );
}