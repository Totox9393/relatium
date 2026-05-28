import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PASSWORD_RESET_REDIRECT_TO = 'https://totox.fr/relatium/reset-password';

type AdminAction = 'list' | 'reset_password' | 'ban' | 'unban' | 'delete' | 'update_bio';

type AdminAccountsPayload = {
  key?: unknown;
  action?: unknown;
  userId?: unknown;
  email?: unknown;
  profileBio?: unknown;
};

const buildCorsHeaders = (origin?: string | null) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

const jsonResponse = (body: unknown, status = 200, origin?: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...buildCorsHeaders(origin),
    },
  });

const okResponse = (body: Record<string, unknown>, origin?: string | null) =>
  jsonResponse({ ok: true, ...body }, 200, origin);

const errorResponse = (error: string, status = 400, origin?: string | null) =>
  jsonResponse({ ok: false, error }, status, origin);

const isAdminAction = (value: unknown): value is AdminAction =>
  value === 'list' ||
  value === 'reset_password' ||
  value === 'ban' ||
  value === 'unban' ||
  value === 'delete' ||
  value === 'update_bio';

const cleanEmail = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase().slice(0, 180) : '';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidUuid = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const getAccountEmail = async (
  supabase: SupabaseClient,
  userId?: string,
  fallbackEmail?: string,
) => {
  if (userId) {
    const { data: account, error: accountError } = await supabase
      .from('relatium_accounts')
      .select('email')
      .eq('id', userId)
      .maybeSingle();

    if (accountError) {
      console.warn('Admin accounts email lookup failed:', accountError);
    }

    const accountEmail = cleanEmail(account?.email);
    if (isValidEmail(accountEmail)) {
      return accountEmail;
    }

    const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(userId);
    if (authUserError) {
      console.warn('Admin accounts auth user lookup failed:', authUserError);
    }

    const authEmail = cleanEmail(authUserData?.user?.email);
    if (isValidEmail(authEmail)) {
      return authEmail;
    }
  }

  const email = cleanEmail(fallbackEmail);
  return isValidEmail(email) ? email : null;
};

Deno.serve(async request => {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: buildCorsHeaders(origin),
    });
  }

  if (request.method !== 'POST') {
    return errorResponse('method_not_allowed', 405, origin);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim();
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
  const adminAccountsKey = Deno.env.get('TOTOX_ADMIN_ACCOUNTS_KEY')?.trim();

  if (!supabaseUrl || !serviceRoleKey || !adminAccountsKey) {
    console.error('Admin accounts configuration missing.');
    return errorResponse('server_not_configured', 500, origin);
  }

  let payload: AdminAccountsPayload;
  try {
    payload = await request.json();
  } catch {
    return errorResponse('invalid_json', 400, origin);
  }

  if (payload.key !== adminAccountsKey) {
    console.warn('Admin accounts request rejected: invalid key.');
    return errorResponse('unauthorized', 401, origin);
  }

  if (!isAdminAction(payload.action)) {
    return errorResponse('invalid_action', 400, origin);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    if (payload.action === 'list') {
      const { data: accounts, error } = await supabase
        .from('relatium_accounts')
        .select('id,email,username,role,created_at,last_active_at,updated_at,is_active,onboarding_completed,profile_bio,avatar_url')
        .order('last_active_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Admin accounts list failed:', error);
        return errorResponse('list_failed', 500, origin);
      }

      return okResponse({ accounts: accounts ?? [] }, origin);
    }

    if (payload.action === 'reset_password') {
      if (payload.userId !== undefined && !isValidUuid(payload.userId)) {
        return errorResponse('valid_user_id_required', 400, origin);
      }

      const userId = isValidUuid(payload.userId) ? payload.userId : undefined;
      const email = await getAccountEmail(supabase, userId, payload.email as string | undefined);

      if (!email) {
        return errorResponse('valid_email_required', 400, origin);
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: PASSWORD_RESET_REDIRECT_TO,
      });

      if (error) {
        console.error('Admin accounts reset password failed:', error);
        return errorResponse('reset_password_failed', 500, origin);
      }

      return okResponse({ email }, origin);
    }

    if (!isValidUuid(payload.userId)) {
      return errorResponse('valid_user_id_required', 400, origin);
    }

    const userId = payload.userId;

    if (payload.action === 'ban' || payload.action === 'unban') {
      const { error } = await supabase
        .from('relatium_accounts')
        .update({
          is_active: payload.action === 'unban',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error(`Admin accounts ${payload.action} failed:`, error);
        return errorResponse(`${payload.action}_failed`, 500, origin);
      }

      return okResponse({ userId }, origin);
    }

    if (payload.action === 'delete') {
      const { error } = await supabase.auth.admin.deleteUser(userId, true);

      if (error) {
        console.warn('Admin accounts soft delete failed, retrying hard delete:', error);
        const { error: hardDeleteError } = await supabase.auth.admin.deleteUser(userId);

        if (hardDeleteError) {
          console.error('Admin accounts delete failed:', hardDeleteError);
          return errorResponse('delete_failed', 500, origin);
        }
      }

      const { error: accountDeleteError } = await supabase
        .from('relatium_accounts')
        .delete()
        .eq('id', userId);

      if (accountDeleteError) {
        console.warn('Admin accounts cleanup after auth delete failed:', accountDeleteError);
      }

      return okResponse({ userId }, origin);
    }

    if (payload.action === 'update_bio') {
      const profileBio = typeof payload.profileBio === 'string' ? payload.profileBio.slice(0, 160) : '';

      const { error } = await supabase
        .from('relatium_accounts')
        .update({
          profile_bio: profileBio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Admin accounts update bio failed:', error);
        return errorResponse('update_bio_failed', 500, origin);
      }

      return okResponse({ userId, profileBio }, origin);
    }
  } catch (error) {
    console.error('Admin accounts unexpected error:', error);
    return errorResponse('unexpected_error', 500, origin);
  }

  return errorResponse('invalid_action', 400, origin);
});
