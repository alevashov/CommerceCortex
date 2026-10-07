const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// The Google Form endpoint should be set as the GOOGLE_FORM_URL environment
// variable in Cloudflare Pages, so it isn't published in the site source.
// The fallback keeps existing deployments working until that variable is set.
const DEFAULT_FORWARD_URL =
  "https://docs.google.com/forms/u/0/d/e/1FAIpQLSfdwAHIjtc6IjpQ-YicnAuFl8435r6uzmuY41b_PlT2l-REoQ/formResponse";

// Pages a form may redirect to after a successful submission.
const ALLOWED_REDIRECTS = new Set(["thankyou.html", "thankyou-maillist.html"]);

// Fields used by this function that must not be forwarded to Google Forms.
const INTERNAL_FIELDS = new Set(["cf-turnstile-response", "_next"]);

async function verifyTurnstile(token, secret, ip) {
  if (!token || typeof token !== "string") {
    return false;
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) {
    body.set("remoteip", ip);
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, { method: "POST", body });
    const data = await response.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}

function buildForwardBody(formData) {
  const body = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    if (!INTERNAL_FIELDS.has(key)) {
      body.append(key, String(value));
    }
  }
  return body;
}

function errorPage(message, status) {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Message not sent | CommerceCortex</title></head>
<body style="font-family:system-ui,sans-serif;max-width:36rem;margin:4rem auto;padding:0 1rem;line-height:1.6">
<h1>Your message wasn't sent</h1><p>${message}</p>
<p><a href="javascript:history.back()">Go back to the form</a> or email us at <a href="mailto:info@commercecortex.net">info@commercecortex.net</a>.</p>
</body></html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function onRequestPost({ request, env }) {
  const secret = env.TURNSTILE_SECRET;
  if (!secret) {
    return errorPage("The contact form isn't configured correctly.", 500);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return errorPage("We couldn't read the form submission.", 400);
  }

  const ok = await verifyTurnstile(
    formData.get("cf-turnstile-response"),
    secret,
    request.headers.get("CF-Connecting-IP")
  );
  if (!ok) {
    return errorPage("The spam check didn't pass. Please go back and try again.", 400);
  }

  const forwardResponse = await fetch(env.GOOGLE_FORM_URL || DEFAULT_FORWARD_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: buildForwardBody(formData),
  });
  if (!forwardResponse.ok) {
    return errorPage("Something went wrong on our side. Please try again later.", 502);
  }

  const next = String(formData.get("_next") || "");
  const target = ALLOWED_REDIRECTS.has(next) ? next : "thankyou.html";
  return Response.redirect(new URL(`/${target}`, request.url).toString(), 303);
}
