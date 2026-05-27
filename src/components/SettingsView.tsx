import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  Eye,
  EyeOff,
  Lightbulb,
  Shuffle,
  Trash2,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import settingsIcon from '../../ressources/settings_icon.png';
import { getProfilePictureSrc, profilePictures } from '../profilePictures';

interface SettingsProfile {
  username: string;
  profile_bio: string;
  avatar_url: string | null;
}

interface SettingsViewProps {
  profile: SettingsProfile;
  onSaveProfile: (profile: SettingsProfile) => Promise<void>;
  onUpdatePassword: (passwords: { currentPassword: string; newPassword: string }) => Promise<void>;
  generalPreferences: GeneralPreferences;
  onUpdateGeneralPreference: (preference: PersistedGeneralPreferenceKey, enabled: boolean) => Promise<void>;
  onUpdateAccentColorPreference: (accentColor: AccentColor) => Promise<void>;
}

const accentColors: Array<{ key: AccentColor; label: string; swatches: [string, string, string] }> = [
  { key: 'violet', label: 'Violet', swatches: ['#ede9fe', '#8b5cf6', '#6d28d9'] },
  { key: 'blue',   label: 'Bleu',   swatches: ['#dbeafe', '#3b82f6', '#1d4ed8'] },
  { key: 'green',  label: 'Vert',   swatches: ['#d1fae5', '#10b981', '#047857'] },
  { key: 'orange', label: 'Orange', swatches: ['#ffedd5', '#f97316', '#c2410c'] },
  { key: 'pink',   label: 'Rose',   swatches: ['#fce7f3', '#ec4899', '#be185d'] },
  { key: 'red',    label: 'Rouge',  swatches: ['#fee2e2', '#ef4444', '#b91c1c'] },
];

type PersistedGeneralPreferenceKey = 'newsletter' | 'daily_tip' | 'animations' | 'confirm_before_delete';
type GeneralPreferenceKey = PersistedGeneralPreferenceKey;
type AccentColor = 'violet' | 'blue' | 'green' | 'orange' | 'pink' | 'red';

type GeneralPreferences = {
  newsletter: boolean;
  daily_tip: boolean;
  animations: boolean;
  confirm_before_delete: boolean;
  accent_color: AccentColor;
};

const preferenceItems: Array<{
  key: GeneralPreferenceKey;
  saveKey?: PersistedGeneralPreferenceKey;
  icon: typeof Bell;
  title: string;
  description: string;
}> = [
  {
    key: 'newsletter',
    saveKey: 'newsletter',
    icon: Bell,
    title: 'Newsletter',
    description: 'Recevoir des notifications pour les activités importantes.',
  },
  {
    key: 'daily_tip',
    saveKey: 'daily_tip',
    icon: Lightbulb,
    title: 'Conseils du jour',
    description: 'Afficher le conseil du jour sur le tableau de bord.',
  },
  {
    key: 'animations',
    saveKey: 'animations',
    icon: Shuffle,
    title: 'Animations',
    description: 'Activer les animations et transitions de l’interface.',
  },
  {
    key: 'confirm_before_delete',
    saveKey: 'confirm_before_delete',
    icon: AlertTriangle,
    title: 'Confirmation avant suppression',
    description: 'Demander une confirmation avant les suppressions importantes.',
  },
];

