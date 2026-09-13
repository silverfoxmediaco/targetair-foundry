# Target Air — Foundry data pipeline

PySpark transforms that run *inside* Foundry, turning the raw uploaded CSVs into
clean, typed, validated datasets and precomputing the joins the dashboard would
otherwise do on every page load.

`../generate.py` produces the raw CSVs. It runs on a laptop and is a fixture,
not a pipeline. Everything here runs in Foundry on a schedule.

---

## What belongs in the pipeline and what does not

The dividing line is **whether the answer depends on "now".**

| Computation | Where | Why |
| --- | --- | --- |
| Schedule slip = forecast − planned | pipeline | Two stored dates. Stable until one changes. |
| Over takt = cycle − takt | pipeline | Two stored numbers. |
| Shortage exposure = qty × unit cost | pipeline | Needs a join, never changes with time. |
| Stock cover = on hand ÷ per airframe | pipeline | Needs a join across two object types. |
| **Is this tail overdue?** | **client** | Depends on today. A pipeline computes at build time; "today" moves. |
| **Days past forecast** | **client** | Same. |
| **Days until recovery** | **client** | Same. |

This is why `dashboard/src/data/derive.ts` still exists and still has tests.
The pipeline precomputes the facts; the client applies the clock. Precomputing
"is it overdue" in a nightly build would produce a dashboard that is wrong every
morning until the build runs, and confidently so.

---

## The transforms

### `clean_station.py`
Types and validates the station list, and adds:
- `over_takt_days` — positive means the station constrains the line
- `is_bottleneck` — true for the single station furthest past takt

Validates that exactly one station is flagged, and that the sequence is a
complete 1..n run with no gaps or duplicates. A gap in station sequence means
an aircraft can never leave the line, and it is the sort of thing that is
obvious in eight rows and invisible in eight hundred.

### `clean_aircraft.py`
Types the dates, computes `slip_days`, and validates that no forecast precedes
its own build start.

### `shortage_enriched.py`
**The showpiece.** One row per shortage, joined out to everything that explains
it:

```
shortage → part → supplier
        → work_order → aircraft
        → station
```

Carries `exposure_usd`, the supplier's on-time rate, the part's lead time, and
the tail's slip. This is the same join `useOperations.ts` performs in
TypeScript, expressed in PySpark.

Having both is deliberate and worth the duplication: the client-side join is
right for an interactive screen that must reflect an edit the instant an action
is applied, and the pipeline version is right for anything that needs history,
scheduling, or to be consumed by something that is not this dashboard. The
comparison is the point.

### `part_cover.py`
Stock cover per part: quantity on hand divided by quantity per airframe. Needs
`inventory_lot` and `bom_line` together, which is why it cannot live on either
object type alone.

---

## Deploying

These files go in a Foundry **Code Repository** using the Python Transforms
template, under `transforms-python/src/myproject/datasets/`.

1. In the Target Air Limited project: **New → Code Repository → Python
   Transforms**.
2. Replace the example transform with these files.
3. Adjust the `Input`/`Output` paths to match the project path exactly.
4. Commit, then **Build** each output dataset.
5. Point the object types at the clean datasets (Ontology Manager → object type
   → Datasources → Replace).

Step 5 is the one to take slowly. Repointing an object type changes what the
live application reads. Do one, confirm the row count and a spot-checked value,
then continue.

## Note on paths

The `Input`/`Output` paths below assume the project lives at
`/Silverformedia-70c170/Target Air Limited`. Foundry resolves these at build
time and will fail loudly if a path is wrong, which is the right behaviour — a
transform silently writing to the wrong place is worse than one that refuses to
run.
