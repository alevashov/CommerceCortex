# CommerceCortex website

Marketing site for [CommerceCortex](https://commercecortex.net): static HTML pages styled with Tailwind CSS, hosted on Cloudflare Pages.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home page: product, pricing, FAQ, team, contact form |
| `signup.html` | Sign-up / enquiry page |
| `privacy-policy.html` | Privacy policy |
| `thankyou.html`, `thankyou-maillist.html` | Shown after a form is submitted |
| `404.html` | Not-found page (Cloudflare Pages serves it automatically) |

## Contact forms

Both forms post to `/api/contact`, a Cloudflare Pages Function (`functions/api/contact.js`). It:

1. checks the Cloudflare Turnstile token (spam protection);
2. forwards the fields to the Google Form;
3. redirects to the thank-you page named in the form's hidden `_next` field.

Cloudflare Pages environment variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `TURNSTILE_SITE_KEY` | yes | Turnstile site key (public). `functions/_middleware.js` inserts it into the form widget on the home and sign-up pages. |
| `TURNSTILE_SECRET` | yes | Turnstile secret key |
| `GOOGLE_FORM_URL` | recommended | Google Form `formResponse` URL. Falls back to the URL in the code if not set. |

In the HTML, `data-sitekey` holds a placeholder; the real key comes from `TURNSTILE_SITE_KEY` at serve time. `_routes.json` limits Functions to the pages that need them and `/api/*`. After changing a variable in Cloudflare, redeploy for it to take effect.

To test locally: `npx wrangler pages dev . --binding TURNSTILE_SITE_KEY=1x00000000000000000000AA --binding TURNSTILE_SECRET=1x0000000000000000000000000000000AA` (Cloudflare's always-pass test keys).

## Styles

Edit classes in the HTML, then rebuild the CSS (requires Node.js):

```
npm install
npm run build-css     # one-off, minified
npm run watch-css     # rebuild on every change while editing
```

Source: `src/tailwind.css`, config: `tailwind.config.js`, output: `assets/css/tailwind.css` (committed, because the site has no build step on deploy).

## Deploying

Cloudflare Pages deploys from this repository. There is no build command; the output directory is the repository root.

## Credits

Based on the free [Play Tailwind template](https://github.com/tailgrids/play-tailwind) by TailGrids and UIdeck (MIT licence, see `LICENSE`).
