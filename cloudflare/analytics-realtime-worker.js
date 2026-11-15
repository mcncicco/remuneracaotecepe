const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GA_REALTIME_API_BASE = "https://analyticsdata.googleapis.com/v1beta/properties/";
const CACHE_TTL_SECONDS = 60;
const ACTIVE_USERS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

let cachedAccessToken;
let cachedAccessTokenExpiresAt = 0;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const allowedOrigin = env.ALLOWED_ORIGIN;
    const requestOrigin = request.headers.get("Origin");

    let parsedAllowedOrigin;
    try {
      parsedAllowedOrigin = new URL(allowedOrigin);
    } catch {
      return invalidOriginConfiguration();
    }

    if (
      typeof allowedOrigin !== "string" ||
      !allowedOrigin.startsWith("https://") ||
      parsedAllowedOrigin.origin !== allowedOrigin
    ) {
      return invalidOriginConfiguration();
    }

    if (requestOrigin && requestOrigin !== allowedOrigin) {
      return jsonResponse({ error: "Origin not allowed." }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(allowedOrigin),
      });
    }

    if (request.method !== "GET") {
      return jsonResponse({ error: "Method not allowed." }, 405, allowedOrigin);
    }

    if (url.pathname !== "/api/realtime") {
      return jsonResponse({ error: "Not found." }, 404, allowedOrigin);
    }

    try {
      const propertyId = env.GA4_PROPERTY_ID;
      if (!/^\d+$/.test(propertyId || "")) {
        throw new Error("GA4_PROPERTY_ID must be a numeric property ID.");
      }

      const cacheKey = new Request(
        `${url.origin}/__cached-realtime-metrics-v2?property=${encodeURIComponent(propertyId)}`,
      );
      const cachedResponse = await caches.default.match(cacheKey);
      if (cachedResponse) {
        return withCors(cachedResponse, allowedOrigin);
      }

      const serviceAccount = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");
      const accessToken = await getAccessToken(serviceAccount);
      const reportResponse = await fetch(
        `${GA_REALTIME_API_BASE}${propertyId}:runRealtimeReport`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            metrics: [
              { name: "activeUsers" },
              { name: "screenPageViews" },
            ],
            metricAggregations: ["TOTAL"],
          }),
        },
      );

      if (!reportResponse.ok) {
        throw new Error(`Google Analytics API returned ${reportResponse.status}.`);
      }

      const report = await reportResponse.json();
      const metricValues =
        report.totals?.[0]?.metricValues ??
        report.rows?.[0]?.metricValues ??
        [];
      const activeUsers = Number(metricValues[0]?.value ?? "0");
      const screenPageViews = Number(metricValues[1]?.value ?? "0");
      if (
        !Number.isSafeInteger(activeUsers) ||
        activeUsers < 0 ||
        !Number.isSafeInteger(screenPageViews) ||
        screenPageViews < 0
      ) {
        throw new Error("Google Analytics returned invalid realtime metrics.");
      }

      const response = jsonResponse(
        {
          activeUsers,
          screenPageViews,
          windowMinutes: 30,
          updatedAt: new Date().toISOString(),
        },
        200,
        allowedOrigin,
        `public, max-age=${CACHE_TTL_SECONDS}`,
      );
      await caches.default.put(cacheKey, response.clone());
      return response;
    } catch (error) {
      console.error("Unable to load Google Analytics realtime data:", error);
      return jsonResponse(
        { error: "Realtime analytics is temporarily unavailable." },
        502,
        allowedOrigin,
        "no-store",
      );
    }
  },
};

async function getAccessToken(serviceAccount) {
  if (
    cachedAccessToken &&
    Date.now() < cachedAccessTokenExpiresAt &&
    serviceAccount.client_email
  ) {
    return cachedAccessToken;
  }

  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("Service account JSON must include client_email and private_key.");
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const assertionHeader = base64UrlEncode(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  );
  const assertionClaims = base64UrlEncode(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: ACTIVE_USERS_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + 3600,
    }),
  );
  const unsignedAssertion = `${assertionHeader}.${assertionClaims}`;
  const signingKey = await importPrivateKey(serviceAccount.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    signingKey,
    new TextEncoder().encode(unsignedAssertion),
  );
  const assertion = `${unsignedAssertion}.${base64UrlEncode(signature)}`;

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Google OAuth returned ${tokenResponse.status}.`);
  }

  const tokenData = await tokenResponse.json();
  if (typeof tokenData.access_token !== "string" || !tokenData.access_token) {
    throw new Error("Google OAuth response did not contain an access token.");
  }

  cachedAccessToken = tokenData.access_token;
  cachedAccessTokenExpiresAt =
    Date.now() + Math.max(0, Number(tokenData.expires_in || 3600) - 60) * 1000;
  return cachedAccessToken;
}

async function importPrivateKey(pem) {
  const encodedKey = pem
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binaryKey = atob(encodedKey);
  const keyBytes = Uint8Array.from(binaryKey, (character) =>
    character.charCodeAt(0),
  );
  return crypto.subtle.importKey(
    "pkcs8",
    keyBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function base64UrlEncode(value) {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function corsHeaders(allowedOrigin) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function invalidOriginConfiguration() {
  return new Response(
    JSON.stringify({ error: "Worker origin configuration is invalid." }),
    {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    },
  );
}

function jsonResponse(body, status, allowedOrigin, cacheControl = "no-store") {
  const headers = new Headers(corsHeaders(allowedOrigin));
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", cacheControl);
  return new Response(JSON.stringify(body), { status, headers });
}

function withCors(response, allowedOrigin) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(corsHeaders(allowedOrigin))) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
