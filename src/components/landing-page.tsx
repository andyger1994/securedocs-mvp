import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Layers3, Map, ShieldCheck, Wrench } from "lucide-react";

const features = [
  {
    icon: Map,
    title: "Planos interactivos",
    text: "Subi un plano o dibujalo por pisos para ubicar cada dispositivo con precision."
  },
  {
    icon: Layers3,
    title: "Capas tecnicas",
    text: "CCTV, acceso, alarma, red y energia organizados para mantenimiento diario."
  },
  {
    icon: Wrench,
    title: "Ficha de equipo",
    text: "Marca, modelo, IP, puerto, alimentacion, notas, archivos y responsable tecnico."
  }
];

const steps = ["Crear cliente", "Dibujar o subir plano", "Ubicar dispositivos", "Compartir vista tecnica"];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/50 bg-white/84 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink-900 text-white">
              <ShieldCheck size={19} />
            </span>
            <span className="text-sm font-semibold tracking-wide">SecureDocs</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-ink-500 md:flex">
            <a href="#producto" className="hover:text-ink-900">Producto</a>
            <a href="#flujo" className="hover:text-ink-900">Flujo</a>
            <a href="#para-quien" className="hover:text-ink-900">Equipos</a>
          </nav>
          <Link
            href="/login"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-ink-900 px-4 text-sm font-semibold text-white transition hover:bg-ink-700"
          >
            Ingresar
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <section className="relative flex min-h-[92vh] items-end overflow-hidden pt-16">
        <Image
          src="/images/landing-hero.png"
          alt="Interfaz premium de documentacion interactiva de seguridad electronica"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,248,251,0.96)_0%,rgba(247,248,251,0.84)_40%,rgba(247,248,251,0.20)_100%)]" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-5 pb-12 pt-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-line bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-600">
              SaaS para instaladores e integradores
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-ink-900 md:text-6xl">
              SecureDocs
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-ink-700 md:text-lg">
              Documentacion interactiva profesional para instalaciones de seguridad electronica:
              planos por piso, dispositivos ubicados visualmente y fichas tecnicas listas para mantenimiento.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex h-12 items-center gap-2 rounded-md bg-accent-500 px-5 text-sm font-semibold text-white shadow-soft transition hover:bg-accent-600"
              >
                Entrar al dashboard
                <ArrowRight size={17} />
              </Link>
              <a
                href="#producto"
                className="inline-flex h-12 items-center rounded-md border border-line bg-white/86 px-5 text-sm font-semibold text-ink-900 transition hover:border-accent-500/50"
              >
                Ver producto
              </a>
            </div>
          </div>
          <div className="hidden min-h-24 lg:block" />
        </div>
      </section>

      <section id="producto" className="border-y border-line bg-white py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-8 flex flex-col gap-2 md:max-w-2xl">
            <p className="text-sm font-semibold text-accent-600">Producto</p>
            <h2 className="text-3xl font-semibold">Todo el contexto tecnico en una sola vista</h2>
            <p className="text-sm leading-6 text-ink-500">
              Pensado para empresas que instalan, mantienen y documentan CCTV, alarmas, control de acceso y redes.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-lg border border-line bg-ink-50 p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-accent-600">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-5 text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-500">{feature.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="flujo" className="bg-ink-50 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold text-accent-600">Flujo operativo</p>
            <h2 className="mt-2 text-3xl font-semibold">Del relevamiento al mantenimiento</h2>
            <p className="mt-4 text-sm leading-6 text-ink-500">
              La plataforma esta preparada para trabajar con datos mock ahora y conectar Supabase despues,
              sin cambiar la experiencia base del equipo tecnico.
            </p>
          </div>
          <div className="grid gap-3">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-4 rounded-lg border border-line bg-white p-4">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-ink-900 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span className="font-medium">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="para-quien" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-5 md:grid-cols-3">
            {["Integradores", "Tecnicos", "Clientes"].map((audience) => (
              <div key={audience} className="flex items-center gap-3 rounded-lg border border-line p-5">
                <CheckCircle2 className="text-accent-600" size={20} />
                <div>
                  <h3 className="font-semibold">{audience}</h3>
                  <p className="text-sm text-ink-500">Vista clara para documentar, revisar y mantener.</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-lg bg-ink-900 p-6 text-white md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-white/10">
                <Building2 size={21} />
              </span>
              <div>
                <h2 className="text-xl font-semibold">Entrar al prototipo</h2>
                <p className="mt-1 text-sm text-white/70">Crea proyectos, agrega pisos y documenta dispositivos.</p>
              </div>
            </div>
            <Link href="/login" className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-ink-900">
              Ingresar
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
