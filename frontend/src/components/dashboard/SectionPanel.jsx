export default function SectionPanel({ title, action, children }) {
  return (
    <section className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="m-0 text-base font-bold text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
