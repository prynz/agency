# [AGENCY NAME] — Creator Marketing & Brand Partnerships Website

Futuristic storytelling one-pager in 10 chapters. Plain HTML, CSS and vanilla JavaScript: no build step, no dependencies.

**Corporate identity (colours, fonts, logo, motion, storytelling rules): see [BRAND.md](BRAND.md).**

## Storyline
| # | Chapter | Question it answers | Interaction |
|---|---|---|---|
| 00 | Intro | What is this? What will I find here? | Choose your role (Brand/Creator/Partner) → the whole page adapts |
| 01 | The shift | Why creator marketing? | Sticky scroll story with an animated phone |
| 02 | The match | What role does the agency play? | Interactive network with particles |
| 03 | What we do | What exactly do you offer? | Spotlight cards, "For you" highlights |
| 04 | Where we play | Which industries? | Accordion |
| 05 | In practice | What does that look like? | Draggable gallery |
| 06 | The people | How do you pick creators? | Animated match scan |
| 07 | How it works | How does working together go? | Timeline with progress |
| 08 | Your path | What does this mean for me? | Planner per role → becomes the contact message |
| 09 | Who we are | Who's behind it? | Principles + FAQ |
| 10 | Let's start | What now? | Contact form with role logic |

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
- **Colours, type, spacing, radii, timing:** CSS custom properties at the top of `styles.css` (documented in `BRAND.md`).
- **Planner content:** the `PLANNERS` object in `main.js`.
- **Legal pages:** the Imprint/Privacy links are placeholders (`data-legal`) and must be in place before going live (German imprint and GDPR requirements).

## Content notes
- The avatars and portrait images are **visual placeholders only**. They do not stand for real staff, clients or partners.
- No client logos, awards or performance figures are shown. Formats are described as formats, not as case studies.
- Google Fonts is loaded from Google's servers. For GDPR compliance, self-hosting is recommended (Unbounded, Manrope and JetBrains Mono are all under the SIL Open Font License).
