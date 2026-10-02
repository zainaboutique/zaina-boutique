# URL Migration: Old Site → New Site

This documents exactly how your old site's URLs are handled on the new one, and why — built
from your real Google Search Console exports (`Coverage-Valid`, `Coverage-Drilldown`,
`Performance-on-Search`, pulled 2026-10-01), not guesswork. 1,064 old URL rows were analyzed
across those exports.

## The one structural change: product URLs are now slug-based

Products used to be reachable at `/product/<random-id>` (e.g. `/product/xK9fJ2mNb3`). They're now
at `/product/<readable-slug>` (e.g. `/product/royal-check-weave-banarasi-semi-katan-silk-saree`),
using the same "Slug" column already in your product CSV.

**Why this mattered enough to change:** of 326 distinct old product URLs found in your Search
Console data, **169 use a slug that exactly matches a product still in your current catalog.**
With random-ID URLs, every single one of those 169 would have needed its own hand-written
redirect line. With slug-based URLs, they need **zero** — the old URL and the new URL are
identical, so there's nothing to redirect at all. The other 157 are products that were
discontinued or renamed at some point before this migration — no URL scheme fixes that; visiting
one of those now shows a "Product not found" page with a link back to the shop, rather than
either a broken link or a misleading redirect to an unrelated product.

## Redirect rules (in `next.config.js`)

All are permanent (301) redirects — this is what tells Google "this page moved here for good,"
which is what actually protects your search rankings through the move, rather than just quietly
avoiding broken links.

| Old URL pattern | Goes to | Why |
|---|---|---|
| `/index.php/product/:slug` | `/product/:slug` | Legacy WordPress/WooCommerce product URLs — 84 found |
| `/index.php/product-tag/*` | `/shop` | WooCommerce tag-archive pages — 497 found, the single largest group. These are auto-generated listing pages, not unique content, so one shared destination is the right call rather than inventing 497 individual mappings |
| `/index.php/product-category/*` | `/shop` | Legacy category archives — 11 found |
| `/index.php/products`, `/index.php/products/*` | `/shop` | Legacy paginated shop listing |
| `/index.php/refund_returns` | `/returns` | |
| `/index.php/2023/*` | `/` | Old date-based blog archive from the legacy WordPress site — distinct from the new site's own `/blog`, which is a real section now |
| `/index.php` | `/` | |
| `/collection/:group/:sub*` | `/shop?category=:group` | Current-era category browsing — 50 found. Subcategory specificity (e.g. the `sarees` in `/collection/women/sarees`) isn't preserved, since the new shop page filters by top-level category only — still lands the visitor on a genuinely relevant page rather than a dead end |
| `/faqs` | `/faq` | Same content, old URL used the plural |
| `/stores` | `/store-locator` | |
| `/cookies` | `/privacy` | No separate cookie policy on the new site |
| `/gift-cards` | `/shop` | Not a feature on the new site |
| `/press` | `/about` | |
| `/designers/*` | `/shop` | |
| `/auth/*` | `/account` | Old login/register paths |
| `/account/*` (one or more sub-segments) | `/account` | Deliberately **not** a catch-all that also matches bare `/account` — that would've redirected `/account` to itself in an infinite loop, since the new site already serves that path directly |
| `/search` | `/shop` | The `?q=...` search query is preserved automatically — the new shop page has its own search box |
| `/index` | `/` | |

**Already identical, no redirect needed:** `/returns`, `/payment-options`, `/terms`, `/shipping`,
`/about`, `/privacy`, `/contact`, `/size-guide` — the old and new sites happen to already use the
exact same path for these.

## The www vs. non-www split — handle this in Vercel, not in code

Your Search Console data shows real indexed traffic on **both** `zainaboutique.com` (643 of the
1,064 URL rows) and `www.zainaboutique.com` (421 rows) — Google currently treats these as two
separate sites. This needs to be fixed, but at the **domain/DNS level in Vercel's dashboard**,
not as a code redirect — that's the standard, more reliable place for it (handled at the edge,
before a request even reaches the app, and avoids SSL certificate complications a code-level
redirect can't solve on its own):

1. Vercel → your project → Settings → Domains.
2. Add **both** `zainaboutique.com` and `www.zainaboutique.com`.
3. Vercel will prompt you to choose one as primary — pick `www.zainaboutique.com` (the more
   recently/actively indexed of the two per your data) — and it automatically 301-redirects the
   other to it, site-wide.

## What this doesn't cover, and what to do if you find more

This list covers every URL pattern present in your three Search Console exports. If, after
launch, you notice an old URL that isn't redirecting correctly (check Search Console's Pages
report over the following weeks for a spike in 404s), send me the exact URL and I'll add a rule
for it — this file and `next.config.js` are meant to be extended, not a one-time, closed list.

## Before switching your domain: test every rule on the live Vercel URL

Your site is already live at its `.vercel.app` address. Before pointing your real domain at it,
manually try a handful of old URLs against that address directly (replace the domain, keep the
path) — e.g. `https://your-project.vercel.app/index.php/product/some-real-old-slug` — and confirm
each lands where this table says it should. This catches mistakes while your real domain is still
safely pointed at the old site.
