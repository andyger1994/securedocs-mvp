import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white px-5 py-4 text-ink-500">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-center text-xs">
        <Image src="/brand/liconex-mark.png" alt="" width={22} height={22} className="h-5 w-5 object-contain" />
        <span>
          Desarrollado por <strong className="font-semibold text-ink-700">Liconex</strong> - Seguridad Electrónica
        </span>
      </div>
    </footer>
  );
}
