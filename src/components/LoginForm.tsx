import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, KeyRound, MailCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import logoV1 from '../../ressources/logo_v1.png';

type PrimaryAuthMode = 'signin' | 'signup';
type LoginFormMode = PrimaryAuthMode | 'forgot' | 'reset';

interface LoginFormProps {
  initialMode?: LoginFormMode;
  passwordResetRedirectTo?: string;
  onModeChange?: (mode: PrimaryAuthMode) => void;
  onAuthenticated?: () => void;
  onPasswordUpdated?: () => void;
  onBack?: () => void;
}

export function LoginForm({
  initialMode = 'signin',
  passwordResetRedirectTo,
  onModeChange,
  onAuthenticated,
  onPasswordUpdated,
  onBack,
}: LoginFormProps) {
  const [mode, setMode] = useState<LoginFormMode>(initialMode);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordUpdated, setIsPasswordUpdated] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setInfo('');
    setPassword('');
    setConfirmPassword('');
    setIsPasswordUpdated(false);
  }, [initialMode]);

  const headerTitle = useMemo(() => {
    if (mode === 'signup') return 'Créer un compte';
    if (mode === 'forgot') return 'Mot de passe oublié';
    if (mode === 'reset') return 'Nouveau mot de passe';
    return 'Se connecter';
  }, [mode]);

  const headerSubtitle = useMemo(() => {
    if (mode === 'forgot') return 'Entre ton email pour recevoir le lien de réinitialisation.';
    if (mode === 'reset') return 'Choisis un mot de passe sécurisé pour ton compte.';
    return headerTitle;
  }, [headerTitle, mode]);

  const switchAuthMode = (nextMode: PrimaryAuthMode) => {
    setMode(nextMode);
    setError('');
    setInfo('');
    setPassword('');
    setConfirmPassword('');
    setIsPasswordUpdated(false);
    onModeChange?.(nextMode);
  };

  const openForgotPassword = () => {
    setMode('forgot');
    setError('');
    setInfo('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleResetEmailRequest = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Entre ton email pour recevoir le lien de réinitialisation.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setInfo('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: passwordResetRedirectTo ?? `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setInfo('Si un compte existe avec cet email, un lien de réinitialisation vient d’être envoyé.');
    } catch (resetError) {
      const message = resetError instanceof Error ? resetError.message : 'Impossible d’envoyer le mail de réinitialisation.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setInfo('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) throw updateError;

      setPassword('');
      setConfirmPassword('');
      setIsPasswordUpdated(true);
      setInfo('Mot de passe mis à jour.');
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Impossible de mettre à jour le mot de passe.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'forgot') {
      await handleResetEmailRequest();
      return;
    }

    if (mode === 'reset') {
      await handlePasswordUpdate();
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Email et mot de passe requis.');
      return;
    }

    if (mode === 'signup') {
      const trimmedUsername = username.trim();
      if (trimmedUsername.length < 3) {
        setError('Le nom utilisateur doit contenir au moins 3 caractères.');
        return;
      }

      if (password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }
    }

    setIsSubmitting(true);
    setError('');
    setInfo('');

    try {
      if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (signInError) throw signInError;

        onAuthenticated?.();
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            username: username.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        onAuthenticated?.();
        return;
      }

      setInfo('Compte créé. Vérifie ta boîte mail pour confirmer ton inscription.');
      setPassword('');
      setConfirmPassword('');
      switchAuthMode('signin');
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Erreur d’authentification.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {mode !== 'reset' && (
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
          </div>
        )}

        <div className="mb-6 flex flex-col items-center">
          <span className="relative mb-2 h-12 w-12 overflow-visible">
            <img src={logoV1} alt="Relatium" className="h-full w-full origin-center scale-[1.45] object-contain" />
          </span>
          <h1 className="bg-gradient-to-r from-[#0f2455] via-[#5b5cf0] to-[#8c46f0] bg-clip-text text-2xl font-bold text-transparent">
            Relatium
          </h1>
          <p className="mt-2 text-center text-gray-600">{headerSubtitle}</p>
        </div>

        {(mode === 'signin' || mode === 'signup') && (
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => switchAuthMode('signin')}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                mode === 'signin' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => switchAuthMode('signup')}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                mode === 'signup' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Inscription
            </button>
          </div>
        )}

        {mode === 'reset' && isPasswordUpdated ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">Mot de passe mis à jour</p>
              <p className="mt-1 text-sm text-slate-500">Tu peux continuer vers ton espace Relatium.</p>
            </div>
            <button
              type="button"
              onClick={onPasswordUpdated}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-purple-500 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-purple-600"
            >
              Continuer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode !== 'reset' && (
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nom utilisateur"
                  autoComplete="username"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' || mode === 'reset' ? 'Mot de passe (8 caractères min)' : 'Mot de passe'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                />

                {mode === 'signin' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={openForgotPassword}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 transition hover:text-violet-700"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Mot de passe oublié ?
                    </button>
                  </div>
                )}
              </div>
            )}

            {(mode === 'signup' || mode === 'reset') && (
              <div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer le mot de passe"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
            {info && (
              <p className={`text-sm ${mode === 'forgot' ? 'rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700' : 'text-emerald-600'}`}>
                {mode === 'forgot' && <MailCheck className="mr-1.5 inline h-4 w-4 align-[-3px]" />}
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-purple-500 py-2.5 font-semibold text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? 'Patiente...'
                : mode === 'signup'
                  ? 'Créer mon compte'
                  : mode === 'forgot'
                    ? 'Envoyer le lien'
                    : mode === 'reset'
                      ? 'Enregistrer le mot de passe'
                      : 'Se connecter'}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchAuthMode('signin')}
                className="w-full text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                Retour à la connexion
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
