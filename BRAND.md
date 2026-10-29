# [AGENCY NAME] — Corporate Identity Guide

## 1. Brand idea
**"The right people. The right impact."**
We are the connection between brands, creators and partners. The visual identity says the same thing: two rings overlapping (the logo mark), lines that connect, signals that light up when something fits.

**Personality:** future-facing · precise · personal · confident, never loud.

## 2. Logo mark
Two overlapping rings: **Signal Violet** (brand side) and **Volt Lime** (creator/partner side). Where they overlap is where we work.
- Minimum size: 20 px high
- Always on a dark background (Void) or on Mist with violet rings
- Wordmark: `[AGENCY NAME]` in Unbounded 700–800, tight tracking (−0.04em)

## 3. Colour palette
| Role | Name | Hex | Use |
|---|---|---|---|
| Base | **Void** | `#07070B` | Main background |
| Base | Ink | `#0E0E15` | Raised areas |
| Base | Surface | `#15151F` | Cards |
| Text | Light | `#F1F1F6` | Text on dark |
| Text | Dim | `#A3A3B8` | Secondary text |
| Primary | **Signal Violet** | `#7B61FF` | Brand colour, highlights, lines |
| Secondary | **Pulse Cyan** | `#4DE3FF` | Gradient end, data, light |
| Action | **Volt Lime** | `#D6FF3D` | CTAs, "active", confirmations only |
| Light | Mist | `#ECECF3` | Light chapters (rhythm break) |

**Aura gradient:** `linear-gradient(115deg, #7B61FF, #A07BFF 45%, #4DE3FF)`. Use it for key words in headlines, progress and lines.

**Rules**
- Dark is the standard; light Mist sections set the rhythm of the story.
- Use Volt Lime sparingly: one strong action per screen.
- Don't put the gradient on large areas. Use it as light, not as wallpaper.
- Photos stay black-and-white (editorial). Colour comes from light and UI.

## 4. Typography
| Use | Font | Weights |
|---|---|---|
| Display / headlines | **Unbounded** | 600 · 700 · 800 |
| Body text / UI | **Manrope** | 400 · 500 · 600 · 700 |
| Labels / HUD / numbers | **JetBrains Mono** | 400 · 500, UPPERCASE, +0.08em |

- Headlines: tight leading (0.98), tracking −0.045em, sentence case
- Mark one keyword per headline with the aura gradient
- Body text at least 16 px, lead text 17–20 px
- All three fonts are under the SIL Open Font License (self-hosting allowed)

## 5. Storytelling principles
1. **Every chapter answers one question:** Why? → Who? → What? → Where? → What does it look like? → Who are the people? → How? → What does it mean for me? → Who's behind it? → What now?
2. **Every chapter ends with a bridge** ("Next: …") into the next question.
3. **The visitor chooses their role** (Brand / Creator / Partner) and the content adapts.
4. **Show, don't tell:** demonstrate (phone, network, scan) rather than claim.
5. **Honest:** no invented customers, numbers or awards.

## 6. Motion
- Easing: `cubic-bezier(.22, 1, .36, 1)`, quick in, soft out
- Typical durations: 0.2 s (hover) · 0.45 s (UI) · 0.9 s (reveals)
- Signature effects: text decode (labels), glow follows the cursor, line reveals, particles on connections
- Always respect `prefers-reduced-motion`: then everything is static and fully visible

## 7. UI components
- **Buttons:** pill shape. Volt = primary action, Ghost = secondary
- **Cards:** radius 20–28 px, a fine 1 px line, glass only where it adds depth
- **Labels:** mono, uppercase, often with a leading line (`—— CHAPTER 03`)
- **Icons:** 1.6 px stroke, round, monochrome or violet
