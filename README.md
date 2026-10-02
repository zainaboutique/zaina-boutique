# Zaina Boutique — Full E-commerce Platform

A mobile-first Indian & contemporary fashion storefront + secured admin dashboard, built with
Next.js 14 (App Router, TypeScript), Tailwind CSS, Firebase (Firestore, Storage, Auth), Zustand,
and Razorpay. Currency is INR (₹).

## Framework version: Next.js 16 + React 19

This project now runs on **Next.js 16 and React 19**, the current supported versions as of
this update — no known unpatched vulnerabilities, unlike the Next.js 14.x line this project
started on (which had a permanently-unpatched Image Optimization RCE that Vercel confirmed will
never be fixed in 14.x).

**Before you run `npm install`, check your Node.js version:**

```
node -v
```

**Next.js 16 requires Node.js 20.9.0 or later — Node 18 is no longer supported at all.** If
`node -v` shows anything below `v20.9.0`, install a newer version from
[nodejs.org](https://nodejs.org) (the current LTS release) before continuing, or `npm install`
and `npm run dev`/`npm run build` will fail.

What changed in the migration, for reference:
- `next`, `react`, `react-dom` bumped to their Next 16 / React 19 compatible versions.
- The one dynamic route in this app (`app/product/[id]/page.tsx`) updated for Next 15+'s async
  `params` API (`params` is now a `Promise` that must be `await`ed) — this was the only file in
  the whole codebase affected, since every other page either has no dynamic segments or reads
  `searchParams` via the client-side `useSearchParams()` hook, which didn't change.
- The `next lint` script was removed, since Next.js 16 dropped that built-in wrapper entirely (it
  was never wired up to an actual ESLint config in this project anyway, so nothing is lost).
- No other code in this app used a pattern affected by the React 19 or Next 16 upgrade
  (no `forwardRef`, `defaultProps`, `useFormState`, legacy `next/image` props, or middleware).

This was verified with a full static TypeScript syntax check across every file, but **actually
running `npm install` is the real test** — I can't execute that here. If anything fails to
install or build, send me the exact error and I'll fix it.

In the meantime, run `npm audit` after installing to see what else, if anything, your current
dependency tree flags, and avoid `npm audit fix --force` without reviewing what it changes (it
can silently bump major versions and break things).

## Demo mode vs. Live mode

- **Demo mode** (no `.env.local`): every admin edit, product, order, review, and customer
  account is saved to your browser's **localStorage**, so it now survives page refreshes —
  this was broken before and is fixed. This is genuinely useful for local testing, but it's
  per-browser only: it won't sync to your phone, another browser, or another person's device,
  and a server-rendered lookup (like a shared product link's preview metadata, or the sitemap)
  can't see localStorage-only data. Admin login accepts any email/password in this mode, and
  the customer portal at `/account` has its own working email/password sign-up for the same reason.
- **Live mode** (`.env.local` populated with Firebase config): everything reads/writes real
  Firestore/Storage/Auth, shared across every device and visitor — this is what you need before
  taking real orders.

**If you're testing locally and something "isn't saving" or "isn't showing up" — connect
Firebase.** Demo mode is a convenience for clicking around before that step, not a substitute
for it.

## What's included

**Storefront:** homepage with a swipeable multi-banner hero, dynamic categories, New Arrivals
(sized correctly now), a "Shop By Occasion" section, a full shop page with
category/search/occasion filtering (`/shop`), product detail pages with photo galleries, real
color and size selection (both are attached to the cart line item and shown to admin), free-shipping
badges, related products and customer reviews, a cart drawer, checkout with discount codes +
enable/disable-able Razorpay (INR) + Cash on Delivery, WhatsApp order confirmation, and order
tracking (`/track`) that shows the delivery partner, tracking number, and a tracking link once
admin adds them. Header includes a working Account icon; footer is a full dark-themed
multi-column layout with your logo, tagline, socials, and payment badges — and the whole site's
font and colors are switchable live from Settings.

**Admin (`/admin`, gated behind `/admin-portal/login`):** Dashboard, Product (multi-photo
upload, settable cover photo, colors with photos, CSV bulk import), Category, Order (status
pipeline including Processed, a live status dot, cancellation, delivery-tracking form, and a
link to each ordered product), Discount codes, Customer accounts (with admin grant/revoke),
**Reviews** (approve/reject before anything shows publicly), **Pages** (edit About Us, Shipping
& Delivery, Return & Exchange, Payment Options, Size Guide, Terms, Privacy, and a full FAQ
manager — all live on the storefront the moment you save), Hero Banner (multiple banners,
drag-to-reorder), and Settings (logo, site font, brand colors, tagline, contact info, social
links, announcement bar, header/footer links, and payment method toggles).

**Customer account (`/account`):** email/password sign-up and login that works out of the box,
plus Google Sign-In once Firebase is connected. Signed-in customers get a dashboard with My
Orders (matched by email, click through to full tracking), a one-tap Bag shortcut, a saved
default Address, an editable Profile, and Sign Out. Orders can also be self-cancelled by the
customer from the tracking page (while still Pending/Processed) — not just by admin.

**Customer accounts:** `/account` has fully working email/password sign-up and login (works
immediately, no setup needed) plus Google Sign-In (needs Firebase connected).

## 1. Local Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Storefront: `http://localhost:3000`. Admin: `http://localhost:3000/admin-portal/login`.

## 2. Connect Firebase

1. [console.firebase.google.com](https://console.firebase.google.com) → Add project → add a Web App
   → copy the config values into `.env.local`.
2. **Firestore:** Build → Firestore Database → Create database (test mode for dev; lock down
   with the rules below before going live).
3. **Storage:** Build → Storage → Get started.
4. **Auth:** Build → Authentication → Sign-in method:
   - Enable **Email/Password** (used by both admin login and the customer account portal).
   - Enable **Google** (for the "Sign in with Google" button at `/account`).
5. Seed demo data:
   ```bash
   npm run seed
   ```
   Seeds `products`, `banners`, `categories`, `settings`, and `discounts` — not `admins`,
   which you set up next.

### Making your first admin

The admin portal checks the `admins` Firestore collection, not just "is logged in" — this
matters once Google Sign-In is live, since otherwise any customer could reach `/admin`.

1. Firebase Console → Authentication → Users → add a user with email/password (your admin
   login — separate from customer accounts).
2. Copy that user's UID.
3. In Firestore, create a document at `admins/{that UID}` with field `email: "you@example.com"`.
4. Sign in at `/admin-portal/login`.

Admin → Customer lets you grant/revoke admin access for other accounts afterward, which keeps
the `admins` collection in sync automatically.

### Firestore security rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    match /products/{id}      { allow read: if true; allow write: if isAdmin(); }
    match /categories/{id}    { allow read: if true; allow write: if isAdmin(); }
    match /banners/{id}       { allow read: if true; allow write: if isAdmin(); }
    match /discounts/{id}     { allow read: if true; allow write: if isAdmin(); }
    match /settings/{id}      { allow read: if true; allow write: if isAdmin(); }
    match /pages/{id}         { allow read: if true; allow write: if isAdmin(); }
    match /faqs/{id}          { allow read: if true; allow write: if isAdmin(); }
    match /reviews/{id}       { allow read: if true; allow create: if true; allow update, delete: if isAdmin(); }
    match /orders/{id}        { allow create: if true; allow read, update: if isAdmin(); }
    match /admins/{id}        { allow read: if isAdmin(); allow write: if isAdmin(); }
    match /users/{id} {
      allow read: if isAdmin() || request.auth.uid == id;
      allow create: if request.auth.uid == id;
      allow update: if isAdmin();
    }
  }
}
```

> The public reviews query filters on `productId` + `approved` + orders by `createdAt`.
> Firestore will show a "requires an index" error with a direct link the first time this runs
> in Live mode — click it to auto-create the composite index. This is a one-time setup step.

### Storage security rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 3. Enable Payment Methods & Connect Razorpay

Cash on Delivery, Razorpay, and **Order via WhatsApp** can each be turned on/off independently in
**Admin → Settings → Payments**. Cash on Delivery needs no setup. Order via WhatsApp needs only a
WhatsApp number set in Admin → Settings → Contact — when a customer picks it at checkout, their
order is recorded (Pending, no payment collected) and they're taken straight to WhatsApp with the
order number, items, total, and address pre-filled, ready to send to your number. For Razorpay:

1. Create a [Razorpay](https://razorpay.com) account (test keys work without KYC for dev).
2. Dashboard → Settings → API Keys → generate a key pair.
3. Paste the **Key ID** into Admin → Settings → Payments (it's public — the same value your
   browser already receives during checkout, so storing it in Settings is safe) and toggle
   Razorpay on.
4. Set the **Key Secret** as a server environment variable — this one is never entered in the
   Settings UI, because anything stored there is potentially readable by anyone visiting the
   storefront, and leaking the secret would let someone create fraudulent charges:
   ```
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
   ```
   Add it to `.env.local` locally and to Vercel → Settings → Environment Variables for
   production. (`RAZORPAY_KEY_ID` as an env var also still works as a fallback if you'd rather
   not put it in Settings.)

Payments are created and **verified** server-side (`app/api/razorpay/`) — never remove the
signature check, or anyone could mark an order "paid" from the browser. Currency is INR
throughout. If neither payment method is enabled, checkout shows a "contact us to order"
message instead of a broken payment form.

## 4. WhatsApp Ordering

Set your WhatsApp number (digits only, with country code — e.g. `918344867027`) in
Admin → Settings → Contact. This powers a floating WhatsApp button site-wide and a "Confirm via
WhatsApp" button on the order confirmation screen. This is the simple `wa.me` link approach — no
Meta Business approval needed. Ask if you want the full WhatsApp Business Cloud API instead
(auto-receives orders into a system, but requires Meta Business verification).

## 5. Delivery Tracking

Once a courier picks up an order, open it in Admin → Order and fill in the "Shipping / Delivery
Tracking" section: delivery partner name (e.g. Delhivery, Blue Dart, India Post), tracking
number, and a tracking link (usually the courier's own tracking-by-AWB URL). Save it, and the
customer immediately sees it on `/track` when they look up that order number — carrier, tracking
number, and a "Track Package" button linking out to the courier's page. All three fields are
optional and independent of order status, so you can add them whenever you have the info.

## 6. Branding: Fonts & Colors

Admin → Settings → Branding lets you set the site's primary color, accent color, and font —
choose from six curated Google Fonts (a live preview shows your site name in the selected font
before you save). All three apply instantly, site-wide — header, footer, buttons, everything —
without a rebuild or redeploy, because they're applied as CSS variables the moment the page
loads. The six fonts are preloaded via `next/font/google` in `app/layout.tsx`, so switching
between them never triggers an extra network request.

**Or bring your own font.** The same panel has an "import your own font file" option — upload a
`.ttf`, `.otf`, `.woff`, or `.woff2` file (e.g. a licensed brand font) and it's registered and
applied immediately, the same way the built-in fonts are. Unlike the six Google Fonts (which are
bundled at build time via `next/font/google`), an uploaded font is loaded at runtime using the
browser's CSS Font Loading API, since the file isn't known until an admin uploads it. It appears
in the font dropdowns as "*Your Font Name* (uploaded)" once added, and can be removed from the
same panel (falls back to the first built-in font). In demo mode, the font file is stored as a
data URL like other demo-mode uploads (see "Demo mode vs. Live mode"); in live mode it goes to
Firebase Storage like any other uploaded asset.

**The logo wordmark has its own, separate font control.** "Logo Text Font" is independent from
"Website Font" — changing one never affects the other. This exists because a brand's logo
typography and a site's body/button typography are often deliberately different, and forcing
them to share one setting would mean compromising one to match the other. Both dropdowns list
the same six built-in fonts plus your uploaded custom font, if any — you can mix and match freely
(e.g. an elegant font for the logo, a plain readable one for everything else).

## 7. Blog (Admin → Blog)

A full blog, built in rather than bolted on. Admin → Blog gives you a Word-style editor: select
text and click a button to make it bold, italic, or underlined; insert headings, bullet lists,
links, and photos directly; pick a font and text size for selected text. A couple of specifics
worth knowing:
- **Moving things around** (a photo, a block of text) is done by dragging the selection to its
  new spot — this is the browser's own native behavior inside the editor, not an extra feature to
  learn.
- **Image alignment** (left/center/right) is set via the toolbar after clicking an inserted
  image — this keeps photos readable on a phone screen, which true freeform pixel positioning
  wouldn't.
- Posts save as **Draft** or **Published** — only published posts appear on the live `/blog` page;
  drafts stay visible to you in Admin → Blog until you're ready.
- The listing page (`/blog`) and each post get real SEO metadata (title, description, social
  share image, and `BlogPosting` structured data) automatically — nothing extra to fill in.
- A "Journal" link was added to the default footer so it's reachable right away; move or rename
  it anytime in Admin → Settings → Header & Footer.

## 8. Shop Navigation: Women/Men/Kids Category Pages

Clicking **Women**, **Men**, or **Kids** in the header (desktop dropdown or mobile menu) now opens
a dedicated landing page (`/shop/women`, `/shop/men`, `/shop/kids`) — a "Shop By Category" tile
grid at the top (pulled from Admin → Category, filtered to that group), with the full product
listing for that group below it. **New Arrival** stays a flat product list, since it's a smart
filter (recently added) rather than a real category taxonomy.

Clicking a category tile narrows down to just that category within the group (e.g. Women →
Sarees), using the shop page's existing filters plus a new `type` filter matched against each
product's assigned categories — this also means the homepage's small category circles now link
to that exact category too, not just the broader group as before.

If a group has no categories added yet in Admin → Category, its landing page just skips straight
to the product grid — nothing breaks, there's just no tile row to show.

## 9. Image Positioning (Hero Banners & Categories)

Uploaded photos rarely have their subject dead-center, so simply center-cropping them (the
default browser behavior) often cuts off the important part — especially on a hero banner, where
the crop shape is completely different on a narrow phone screen versus a wide desktop screen.

Wherever this matters, the admin form shows the actual uploaded photo in an interactive box —
**click or drag directly on the photo** to choose which part of it stays visible once it's
cropped, and it updates live as you move.

- **Hero Banners** (Admin → Hero Banner): two separate pickers, "Desktop crop" and "Mobile crop"
  — set them independently, since a photo that looks right cropped wide on desktop often needs a
  different focal point cropped tall on mobile.
- **Categories** (Admin → Category): one picker, shown at the same circular shape it'll actually
  display at on the storefront.

If you don't touch it, everything defaults to a plain center crop, same as before.

## 10. Automatic WebP Image Delivery

Every product, banner, category, and logo image uploaded through the admin panel is served as
WebP automatically — no action needed. This works by routing the image's URL through
[wsrv.nl](https://wsrv.nl) (the current domain for what's commonly known as images.weserv.nl —
same free service, same team; the old `images.weserv.nl` hostname got rate-limited after a 2022
Cloudflare policy change, so `wsrv.nl` is the one that's actually reliable today). It fetches the
original image, converts it to WebP on the fly, and serves it from a CDN edge cache.

A few things worth knowing:
- This only works on images that are **publicly reachable by URL** — real Firebase Storage
  uploads (live mode). In **demo mode**, uploaded images are stored as local `data:` URLs (see
  "Demo mode vs. Live mode" above), which no external service can fetch, so those are left
  untouched and shown in their original format. Connect Firebase to get WebP delivery.
- The default logo files shipped in `public/` are also left untouched, since they're local
  project assets, not a publicly fetchable URL, until the site is actually deployed.
- This is separate from (and complements) Next.js's own built-in image optimizer, which already
  serves WebP/AVIF automatically when deployed on Vercel. If you deploy elsewhere without that
  optimizer configured, this wsrv.nl layer is what's actually doing the WebP conversion.
- The conversion logic lives in `lib/utils.ts` (`toWebp`) and is applied via a drop-in
  `<Image>` replacement at `components/OptimizedImage.tsx` — every image-showing component
  imports `Image` from there instead of `next/image` directly, so no per-image code changed.

## 11. Product CSV Bulk Import

Admin → Product → **Import CSV**. It's built to match a real product export with these exact
columns (header row required, matching is case-insensitive):

```
ID, Name, Slug, Designer, Audience, Category, Other Categories, Sub Category, Price,
Compare Price, Currency, Size Pricing, Sizes, Colors, Fabric, Occasion, Tags, In Stock,
Stock Count, Featured, New, Sale, Best Seller, Festive, Free Shipping, Rating, Review Count,
Images, Description, Created At, Updated At
```

Notes on specific columns:
- **Only `Name` and `Price` are required** — everything else is optional.
- `Audience`: `women`/`men`/`kids` (any case) → mapped to Women/Men/Kids; anything else → Unisex.
- `Category` + `Other Categories` are combined into one category list; `Other Categories` is
  **semicolon**-separated (e.g. `Lehengas; Sarees`).
- `Sizes`, `Occasion`, `Tags`: also **semicolon**-separated.
- `Images`: **pipe**-separated (`|`) — this matches how Firebase Storage export tools typically
  format multiple URLs in one cell. The first image becomes the cover photo.
- `Colors`: format `Name (#hexcode); Name (#hexcode)` — e.g. `Maroon (#7f1d1d); Black (#000000)`.
  These render as color swatches on the product page. `ID`, `Rating`, `Review Count`, `Currency`,
  and `Updated At` are read but not currently used (ratings come from real approved reviews
  instead of imported numbers, and IDs are regenerated).
- `In Stock` (`true`/`false`) and `Stock Count` (a number) are independent — if you don't track
  exact quantities, leave `Stock Count` at 0 and just set `In Stock`. The storefront shows an
  exact count when `Stock Count > 0`, otherwise falls back to the `In Stock` flag.
- `Featured`, `New`, `Sale`, `Best Seller`: `true`/`false` — each maps to a matching badge shown
  on the product. `Festive` (`true`/`false`) is folded into the Occasion list as "Festive" if not
  already present there.
- `Created At`: an ISO date (e.g. `2026-09-28T08:10:57.842Z`) — used for "New Arrivals" sorting.

The parser correctly handles descriptions that span multiple lines/paragraphs inside quoted CSV
cells (a common gotcha with naive CSV parsers).

## 12. Deploy to Vercel

1. Push to GitHub/GitLab/Bitbucket.
2. [vercel.com/new](https://vercel.com/new) → import → framework auto-detects as Next.js.
3. Add environment variables for Production, Preview, and Development: all six
   `NEXT_PUBLIC_FIREBASE_*` vars, `NEXT_PUBLIC_SITE_URL` (your real domain), and
   `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` if using Razorpay.
4. Deploy.
5. Firebase Console → Authentication → Settings → Authorized domains → add your Vercel domain
   (needed for admin login and customer Google Sign-In).
6. (Optional) Add a custom domain in Vercel and update `NEXT_PUBLIC_SITE_URL` to match.

## 13. Checkout: State, Shipping Fee & Per-Item Cancellation

**State dropdown at checkout.** Customers now select their state from a dropdown (all 28 states
+ 8 union territories) instead of typing it. District/city stays a free-text field deliberately —
India has 775+ districts and new ones are created periodically as states reorganize them, so a
hardcoded dropdown risks being wrong or incomplete in a way a customer can't work around; a
dropdown that's missing someone's actual district is worse than a text field.

**Shipping fee.** Admin → Settings → Payments has a "Shipping Fee" field — a site-wide flat
amount charged at checkout, shown as its own line item. A product marked "Free Shipping" (Admin →
Product) waives this fee, but only when *every* item in the cart has that flag — a mixed cart
still pays the fee, so the badge never ends up more generous than intended. For a specific
product that costs more (or less) to ship than the site-wide default, Admin → Product has its own
"Shipping Cost" field — it only appears once "Free Shipping" is unchecked for that product, and
only needs filling in when that one item should differ from the default. If a cart has several
non-free items with different costs, the highest one applies rather than adding them together,
since shipping is charged per order, not per item.

**Cancel one item in an order, not the whole thing.** Admin → Order now has a Cancel button next
to each individual item — for when a customer orders 2 products but only 1 is actually in stock.
The cancelled item stays visible (struck through) for a full record of what was originally
ordered, the order shows both its original and revised total, and the customer sees the same
struck-through item with a note on their tracking page. One thing this can't do automatically:
for an order paid via Razorpay, the actual refund for the cancelled item still has to be issued
manually through your Razorpay dashboard — this app flags that it's needed, but doesn't move
money on its own.

## 12a. Product Page: Single "Add to Bag" Button

The "Buy Now" button has been removed from the product page (both desktop and the floating
mobile bar) — there's now one button, "Add to Bag." The floating mobile bar's position was also
fixed — it previously sat too close to the bottom navigation dock, with barely any gap between
them; there's now clear, deliberate spacing between every floating element on the product page
(the Add to Bag bar, the WhatsApp button, and the bottom nav).

## 13a. Mobile Menu Fixes

Several real bugs fixed in the two mobile hamburger menus (header's and the bottom nav's):
- The "Admin Dashboard" link was visible to every customer — removed; there's no reason to
  advertise the admin login path publicly.
- Opening either menu didn't prevent the page underneath from being scrolled — scrolling it down
  while the menu was open could bring the real page footer into view behind the backdrop, looking
  like broken/duplicated content. Both menus now lock background scrolling while open.
- The menu panel's height wasn't reliably filling the full screen on every device — it could cut
  off a couple of the lower menu items behind the page content instead of showing all of them.
  Switched to a sizing approach that doesn't depend on the parent element resolving a height
  correctly, which removes the ambiguity.
- **Women/Men/Kids/New Arrival now expand in place** — tapping the arrow next to one reveals its
  sub-categories right there in the menu (an accordion), instead of only being reachable by
  navigating to a separate page first. Tapping the group name itself still goes to that group's
  full page, same as before.

**Main Categories, a new admin section.** Admin → Category now has two clearly separate
sections: **Main Categories** (the four fixed groups every product belongs to — Women, Men, Kids,
New Arrival) and **Sub Categories** (the existing add/edit/delete list, e.g. "Sarees" under
Women). The four main categories can't be added to or removed, since every product's `audience`
field is structurally tied to exactly these four — but each can now have its own image, used in
the navigation menu.

## 14. Search, Sort & Filter (Shop page)

The Shop page now has a **Filters** button (price range buckets, size) and a **Sort** dropdown
(Newest, Price Low→High, Price High→Low), both reflected in the URL so filtered/sorted views are
shareable and bookmarkable. Search (the box in the header) now also matches against designer,
fabric, sub-category, and occasion — not just title, tags, and category — so a search for e.g. a
fabric name or designer surfaces relevant products.

## 15. SEO Audit Fixes (October 2026)

A real audit (SEOptimer) was run against the live site and addressed point by point — here's
what changed and, just as importantly, what's flagged but genuinely isn't a code problem:

**Fixed in code:**
- The homepage is now server-rendered instead of client-fetched — its real content (products,
  banners, reviews) is present in the very first response, not something that pops in after the
  browser runs JavaScript. This directly fixes three things the audit flagged: a high "rendering
  percentage" (content invisible to crawlers that don't fully execute JS), layout shift as
  sections popped in, and a "thin content" warning.
- Added the missing `<h1>` tag (the homepage had none — the hero banner's headline is now the
  page's H1) and a canonical tag on the homepage specifically.
- Added a dedicated, admin-editable **Meta Description** field (Admin → Settings → Branding),
  separate from the **Tagline** field — they were previously the same field, which meant a
  tagline short enough to look good in the footer was too short for an effective meta description
  (86 characters; the fixed default is within your own 120-180 target).
- Every static page's title and description were individually checked and rewritten to land
  in the 50-60 / 120-180 character ranges you specified — not just "shortened" or "lengthened"
  arbitrarily, each was verified by actual character count before being applied.
- Added a real favicon, generated from your logo mark.
- Added visible address and phone number in the footer (shows on every page) — the audit
  specifically checks for this as plain visible text, separate from the same information already
  being present in structured data.
- Logo icon images now have real alt text instead of an intentionally empty one — a deliberate
  accessibility pattern that this particular audit tool flags as a missing-alt SEO issue.
- Added Google Analytics scaffolding — inactive until you provide a real GA4 Measurement ID (see
  `.env.local.example`); nothing fabricated.

**Flagged by the audit but not a code fix — these need real-world action, not a code change:**
- **"Execute a Link Building Strategy" (High Priority).** Backlinks (other sites linking to
  yours) can't be created by changing your own code — this takes real outreach once you're live
  on your actual domain, where it'll start accumulating genuine signal.
- **Facebook/Instagram/LinkedIn/YouTube profile links, Facebook Pixel.** The mechanism to show
  these (in the footer and in structured data) already exists — it needs your *real* social
  profile URLs and a real Pixel ID in Admin → Settings, not placeholder ones.
- **DMARC/SPF mail records.** These are DNS records configured at your domain registrar, not
  something in this codebase.
- **"Friendly URLs" for filtered shop links** (e.g. `/shop?category=Women`). This is flagged
  because it uses a query parameter rather than a clean path — converting it would mean changing
  URL structure, which your own stated SEO guidelines say explicitly not to do. Left as-is,
  deliberately.

## 16. SEO & Search Console

**What's already built in, and what it actually does:**

- Every page has its own unique title and description — previously, most pages (Shop, Track,
  Account, FAQ, About, Contact, and every other static page) shared one generic title, which
  hurts how they show up in search results. Each now has real, specific metadata, generated
  server-side from your actual content/settings so it's always accurate.
- **Canonical URLs** on every page, so Google doesn't treat filtered/duplicate URL variants as
  separate pages competing with each other.
- **Open Graph and Twitter Card images** — this is what makes link previews look right when the
  site is shared on WhatsApp/Instagram, or used as a link in a Meta/Google ad. It uses your
  current hero banner photo automatically, and updates itself whenever you change the banner in
  Admin → Hero Banner — no code change needed.
- **Structured data (JSON-LD)** for your store (`ClothingStore`), every product (`Product`, with
  price/currency/availability), and the FAQ page (`FAQPage`) — this is what lets Google show
  rich results (star ratings, price, FAQ dropdowns directly in search results) rather than a
  plain blue link.
- `/account` is marked `noindex` (account pages have nothing for search engines to usefully show,
  and shouldn't be indexed) while everything customer-facing is indexable.
- Auto-generated `sitemap.xml` (every product + every static page) and `robots.txt` (blocking
  only `/admin`, `/admin-portal`, `/api`).

**To actually go live with this:**

1. Verify your domain in [Search Console](https://search.google.com/search-console). The
   easiest method: choose "HTML tag" verification, copy just the `content` value it shows you
   into `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in your environment variables (both locally and in
   Vercel), redeploy, then click Verify.
2. Submit `https://yourdomain.com/sitemap.xml` in Search Console.
3. Once live, test your link preview at
   [developers.facebook.com/tools/debug](https://developers.facebook.com/tools/debug/) (for
   Meta/Instagram ads and WhatsApp shares) and
   [cards-dev.twitter.com/validator](https://cards-dev.twitter.com/validator) — paste your URL
   and confirm the image/title/description look right before you spend on ads.

**An honest note on "ranking #1 on Google":** everything above is genuine, real technical SEO —
it removes friction and mistakes that would otherwise hold the site back. But no code change can
*guarantee* a top ranking. That depends heavily on things outside the codebase: how much unique,
genuinely useful content you publish, how many other sites link to yours, how established your
competitors already are, and how consistently you keep adding products/content over time. Think
of this work as making sure the site is no longer working against you — the ongoing part (content,
backlinks, reviews, consistency) is what actually moves rankings from here.

## 17. AEO & GEO (Answer Engines & AI Search)

These are newer, related-but-different concerns from classic SEO: **AEO** (Answer Engine
Optimization) is about showing up in voice assistants and Google's direct-answer boxes; **GEO**
(Generative Engine Optimization) is about being accurately found and cited by AI chat tools
(ChatGPT, Perplexity, Google AI Overviews, Claude, etc.) when someone asks them a shopping
question. Both are far less standardized than traditional SEO — there's no equivalent of Search
Console to verify against, and no one, including large SEO agencies, can guarantee results with
these newer systems, since the AI providers don't publish how they select what to cite.

With that honestly said, here's what's genuinely in place:

- **Structured data** — the same `Product`, `FAQPage`, and store-level JSON-LD that helps
  classic SEO rich results is also exactly what AI systems and voice assistants rely on to
  extract accurate facts (price, availability, real customer rating, business address/phone)
  instead of having to guess from prose. The store's structured address, phone number (from your
  WhatsApp number), and social profiles (`sameAs`) are included when set in Admin → Settings.
- **`BreadcrumbList` structured data** on every product page, clarifying how the page fits into
  the site (Home → Shop → Product) — this is a signal both traditional and AI-driven search use
  to understand site structure.
- **Real ratings only, never fabricated** — a product's `aggregateRating` only appears in its
  structured data once it has at least one admin-approved review; a product with zero reviews
  correctly shows no rating at all, rather than a fake one. Fabricated ratings violate Google's
  guidelines and would actively hurt trust with AI systems that cross-check claims.
- **AI crawlers are explicitly allowed** in `robots.txt` (GPTBot, ClaudeBot, Google-Extended,
  PerplexityBot, and others are named directly, not just covered by the default wildcard) — this
  makes it a deliberate choice that these systems can read and potentially recommend your store,
  rather than an accidental side effect of not blocking them.
- **`llms.txt`** at your site's root — an emerging, informal convention (not an official standard
  any AI provider has committed to reading) that gives AI systems a short, structured summary of
  what your store sells and where key pages are. It costs nothing to provide and may help as
  adoption grows; treat it as a good-faith signal, not a guaranteed lever.
- **FAQ content in a real Q&A format** (`FAQPage` schema) is specifically the format voice
  assistants and AI Overviews most reliably pull direct answers from — keeping your Admin → Pages
  FAQ section current and genuinely useful is one of the highest-leverage things you can do here.

**What actually moves the needle beyond this:** consistently accurate product information,
genuine customer reviews (the review moderation system in Admin → Reviews exists partly for
this — approve real ones promptly), and content that directly answers the questions real
customers ask. That's true for classic SEO, AEO, and GEO alike — the technical foundation above
just makes sure that content is presented in a form these systems can actually use.

## Known simplifications (by design)

- **Kids/Women/Men filtering** on the Shop page now uses the product's `audience` field
  directly (set per-product in the admin form) rather than guessing from garment categories.
- **Drag-and-drop banner reorder** uses the native HTML5 drag API (no extra dependency).
- **Colors** are photo + name metadata that swap the gallery image when clicked — there's no
  separate per-color stock tracking; total stock is still one number per product.
- **Review moderation:** every review starts unapproved. It won't appear on the product page or
  homepage "Loved By Thousands" section until an admin approves it in Admin → Reviews.
- **Role security nuance:** granting/revoking admin via Admin → Customer updates both the
  `users.role` field and the `admins` allowlist together, since the actual access check reads
  `admins`, not the self-reported `role` field.

## Directory Structure

```
zaina-boutique/
├── app/
│   ├── page.tsx                      # Homepage
│   ├── shop/page.tsx                 # Full catalog: category + search + occasion filtering
│   ├── product/[id]/                 # Product detail (gallery, colors, sizes, reviews, related)
│   ├── track/page.tsx                # Order tracking
│   ├── account/page.tsx              # Customer login/register + Google Sign-In
│   ├── about|contact|store-locator|size-guide|shipping|returns|terms|privacy/
│   ├── api/razorpay/                 # create-order + verify (server-only)
│   ├── admin-portal/login/           # Dedicated secure admin login
│   ├── admin/                        # Dashboard, products, categories, orders, discounts,
│   │                                 # customers, reviews, banner, settings
│   ├── sitemap.ts / robots.ts
│   └── layout.tsx                    # Static metadata; SiteChrome handles live theme/branding
├── components/                       # Header, Footer, BottomNav, HeroBanner (carousel),
│                                     # ProductCard, ProductGrid, ProductReviews, CartDrawer,
│                                     # CheckoutModal, WhatsAppButton, SiteChrome
├── lib/
│   ├── types.ts, data.ts, demo-data.ts, firebase.ts, use-admin-auth.ts, utils.ts
├── public/logo.png, logo-mark.png    # Extracted from your provided logo
├── store/cart.ts                     # Zustand cart (size-aware)
└── scripts/seed.ts
```
