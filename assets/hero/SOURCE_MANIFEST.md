# Hero imagery — BLOCKED, nothing downloaded

**Status as of 2026-08-10: zero images in this folder.** Step 2/3 of the
premium-visual-direction task (real Atlantis Holidays photography for a
hero band, plus a tagline pulled verbatim from the live site) could not be
attempted. This file exists to document exactly why, per the task's
explicit instruction not to fabricate or hallucinate placeholder imagery
or invented brand copy in place of the real thing.

## What was checked

Per the task's Step 1, network reachability was verified before doing
anything else, using two independent methods:

1. Direct `curl` through this sandbox's egress proxy:
   ```
   curl -I https://atlantisholidays.com
   curl -I https://atlantisholidays.com/assets/web/img/atlantis/favicon/ms-icon-144x144.png
   ```
   Both returned `curl: (56) CONNECT tunnel failed, response 403` — the
   proxy's CONNECT tunnel to `atlantisholidays.com` is rejected outright,
   confirmed via `$HTTPS_PROXY/__agentproxy/status`, which logs the
   rejection as `connect_rejected` / "gateway answered 403 to CONNECT
   (policy denial or upstream failure)" — the same class of denial that
   blocked `unpkg.com` during PR #1.

2. The `WebFetch` tool (a separate fetch path from this sandbox's local
   proxy, in case it had different egress):
   ```
   WebFetch(url: "https://atlantisholidays.com/", ...)
   ```
   Returned `{"error_type":"EGRESS_BLOCKED","domain":"atlantisholidays.com", ...}`
   — blocked at the same layer, independent of the local curl/proxy path.

## Why there's no partial URL list

The task anticipated a partial outcome — raw HTML reachable but JS-rendered
lazy-loaded images not — and asked for whatever image URLs could be
identified from page source even if full rendering wasn't possible. That
didn't happen here: **neither method returned any content at all**, not
even the initial HTML response. There is no page source to inspect, so
there are no candidate image URLs to hand off — not even unverified or
low-confidence ones. Listing anything here without actually having seen it
would be exactly the fabrication the task said not to do.

## What's needed to unblock this

One of:

- A human downloads 2-4 hero-quality images directly from
  `https://atlantisholidays.com/` and `https://atlantisholidays.com/destination/the-uae`
  and drops them into this folder, along with the source URL for each
  (needed for the licensing note below) and the exact tagline text they
  want used (also unverifiable without site access — do not treat
  "Luxury travel experts" or similar as confirmed copy, it was only ever
  an example in the task description, not something read off the site).
- This session/environment gets `atlantisholidays.com` added to its
  egress allowlist, so the originally-planned Playwright capture (load
  the homepage + UAE destination page, scroll to trigger lazy-loaded
  images, enumerate rendered `<img>`/background-image URLs, download the
  best 2-4 at full resolution) can run as specified.

## Licensing caveat (flagging per the task's explicit request)

Even once images are obtained, note before this tool is ever exposed
publicly: marketing photography on a hospitality site's public pages is
frequently third-party stock licensed only for use on that specific site,
not for redistribution elsewhere. Whoever manages Atlantis Holidays'
marketing site photo licenses should review the actual source/license of
any image placed in this folder before this internal tool becomes
public-facing. This manifest should be updated with each image's
confirmed license status once that review happens.

## What shipped instead this pass

The two changes in this task that didn't depend on site access:
removing the lamp/theme-toggle illustration in favor of a plain icon
switch, and self-hosting the Fraunces typeface. No hero band markup was
added to `index.html` — the header stays as the existing logo + title +
subtitle treatment (unchanged copy, nothing invented) so there's no
placeholder gradient or stand-in image pretending to be final direction.
