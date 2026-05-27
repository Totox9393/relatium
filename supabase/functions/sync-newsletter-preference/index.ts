import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const NEWSLETTER_ENDPOINT = 'https://totox.fr/relatium-newsletter.php';

type SyncPayload = {
  enabled?: unknown;
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

const cleanEmail = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase().slice(0, 180) : '';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

Deno.serve(async request => {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: buildCorsHeaders(origin),
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405, origin);
  }

  const authorizationHeader = request.headers.get('Authorization');
  if (!authorizationHeader) {
    return jsonResponse({ error: 'Authentication required.' }, 401, origin);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim();
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')?.trim();
  const syncKey = Deno.env.get('TOTOX_NEWSLETTER_SYNC_KEY')?.trim();

  if (!supabaseUrl || !supabaseAnonKey || !syncKey) {
    console.error('Configuration newsletter sync missing.');
    return jsonResponse({ error: 'Newsletter sync unavailable.' }, 500, origin);
  }

  let payload: SyncPayload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request.' }, 400, origin);
  }

  if (typeof payload.enabled !== 'boolean') {
    return jsonResponse({ error: 'Invalid enabled value.' }, 400, origin);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorizationHeader,
      },
    },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  if (userError || !user) {
    console.warn('Newsletter sync auth failed:', userError);
    return jsonResponse({ error: 'Authentication required.' }, 401, origin);
  }

  const { data: accountData, error: accountError } = await supabase
    .from('relatium_accounts')
    .select('email')
    .eq('id', user.id)
    .maybeSingle();

  if (accountError) {
    console.warn('Newsletter sync account lookup failed:', accountError);
  }

  const email = cleanEmail(accountData?.email) || cleanEmail(user.email);

  if (!isValidEmail(email)) {
    return jsonResponse({ error: 'Valid email required.' }, 400, origin);
  }

  const newsletterResponse = await fetch(NEWSLETTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      action: 'sync_preference',
      key: syncKey,
      email,
      enabled: payload.enabled ? 'true' : 'false',
      userId: user.id,
      source: 'settings',
    }),
  });

  if (!newsletterResponse.ok) {
    const errorText = await newsletterResponse.text();
    console.warn('Newsletter sync endpoint failed:', newsletterResponse.status, errorText.slice(0, 300));
    return jsonResponse({ error: 'Newsletter sync failed.' }, 502, origin);
  }

  return jsonResponse({ success: true }, 200, origin);
});
