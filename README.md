# [AGENCY NAME] — Creator Marketing & Brand Partnerships Website

Premium editorial one-pager. Plain HTML, CSS and vanilla JavaScript: no build step, no dependencies.

## Run locally
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Structure
```
index.html             All sections (Hero → Contact, Footer)
assets/css/styles.css  Design tokens (:root) + components + responsive styles
assets/js/config.js    Brand name, email, location, socials, form endpoint
assets/js/main.js      Interactions (nav, scroll spy, planner, form …)
```

## Customise
- **Brand name / email / location / socials:** `assets/js/config.js`. Every `[data-brand]`, `[data-email]` … element updates automatically. For SEO, also replace `[AGENCY NAME]` in the `<title>`/`<meta>` tags of `index.html`.
- **Contact form:** set `formEndpoint` to a URL that accepts a JSON POST (own API, Formspree, Make/Zapier webhook …). If it's empty, the form opens a pre-filled email (mailto).
- **Colours, type, spacing, radii, timing:** CSS custom properties at the top of `styles.css`.
- **Legal pages:** the Imprint/Privacy links are placeholders (`data-legal`) and must be in place before going live (German imprint and GDPR requirements).

## Content notes
- The avatars and portrait images are **visual placeholders only**. They do not stand for real staff, clients or partners.
- No client logos, awards or performance figures are shown. Formats are described as formats, not as case studies.
- Google Fonts is loaded from Google's servers. For GDPR compliance, self-hosting is recommended (Inter Tight and Archivo are both under the SIL Open Font License).
