import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { type Session } from '@supabase/supabase-js';
import { ArrowLeftRight, ArrowRight, UserRound, X } from 'lucide-react';
import { Friend, Relation, FriendGroup, RelationTypeDB } from './types';
import { LoginForm } from './components/LoginForm';
import { Navigation } from './components/Navigation';
import { FriendGraph } from './components/FriendGraph';
import { FriendProfile } from './components/FriendProfile';
import { StatsAndLegend } from './components/StatsAndLegend';
import RelationTypeManagement, { availableIcons } from './components/RelationTypeManagement';
import { Ranking } from './components/Ranking';
import { SearchableCombobox } from './components/SearchableCombobox';
import { LandingPage } from './components/LandingPage';
import { FeaturesPage, type FeatureActionKey } from './components/FeaturesPage';
import { AboutPage } from './components/AboutPage';
import { BlogPage } from './components/BlogPage';
import { ContactPage } from './components/ContactPage';
import { PricingPage } from './components/PricingPage';
import { TrailerPage } from './components/TrailerPage';
import { NotFoundPage } from './components/NotFoundPage';
import { ArticleReaderPage } from './components/articles/ArticleReaderPage';
import { getBlogArticleBySlug } from './components/articles/registry';
import { DirectoryView } from './components/DirectoryView';
import { GroupsView } from './components/GroupsView';
import { RelationTypesView } from './components/RelationTypesView';
import { Statistics } from './components/Statistics';
import { AnalysisView } from './components/AnalysisView';
import { SettingsView } from './components/SettingsView';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { supabase } from './lib/supabaseClient';
import addUserModalBackground from '../ressources/fond_modal_adduser.png';
import welcomeLogo from '../ressources/logo_welcome.png';

type AppView = 'dashboard' | 'relation-map' | 'directory' | 'groups' | 'relation-types' | 'statistics' | 'analysis' | 'settings';

type AccountProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  profile_bio: string | null;
  onboarding_completed: boolean;
};

type AccentColor = 'violet' | 'blue' | 'green' | 'orange' | 'pink' | 'red';
type PersistedGeneralPreferenceKey = 'newsletter' | 'daily_tip' | 'animations' | 'confirm_before_delete' | 'accent_color';
type PersistedBooleanPreferenceKey = Exclude<PersistedGeneralPreferenceKey, 'accent_color'>;

type GeneralPreferences = {
  newsletter: boolean;
  daily_tip: boolean;
  animations: boolean;
  confirm_before_delete: boolean;
  accent_color: AccentColor;
};

const DEFAULT_GENERAL_PREFERENCES: GeneralPreferences = {
  newsletter: true,
  daily_tip: true,
  animations: true,
  confirm_before_delete: true,
  accent_color: 'violet',
};

const PERSISTED_GENERAL_PREFERENCE_KEYS: PersistedGeneralPreferenceKey[] = ['newsletter', 'daily_tip', 'animations', 'confirm_before_delete', 'accent_color'];

const normalizeFriendName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s'-]/g, '')
    .replace(/\s+/g, ' ');

const getStringDistance = (firstValue: string, secondValue: string) => {
  const firstLength = firstValue.length;
  const secondLength = secondValue.length;
  const distances = Array.from({ length: firstLength + 1 }, () => new Array<number>(secondLength + 1).fill(0));

  for (let firstIndex = 0; firstIndex <= firstLength; firstIndex += 1) {
    distances[firstIndex][0] = firstIndex;
  }

  for (let secondIndex = 0; secondIndex <= secondLength; secondIndex += 1) {
    distances[0][secondIndex] = secondIndex;
  }

  for (let firstIndex = 1; firstIndex <= firstLength; firstIndex += 1) {
    for (let secondIndex = 1; secondIndex <= secondLength; secondIndex += 1) {
      const substitutionCost = firstValue[firstIndex - 1] === secondValue[secondIndex - 1] ? 0 : 1;
      distances[firstIndex][secondIndex] = Math.min(
        distances[firstIndex - 1][secondIndex] + 1,
        distances[firstIndex][secondIndex - 1] + 1,
        distances[firstIndex - 1][secondIndex - 1] + substitutionCost,
      );
    }
  }

  return distances[firstLength][secondLength];
};

type DeleteConfirmationRequest = {
  title: string;
  message: string;
  confirmLabel?: string;
};

type PendingDeleteConfirmation = DeleteConfirmationRequest & {
  resolve: (confirmed: boolean) => void;
};

type PublicAuthStep = 'landing' | 'features' | 'about' | 'pricing' | 'blog' | 'blog-article' | 'contact' | 'trailer' | 'login' | 'not-found';

const APP_BASE_PATH = (() => {
  const rawBasePath = (import.meta.env.BASE_URL ?? '/').trim();
  if (!rawBasePath || rawBasePath === '/') {
    return '';
  }
  return rawBasePath.replace(/\/+$/, '');
})();

const normalizePublicPath = (path: string) => {
  if (!path || path === '/') {
    return '/';
  }

  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  return withLeadingSlash.replace(/\/+$/, '');
};

const toAppPath = (publicPath: string) => {
  const normalizedPath = normalizePublicPath(publicPath);

  if (!APP_BASE_PATH) {
    return normalizedPath === '/' ? '/' : normalizedPath;
  }

  if (normalizedPath === '/') {
    return `${APP_BASE_PATH}/`;
  }

  return `${APP_BASE_PATH}${normalizedPath}`;
};

const fromAppPath = (pathname: string) => {
  const normalizedPath = normalizePublicPath(pathname);

  if (!APP_BASE_PATH) {
    return normalizedPath;
  }

  if (normalizedPath === APP_BASE_PATH) {
    return '/';
  }

  if (normalizedPath.startsWith(`${APP_BASE_PATH}/`)) {
    const routePath = normalizedPath.slice(APP_BASE_PATH.length);
    return normalizePublicPath(routePath);
  }

  return normalizedPath;
};

const getPublicRouteFromPath = (pathname: string): { step: PublicAuthStep; articleSlug: string | null } => {
  const cleanPath = fromAppPath(pathname);

  if (cleanPath === '/') {
    return { step: 'landing', articleSlug: null };
  }

  if (cleanPath === '/reset-password') {
    return { step: 'login', articleSlug: null };
  }

  if (cleanPath === '/fonctionnalites') {
    return { step: 'features', articleSlug: null };
  }

  if (cleanPath === '/a-propos') {
    return { step: 'about', articleSlug: null };
  }

  if (cleanPath === '/tarifs' || cleanPath === '/tarif') {
    return { step: 'pricing', articleSlug: null };
  }

  if (cleanPath === '/blog') {
    return { step: 'blog', articleSlug: null };
  }

  if (cleanPath === '/contact') {
    return { step: 'contact', articleSlug: null };
  }

  if (cleanPath === '/trailer') {
    return { step: 'trailer', articleSlug: null };
  }

  if (cleanPath.startsWith('/blog/')) {
    const articleSlug = cleanPath.slice('/blog/'.length);
    if (articleSlug) {
      return { step: 'blog-article', articleSlug };
    }
  }

  return { step: 'not-found', articleSlug: null };
};

const isPasswordRecoveryUrl = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return searchParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery';
};

