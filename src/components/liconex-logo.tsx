import Image from "next/image";
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
  const content = compact ? (
    <LiconexMark />
  ) : (
    <span className="flex items-center gap-3">
      <Image
        src="/brand/liconex-wordmark.png"
        alt="Liconex"
        width={838}
        height={159}
        priority
        className={`h-7 w-auto object-contain ${inverted ? "brightness-0 invert" : ""}`}
      />
      {subtitle ? (
        <span className={`hidden border-l pl-3 text-xs sm:block ${inverted ? "border-white/20 text-white/64" : "border-line text-ink-500"}`}>
          {subtitle}
        </span>
      ) : null}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex items-center" aria-label="Liconex">
      {content}
    </Link>
  );
}

export function LiconexMark() {
  return (
    <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-md border border-line bg-white shadow-sm">
      <Image
        src="/brand/liconex-mark.png"
        alt=""
        width={96}
        height={96}
        className="h-8 w-8 object-contain"
      />
    </span>
  );
}
