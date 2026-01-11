const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const FORWARD_URL =
  "https://docs.google.com/forms/u/0/d/e/1FAIpQLSfdwAHIjtc6IjpQ-YicnAuFl8435r6uzmuY41b_PlT2l-REoQ/formResponse";

async function verifyTurnstile(request, secret) {
  const formData = await request.formData();
  const token = formData.get("cf-turnstile-response");

  if (!token || typeof token !== "string") {
    return { ok: false, formData };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json();
  return { ok: Boolean(data.success), formData };
}

function buildForwardBody(formData) {
  const body = new URLSearchParams();

  for (const [key, value] of formData.entries()) {
    if (key === "cf-turnstile-response") {
      continue;
    }

    body.append(key, String(value));
  }

  return body;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const secret = env.TURNSTILE_SECRET;

  if (!secret) {
    return new Response("Turnstile secret not configured.", { status: 500 });
  }

  const { ok, formData } = await verifyTurnstile(request, secret);

  if (!ok) {
    return new Response("Turnstile validation failed.", { status: 400 });
  }

  const forwardResponse = await fetch(FORWARD_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: buildForwardBody(formData),
  });

  if (!forwardResponse.ok) {
    return new Response("Failed to submit the form.", { status: 502 });
  }

  return Response.redirect(new URL("/thankyou.html", request.url), 303);
}
