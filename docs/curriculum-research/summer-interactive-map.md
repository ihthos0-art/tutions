# Manha Summer Prep — 8-Week Interactive Map

**Student:** Manha, age 8–10, Grade 3→4 bridge, Brooklyn NY
**Schedule:** 8 weeks × 4 days. Pattern: D1=Math+Sci, D2=ELA+SS, D3=Math+ELA, D4=Sci+SS.
**Per-day structure (fixed order):** Math/subj1 **Lesson** → **Drill** (5–6 Q) → subj2 **Lesson** → **Practice** (recap) → **Activity** (combined mission, 4 gates).
**Sequential unlock:** Day N+1 locked until Day N done.

**Constraint:** No two days in a week share the same activity-gate engine set. Each week introduces ≥1 new interactive mechanic so the 8 weeks feel distinct, not repetitive.

---

## Engine pool (built + planned)

### Built (available now — 12 engines)
| Engine | How it works | Best fit |
|--------|--------------|----------|
| `quizMC` | Multiple-choice, sequential, scored | any drill |
| `trueFalse` *(W2)* | ✓/✗ statements, reveal right answer | quick math/checks |
| `fillBlank` | Click word-bank → fill sentence blanks | ELA, science sentences |
| `scramble` *(W2)* | Tap word tiles → rebuild a sentence | ELA |
| `match` | Tap left then right to pair term↔def | vocab all subjects |
| `dragSort` | Drag items into correct order | steps/sequence |
| `timeline` *(W2)* | Tap event → tap the era slot it belongs in | SS history, sci processes |
| `categorize` *(W2)* | Tap item → tap the bin it belongs in | classification |
| `wordSearch` | Find hidden words in a grid | vocab terms |
| `flip` | Tap cards to flip front/back | recall |
| `hangman` | Guess letters of a term w/ hint | vocab |
| `scratch` | Wipe canvas to reveal a fact | reward/reveal |
| **gate-native:** `quiz` (MC gate), `input` (text), `seek` (tap-all-that-apply) | — | activity gates |

### Planned (build in the week they premiere)
| Engine | How it works | Premiere |
|--------|--------------|----------|
| `labelDiagram` | Drag labels onto CSS-diagram hotspots | W3 |
| `venn` | Sort items into left-only / right-only / intersection | W3 |
| `twoTruths` | 3 statements, tap the one that's false | W4 |
| `numberLine` | Tap the correct dot on a CSS number line | W4 |
| `fractionBar` | Drag bar segments to build a target fraction | W5 |
| `higherLower` | Guess if next card is higher/lower | W5 |
| `crossword` | Mini grid, clues, tap cell → type letter | W6 |
| `cloze` | Passage with per-blank drop-down choices | W6 |
| `maze` | Tap adjacent cells to route start→goal, micro-prompts | W7 |
| `cryptoHack` | Correct answers reveal chars of a hidden phrase | W7 |
| `bossMix` | Multi-engine capstone mission (chains 5+ gates) | W8 |

---

## Week-by-week plan

### Week 1 — Foundations *(BUILT)*
| Day | Subj1 + topic | Drill | Subj2 + topic | Practice | Activity gates |
|-----|---------------|-------|---------------|----------|----------------|
| 1-0 | Math: place value to 1M | quizMC | Sci: forms of energy | match | quiz · match · input · fillBlank |
| 1-1 | ELA: close reading & evidence | quizMC | SS: NYS geography | wordSearch | quiz · dragSort · match · input |
| 1-2 | Math: multiplicative comparison | fillBlank | ELA: summary vs central idea | dragSort | hangman · fillBlank · input · match |
| 1-3 | Sci: energy transfers | quizMC | SS: map types | flip | quiz · match · input · scratch |

*Signature: phase-runner + 8 base engines. Pink worksheet layer.*

### Week 2 — Multi-Digit Operations *(BUILT THIS SESSION)*
| Day | Subj1 + topic | Drill | Subj2 + topic | Practice | Activity gates |
|-----|---------------|-------|---------------|----------|----------------|
| 2-0 | Math: multi-digit +/− algorithms | quizMC | Sci: energy conversions intro | **categorize** | **trueFalse** · match · input · fillBlank |
| 2-1 | ELA: text structure (sequence & cause/effect) | **scramble** | SS: Haudenosaunee & Algonquian | **timeline** | quiz · match · input · dragSort |
| 2-2 | Math: 4-digit × 1-digit area model | fillBlank | ELA: paragraphs + topic sentence | **scramble** | **trueFalse** · dragSort · input · match |
| 2-3 | Sci: designing energy devices | quizMC | SS: geography shaped Native life | **categorize** | dragSort · match · input · **timeline** |

*Premiere: `trueFalse`, `scramble`, `timeline`, `categorize`. All 4 activity sets distinct; no within-day drill/practice/gate repeat. (Code keys: `1-0`..`1-3` — zero-indexed week in JS.)*

### Week 3 — Multiplication & Division *(planned)*
| Day | Subj1 + topic | Drill | Subj2 + topic | Practice | Activity gates |
|-----|---------------|-------|---------------|----------|----------------|
| 3-0 | Math: 2-digit × 2-digit | fillBlank | Sci: vision & light | **labelDiagram** (eye) | quiz · labelDiagram · input · fillBlank |
| 3-1 | ELA: opinion writing (claim+reasons) | scramble | SS: explorers (Verrazano/Hudson/Champlain) | timeline | scramble · timeline · match · input |
| 3-2 | Math: division w/ remainders | quizMC | ELA: linking words | dragSort | quiz · dragSort · input · match |
| 3-3 | Sci: light reflection & eye | **twoTruths** | SS: New Netherland → New York | **venn** (Dutch/English colony traits) | twoTruths · venn · input · match |

