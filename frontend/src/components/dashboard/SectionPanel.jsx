export default function SectionPanel({ title, subtitle, icon: Icon, chipClass, action, children }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${chipClass ?? "bg-gray-50 text-gray-500"}`}>
              <Icon size={17} />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="m-0 truncate text-[15px] font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="m-0 mt-0.5 truncate text-xs text-gray-400">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
