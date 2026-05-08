# Submit a Zazen

Open a pull request that adds a single YAML file under `content/zazen/`. That's it.

## Quickstart

```bash
git clone https://github.com/ahoward/a16zee
cd a16zee
npm install
```

Create `content/zazen/<your-slug>.yml`:

```yaml
slug: your-slug              # url-safe, lowercase, hyphens. matches the filename.
title: "Your Title Cased"    # displayed on the permalink page and in the OG image
author: "Punny Authorname"   # phonetic homophone of a real venture-adjacent figure
author_real: "real name"     # who you're parodying. lowercase. no link, no @.
body: |                      # exactly three lines. 5 / 7 / 5 syllables, traditional.
  line one. five.
  line two should be seven, yes
  line three. five again.
motif: "rolled-bill"         # one of the available motifs (see below)
caption: "EXHIBIT XIII · YOUR CAPTION HERE"
created: "2026-05-08"
```

Then build and preview:

```bash
npm run build
# open public/zazen/<your-slug>/index.html and .../og.png to eyeball the result
```

Open a PR. We'll review for:

- **5/7/5.** Traditional haiku syllable count. We will count.
- **It's actually funny.** Mid haikus get rejected. Mid is the enemy.
- **Punny but not punching down.** Homophones of real figures, fine. Real figures with sex-crime convictions, jail time for fraud-against-people, or otherwise documented-victim issues — no. We're parodying the *aesthetic*, not licensing libel.
- **No slurs, no harassment, no targeting private people.** This site exists to dunk on a particular *class* of public-figure VC, not on individuals' families, employees, or bystanders.

## Available motifs

Each motif maps to a different cocaine-pastiche illustration in the OG image:

| motif              | what it draws                                        |
|--------------------|------------------------------------------------------|
| `rolled-bill`      | rolled bill with `$1M / SAFE NOTE / NO DECK`         |
| `polaroid`         | polaroid frame, blank, "developed in the bathroom"   |
| `mirror-rails`     | tabletop with two horizontal rails                   |
| `ledger-paper`     | green ledger sheet with absurd line items            |
| `stack-of-paper`   | a deck v47 nobody will read                          |
| `chain-pendant`    | gold chain with terminal-cursor pendant              |
| `speech-bubble`    | giant pull-quote in monospace                        |
| `calendar-grid`    | 10-week curriculum, every day x'd out                |
| `parking-stripe`   | dark parking lot, spot 47, 3:00 am                   |
| `gift-wrap`        | "platform" wrapped in a bow                          |
| `x-marks-spot`     | giant red X over the word MID                        |
| `git-graph`        | branching graph ending in `push --force`             |

Want a new motif? Add it to `scripts/build.js` (`motifs` object) in the same PR.
SVG art only. Black on white. No raster, no glassmorphism.

## What gets generated

For each `content/zazen/<slug>.yml`:

- `public/zazen/<slug>/index.html` — permalink page with full OG/Twitter card meta
- `public/zazen/<slug>/og.png` — 1200×630 PNG used in social unfurls
- `public/zazen/index.html` — re-rendered index of all haikus
- `public/zazen/manifest.json` — used by the landing page modal to pick a random one

You don't commit the generated files in `public/zazen/`. CI handles that on merge.

## Style notes

- All-lowercase haiku body. Capital letters break the trance.
- Periods optional. Em-dashes welcome. Semi-colons forbidden.
- Don't use the word "disrupt." We mean it.
- Rhyming is allowed but suspicious.

## Secrets / forking

If you fork this repo and want CI to deploy your own preview, copy `.env.example`
to `.env`, fill in the values, and run `gh lockbox dotenv push .env`. See
`.env.example` for what each secret is for and how to provision it. `.env` is
.gitignored — never commit it.

## Licensing

By submitting, you agree your contribution is licensed under MIT (same as the
repo). You also accept that some VC associate may see this and tweet about it,
which is karma you're choosing to invite.

#vcevil
