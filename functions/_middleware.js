// Inserts the public Turnstile site key into pages that contain a
// <div class="cf-turnstile"> widget, so the key is configured in Cloudflare
// (TURNSTILE_SITE_KEY environment variable) instead of being hard-coded.
// Only runs on the routes listed in /_routes.json.
export async function onRequest({ request, env, next }) {
  const response = await next();

  const siteKey = env.TURNSTILE_SITE_KEY;
  const type = response.headers.get("content-type") || "";
  if (!siteKey || request.method !== "GET" || !type.includes("text/html")) {
    return response;
  }

  return new HTMLRewriter()
    .on(".cf-turnstile", {
      element(el) {
        el.setAttribute("data-sitekey", siteKey);
      },
    })
    .transform(response);
}
