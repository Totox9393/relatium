import { ArrowRight, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import landingBackground from '../../ressources/fond_landing.png';
import logoV1 from '../../ressources/logo_v1.png';
import contact1Image from '../../ressources/contact1.png';
import contact2Image from '../../ressources/contact2.png';
import contact3Image from '../../ressources/contact3.png';

interface ContactPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
  onHomeClick: () => void;
  onFeaturesClick: () => void;
  onAboutClick: () => void;
  onPricingClick: () => void;
  onBlogClick: () => void;
}

const navItems = ['Fonctionnalités', 'À propos', 'Tarifs', 'Blog', 'Contact'];

const DEFAULT_SUBJECT = 'Message depuis le formulaire de contact';

type ContactFormState = {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  company: string;
};

type SubmitStatus = 'idle' | 'sending' | 'success' | 'error';

const contactHighlights = [
  {
    title: 'Réponse claire',
    description: 'Un message précis pour chaque demande, question produit ou retour.',
    image: contact1Image,
  },
  {
    title: 'Contact direct',
    description: 'Une prise de contact simple pour centraliser vos besoins autour de Relatium.',
    image: contact2Image,
  },
  {
    title: 'Réponse rapide',
    description: 'Nous lisons chaque demande avec attention pour revenir vers vous efficacement.',
    image: contact3Image,
  },
];

const initialFormState: ContactFormState = {
  firstName: '',
  lastName: '',
  email: '',
  subject: '',
  message: '',
  company: '',
};

const getOperatingSystem = (userAgent: string) => {
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Mac OS|Macintosh/i.test(userAgent)) return 'macOS';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'Inconnu';
};

