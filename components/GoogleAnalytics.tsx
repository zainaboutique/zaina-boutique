import Script from "next/script";

// Renders nothing unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set as an
// environment variable (Vercel → Settings → Environment Variables) — get
// this ID from Google Analytics → Admin → Data Streams → your web stream.
// No code change needed once that's set; this activates automatically.
export default function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!id) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
