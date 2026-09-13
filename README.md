# Target Air Limited

A prototype Palantir Foundry ontology and executive operations dashboard for a
fictional contract manufacturer of unmanned aircraft.

Built to answer one question on a single screen: **are we going to deliver, and
if not, what is stopping us.**

Everything here is synthetic. Target Air Limited does not exist, the data is
generated deterministically by `generate.py`, and the point of the project is
the modelling and the read path rather than the domain. I am not claiming
aerospace experience — this is how I would model the problem.

---

## The thesis: the join is the product

A factory runs two systems that do not talk to each other.

An **MES** knows where every aircraft is on the line. It knows station 4 is
idle. It does not know why.

An **ERP** knows you have fourteen brackets arriving on the 23rd. It does not
know that station 4 is the reason anyone cares.

Neither can answer *"which deliveries are at risk, and what is causing it"*,
because that answer requires a chain that crosses both:

```
Shortage → Part → Supplier
   ↓
WorkOrder → Aircraft → delivery date
```

That chain is what an ontology is for. Once those links exist, a row like this
becomes expressible:

> Autonomy compute module 19 is short by 2. It comes from Halden Autonomy
> Systems — 97% on time, so not an unreliable supplier — but with a 56-day lead
> time. It is blocking WO-5070 at Wiring Harness, which is holding TA7-040,
> which is forecast to deliver three days late. Recovery is eight weeks out, so
> expediting will not help.

No single source system holds all five of those facts. That is the whole
argument for the model.

---

## What the data deliberately says

The generator is seeded (1947, the Bell X-1's first flight) so the numbers never
shift between runs. They are shaped so the dashboard has something real to
report:

- **Wiring Harness runs 27 days against a 20-day takt.** It is the constraint,
  and the programme cannot beat 27 days per tail until that changes.
- **Four work orders blocked** behind four open shortages, worth $122k of parts.
- **Five tails forecast late**, three days each.
- **Two tails are past their own forecast date and still undelivered** — while
  their forecast still equals their plan, so schedule variance reports them as
  on time. The dashboard treats "past forecast and undelivered" as its own
  state, because that gap is exactly the kind of thing an executive view exists
  to catch.
- **Atlas Harness Systems is the worst supplier** at 71% on time, and carries
  eight critical parts — but is behind **no** open shortage today. Exposure, not
  a live problem. Worst supplier and current constraint are different questions,
  and a dashboard that conflates them sends people to the wrong fire.
- **Open rework is heaviest at Integration & Flight Test**, not at the
  constraint station. Quality and throughput point at different places here, so
  they are two problems rather than one.

---

## The ontology

Nine object types, thirteen link types, twenty-six traversal endpoints. Full
specification in [`ontology-spec.md`](ontology-spec.md).

| Object type | What it is |
| --- | --- |
| `Station` | A position on the line. Over takt when `avgCycleDays > taktDays`. |
| `Aircraft` | An airframe in build or delivered. Forecast against plan is the schedule signal. |
| `WorkOrder` | One job, one airframe, one station. |
| `Part` | A purchased part. Criticality and lead time decide how badly a shortage hurts. |
| `BomLine` | Where a part is consumed. Turns "six airframes" into "forty-eight of these". |
| `Supplier` | On-time rate and lead time drive shortage risk. |
| `InventoryLot` | Stock on hand, by location. |
| `Shortage` | A missing part blocking a work order. The link between supply chain and the line stopping. |
| `NonConformance` | Something built out of spec. |

### A modelling decision worth defending

`Shortage → Aircraft` and `Shortage → Station` are **redundant** — both are
already reachable via `Shortage → WorkOrder`.

They exist anyway. The dashboard's central question is "which aircraft are
blocked right now", and answering it through a two-hop traversal on every render
is slower and harder to read than a direct link. The cost is that those foreign
keys must stay consistent with the work order.

That is a deliberate read-path denormalisation with a known integrity cost, not
an oversight.

---

## Architecture

```
generate.py  →  9 CSVs  →  Foundry datasets  →  9 object types + 13 link types
                                                        ↓
                                            Ontology SDK (@target-air/sdk)
                                                        ↓
                                      React + TypeScript dashboard (OAuth/PKCE)
```

- **Data layer** — [`dashboard/src/data/useOperations.ts`](dashboard/src/data/useOperations.ts)
  fetches seven object types in one parallel round and joins them in memory on
  the same foreign keys the links are built from. At this cardinality that beats
  walking `$link` per row, which costs a request per hop.
- **Traversal proof** — [`dashboard/src/Smoke.tsx`](dashboard/src/Smoke.tsx)
  (route `/smoke`) deliberately *does* walk `$link` one object at a time, as a
  connectivity check that auth, the generated SDK and link traversal all work.
- **Presentation** — [`dashboard/src/dashboard/`](dashboard/src/dashboard/).
  Hand-written CSS modules, no component library.

### Design

Dark by deliberate choice rather than by following the viewer's theme — this is
an operations view. Ground and panel derive from the brand navy sampled from the
logo; the ice accent is reserved for structure and identity (the mark, the takt
threshold, the today rule) so that blue never means "good". State is carried by
a separate semantic set. Figures are set in a monospace face with tabular
numerals so columns align.

Typefaces are self-hosted via `@fontsource` rather than loaded from a CDN,
because Foundry serves applications under a Content Security Policy that blocks
external font hosts.

---

## Running it

Requires Node 18+ and access to the backing Foundry ontology.

```bash
cd dashboard
export FOUNDRY_TOKEN=<token from Developer Console → Ontology SDK → SDK versions → Terminal (Local)>
npm install
npm run dev
```

`FOUNDRY_TOKEN` is only needed to install `@target-air/sdk` from the Foundry npm
registry. The application itself authenticates the user through OAuth with
authorization code and PKCE; there is no client secret.

To regenerate the data:

```bash
python3 generate.py
```

---

## Notes

- `dashboard/.env.development` and `dashboard/.npmrc` are committed on purpose.
  Neither contains a secret — the OAuth client is public by design and the
  registry token is read from the environment.
- The dashboard's as-of date is the real current date, so the schedule picture
  moves with time.
- `editsummary.txt` is a running log of every change, including the mistakes.
