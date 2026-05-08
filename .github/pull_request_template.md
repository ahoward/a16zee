<!--
thanks for submitting a zazen.

if your PR adds a single content/zazen/*.yml file and nothing else, ignore
the structural section below. the linter will tell you if anything's off,
and the preview workflow will post a link to your haiku's permalink + OG
card so you can eyeball it.

if your PR touches scripts/, public/, or .github/ — fill out the structural
section. those reviews take longer.
-->

## what kind of change is this?

- [ ] adding a new haiku (`content/zazen/<slug>.yml` only)
- [ ] adding a new motif (`scripts/build.js` + a haiku that uses it)
- [ ] structural change (build pipeline, landing page, CI, deps)

---

## if you're adding a haiku

**slug:** `<slug>`
**title:** `<title>`
**author:** `<punny VC name>` (parodying: `<real name>`)
**motif:** `<one of the motifs in CONTRIBUTING.md>`

**body:**
```
line one
line two with seven syllables
line three again
```

**self-check:**
- [ ] 5 / 7 / 5 syllables (the linter will second-guess you, but be honest)
- [ ] doesn't use the word "disrupt"
- [ ] author is a *phonetic homophone* of a real public-figure VC, not a real name
- [ ] the figure being parodied is **not** convicted of sex crimes, fraud against
      individuals, or otherwise documented-victim issues
- [ ] no slurs, no harassment, no targeting of private people
- [ ] it's actually funny (mid is the enemy)

---

## if you're adding a motif

new motifs go in `scripts/build.js` under the `motifs` object. SVG only,
black on white, sized to fit the right half of the 1200×630 OG card
(roughly the area `x=720..1140, y=200..480`).

- [ ] motif renders cleanly at 1200×630
- [ ] no raster images, no external fonts, no glassmorphism
- [ ] include a haiku that uses it (proves the integration)
- [ ] update `CONTRIBUTING.md` motif table

---

## if it's structural

these get extra scrutiny.

- [ ] explain *why* — what's the user-visible change?
- [ ] does it change how PRs from contributors are reviewed or built?
- [ ] does it touch how the rickroll / modal / form flow behaves?
- [ ] is it backwards-compatible with existing `content/zazen/*.yml` files?

---

## checklist (everyone)

- [ ] `npm run lint` passes locally
- [ ] `npm run build` produces output without errors
- [ ] preview workflow link looks right (it'll auto-comment after CI runs)

#vcevil