*Premiere: `labelDiagram`, `venn`. Diagram week.*

### Week 4 — Fractions *(planned)*
| Day | Subj1 + topic | Drill | Subj2 + topic | Practice | Activity gates |
|-----|---------------|-------|---------------|----------|----------------|
| 4-0 | Math: fraction equivalence | **numberLine** | Sci: animal structures & survival | categorize | numberLine · categorize · input · match |
| 4-1 | ELA: informative/explanatory writing | scramble | SS: colonial life in NY | timeline | scramble · timeline · match · input |
| 4-2 | Math: comparing fractions | **higherLower** | ELA: Greek & Latin roots/affixes | match | higherLower · match · input · dragSort |
| 4-3 | Sci: senses & processing info | twoTruths | SS: Am Revolution in NY (Loyalists/Patriots) | flip | twoTruths · flip · input · categorize |

*Premiere: `numberLine`, `higherLower`. Comparison week.*

### Week 5 — Fractions & Decimals *(planned)*
| Day | Subj1 + topic | Drill | Subj2 + topic | Practice | Activity gates |
|-----|---------------|-------|---------------|----------|----------------|
| 5-0 | Math: add/subtract fractions (like denom) | **fractionBar** | Sci: rock layers & fossils | timeline | fractionBar · timeline · input · match |
| 5-1 | ELA: similes & metaphors | scramble | SS: branches of government | categorize (3 bins: leg/exec/jud) | scramble · categorize · match · input |
| 5-2 | Math: mixed numbers; whole × fraction | fillBlank | ELA: multiple-meaning words & context clues | flip | quiz · fillBlank · input · match |
| 5-3 | Sci: weathering/erosion/deposition | dragSort (process order) | SS: Brooklyn/Kings County local gov | labelDiagram (NYC boroughs) | dragSort · labelDiagram · input · timeline |

*Premiere: `fractionBar`. Visual-model week.*

### Week 6 — Measurement & Geometry *(planned)*
| Day | Subj1 + topic | Drill | Subj2 + topic | Practice | Activity gates |
|-----|---------------|-------|---------------|----------|----------------|
| 6-0 | Math: decimals (tenths/hundredths) | numberLine | Sci: topographic maps & landforms | labelDiagram | numberLine · labelDiagram · input · match |
| 6-1 | ELA: idioms, adages, proverbs | **crossword** | SS: rights & responsibilities of citizens | flip | crossword · flip · input · match |
| 6-2 | Math: measurement conversions; area & perimeter | fillBlank | ELA: narrative writing w/ dialogue | scramble | quiz · fillBlank · input · scramble |
| 6-3 | Sci: natural hazards & engineering | categorize | SS: slavery, abolition, Underground Railroad | timeline | categorize · timeline · input · dragSort |

*Premiere: `crossword`. Word-puzzle week.*

### Week 7 — Angles & Advanced Reading *(planned)*
| Day | Subj1 + topic | Drill | Subj2 + topic | Practice | Activity gates |
|-----|---------------|-------|---------------|----------|----------------|
| 7-0 | Math: angle measurement w/ protractor | dragSort (protractor steps) | Sci: waves — amplitude/wavelength/sound | **cloze** | dragSort · cloze · input · match |
| 7-1 | ELA: primary vs secondary sources | **twoTruths** | SS: women's rights & Seneca Falls | timeline | twoTruths · timeline · match · input |
| 7-2 | Math: additive & unknown angles | fillBlank | ELA: research note-taking & categorizing facts | categorize | quiz · fillBlank · input · categorize |
| 7-3 | Sci: how dolphins/waves communicate | **maze** (signal path) | SS: immigration through Ellis Island | **cryptoHack** | maze · cryptoHack · input · match |

*Premiere: `cloze`, `maze`, `cryptoHack`. Process/communication week.*

### Week 8 — Capstone & Review *(planned)*
| Day | Subj1 + topic | Drill | Subj2 + topic | Practice | Activity gates |
|-----|---------------|-------|---------------|----------|----------------|
| 8-0 | Math: multi-step word problem review | quizMC | Sci: engineering design challenge | dragSort (design steps) | quiz · dragSort · input · **bossMix** |
| 8-1 | ELA: write a short informative article | scramble | SS: industrialization, Erie Canal, transport | timeline | scramble · timeline · match · input |
| 8-2 | Math: mixed Grade 4 skills review | higherLower | ELA: oral presentation practice | flip | higherLower · flip · input · match |
| 8-3 | Sci: science vocab review game | **crossword** | SS: famous New Yorkers then & now | match | crossword · match · input · **bossMix** |

*Premiere: `bossMix` (chains 5+ engines in one mission — capstone). Review week reuses the whole pool.*

---

## Anti-repetition rules
1. Each day's **activity gate set** must be unique within its week.
2. A day's **practice engine** must not equal that day's **drill engine** or any of its **activity gate** engines (no within-day repeat).
3. Each week premieres ≥1 new engine (above) so the 8 weeks feel distinct.
4. Repeats across weeks are allowed (only ~16 engines for 32 days × 4 gates) — variety comes from unique *sets* + unique *content* + premieres.

## Diagram library (CSS-only, no images)
`.sg-pv` place-value chart · `.sg-energy-forms` chip row · `.sg-flow` IN→box→OUT · geography/map-type chips · (W3+) eye diagram, borough map, fraction bar, number line, wave — all CSS/SVG.

## Source
Patterns drawn from `curriculum-research/interactive-activities.md`, `kid-ux-gamification.md`, `animations.md`, `2026-06-27-summer-interactive-design.md`, plus community research (r/Teachers, r/edtech, HN, Blooket/Gimkit/Kahoot/Duolingo/Khan mechanics). Curriculum from `summer-prep-plan.md` (NYSED Next Gen standards).