const getBrowser = (userAgent: string) => {
  if (/Edg\//i.test(userAgent)) return 'Microsoft Edge';
  if (/OPR\//i.test(userAgent)) return 'Opera';
  if (/Firefox\//i.test(userAgent)) return 'Firefox';
  if (/Chrome\//i.test(userAgent)) return 'Chrome';
  if (/Safari\//i.test(userAgent)) return 'Safari';
  return 'Inconnu';
};

const getDevice = (userAgent: string) => {
  if (/Tablet|iPad/i.test(userAgent)) return 'Tablette';
  if (/Mobile|Android|iPhone|iPod/i.test(userAgent)) return 'Mobile';
  return 'Desktop';
};

export function ContactPage({
  onLoginClick,
  onSignupClick,
  onHomeClick,
  onFeaturesClick,
  onAboutClick,
  onPricingClick,
  onBlogClick,
}: ContactPageProps) {
  const [formData, setFormData] = useState<ContactFormState>(initialFormState);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');

  const isSending = submitStatus === 'sending';

  const updateField = (field: keyof ContactFormState, value: string) => {
    setFormData(currentFormData => ({
      ...currentFormData,
      [field]: value,
    }));

    if (submitStatus !== 'idle') {
      setSubmitStatus('idle');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitStatus('sending');

    const userAgent = window.navigator.userAgent || 'Non disponible';
    const subject = formData.subject.trim() || DEFAULT_SUBJECT;

    try {
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          projectName: 'Relatium',
          projectUrl: window.location.origin,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          subject,
          message: formData.message.trim(),
          os: getOperatingSystem(userAgent),
          browser: getBrowser(userAgent),
          device: getDevice(userAgent),
          userAgent,
          company: formData.company.trim(),
        },
      });

      if (error) throw error;

      setFormData(initialFormState);
      setSubmitStatus('success');
    } catch (error) {
      console.error('Erreur formulaire de contact:', error);
      setSubmitStatus('error');
    }
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-fixed bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${landingBackground})`,
      }}
    >
      <div className="relative mx-auto flex min-h-screen max-w-[1376px] flex-col px-6 py-5 md:px-10">
        <span className="pointer-events-none absolute left-[2.5%] top-[96px] h-2.5 w-2.5 rotate-45 rounded-[2px] border border-[#E1D9F4]" />
        <span className="pointer-events-none absolute right-[10%] top-[132px] h-2.5 w-2.5 rotate-45 rounded-[2px] border border-[#E1D9F4]" />
        <span className="pointer-events-none absolute left-[7%] top-[352px] h-1.5 w-1.5 rotate-45 rounded-[2px] border border-[#E1D9F4]" />
        <span className="pointer-events-none absolute right-[6%] top-[430px] h-1.5 w-1.5 rotate-45 rounded-[2px] border border-[#E1D9F4]" />

        <header className="relative z-10 mx-auto flex w-full max-w-[1376px] items-center justify-between">
          <button
            type="button"
            onClick={onHomeClick}
            className="inline-flex items-center gap-4"
          >
            <span className="relative h-8 w-8 overflow-visible">
              <img src={logoV1} alt="Relatium" className="h-full w-full origin-center scale-[1.75] object-contain" />
            </span>
            <span className="bg-gradient-to-r from-[#0f2455] via-[#5b5cf0] to-[#8c46f0] bg-clip-text text-[31px] font-extrabold tracking-[-0.02em] text-transparent">
              Relatium
            </span>
          </button>

          <nav className="hidden items-center gap-8 text-[13px] font-semibold text-slate-600 lg:flex">
            {navItems.map(item => {
              const isActive = item === 'Contact';

              return (
                <button
                  key={item}
                  type="button"
                  onClick={
                    item === 'Fonctionnalités'
                      ? onFeaturesClick
                      : item === 'À propos'
                        ? onAboutClick
                        : item === 'Tarifs'
                          ? onPricingClick
                        : item === 'Blog'
                          ? onBlogClick
                          : undefined
                  }
                  className={`relative pb-2 transition ${isActive ? 'text-violet-600' : 'hover:text-violet-600'}`}
                >
                  {item}
                  {isActive ? <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-violet-500" /> : null}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onLoginClick}
              className="rounded-xl border border-violet-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={onSignupClick}
              className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Créer un compte
            </button>
          </div>
        </header>

        <main className="relative z-10 flex flex-1 items-center py-4">
          <section className="grid gap-9 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="pt-4">
              <h1 className="mt-5 max-w-[560px] text-[54px] font-extrabold leading-[1.04] tracking-tight text-[#0B1C4B] md:text-[64px]">
                Parlons de vos
                <br />
                <span className="bg-gradient-to-r from-[#0f2455] via-[#5b5cf0] to-[#8c46f0] bg-clip-text text-transparent">
                  relations.
                </span>
              </h1>
              <p className="mt-5 max-w-[520px] text-[17px] leading-[1.6] text-[#5B6884]">
                Une question, une idée ou un retour sur Relatium ? Laissez-nous un message et nous reviendrons vers vous.
              </p>

              <div className="mt-8 grid gap-3">
                {contactHighlights.map(item => {
                  return (
                    <article key={item.title} className="flex items-start gap-4 rounded-2xl border border-[#ECE8F4] bg-white/90 p-4 shadow-[0_12px_32px_rgba(44,57,91,0.05)]">
                      <img src={item.image} alt="" className="h-16 w-16 shrink-0 object-contain" />
                      <div>
                        <h2 className="text-[16px] font-bold text-[#142957]">{item.title}</h2>
                        <p className="mt-1 text-[14px] leading-[1.55] text-[#5D6C88]">{item.description}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-[28px] border border-[#E7EAF5] bg-white/95 p-5 shadow-[0_28px_72px_rgba(26,40,79,0.13)] sm:p-7"
            >
              <label className="sr-only" aria-hidden="true">
                Entreprise
                <input
                  type="text"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formData.company}
                  onChange={event => updateField('company', event.target.value)}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-[13px] font-semibold text-[#314264]">
                  Prénom
                  <input
                    type="text"
                    name="firstName"
                    autoComplete="given-name"
                    required
                    disabled={isSending}
                    value={formData.firstName}
                    onChange={event => updateField('firstName', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#DEE3F0] bg-[#F9FAFF] px-4 py-3 text-[14px] text-[#182B52] outline-none transition placeholder:text-[#9BA7BA] focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    placeholder="Camille"
                  />
                </label>
                <label className="block text-[13px] font-semibold text-[#314264]">
                  Nom
                  <input
                    type="text"
                    name="lastName"
                    autoComplete="family-name"
                    required
                    disabled={isSending}
                    value={formData.lastName}
                    onChange={event => updateField('lastName', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#DEE3F0] bg-[#F9FAFF] px-4 py-3 text-[14px] text-[#182B52] outline-none transition placeholder:text-[#9BA7BA] focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    placeholder="Martin"
                  />
                </label>
              </div>

              <label className="mt-4 block text-[13px] font-semibold text-[#314264]">
                Email
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  disabled={isSending}
                  value={formData.email}
                  onChange={event => updateField('email', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#DEE3F0] bg-[#F9FAFF] px-4 py-3 text-[14px] text-[#182B52] outline-none transition placeholder:text-[#9BA7BA] focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  placeholder="camille@email.com"
                />
              </label>

              <label className="mt-4 block text-[13px] font-semibold text-[#314264]">
                Sujet
                <select
                  name="subject"
                  required
                  disabled={isSending}
                  value={formData.subject}
                  onChange={event => updateField('subject', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#DEE3F0] bg-[#F9FAFF] px-4 py-3 text-[14px] text-[#182B52] outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                >
                  <option value="" disabled>
                    Choisir un sujet
                  </option>
                  <option value="Question générale">Question générale</option>
                  <option value="Retour ou suggestion">Retour ou suggestion</option>
                  <option value="Aide sur le compte">Aide sur le compte</option>
                  <option value="Partenariat">Partenariat</option>
                  <option value="Autre">Autre</option>
                </select>
              </label>

              <label className="mt-4 block text-[13px] font-semibold text-[#314264]">
                Message
                <textarea
                  name="message"
                  rows={7}
                  required
                  disabled={isSending}
                  value={formData.message}
                  onChange={event => updateField('message', event.target.value)}
                  className="mt-2 w-full resize-none rounded-2xl border border-[#DEE3F0] bg-[#F9FAFF] px-4 py-3 text-[14px] leading-[1.55] text-[#182B52] outline-none transition placeholder:text-[#9BA7BA] focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  placeholder="Dites-nous ce que vous avez en tête..."
                />
              </label>

              <div className="mt-4 min-h-6" aria-live="polite">
                {submitStatus === 'success' ? (
                  <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">
                    Votre message a bien été envoyé. Merci, nous revenons vers vous rapidement.
                  </p>
                ) : null}
                {submitStatus === 'error' ? (
                  <p className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700">
                    Impossible d’envoyer le message pour le moment. Réessayez dans quelques instants.
                  </p>
                ) : null}
              </div>

              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[12px] leading-[1.5] text-[#77839A]">
                  Vos informations restent confidentielles et servent uniquement à traiter votre demande.
                </p>
                <button
                  type="submit"
                  disabled={isSending}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
                >
                  {isSending ? 'Envoi...' : 'Envoyer'}
                  <Send className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 rounded-2xl bg-[#F7F5FF] px-4 py-3 text-[13px] font-semibold text-[#6D5CA7]">
                <span className="inline-flex items-center gap-2">
                  Une demande précise aide à répondre plus vite
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