function App() {
  const initialPublicRoute = getPublicRouteFromPath(window.location.pathname);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => isPasswordRecoveryUrl());
  const [isBootstrappingAccount, setIsBootstrappingAccount] = useState(false);
  const [authStep, setAuthStep] = useState<PublicAuthStep>(initialPublicRoute.step);
  const [activeBlogArticleSlug, setActiveBlogArticleSlug] = useState<string | null>(initialPublicRoute.articleSlug);
  const [authFormMode, setAuthFormMode] = useState<'signin' | 'signup'>('signin');
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(null);
  const [error, setError] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [relationTypes, setRelationTypes] = useState<RelationTypeDB[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showAddRelation, setShowAddRelation] = useState(false);
  const [showRelationTypeManagement, setShowRelationTypeManagement] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [selectedFriend1, setSelectedFriend1] = useState<string>('');
  const [selectedFriend2, setSelectedFriend2] = useState<string>('');
  const [selectedRelationTypes, setSelectedRelationTypes] = useState<string[]>([]);
  const [relationIntensity, setRelationIntensity] = useState<number | null>(null);
  const [relationNote, setRelationNote] = useState('');
  const [initialRelationIntensity, setInitialRelationIntensity] = useState<number | null>(null);
  const [initialRelationNote, setInitialRelationNote] = useState('');
  const [editingRelationId, setEditingRelationId] = useState<string | null>(null);
  const [hoveredFriend, setHoveredFriend] = useState<Friend | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [groups, setGroups] = useState<FriendGroup[]>([]);
  const [friendGroups, setFriendGroups] = useState<Record<string, string[]>>({});
  const [relationTypeFilters, setRelationTypeFilters] = useState<Record<string, boolean>>({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [postLoginFeatureTarget, setPostLoginFeatureTarget] = useState<FeatureActionKey | null>(null);
  const [directoryRefreshToken, setDirectoryRefreshToken] = useState(0);
  const [groupsRefreshToken, setGroupsRefreshToken] = useState(0);
  const [relationTypeModalMode, setRelationTypeModalMode] = useState<'default' | 'group-create' | 'relation-create' | 'relation-edit'>('default');
  const [relationTypeToEdit, setRelationTypeToEdit] = useState<RelationTypeDB | null>(null);
  const [generalPreferences, setGeneralPreferences] = useState<GeneralPreferences>(DEFAULT_GENERAL_PREFERENCES);
  const [pendingDeleteConfirmation, setPendingDeleteConfirmation] = useState<PendingDeleteConfirmation | null>(null);
  const lastBootstrappedUserIdRef = useRef<string | null>(null);

  const isAuthenticated = Boolean(session?.user);

  const navigatePublic = useCallback(
    (path: string, step: PublicAuthStep, articleSlug: string | null = null, replace = false) => {
      const targetPath = toAppPath(path);
      if (window.location.pathname !== targetPath) {
        if (replace) {
          window.history.replaceState({}, '', targetPath);
        } else {
          window.history.pushState({}, '', targetPath);
        }
      }

      setAuthStep(step);
      setActiveBlogArticleSlug(articleSlug);
    },
    [],
  );

  useEffect(() => {
    const syncFromLocation = () => {
      const nextRoute = getPublicRouteFromPath(window.location.pathname);
      setAuthStep(nextRoute.step);
      setActiveBlogArticleSlug(nextRoute.articleSlug);
    };

    window.addEventListener('popstate', syncFromLocation);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !postLoginFeatureTarget) {
      return;
    }

    if (postLoginFeatureTarget === 'ranking') {
      setShowRanking(true);
    } else {
      setActiveView(postLoginFeatureTarget);
      setShowRanking(false);
    }

    setPostLoginFeatureTarget(null);
  }, [isAuthenticated, postLoginFeatureTarget]);

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (sessionError) {
        console.error('Error getting auth session:', sessionError);
      }

      setSession(data.session ?? null);
      setIsAuthLoading(false);
    };

    void initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        navigatePublic('/reset-password', 'login', null, true);
      }

      setSession(nextSession);
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigatePublic]);

  useEffect(() => {
    const authenticatedUserId = session?.user?.id ?? null;

    if (!authenticatedUserId) {
      lastBootstrappedUserIdRef.current = null;
      setIsBootstrappingAccount(false);
      setAccountProfile(null);
      setFriends([]);
      setRelations([]);
      setRelationTypes([]);
      setGroups([]);
      setFriendGroups({});
      setGeneralPreferences(DEFAULT_GENERAL_PREFERENCES);
      return;
    }

    if (lastBootstrappedUserIdRef.current === authenticatedUserId) {
      return;
    }

    let cancelled = false;

    const bootstrapAccountData = async () => {
      setIsBootstrappingAccount(true);

      try {
        const { error: claimError } = await supabase.rpc('relatium_claim_legacy_data');
        if (claimError) {
          console.error('Error claiming legacy data:', claimError);
        }

        await Promise.all([fetchAllData(), fetchAccountProfile(authenticatedUserId), fetchGeneralPreferences(authenticatedUserId)]);
        lastBootstrappedUserIdRef.current = authenticatedUserId;
      } catch (bootstrapError) {
        console.error('Error bootstrapping account data:', bootstrapError);
        setError('Impossible d initialiser votre compte pour le moment.');
      } finally {
        if (!cancelled) {
          setIsBootstrappingAccount(false);
        }
      }
    };

    void bootstrapAccountData();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    setRelationTypeFilters(prev => {
      const next: Record<string, boolean> = {};
      relationTypes.forEach(type => {
        next[type.type] = prev[type.type] ?? true;
      });
      return next;
    });
  }, [relationTypes]);

  useEffect(() => {
    const preventImageDrag = (event: DragEvent) => {
      if (event.target instanceof HTMLImageElement) {
        event.preventDefault();
      }
    };

    document.addEventListener('dragstart', preventImageDrag);
    return () => {
      document.removeEventListener('dragstart', preventImageDrag);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', generalPreferences.accent_color);
  }, [generalPreferences.accent_color]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchFriendsAndRelations(),
      fetchGroups(),
      fetchRelationTypes()
    ]);
  };

  const fetchAccountProfile = async (userId: string) => {
    const { data, error: accountError } = await supabase
      .from('relatium_accounts')
      .select('id,username,avatar_url,profile_bio,onboarding_completed')
      .eq('id', userId)
      .single();

    if (accountError) {
      console.error('Error fetching account profile:', accountError);
      return;
    }

    setAccountProfile(data as AccountProfile);
  };

  const fetchGeneralPreferences = async (userId: string) => {
    const { data, error: settingsError } = await supabase
      .from('relatium_user_settings')
      .select('setting_name,setting_value')
      .eq('user_id', userId)
      .in('setting_name', PERSISTED_GENERAL_PREFERENCE_KEYS);

    if (settingsError) {
      console.error('Error fetching general preferences:', settingsError);
      return;
    }

    const nextPreferences: GeneralPreferences = { ...DEFAULT_GENERAL_PREFERENCES };
    (data ?? []).forEach(setting => {
      if (setting.setting_name === 'newsletter' && typeof setting.setting_value === 'boolean') {
        nextPreferences.newsletter = setting.setting_value;
      }
      if (setting.setting_name === 'daily_tip' && typeof setting.setting_value === 'boolean') {
        nextPreferences.daily_tip = setting.setting_value;
      }
      if (setting.setting_name === 'animations' && typeof setting.setting_value === 'boolean') {
        nextPreferences.animations = setting.setting_value;
      }
      if (setting.setting_name === 'confirm_before_delete' && typeof setting.setting_value === 'boolean') {
        nextPreferences.confirm_before_delete = setting.setting_value;
      }
      if (
        setting.setting_name === 'accent_color' &&
        typeof setting.setting_value === 'string' &&
        ['violet', 'blue', 'green', 'orange', 'pink', 'red'].includes(setting.setting_value)
      ) {
        nextPreferences.accent_color = setting.setting_value as AccentColor;
      }
    });

    setGeneralPreferences(nextPreferences);
  };

  const markOnboardingCompleted = async () => {
    const userId = session?.user?.id;
    if (!userId || accountProfile?.onboarding_completed) {
      return;
    }

    const { error: updateError } = await supabase
      .from('relatium_accounts')
      .update({ onboarding_completed: true })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating onboarding flag:', updateError);
      return;
    }
    setAccountProfile(prev => (prev ? { ...prev, onboarding_completed: true } : prev));
  };

  const updateAccountProfile = async (profileUpdate: Pick<AccountProfile, 'username' | 'avatar_url' | 'profile_bio'>) => {
    const userId = session?.user?.id;
    const trimmedUsername = profileUpdate.username.trim();

    if (!userId) {
      throw new Error('Session introuvable.');
    }

    if (trimmedUsername.length < 3) {
      throw new Error('Le pseudo doit contenir au moins 3 caractères.');
    }

    const nextProfile = {
      username: trimmedUsername,
      avatar_url: profileUpdate.avatar_url,
      profile_bio: (profileUpdate.profile_bio ?? '').slice(0, 160),
      updated_at: new Date().toISOString(),
    };

    const { data, error: updateError } = await supabase
      .from('relatium_accounts')
      .update(nextProfile)
      .eq('id', userId)
      .select('id,username,avatar_url,profile_bio,onboarding_completed')
      .single();

    if (updateError) {
      console.error('Error updating account profile:', updateError);
      throw new Error('Impossible d’enregistrer le profil pour le moment.');
    }

    setAccountProfile(data as AccountProfile);
  };

  const updateAccountPassword = async ({
    currentPassword,
    newPassword,
  }: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const email = session?.user?.email;

    if (!email) {
      throw new Error('Adresse email introuvable pour ce compte.');
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      console.error('Error verifying current password:', signInError);
      throw new Error('Mot de passe actuel incorrect.');
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      throw new Error('Impossible de mettre à jour le mot de passe pour le moment.');
    }
  };

  const updateGeneralPreference = async (preference: PersistedBooleanPreferenceKey, enabled: boolean) => {
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error('Session introuvable.');
    }

    setGeneralPreferences(prev => ({ ...prev, [preference]: enabled }));

    const { error: upsertError } = await supabase.from('relatium_user_settings').upsert(
      {
        user_id: userId,
        setting_name: preference,
        setting_value: enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,setting_name' },
    );

    if (upsertError) {
      console.error('Error updating general preference:', upsertError);
      setGeneralPreferences(prev => ({ ...prev, [preference]: !enabled }));
      throw new Error('Impossible de mettre à jour la préférence pour le moment.');
    }
  };

  const updateAccentColorPreference = async (accentColor: AccentColor) => {
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error('Session introuvable.');
    }

    const previousAccentColor = generalPreferences.accent_color;
    setGeneralPreferences(prev => ({ ...prev, accent_color: accentColor }));

    const { error: upsertError } = await supabase.from('relatium_user_settings').upsert(
      {
        user_id: userId,
        setting_name: 'accent_color',
        setting_value: accentColor,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,setting_name' },
    );

    if (upsertError) {
      console.error('Error updating accent color preference:', upsertError);
      setGeneralPreferences(prev => ({ ...prev, accent_color: previousAccentColor }));
      throw new Error("Impossible de mettre à jour la couleur d'accent pour le moment.");
    }
  };

  const requestDeleteConfirmation = useCallback(
    (request: DeleteConfirmationRequest): Promise<boolean> => {
      if (!generalPreferences.confirm_before_delete) {
        return Promise.resolve(true);
      }

      return new Promise(resolve => {
        setPendingDeleteConfirmation({ ...request, resolve });
      });
    },
    [generalPreferences.confirm_before_delete],
  );

  const closeDeleteConfirmation = () => {
    pendingDeleteConfirmation?.resolve(false);
    setPendingDeleteConfirmation(null);
  };

  const confirmPendingDelete = async (disableFutureConfirmations: boolean) => {
    const currentRequest = pendingDeleteConfirmation;
    if (!currentRequest) {
      return;
    }

    currentRequest.resolve(true);
    setPendingDeleteConfirmation(null);

    if (disableFutureConfirmations && generalPreferences.confirm_before_delete) {
      try {
        await updateGeneralPreference('confirm_before_delete', false);
      } catch {
        // The deletion can continue even if saving the preference fails.
      }
    }
  };

  const fetchRelationTypes = async () => {
    const { data, error } = await supabase
      .from('relatium_relations_definition')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching relation types:', error);
      return;
    }

    if (data) {
      setRelationTypes(data);
    }
  };

  const fetchFriendsAndRelations = async () => {
    const { data: friendsData } = await supabase.from('relatium_friends_list').select('*');
    const { data: relationsData } = await supabase.from('relatium_relations_link').select('*');
    
    if (friendsData) {
      setFriends(friendsData);
    }
    
    if (relationsData) {
      const enrichedRelations = relationsData.map(relation => ({
        ...relation,
        source: friendsData?.find(f => f.id === relation.friend1_id),
        target: friendsData?.find(f => f.id === relation.friend2_id),
      }));
      setRelations(enrichedRelations);
    }
  };

  const fetchGroups = async () => {
    const { data: groupsData } = await supabase.from('relatium_groups_list').select('*');
    const { data: membersData } = await supabase.from('relatium_groups_link').select('*');
    
    if (groupsData) {
      setGroups(groupsData);
    }
    
    if (membersData) {
      const groupMap: Record<string, string[]> = {};
      membersData.forEach(member => {
        if (!groupMap[member.friend_id]) {
          groupMap[member.friend_id] = [];
        }
        groupMap[member.friend_id].push(member.group_id);
      });
      setFriendGroups(groupMap);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) {
      setError('Le nom est requis');
      return;
    }

    const shouldGuideFirstRelation = Boolean(
      accountProfile &&
      !accountProfile.onboarding_completed &&
      friends.length === 1 &&
      relations.length === 0,
    );
    const selfFriendId = shouldGuideFirstRelation ? friends[0]?.id : undefined;

    try {
      const { data: newFriend, error: insertError } = await supabase
        .from('relatium_friends_list')
        .insert([{ name: newFriendName.trim() }])
        .select()
        .single();

      if (insertError) throw insertError;

      if (newFriend) {
        setFriends([...friends, newFriend]);
        setNewFriendName('');
        setShowAddFriend(false);
        setError('');
        setDirectoryRefreshToken(prev => prev + 1);

        if (selfFriendId && newFriend.id && selfFriendId !== newFriend.id) {
          const defaultRelationType = relationTypes.find(type => type.type === 'friend')?.type ?? relationTypes[0]?.type;
          setEditingRelationId(null);
          setSelectedFriend1(selfFriendId);
          setSelectedFriend2(newFriend.id);
          setSelectedRelationTypes(defaultRelationType ? [defaultRelationType] : []);
          setRelationIntensity(null);
          setRelationNote('');
          setInitialRelationIntensity(null);
          setInitialRelationNote('');
          setShowAddRelation(true);
        }
      }
    } catch (err) {
      setError('Erreur lors de l\'ajout de l\'ami');
      console.error('Error adding friend:', err);
    }
  };

  const handleDeleteFriend = async (friendId: string) => {
    const friendToDelete = friends.find(friend => friend.id === friendId);
    const confirmed = await requestDeleteConfirmation({
      title: 'Supprimer cette personne ?',
      message: `Cette action supprimera ${friendToDelete?.name ? `"${friendToDelete.name}"` : 'cette personne'} et toutes ses relations. Cette action est irréversible.`,
    });

    if (!confirmed) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('relatium_friends_list')
        .delete()
        .eq('id', friendId);

      if (deleteError) throw deleteError;

      if (activeView === 'directory') {
        setFriends(prev => prev.filter(friend => friend.id !== friendId));
        setRelations(prev =>
          prev.filter(relation => relation.friend1_id !== friendId && relation.friend2_id !== friendId),
        );
      } else {
        await fetchAllData(); // Refresh all data to ensure consistency
      }

      setDirectoryRefreshToken(prev => prev + 1);
      setSelectedFriend(null);
      setError('');
    } catch (err) {
      setError('Erreur lors de la suppression de l\'ami');
      console.error('Error deleting friend:', err);
    }
  };

  const handleDeleteRelation = async (relationId: string) => {
    const relationToDelete = relations.find(relation => relation.id === relationId);
    const friend1Name = friends.find(friend => friend.id === relationToDelete?.friend1_id)?.name;
    const friend2Name = friends.find(friend => friend.id === relationToDelete?.friend2_id)?.name;
    const confirmed = await requestDeleteConfirmation({
      title: 'Supprimer cette relation ?',
      message: `Cette action supprimera le lien${friend1Name && friend2Name ? ` entre ${friend1Name} et ${friend2Name}` : ''}. Cette action est irréversible.`,
    });

    if (!confirmed) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('relatium_relations_link')
        .delete()
        .eq('id', relationId);

      if (deleteError) throw deleteError;

      await fetchAllData(); // Refresh all data to ensure consistency
    } catch (err) {
      setError('Erreur lors de la suppression de la relation');
      console.error('Error deleting relation:', err);
    }
  };

  const handleUpdateFriendName = async (friendId: string, newName: string): Promise<boolean> => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      setError('Le nom est requis');
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('relatium_friends_list')
        .update({ name: trimmedName })
        .eq('id', friendId);

      if (updateError) throw updateError;

      setSelectedFriend(prev => (prev && prev.id === friendId ? { ...prev, name: trimmedName } : prev));
      await fetchAllData();
      setError('');
      setDirectoryRefreshToken(prev => prev + 1);
      return true;
    } catch (err) {
      setError('Erreur lors de la mise à jour du nom');
      console.error('Error updating friend name:', err);
      return false;
    }
  };

  const openRelationCreationModal = (firstFriendId = '') => {
    setEditingRelationId(null);
    setSelectedFriend1(firstFriendId);
    setSelectedFriend2('');
    setSelectedRelationTypes([]);
    setRelationIntensity(null);
    setRelationNote('');
    setInitialRelationIntensity(null);
    setInitialRelationNote('');
    setShowAddRelation(true);
  };

  const openRelationEditionModal = (relation: Relation) => {
    const normalizedIntensity = typeof relation.intensity === 'number'
      ? Math.max(0, Math.min(100, Math.round(relation.intensity)))
      : null;
    const normalizedNote = relation.note ?? '';

    setSelectedFriend1(relation.friend1_id);
    setSelectedFriend2(relation.friend2_id);
    setSelectedRelationTypes([relation.type]);
    setRelationIntensity(normalizedIntensity);
    setRelationNote(normalizedNote);
    setInitialRelationIntensity(normalizedIntensity);
    setInitialRelationNote(normalizedNote);
    setEditingRelationId(relation.id);
    setShowAddRelation(true);
  };

  const handleAddRelation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriend1 || !selectedFriend2 || selectedFriend1 === selectedFriend2) return;

    const normalizedRelationIntensity = relationIntensity === null
      ? null
      : Math.max(0, Math.min(100, Math.round(relationIntensity)));
    const trimmedRelationNote = relationNote.trim();
    const normalizedRelationNote = trimmedRelationNote.length > 0 ? trimmedRelationNote : null;
    const normalizedInitialRelationNote = initialRelationNote.trim() || null;

    const isEditingCurrentRelation = Boolean(editingRelationId);
    const shouldApplyRelationOptions = isEditingCurrentRelation || selectedRelationTypes.length <= 1;
    const relationPayload = {
      intensity: shouldApplyRelationOptions ? normalizedRelationIntensity : null,
      note: shouldApplyRelationOptions ? normalizedRelationNote : null,
    };

    if (!isEditingCurrentRelation && selectedRelationTypes.length === 0) return;

    if (isEditingCurrentRelation) {
      const relationToEdit = relations.find(relation => relation.id === editingRelationId);

      if (!relationToEdit) {
        setError('Relation introuvable pour la modification.');
        return;
      }

      if (selectedRelationTypes.length === 0) {
        setError('Selectionnez un type de relation.');
        return;
      }

      const nextRelationType = selectedRelationTypes[0];
      const relationTypeChanged = nextRelationType !== relationToEdit.type;
      const relationIntensityChanged = normalizedRelationIntensity !== initialRelationIntensity;
      const relationNoteChanged = normalizedRelationNote !== normalizedInitialRelationNote;
      const relationOptionsChanged = relationTypeChanged || relationIntensityChanged || relationNoteChanged;

      const relationUpdatePayload: { type?: string; intensity?: number | null; note?: string | null } = {};
      if (relationTypeChanged) {
        relationUpdatePayload.type = nextRelationType;
      }
      if (relationIntensityChanged) {
        relationUpdatePayload.intensity = normalizedRelationIntensity;
      }
      if (relationNoteChanged) {
        relationUpdatePayload.note = normalizedRelationNote;
      }

      if (!relationOptionsChanged) {
        closeAddRelationModal();
        setError('');
        return;
      }

      try {
        const { error: updateError } = await supabase
          .from('relatium_relations_link')
          .update(relationUpdatePayload)
          .eq('id', relationToEdit.id);

        if (updateError) throw updateError;

        await fetchAllData();
        await markOnboardingCompleted();
        closeAddRelationModal();
        setError('');
      } catch (err) {
        setError('Erreur lors de la modification de la relation');
        console.error('Error editing relation:', err);
      }

      return;
    }

    const relationTypesToInsert = selectedRelationTypes.filter(type => {
      return !relations.some(relation =>
        ((relation.friend1_id === selectedFriend1 && relation.friend2_id === selectedFriend2) ||
          (relation.friend1_id === selectedFriend2 && relation.friend2_id === selectedFriend1)) &&
        relation.type === type,
      );
    });

    if (relationTypesToInsert.length === 0) {
      setError('Toutes les relations sélectionnées existent déjà entre ces deux personnes.');
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('relatium_relations_link')
        .insert(
          relationTypesToInsert.map(type => ({
            friend1_id: selectedFriend1,
            friend2_id: selectedFriend2,
            type,
            ...relationPayload,
          })),
        );

      if (insertError) throw insertError;

      await fetchAllData(); // Refresh all data to ensure consistency
      await markOnboardingCompleted();
      closeAddRelationModal();
      setError('');
    } catch (err) {
      setError('Erreur lors de l\'ajout de la relation');
      console.error('Error adding relation:', err);
    }
  };

  const handleCreateDirectRelation = async (
    friend1Id: string,
    friend2Id: string,
    relationType: string,
  ): Promise<boolean> => {
    if (!friend1Id || !friend2Id || !relationType || friend1Id === friend2Id) {
      return false;
    }

    const relationAlreadyExists = relations.some(relation =>
      ((relation.friend1_id === friend1Id && relation.friend2_id === friend2Id)
        || (relation.friend1_id === friend2Id && relation.friend2_id === friend1Id))
      && relation.type === relationType,
    );

    if (relationAlreadyExists) {
      return false;
    }

    try {
      const { error: insertError } = await supabase
        .from('relatium_relations_link')
        .insert([
          {
            friend1_id: friend1Id,
            friend2_id: friend2Id,
            type: relationType,
          },
        ]);

      if (insertError) throw insertError;

      await fetchAllData();
      await markOnboardingCompleted();
      setError('');
      return true;
    } catch (err) {
      setError('Erreur lors de l\'ajout de la relation');
      console.error('Error creating direct relation from analysis:', err);
      return false;
    }
  };

  const handleDeleteDirectRelationType = async (
    friend1Id: string,
    friend2Id: string,
    relationType: string,
  ): Promise<boolean> => {
    if (!friend1Id || !friend2Id || !relationType || friend1Id === friend2Id) {
      return false;
    }

    const friend1Name = friends.find(friend => friend.id === friend1Id)?.name;
    const friend2Name = friends.find(friend => friend.id === friend2Id)?.name;
    const relationTypeLabel = relationTypes.find(type => type.type === relationType)?.label ?? relationType;
    const confirmed = await requestDeleteConfirmation({
      title: 'Supprimer ce lien direct ?',
      message: `Cette action supprimera la relation "${relationTypeLabel}"${friend1Name && friend2Name ? ` entre ${friend1Name} et ${friend2Name}` : ''}.`,
    });

    if (!confirmed) {
      return false;
    }

    const condition = `and(friend1_id.eq.${friend1Id},friend2_id.eq.${friend2Id}),and(friend1_id.eq.${friend2Id},friend2_id.eq.${friend1Id})`;

    try {
      const { error: deleteError } = await supabase
        .from('relatium_relations_link')
        .delete()
        .eq('type', relationType)
        .or(condition);

      if (deleteError) throw deleteError;

      await fetchAllData();
      setError('');
      return true;
    } catch (err) {
      setError('Erreur lors de la suppression de la relation');
      console.error('Error deleting direct relation type from analysis:', err);
      return false;
    }
  };

  const closeAddRelationModal = () => {
    setShowAddRelation(false);
    setSelectedFriend1('');
    setSelectedFriend2('');
    setSelectedRelationTypes([]);
    setRelationIntensity(null);
    setRelationNote('');
    setInitialRelationIntensity(null);
    setInitialRelationNote('');
    setEditingRelationId(null);
  };

  const toggleRelationTypeFilter = (type: string) => {
    setRelationTypeFilters(prev => ({
      ...prev,
      [type]: !(prev[type] ?? true)
    }));
  };

  const resetRelationTypeFilters = () => {
    setRelationTypeFilters(prev => {
      const next = { ...prev };
      relationTypes.forEach(type => {
        next[type.type] = true;
      });
      return next;
    });
  };

  const setRelationTypeVisibility = (type: string, visible: boolean) => {
    setRelationTypeFilters(prev => ({
      ...prev,
      [type]: visible,
    }));
  };

  const openRelationTypeManagement = () => {
    setRelationTypeModalMode('default');
    setRelationTypeToEdit(null);
    setShowRelationTypeManagement(true);
  };

  const openGroupCreatorFromGroupsView = () => {
    setRelationTypeModalMode('group-create');
    setRelationTypeToEdit(null);
    setShowRelationTypeManagement(true);
  };

  const openRelationTypeCreatorFromRelationTypesView = () => {
    setRelationTypeModalMode('relation-create');
    setRelationTypeToEdit(null);
    setShowRelationTypeManagement(true);
  };

  const openRelationTypeEditorFromRelationTypesView = (relationType: RelationTypeDB) => {
    setRelationTypeModalMode('relation-edit');
    setRelationTypeToEdit(relationType);
    setShowRelationTypeManagement(true);
  };

  const handleDeleteRelationType = async (relationType: RelationTypeDB): Promise<boolean> => {
    const confirmed = await requestDeleteConfirmation({
      title: 'Supprimer ce type de relation ?',
      message: `Cette action supprimera le type "${relationType.label}" et toutes les relations qui l’utilisent. Cette action est irréversible.`,
    });

    if (!confirmed) {
      return false;
    }

    try {
      const { error: deleteRelationsError } = await supabase.from('relatium_relations_link').delete().eq('type', relationType.type);
      if (deleteRelationsError) throw deleteRelationsError;

      const { error: deleteTypeError } = await supabase.from('relatium_relations_definition').delete().eq('id', relationType.id);
      if (deleteTypeError) throw deleteTypeError;

      await refreshAfterStructureUpdate();
      return true;
    } catch (err) {
      setError('Erreur lors de la suppression du type de relation');
      console.error('Error deleting relation type:', err);
      return false;
    }
  };

  const refreshAfterStructureUpdate = async () => {
    await fetchAllData();
    setDirectoryRefreshToken(prev => prev + 1);
    setGroupsRefreshToken(prev => prev + 1);
  };

  const relationModalSteps = [
    { id: 1, label: 'Choisir les personnes' },
    { id: 2, label: 'Type de relation' },
    { id: 3, label: 'Options' },
  ];

  const hasSelectedPeople = Boolean(selectedFriend1 && selectedFriend2);
  const hasSelectedRelationType = selectedRelationTypes.length > 0;
  const isEditingRelationModal = Boolean(editingRelationId);
  const isBulkRelationCreation = !isEditingRelationModal && selectedRelationTypes.length > 1;
  const relationIntensityPercent = relationIntensity === null ? 0 : relationIntensity;
  const relationIntensityColor = relationIntensity === null
    ? '#94A3B8'
    : `hsl(${Math.round((relationIntensityPercent / 100) * 120)}, 85%, 45%)`;
  const relationModalCurrentStep = hasSelectedRelationType ? 3 : hasSelectedPeople ? 2 : 1;
  const canSubmitRelation = hasSelectedPeople && hasSelectedRelationType;
  const relationSubmitLabel = isEditingRelationModal
    ? 'Enregistrer les modifications'
    : selectedRelationTypes.length > 1
      ? 'Ajouter les relations'
      : 'Ajouter la relation';
  const similarFriendMatches = (() => {
    const normalizedInput = normalizeFriendName(newFriendName);
    if (normalizedInput.length < 3) {
      return [];
    }

    return friends
      .map(friend => {
        const normalizedExistingName = normalizeFriendName(friend.name);
        const isExactMatch = normalizedExistingName === normalizedInput;
        const containsInput =
          normalizedExistingName.includes(normalizedInput) || normalizedInput.includes(normalizedExistingName);
        const distance = getStringDistance(normalizedInput, normalizedExistingName);
        const maxAllowedDistance = normalizedInput.length <= 5 ? 1 : 2;

        return {
          friend,
          score: isExactMatch ? 0 : containsInput ? 1 : distance <= maxAllowedDistance ? 2 + distance : 99,
        };
      })
      .filter(match => match.score < 99)
      .sort((firstMatch, secondMatch) => firstMatch.score - secondMatch.score)
      .slice(0, 3)
      .map(match => match.friend);
  })();
  const addFriendHelperText =
    similarFriendMatches.length > 0
      ? `Ce nom ressemble à ${similarFriendMatches.map(friend => friend.name).join(', ')} : déjà existant dans votre réseau.`
      : 'Ajoute un nouvel ami à ton réseau.';
  const shouldShowFirstConnectionGuide = Boolean(
    accountProfile &&
    !accountProfile.onboarding_completed &&
    friends.length === 1 &&
    relations.length === 0,
  );

  useEffect(() => {
    if (!accountProfile || accountProfile.onboarding_completed) {
      return;
    }

    if (relations.length > 0) {
      void markOnboardingCompleted();
    }
  }, [accountProfile, relations.length]);

  const openSignIn = () => {
    setPostLoginFeatureTarget(null);
    setAuthFormMode('signin');
    setAuthStep('login');
  };

  const openSignUp = () => {
    setPostLoginFeatureTarget(null);
    setAuthFormMode('signup');
    setAuthStep('login');
  };

  const requestFeatureAccess = (target: FeatureActionKey) => {
    setPostLoginFeatureTarget(target);
    setAuthFormMode('signin');
    setAuthStep('login');
  };

  const handleSignOut = async () => {
    setError('');
    setAuthFormMode('signin');
    navigatePublic('/', 'landing', null, true);
    setShowAddFriend(false);
    setShowAddRelation(false);
    setShowRelationTypeManagement(false);
    setShowRanking(false);
    setSelectedFriend(null);
    setSearchTerm('');
    setActiveView('dashboard');
    setPostLoginFeatureTarget(null);

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError('Impossible de vous déconnecter pour le moment.');
      console.error('Error signing out:', signOutError);
    }
  };

  const handlePasswordRecoveryBack = async () => {
    setIsPasswordRecovery(false);
    setAuthFormMode('signin');
    navigatePublic('/', 'landing', null, true);

    if (session?.user) {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('Error signing out from password recovery:', signOutError);
      }
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Vérification de la session...
        </div>
      </div>
    );
  }

  if (isPasswordRecovery) {
    return (
      <LoginForm
        initialMode="reset"
        passwordResetRedirectTo={`${window.location.origin}${toAppPath('/reset-password')}`}
        onPasswordUpdated={() => {
          setIsPasswordRecovery(false);
          setAuthFormMode('signin');
          setError('');
          navigatePublic('/', 'landing', null, true);
        }}
        onBack={handlePasswordRecoveryBack}
      />
    );
  }

  if (!isAuthenticated) {
    if (authStep === 'landing') {
      return (
        <LandingPage
          onLoginClick={openSignIn}
          onSignupClick={openSignUp}
          onFeaturesClick={() => navigatePublic('/fonctionnalites', 'features')}
          onAboutClick={() => navigatePublic('/a-propos', 'about')}
          onPricingClick={() => navigatePublic('/tarifs', 'pricing')}
          onBlogClick={() => navigatePublic('/blog', 'blog')}
          onContactClick={() => navigatePublic('/contact', 'contact')}
          onTrailerClick={() => navigatePublic('/trailer', 'trailer')}
          isAuthenticated={isAuthenticated}
          onLogoutClick={handleSignOut}
        />
      );
    }

    if (authStep === 'features') {
      return (
        <FeaturesPage
          onLoginClick={openSignIn}
          onSignupClick={openSignUp}
          onHomeClick={() => navigatePublic('/', 'landing')}
          onAboutClick={() => navigatePublic('/a-propos', 'about')}
          onPricingClick={() => navigatePublic('/tarifs', 'pricing')}
          onBlogClick={() => navigatePublic('/blog', 'blog')}
          onContactClick={() => navigatePublic('/contact', 'contact')}
          onFeatureClick={requestFeatureAccess}
        />
      );
    }

    if (authStep === 'about') {
      return (
        <AboutPage
          onLoginClick={openSignIn}
          onSignupClick={openSignUp}
          onHomeClick={() => navigatePublic('/', 'landing')}
          onFeaturesClick={() => navigatePublic('/fonctionnalites', 'features')}
          onPricingClick={() => navigatePublic('/tarifs', 'pricing')}
          onBlogClick={() => navigatePublic('/blog', 'blog')}
          onContactClick={() => navigatePublic('/contact', 'contact')}
        />
      );
    }

    if (authStep === 'pricing') {
      return (
        <PricingPage
          onLoginClick={openSignIn}
          onSignupClick={openSignUp}
          onHomeClick={() => navigatePublic('/', 'landing')}
          onFeaturesClick={() => navigatePublic('/fonctionnalites', 'features')}
          onAboutClick={() => navigatePublic('/a-propos', 'about')}
          onBlogClick={() => navigatePublic('/blog', 'blog')}
          onContactClick={() => navigatePublic('/contact', 'contact')}
        />
      );
    }

    if (authStep === 'blog') {
      return (
        <BlogPage
          onLoginClick={openSignIn}
          onSignupClick={openSignUp}
          onHomeClick={() => navigatePublic('/', 'landing')}
          onFeaturesClick={() => navigatePublic('/fonctionnalites', 'features')}
          onAboutClick={() => navigatePublic('/a-propos', 'about')}
          onPricingClick={() => navigatePublic('/tarifs', 'pricing')}
          onContactClick={() => navigatePublic('/contact', 'contact')}
          onOpenArticle={(articleSlug) => {
            navigatePublic(`/blog/${articleSlug}`, 'blog-article', articleSlug);
          }}
        />
      );
    }

    if (authStep === 'trailer') {
      return <TrailerPage onHomeClick={() => navigatePublic('/', 'landing')} />;
    }

    if (authStep === 'contact') {
      return (
        <ContactPage
          onLoginClick={openSignIn}
          onSignupClick={openSignUp}
          onHomeClick={() => navigatePublic('/', 'landing')}
          onFeaturesClick={() => navigatePublic('/fonctionnalites', 'features')}
          onAboutClick={() => navigatePublic('/a-propos', 'about')}
          onPricingClick={() => navigatePublic('/tarifs', 'pricing')}
          onBlogClick={() => navigatePublic('/blog', 'blog')}
        />
      );
    }

    if (authStep === 'blog-article' && activeBlogArticleSlug) {
      const activeArticle = getBlogArticleBySlug(activeBlogArticleSlug);
      if (!activeArticle) {
        return (
          <NotFoundPage
            onHomeClick={() => navigatePublic('/', 'landing')}
            onFeaturesClick={() => navigatePublic('/fonctionnalites', 'features')}
            onAboutClick={() => navigatePublic('/a-propos', 'about')}
            onPricingClick={() => navigatePublic('/tarifs', 'pricing')}
            onBlogClick={() => navigatePublic('/blog', 'blog')}
            onContactClick={() => navigatePublic('/contact', 'contact')}
            onLoginClick={openSignIn}
            onSignupClick={openSignUp}
          />
        );
      }

      return (
        <ArticleReaderPage
          article={activeArticle}
          onLoginClick={openSignIn}
          onSignupClick={openSignUp}
          onHomeClick={() => navigatePublic('/', 'landing')}
          onFeaturesClick={() => navigatePublic('/fonctionnalites', 'features')}
          onAboutClick={() => navigatePublic('/a-propos', 'about')}
          onPricingClick={() => navigatePublic('/tarifs', 'pricing')}
          onContactClick={() => navigatePublic('/contact', 'contact')}
          onBackToBlog={() => navigatePublic('/blog', 'blog')}
          onOpenArticle={(articleSlug) => navigatePublic(`/blog/${articleSlug}`, 'blog-article', articleSlug)}
        />
      );
    }

    if (authStep === 'blog-article') {
      return (
        <NotFoundPage
          onHomeClick={() => navigatePublic('/', 'landing')}
          onFeaturesClick={() => navigatePublic('/fonctionnalites', 'features')}
          onAboutClick={() => navigatePublic('/a-propos', 'about')}
          onPricingClick={() => navigatePublic('/tarifs', 'pricing')}
          onBlogClick={() => navigatePublic('/blog', 'blog')}
          onContactClick={() => navigatePublic('/contact', 'contact')}
          onLoginClick={openSignIn}
          onSignupClick={openSignUp}
        />
      );
    }

    if (authStep === 'not-found') {
      return (
        <NotFoundPage
          onHomeClick={() => navigatePublic('/', 'landing')}
          onFeaturesClick={() => navigatePublic('/fonctionnalites', 'features')}
          onAboutClick={() => navigatePublic('/a-propos', 'about')}
          onPricingClick={() => navigatePublic('/tarifs', 'pricing')}
          onBlogClick={() => navigatePublic('/blog', 'blog')}
          onContactClick={() => navigatePublic('/contact', 'contact')}
          onLoginClick={openSignIn}
          onSignupClick={openSignUp}
        />
      );
    }

    return (
      <LoginForm
        initialMode={authFormMode}
        passwordResetRedirectTo={`${window.location.origin}${toAppPath('/reset-password')}`}
        onModeChange={setAuthFormMode}
        onAuthenticated={() => {
          setError('');
        }}
        onBack={() => {
          setPostLoginFeatureTarget(null);
          navigatePublic('/', 'landing');
        }}
      />
    );
  }

  if (isBootstrappingAccount) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Initialisation de votre base Relatium...
        </div>
      </div>
    );
  }

  const viewTransitionClass = generalPreferences.animations ? 'relatium-view-transition' : '';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation
        onShowRanking={() => setShowRanking(true)}
        onShowAddFriend={() => setShowAddFriend(true)}
        onShowRelationTypeManagement={openRelationTypeManagement}
        onSignOut={handleSignOut}
        onShowRelationTypeCreator={openRelationTypeCreatorFromRelationTypesView}
        onShowGroupCreator={openGroupCreatorFromGroupsView}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
        activeView={activeView}
        onSelectView={setActiveView}
        showDailyTip={generalPreferences.daily_tip}
        currentUsername={
          accountProfile?.username ??
          (typeof session?.user?.user_metadata?.username === 'string'
            ? session.user.user_metadata.username
            : null)
        }
        currentAvatarUrl={accountProfile?.avatar_url ?? null}
      />

      <main
        className={`px-4 pt-24 sm:px-6 lg:px-8 ${
          isSidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[244px]'
        } ${
          activeView === 'settings' ? 'pb-4' : 'pb-24'
        } ${
          activeView === 'relation-map' ? 'h-[calc(100vh-5rem)] pb-4' : ''
        } ${generalPreferences.animations ? 'transition-all duration-300' : ''}`}
      >
        <div
          key={generalPreferences.animations ? activeView : 'no-animation'}
          className={`${activeView === 'relation-map' ? 'h-full w-full' : 'mx-auto w-full max-w-[1360px]'} ${viewTransitionClass}`}
        >
          {shouldShowFirstConnectionGuide && activeView === 'dashboard' && (
            <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-4 text-sm text-violet-900 sm:px-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <img
                  src={welcomeLogo}
                  alt="Logo bienvenue"
                  draggable={false}
                  className="h-20 w-20 shrink-0 object-contain"
                />
                <div>
                  <p className="font-semibold">Bienvenue dans Relatium</p>
                  <p className="mt-1 text-violet-800">
                    Commence par ajouter une personne à ton réseau. Ensuite, on te proposera directement de créer une relation avec ton profil.
                  </p>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddFriend(true);
                        setNewFriendName('');
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 font-semibold text-white transition hover:bg-violet-700"
                    >
                      Ajouter ma première personne
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {activeView === 'directory' ? (
            <DirectoryView
              searchTerm={searchTerm}
              relationTypes={relationTypes}
              onOpenFriendProfile={setSelectedFriend}
              onDeleteFriend={handleDeleteFriend}
              refreshToken={directoryRefreshToken}
            />
          ) : activeView === 'groups' ? (
            <GroupsView
              searchTerm={searchTerm}
              totalFriends={friends.length}
              relationTypes={relationTypes}
              onGroupsChanged={refreshAfterStructureUpdate}
              onOpenGroupCreator={openGroupCreatorFromGroupsView}
              onOpenFriendProfile={setSelectedFriend}
              onConfirmDelete={requestDeleteConfirmation}
              refreshToken={groupsRefreshToken}
            />
          ) : activeView === 'relation-types' ? (
            <RelationTypesView
              searchTerm={searchTerm}
              relationTypes={relationTypes}
              relations={relations}
              friends={friends}
              onOpenRelationTypeCreator={openRelationTypeCreatorFromRelationTypesView}
              onOpenRelationTypeEditor={openRelationTypeEditorFromRelationTypesView}
              onDeleteRelationType={handleDeleteRelationType}
            />
          ) : activeView === 'statistics' ? (
            <Statistics
              relations={relations}
              friends={friends}
              groups={groups}
              friendGroups={friendGroups}
              relationTypes={relationTypes}
              onOpenGroupsView={() => setActiveView('groups')}
            />
          ) : activeView === 'analysis' ? (
            <AnalysisView
              friends={friends}
              relations={relations}
              relationTypes={relationTypes}
              onOpenFriendProfile={setSelectedFriend}
              onCreateDirectRelation={handleCreateDirectRelation}
              onDeleteDirectRelationType={handleDeleteDirectRelationType}
            />
          ) : activeView === 'settings' ? (
            <SettingsView
              profile={{
                username:
                  accountProfile?.username ??
                  (typeof session?.user?.user_metadata?.username === 'string'
                    ? session.user.user_metadata.username
                    : 'Utilisateur'),
                profile_bio: accountProfile?.profile_bio ?? '',
                avatar_url: accountProfile?.avatar_url ?? null,
              }}
              onSaveProfile={updateAccountProfile}
              onUpdatePassword={updateAccountPassword}
              generalPreferences={generalPreferences}
              onUpdateGeneralPreference={updateGeneralPreference}
              onUpdateAccentColorPreference={updateAccentColorPreference}
            />
	          ) : (
            <>
              {activeView === 'dashboard' && (
                <StatsAndLegend
                  relations={relations}
                  hoveredFriend={hoveredFriend}
                  friends={friends}
                  groups={groups}
                  friendGroups={friendGroups}
                  relationTypes={relationTypes}
                  onOpenFriendProfile={friend => setSelectedFriend(friend)}
                />
              )}

              <FriendGraph
                friends={friends}
                relations={relations}
                groups={groups}
                friendGroups={friendGroups}
                hoveredFriend={selectedFriend || hoveredFriend}
                searchTerm={searchTerm}
                relationTypes={relationTypes} // <-- PASSAGE DES TYPES DB
                relationTypeFilters={relationTypeFilters}
                onToggleRelationType={toggleRelationTypeFilter}
                onResetRelationTypeFilters={resetRelationTypeFilters}
                onSetRelationTypeVisibility={setRelationTypeVisibility}
                onFriendClick={friend => setSelectedFriend(selectedFriend && selectedFriend.id === friend.id ? null : friend)}
                onFriendHover={setHoveredFriend}
                isImmersiveView={activeView === 'relation-map'}
                animationsEnabled={generalPreferences.animations}
              />
            </>
          )}
        </div>

        {selectedFriend && (
          <FriendProfile
            friend={selectedFriend}
            friends={friends}
            relations={relations}
            groups={groups}
            friendGroups={friendGroups}
            onClose={() => setSelectedFriend(null)}
            onDelete={handleDeleteFriend}
            onDeleteRelation={handleDeleteRelation}
            onAddRelation={() => {
              openRelationCreationModal(selectedFriend.id);
            }}
            onEditRelation={(relation) => {
              openRelationEditionModal(relation);
            }}
            onUpdateName={handleUpdateFriendName}
            onRefreshData={fetchAllData}
            onConfirmDelete={requestDeleteConfirmation}
            relationTypes={relationTypes}
            onOpenFriendProfile={setSelectedFriend}
          />
        )}

        {showAddFriend && (
          <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[4px]">
            <div
              className="relative w-full max-w-[620px] overflow-hidden rounded-[24px] border border-violet-100 px-6 pb-6 pt-5 shadow-[0_32px_80px_rgba(15,23,42,0.30)] sm:px-7 sm:pb-7 sm:pt-6"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0)), url(${addUserModalBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center -18px',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <button
                type="button"
                onClick={() => setShowAddFriend(false)}
                className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-violet-50 text-violet-900 transition hover:bg-violet-100"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mx-auto mb-4 flex max-w-[440px] flex-col items-center text-center">
                <div aria-hidden="true" className="mb-4 mt-1 h-[98px] w-[74px]" />
                <h2 className="text-[32px] font-semibold leading-none text-indigo-950">Ajouter une personne</h2>
                <p
                  className={`mt-3 text-[15px] ${
                    similarFriendMatches.length > 0 ? 'font-semibold text-amber-600' : 'text-slate-500'
                  }`}
                >
                  {addFriendHelperText}
                </p>
              </div>

              <form onSubmit={handleAddFriend} className="mx-auto mt-5 max-w-[560px] space-y-5">
                <fieldset className="rounded-2xl border border-violet-300/75 px-4 pb-3 pt-1.5">
                  <legend className="px-2 text-[14px] font-semibold text-violet-500">Nom de l&apos;ami *</legend>
                  <div className="flex items-center gap-3 px-1 pb-1 pt-0.5">
                    <UserRound className="h-5 w-5 shrink-0 text-violet-500" />
                    <input
                      type="text"
                      value={newFriendName}
                      onChange={(e) => setNewFriendName(e.target.value)}
                      placeholder="Entrez le nom de votre ami"
                      className="w-full border-none bg-transparent py-2 text-[15px] text-slate-800 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </fieldset>

                <button
                  type="submit"
                  className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 text-[20px] font-semibold text-white transition hover:brightness-105"
                >
                  Ajouter
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {showAddRelation &&
          createPortal(
            <div
              className="fixed inset-0 z-[13000] flex items-center justify-center bg-slate-900/40 p-4"
              onClick={closeAddRelationModal}
            >
              <div
                className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.35)]"
                style={{
                  width: '760px',
                  maxWidth: 'calc(100vw - 32px)',
                  height: '860px',
                  maxHeight: 'calc(100vh - 32px)',
                }}
                onClick={event => event.stopPropagation()}
              >
                <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-[30px] font-semibold leading-none text-slate-900">
                        {isEditingRelationModal ? 'Modifier la relation' : 'Ajouter une relation'}
                      </h2>
                      <p className="mt-2 text-sm text-slate-500">
                        {isEditingRelationModal
                          ? 'Ajustez les types de relation entre ces deux personnes.'
                          : 'Créez ou modifiez le lien entre deux personnes.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeAddRelationModal}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                      aria-label="Fermer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAddRelation} className="flex min-h-0 flex-1 flex-col">
                  <div className="scrollbar-thin min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
                    <div className="grid grid-cols-3 gap-3">
                    {relationModalSteps.map((step, index) => {
                      const isActive = step.id === relationModalCurrentStep;
                      const isCompleted = step.id < relationModalCurrentStep;

                      return (
                        <div key={step.id} className="flex items-center gap-3">
                          <span
                            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                              isActive
                                ? 'bg-violet-600 text-white'
                                : isCompleted
                                  ? 'bg-violet-100 text-violet-700'
                                  : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {step.id}
                          </span>
                          <span className={`text-sm font-medium ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                            {step.label}
                          </span>
                          {index < relationModalSteps.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
                        </div>
                      );
                    })}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-700">Choisir les personnes</h3>

                      <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-slate-600">Première personne</label>
                          <SearchableCombobox
                            value={selectedFriend1}
                            onChange={setSelectedFriend1}
                            options={friends}
                            placeholder="Choisir une personne..."
                            excludeId={selectedFriend2}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFriend1(selectedFriend2);
                            setSelectedFriend2(selectedFriend1);
                          }}
                          className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                          aria-label="Inverser les personnes"
                        >
                          <ArrowLeftRight className="h-4 w-4" />
                        </button>

                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-slate-600">Seconde personne</label>
                          <SearchableCombobox
                            value={selectedFriend2}
                            onChange={setSelectedFriend2}
                            options={friends}
                            placeholder="Choisir une personne..."
                            excludeId={selectedFriend1}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-slate-700">Type de relation</h3>
                        <span className="text-xs text-slate-500">
                          {isEditingRelationModal
                            ? (selectedRelationTypes[0]
                                ? 'Sélection unique'
                                : 'Choisir un type')
                            : (selectedRelationTypes.length > 0
                                ? `${selectedRelationTypes.length} type(s) sélectionné(s)`
                                : 'Sélection multiple')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                        {relationTypes.map(type => {
                          const IconComponent = availableIcons[type.icon_name as keyof typeof availableIcons];
                          if (!IconComponent) return null;

                          const isSelected = selectedRelationTypes.includes(type.type);

                          return (
                            <button
                              key={type.type}
                              type="button"
                              onClick={() => {
                                if (isEditingRelationModal) {
                                  setSelectedRelationTypes([type.type]);
                                  return;
                                }

                                setSelectedRelationTypes(prev =>
                                  prev.includes(type.type)
                                    ? prev.filter(selectedType => selectedType !== type.type)
                                    : [...prev, type.type],
                                );
                              }}
                              className={`rounded-xl border px-3 py-3 text-center transition ${
                                isSelected
                                  ? 'border-violet-400 bg-violet-50 shadow-[inset_0_0_0_1px_rgba(124,58,237,0.35)]'
                                  : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40'
                              }`}
                            >
                              <div className="mb-1.5 flex justify-center">
                                <IconComponent size={18} color={type.color} />
                              </div>
                              <span className="text-sm font-medium text-slate-700">{type.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-slate-200 pt-5">
                      {isBulkRelationCreation ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          <p className="font-semibold">Creation multiple detectee</p>
                          <p className="mt-1 text-xs text-amber-700">
                            L'intensite et la note sont propres a chaque lien et ne sont pas appliquees en lot.
                            Selectionnez un seul type pour les renseigner.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-slate-700">Intensité du lien (optionnel)</h3>
                            <p className="text-xs text-slate-500">
                              Question guide: ce type vous décrit à combien de pourcent ?
                            </p>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-xs text-slate-500">
                                Exemple: "Ex" a 90% signifie que ce type décrit très fortement votre lien actuel.
                              </p>

                              <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-3">
                                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                                  <span>0%</span>
                                  <span style={{ color: relationIntensityColor }}>
                                    {relationIntensity === null ? 'Non renseigné' : `${relationIntensityPercent}%`}
                                  </span>
                                  <span>100%</span>
                                </div>

                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={relationIntensity ?? 0}
                                  onChange={event => setRelationIntensity(Number(event.target.value))}
                                  className="mt-3 h-2 w-full cursor-pointer"
                                  style={{ accentColor: relationIntensityColor }}
                                />

                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  {[0, 25, 50, 75, 100].map(value => (
                                    <button
                                      key={value}
                                      type="button"
                                      onClick={() => setRelationIntensity(value)}
                                      className={`rounded-md border px-2 py-1 text-xs font-semibold transition ${
                                        relationIntensity === value
                                          ? 'border-violet-300 bg-violet-50 text-violet-700'
                                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                                      }`}
                                    >
                                      {value}%
                                    </button>
                                  ))}

                                  <button
                                    type="button"
                                    onClick={() => setRelationIntensity(null)}
                                    className="ml-auto rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                  >
                                    Effacer
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-slate-700">Notes (optionnel)</h3>
                            <textarea
                              value={relationNote}
                              onChange={event => setRelationNote(event.target.value)}
                              maxLength={400}
                              placeholder="Exemple : sujet principal = projet photo, sont déjà partis en vacances ensemble 3 fois, se sont rencontrés à l'école, etc."
                              className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                            />
                            <p className="text-right text-xs text-slate-500">{relationNote.length}/400</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-slate-200 px-6 py-5 sm:px-8">
                    <button
                      type="submit"
                      disabled={!canSubmitRelation}
                      className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {relationSubmitLabel}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )}

        {showRelationTypeManagement && (
          <RelationTypeManagement 
            onClose={() => {
              setShowRelationTypeManagement(false);
              setRelationTypeModalMode('default');
              setRelationTypeToEdit(null);
            }} 
            onUpdate={refreshAfterStructureUpdate}
            onConfirmDelete={requestDeleteConfirmation}
            startInGroupCreateMode={relationTypeModalMode === 'group-create'}
            startInRelationCreateMode={relationTypeModalMode === 'relation-create'}
            initialRelationTypeToEdit={relationTypeModalMode === 'relation-edit' ? relationTypeToEdit : null}
          />
        )}

        {showRanking && (
          <Ranking
            friends={friends}
            relations={relations}
            onClose={() => setShowRanking(false)}
            onOpenFriendProfile={(friend) => {
              setShowRanking(false);
              setSelectedFriend(friend);
            }}
          />
        )}

        {pendingDeleteConfirmation && (
          <DeleteConfirmationModal
            title={pendingDeleteConfirmation.title}
            message={pendingDeleteConfirmation.message}
            confirmLabel={pendingDeleteConfirmation.confirmLabel}
            onCancel={closeDeleteConfirmation}
            onConfirm={confirmPendingDelete}
          />
        )}
      </main>
    </div>
  );
}

export default App;