export function SettingsView({
  profile,
  onSaveProfile,
  onUpdatePassword,
  generalPreferences,
  onUpdateGeneralPreference,
  onUpdateAccentColorPreference,
}: SettingsViewProps) {
  const [username, setUsername] = useState(profile.username);
  const [profileBio, setProfileBio] = useState(profile.profile_bio);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState<string | null>(null);
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isPreferenceSaving, setIsPreferenceSaving] = useState<Record<PersistedGeneralPreferenceKey, boolean>>({
    newsletter: false,
    daily_tip: false,
    animations: false,
    confirm_before_delete: false,
  });
  const [isAccentSaving, setIsAccentSaving] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<GeneralPreferences>(generalPreferences);
  const [feedback, setFeedback] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState('');
  const [preferencesFeedback, setPreferencesFeedback] = useState('');

  useEffect(() => {
    setUsername(profile.username);
    setProfileBio(profile.profile_bio);
    setAvatarUrl(profile.avatar_url);
    setFeedback('');
  }, [profile.avatar_url, profile.profile_bio, profile.username]);

  useEffect(() => {
    setLocalPreferences(generalPreferences);
  }, [generalPreferences]);

  const selectedProfilePictureSrc = useMemo(() => getProfilePictureSrc(avatarUrl), [avatarUrl]);
  const displayedUsername = username.trim() || 'Utilisateur';
  const userInitial = displayedUsername.charAt(0).toUpperCase();
  const hasChanges =
    username.trim() !== profile.username ||
    profileBio !== profile.profile_bio ||
    avatarUrl !== profile.avatar_url;

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      setFeedback('Le pseudo doit contenir au moins 3 caractères.');
      return;
    }

    setIsSaving(true);
    setFeedback('');

    try {
      await onSaveProfile({
        username: trimmedUsername,
        profile_bio: profileBio.slice(0, 160),
        avatar_url: avatarUrl,
      });
      setFeedback('Profil enregistré.');
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : 'Impossible d’enregistrer le profil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordFeedback('Renseignez les trois champs.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordFeedback('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }

    setIsPasswordSaving(true);
    setPasswordFeedback('');

    try {
      await onUpdatePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordFeedback('Mot de passe mis à jour.');
    } catch (passwordError) {
      setPasswordFeedback(
        passwordError instanceof Error ? passwordError.message : 'Impossible de mettre à jour le mot de passe.',
      );
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handlePreferenceToggle = async (item: (typeof preferenceItems)[number]) => {
    const { saveKey } = item;
    if (!saveKey) {
      return;
    }

    const nextValue = !localPreferences[saveKey];

    setPreferencesFeedback('');
    setLocalPreferences(prev => ({ ...prev, [saveKey]: nextValue }));
    setIsPreferenceSaving(prev => ({ ...prev, [saveKey]: true }));

    try {
      await onUpdateGeneralPreference(saveKey, nextValue);
    } catch (preferenceError) {
      setLocalPreferences(prev => ({ ...prev, [saveKey]: !nextValue }));
      setPreferencesFeedback(
        preferenceError instanceof Error ? preferenceError.message : 'Impossible de mettre à jour cette préférence.',
      );
    } finally {
      setIsPreferenceSaving(prev => ({ ...prev, [saveKey]: false }));
    }
  };

  const handleAccentColorChange = async (accentColor: AccentColor) => {
    if (localPreferences.accent_color === accentColor) {
      return;
    }

    const previousAccentColor = localPreferences.accent_color;
    setPreferencesFeedback('');
    setLocalPreferences(prev => ({ ...prev, accent_color: accentColor }));
    setIsAccentSaving(true);

    try {
      await onUpdateAccentColorPreference(accentColor);
    } catch (accentError) {
      setLocalPreferences(prev => ({ ...prev, accent_color: previousAccentColor }));
      setPreferencesFeedback(
        accentError instanceof Error ? accentError.message : "Impossible de mettre à jour la couleur d'accent.",
      );
    } finally {
      setIsAccentSaving(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <img src={settingsIcon} alt="" className="h-12 w-12 object-contain" draggable={false} />
        <div>
          <h2 className="text-[24px] font-bold leading-tight text-slate-950">Paramètres</h2>
          <p className="mt-0.5 text-sm text-slate-600">Gérez votre compte et vos préférences.</p>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <form onSubmit={handleProfileSubmit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
          <div>
            <h3 className="text-lg font-bold leading-tight text-slate-950">Profil</h3>
            <p className="mt-0.5 text-xs text-slate-600">Gérez vos informations personnelles visibles sur Relatium.</p>
          </div>

          <div className="mt-4 grid gap-5 lg:grid-cols-[148px_1fr]">
            <div className="flex flex-col items-center">
              <div className="flex h-[126px] w-[126px] items-center justify-center overflow-hidden rounded-full bg-violet-50 ring-1 ring-violet-100">
                {selectedProfilePictureSrc ? (
                  <img src={selectedProfilePictureSrc} alt="" className="h-full w-full object-cover" draggable={false} />
                ) : (
                  <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-violet-500 text-[38px] font-bold text-white shadow-[inset_0_-12px_0_rgba(88,28,135,0.18)]">
                    {userInitial}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoPickerOpen(true)}
                className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm"
              >
                <Upload className="h-4 w-4" />
                Changer la photo
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-800">Pseudo</span>
                <span className="relative mt-1.5 block">
                  <input
                    type="text"
                    value={username}
                    onChange={event => setUsername(event.target.value)}
                    maxLength={32}
                    autoComplete="username"
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 pr-9 text-sm text-slate-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  />
                  <UserRound className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </span>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-800">À propos de vous (facultatif)</span>
                <span className="relative mt-1.5 block">
                  <textarea
                    value={profileBio}
                    onChange={event => setProfileBio(event.target.value.slice(0, 160))}
                    placeholder="Parlez un peu de vous..."
                    className="h-[82px] w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-slate-500">{profileBio.length}/160</span>
                </span>
              </label>

              <div className="flex items-center justify-between gap-3">
                <p className={`text-xs ${feedback === 'Profil enregistré.' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {feedback}
                </p>
                <button
                  type="submit"
                  disabled={isSaving || !hasChanges}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </form>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
          <div>
            <h3 className="text-lg font-bold leading-tight text-slate-950">Sécurité</h3>
            <p className="mt-0.5 text-xs text-slate-600">Mettez à jour votre mot de passe pour sécuriser votre compte.</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="mt-4">
            <div className="space-y-3">
            {[
              {
                label: 'Mot de passe actuel',
                value: currentPassword,
                onChange: setCurrentPassword,
                autoComplete: 'current-password',
              },
              {
                label: 'Nouveau mot de passe',
                value: newPassword,
                onChange: setNewPassword,
                autoComplete: 'new-password',
              },
              {
                label: 'Confirmer le nouveau mot de passe',
                value: confirmPassword,
                onChange: setConfirmPassword,
                autoComplete: 'new-password',
              },
            ].map(field => (
              <label key={field.label} className="block">
                <span className="text-xs font-semibold text-slate-800">{field.label}</span>
                <span className="relative mt-1.5 block">
                  <input
                    type={showPasswords === field.label ? 'text' : 'password'}
                    value={field.value}
                    onChange={event => field.onChange(event.target.value)}
                    autoComplete={field.autoComplete}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 pr-9 text-sm text-slate-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(v => v === field.label ? null : field.label)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showPasswords === field.label ? 'Masquer' : 'Afficher'}
                  >
                    {showPasswords === field.label ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>
            ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
            <p className={`text-xs ${passwordFeedback === 'Mot de passe mis à jour.' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {passwordFeedback}
            </p>
            <button
              type="submit"
              disabled={isPasswordSaving}
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPasswordSaving ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
          <div>
            <h3 className="text-lg font-bold leading-tight text-slate-950">Préférences d’affichage</h3>
            <p className="mt-0.5 text-xs text-slate-600">Personnalisez l’apparence de Relatium selon vos préférences.</p>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-800">Couleur d&apos;accent</p>
            <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {accentColors.map(accentColor => {
                const isSelected = localPreferences.accent_color === accentColor.key;
                return (
                  <button
                    key={accentColor.key}
                    type="button"
                    onClick={() => { void handleAccentColorChange(accentColor.key); }}
                    disabled={isAccentSaving}
                    className={`group relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 transition-all ${
                      isSelected
                        ? 'border-slate-400 shadow-sm'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    } ${isAccentSaving ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    <div className="flex w-full overflow-hidden rounded-lg shadow-sm">
                      {accentColor.swatches.map((swatch, i) => (
                        <div key={i} className="h-6 flex-1" style={{ backgroundColor: swatch }} />
                      ))}
                    </div>
                    <span className={`text-[11px] font-semibold ${isSelected ? 'text-slate-700' : 'text-slate-500 group-hover:text-slate-600'}`}>
                      {accentColor.label}
                    </span>
                    {isSelected && (
                      <span
                        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-white text-white shadow"
                        style={{ backgroundColor: accentColor.swatches[1] }}
                      >
                        <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1.5,5 4,7.5 8.5,2.5" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

          {(() => {
            const current = accentColors.find(c => c.key === localPreferences.accent_color) ?? accentColors[0];
            const [light, mid, dark] = current.swatches;
            return (
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Aperçu</p>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Bouton principal */}
                  <button
                    type="button"
                    className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white shadow-sm"
                    style={{ backgroundColor: mid }}
                  >
                    Action
                  </button>
                  {/* Bouton outline */}
                  <button
                    type="button"
                    className="rounded-lg border px-4 py-1.5 text-xs font-semibold"
                    style={{ borderColor: mid, color: dark }}
                  >
                    Secondaire
                  </button>
                  {/* Badge */}
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: light, color: dark }}
                  >
                    Ami proche
                  </span>
                  {/* Tag relation */}
                  <span
                    className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: light, color: mid }}
                  >
                    Relation
                  </span>
                  {/* Barre de progression */}
                  <div className="flex flex-1 min-w-[80px] flex-col gap-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: '65%', backgroundColor: mid }}
                      />
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full"
                        style={{ width: '40%', backgroundColor: light, outline: `1px solid ${mid}` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
          <div>
            <h3 className="text-lg font-bold leading-tight text-slate-950">Préférences générales</h3>
            <p className="mt-0.5 text-xs text-slate-600">Gérez vos préférences d’utilisation.</p>
          </div>

          <div className="mt-4 space-y-3">
            {preferenceItems.map(item => {
              const Icon = item.icon;
              const enabled = localPreferences[item.key];
              const isSavingPreference = item.saveKey ? isPreferenceSaving[item.saveKey] : false;
              return (
                <div key={item.title} className="flex items-center justify-between gap-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        enabled ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-tight text-slate-800">{item.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void handlePreferenceToggle(item);
                    }}
                    disabled={!item.saveKey || isSavingPreference}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      enabled ? 'bg-violet-600' : 'bg-slate-300'
                    }`}
                    aria-pressed={enabled}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm ${
                        enabled ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
            <p className="text-xs text-rose-600">{preferencesFeedback}</p>
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold leading-tight text-slate-950">Zone dangereuse</h3>
          <p className="mt-0.5 text-xs text-slate-600">Les actions ci-dessous sont irréversibles. Veuillez être prudent.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-400 bg-white px-4 py-2 text-xs font-bold text-red-500"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer mon compte
        </button>
      </section>

      {isPhotoPickerOpen && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[620px] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Choisir une photo</h3>
                <p className="mt-0.5 text-sm text-slate-500">Sélectionnez une photo de profil.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoPickerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {profilePictures.map(profilePicture => {
                const isSelected = avatarUrl === profilePicture.id;
                return (
                  <button
                    key={profilePicture.id}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(profilePicture.id);
                      setIsPhotoPickerOpen(false);
                    }}
                    className={`relative flex aspect-square items-center justify-center rounded-full p-1.5 transition ${
                      isSelected ? 'bg-violet-100 ring-2 ring-violet-500' : 'bg-slate-50 ring-1 ring-slate-200 hover:ring-violet-300'
                    }`}
                  >
                    <img src={profilePicture.src} alt="" className="h-full w-full rounded-full object-cover" draggable={false} />
                    {isSelected && (
                      <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white ring-2 ring-white">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
