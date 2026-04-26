interface SectionGroupProps {
  /** Letter, emoji, or short text shown in the circle */
  icon: React.ReactNode;
  label: string;
  count: number;
  countLabel?: string; // e.g. "resident" — pluralised automatically
  children: React.ReactNode;
}

export function SectionGroup({
  icon,
  label,
  count,
  countLabel,
  children,
}: SectionGroupProps) {
  const noun = countLabel ?? "item";
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="font-semibold text-base">{label}</h2>
          <p className="text-xs text-gray-400">
            {count} {noun}{count !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex-1 border-t border-gray-100 ml-2" />
      </div>
      {children}
    </section>
  );
}
