import Link from "next/link";

export function LiconexLogo({
  href,
  subtitle,
  compact = false,
  inverted = false
}: {
  href?: string;
  subtitle?: string;
  compact?: boolean;
  inverted?: boolean;
}) {
  const content = (
    <span className="flex items-center gap-3">
      <LiconexMark />
      {compact ? null : (
        <span>
          <span className={`block text-sm font-semibold tracking-wide ${inverted ? "text-white" : "text-ink-900"}`}>
            Liconex
          </span>
          {subtitle ? (
            <span className={`block text-xs ${inverted ? "text-white/64" : "text-ink-500"}`}>
              {subtitle}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex items-center">
      {content}
    </Link>
  );
}

export function LiconexMark() {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink-900 text-white shadow-sm">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 4v14h9.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 13.5 16.8 5" stroke="#5dd6a5" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="7" cy="4" r="2.2" fill="#2f6df6" stroke="white" strokeWidth="1.4" />
        <circle cx="17" cy="5" r="2.2" fill="#5dd6a5" stroke="white" strokeWidth="1.4" />
        <circle cx="16.5" cy="18" r="2.2" fill="#f59e0b" stroke="white" strokeWidth="1.4" />
      </svg>
    </span>
  );
}
