const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';
const DEFAULT_SUBJECT = 'Message depuis le formulaire de contact';
const ADMIN_CONTACT_URL = 'https://totox.fr/relatium-contact.php';

type ContactPayload = {
  projectName?: string;
  projectUrl?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  subject?: string;
  message?: string;
  os?: string;
  browser?: string;
  device?: string;
  userAgent?: string;
  company?: string;
};

const jsonResponse = (body: unknown, status = 200, origin?: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...buildCorsHeaders(origin),
    },
  });

const buildCorsHeaders = (origin?: string | null) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

const getAllowedOrigins = () =>
  (Deno.env.get('CONTACT_ALLOWED_ORIGINS') || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const isOriginAllowed = (origin: string | null) => {
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.length === 0 || (origin ? allowedOrigins.includes(origin) : false);
};

const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'Non disponible';
  }

  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    'Non disponible'
  );
};

const cleanText = (value: unknown, maxLength: number) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

Deno.serve(async request => {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: buildCorsHeaders(isOriginAllowed(origin) ? origin : null),
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Méthode non autorisée.' }, 405, origin);
  }

  if (!isOriginAllowed(origin)) {
    return jsonResponse({ error: 'Origine non autorisée.' }, 403, origin);
  }

  const serviceId = Deno.env.get('EMAILJS_SERVICE_ID')?.trim();
  const templateId = Deno.env.get('EMAILJS_TEMPLATE_ID')?.trim();
  const publicKey = Deno.env.get('EMAILJS_PUBLIC_KEY')?.trim();
  const privateKey = Deno.env.get('EMAILJS_PRIVATE_KEY')?.trim();

  if (!serviceId || !templateId || !publicKey) {
    console.error('Configuration EmailJS manquante.');
    return jsonResponse({ error: 'Configuration email indisponible.' }, 500, origin);
  }

  let payload: ContactPayload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Requête invalide.' }, 400, origin);
  }

  if (cleanText(payload.company, 120)) {
    return jsonResponse({ success: true }, 200, origin);
  }

  const firstName = cleanText(payload.firstName, 80);
  const lastName = cleanText(payload.lastName, 80);
  const email = cleanText(payload.email, 180);
  const subject = cleanText(payload.subject, 140) || DEFAULT_SUBJECT;
  const message = cleanText(payload.message, 4000);
  const projectName = cleanText(payload.projectName, 80) || 'Relatium';
  const projectUrl = cleanText(payload.projectUrl, 240) || origin || 'Non disponible';
  const os = cleanText(payload.os, 80) || 'Non disponible';
  const browser = cleanText(payload.browser, 80) || 'Non disponible';
  const device = cleanText(payload.device, 80) || 'Non disponible';
  const userAgent = cleanText(payload.userAgent || request.headers.get('user-agent'), 500) || 'Non disponible';

  if (!firstName || !lastName || !isValidEmail(email) || !message) {
    return jsonResponse({ error: 'Champs invalides.' }, 400, origin);
  }

  const emailjsResponse = await fetch(EMAILJS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      ...(privateKey ? { accessToken: privateKey } : {}),
      template_params: {
        projectName,
        projectUrl,
        firstName,
        lastName,
        email,
        subject,
        message,
        ip: getClientIp(request),
        os,
        browser,
        device,
        userAgent,
      },
    }),
  });

  if (!emailjsResponse.ok) {
    const errorText = await emailjsResponse.text();
    console.error('Erreur EmailJS:', emailjsResponse.status, errorText);
    return jsonResponse({ error: 'Impossible d’envoyer le message.' }, 502, origin);
  }

  try {
    const adminResponse = await fetch(ADMIN_CONTACT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        action: 'add',
        firstName,
        lastName,
        email,
        subject,
        message,
        projectName,
        projectUrl,
        os,
        browser,
        device,
        userAgent,
      }),
    });

    if (!adminResponse.ok) {
      console.warn('Sauvegarde contact admin échouée:', adminResponse.status);
    }
  } catch (error) {
    console.warn('Sauvegarde contact admin indisponible:', error);
  }

  return jsonResponse({ success: true }, 200, origin);
});
