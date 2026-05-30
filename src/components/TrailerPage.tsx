import { ArrowLeft } from 'lucide-react';
import trailerBackground from '../../ressources/fond_modal_podium.png';
import trailerVideo from '../../ressources/trailer_relatium.mp4';

interface TrailerPageProps {
  onHomeClick: () => void;
}

export function TrailerPage({ onHomeClick }: TrailerPageProps) {
  return (
    <main
      className="relative isolate flex min-h-screen flex-col overflow-hidden bg-cover bg-center bg-no-repeat px-4 py-5"
      style={{
        backgroundImage: `url(${trailerBackground})`,
      }}
    >
      <button
        type="button"
        onClick={onHomeClick}
        className="absolute left-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/55 text-slate-700 shadow-sm backdrop-blur-md transition hover:bg-white/80 hover:text-violet-700 sm:left-6 sm:top-6"
        aria-label="Retour à l'accueil"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <header className="mx-auto w-full max-w-5xl pt-14 text-center sm:pt-10">
        <h1 className="bg-gradient-to-r from-[#0f2455] via-[#5b5cf0] to-[#8c46f0] bg-clip-text text-3xl font-extrabold text-transparent sm:text-5xl">
          Bienvenue sur Relatium
        </h1>
      </header>

      <section className="flex flex-1 items-center justify-center py-8">
        <div className="w-full max-w-5xl rounded-2xl bg-white/10 shadow-[0_24px_70px_rgba(91,92,240,0.18)]">
          <video
            src={trailerVideo}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="block aspect-video w-full rounded-2xl bg-transparent object-contain opacity-100"
          >
            Votre navigateur ne peut pas lire cette vidéo.
          </video>
        </div>
      </section>
    </main>
  );
}
