# Target Air Limited — ontology spec

Target Air Limited is a contract manufacturer of **unmanned aircraft**. The TA-7
is a fixed-wing platform flown either by a remote operator over an FPV link or
by an onboard autonomy stack. There is no cockpit, no crew systems and no
avionics bay in the crewed sense; the equivalent content is a flight computer,
a command and video datalink, and an electric propulsion train. The station
list and the part catalogue reflect that.

Nine object types, thirteen link types. Build them in this order, because links
can only be created once both ends exist.

The point of the model is the join. A shortage traces to a part, to the bill of
materials, to a work order, to an aircraft, to a delivery date. That chain is
what lets one screen answer "what is blocking the line and what does it cost",
which neither an MES nor an ERP can answer alone.

---

## 1. Object types

Create these first. `PK` is the primary key; `title` is what Foundry shows when
it needs a human-readable label for the object.

### Station — dataset `station`
- **PK** `station_code` · **title** `station_name`
- `sequence` integer, `standard_hours` integer, `takt_days` integer,
  `avg_cycle_days` integer

A station is over takt when `avg_cycle_days > takt_days`. That comparison is the
bottleneck test and it drives the throughput view.

### Supplier — dataset `supplier`
- **PK** `supplier_id` · **title** `supplier_name`
- `on_time_rate` double, `avg_lead_time_days` integer, `location` string

### Part — dataset `part`
- **PK** `part_number` · **title** `description`
- `supplier_id` string, `lead_time_days` integer, `criticality` string,
  `unit_cost_usd` double, `uom` string

### BomLine — dataset `bom_line`
- **PK** `bom_line_id` · **title** `bom_line_id`
- `program` string, `station_code` string, `part_number` string,
  `qty_per_aircraft` integer

Where a part is consumed. This is what turns "we are building six aircraft" into
"we need forty-eight of these".

### Aircraft — dataset `aircraft`
- **PK** `serial_number` · **title** `serial_number`
- `program` string, `status` string, `current_station_code` string,
  `build_start_date` **date**, `planned_delivery_date` **date**,
  `forecast_delivery_date` **date**, `customer` string

`forecast_delivery_date > planned_delivery_date` means the tail is late. That is
the number an executive actually reads.

### WorkOrder — dataset `work_order`
- **PK** `work_order_id` · **title** `work_order_id`
- `serial_number` string, `station_code` string, `status` string,
  `started_date` **date**, `completed_date` **date**,
  `hours_booked` integer, `standard_hours` integer

### InventoryLot — dataset `inventory_lot`
- **PK** `lot_id` · **title** `lot_id`
- `part_number` string, `qty_on_hand` integer, `location` string,
  `received_date` **date**

### Shortage — dataset `shortage`
- **PK** `shortage_id` · **title** `shortage_id`
- `part_number` string, `work_order_id` string, `serial_number` string,
  `station_code` string, `qty_short` integer, `opened_date` **date**,
  `expected_recovery_date` **date**, `status` string, `criticality` string

### NonConformance — dataset `non_conformance`
- **PK** `ncr_id` · **title** `ncr_id`
- `serial_number` string, `station_code` string, `severity` string,
  `status` string, `description` string, `opened_date` **date**,
  `closed_date` **date**, `disposition` string

---

## 2. Cast the dates

Foundry will infer every column from the CSV and the date columns will land as
**strings**. Cast them to `date` when you define each object type, or every date
filter and sort in the dashboard will be alphabetical rather than chronological,
which looks correct until it silently isn't.

The columns that need it:

| Object | Date columns |
| --- | --- |
| Aircraft | `build_start_date`, `planned_delivery_date`, `forecast_delivery_date` |
| WorkOrder | `started_date`, `completed_date` |
| InventoryLot | `received_date` |
| Shortage | `opened_date`, `expected_recovery_date` |
| NonConformance | `opened_date`, `closed_date` |

`completed_date` and `closed_date` are empty for open records. That is correct,
not missing data, and the dashboard uses the null to mean "still open".

---

## 3. Link types

All many-to-one on a foreign key. The name on the left is what you traverse from
the many side; the name in brackets is the reverse.

| From | To | Join on | Names |
| --- | --- | --- | --- |
| Part | Supplier | `supplier_id` | `supplier` / `parts` |
| BomLine | Part | `part_number` | `part` / `bomLines` |
| BomLine | Station | `station_code` | `station` / `bomLines` |
| Aircraft | Station | `current_station_code` | `currentStation` / `aircraftHere` |
| WorkOrder | Aircraft | `serial_number` | `aircraft` / `workOrders` |
| WorkOrder | Station | `station_code` | `station` / `workOrders` |
| InventoryLot | Part | `part_number` | `part` / `lots` |
| Shortage | Part | `part_number` | `part` / `shortages` |
| Shortage | WorkOrder | `work_order_id` | `blockedWorkOrder` / `shortages` |
| Shortage | Aircraft | `serial_number` | `aircraft` / `shortages` |
| Shortage | Station | `station_code` | `station` / `shortages` |
| NonConformance | Aircraft | `serial_number` | `aircraft` / `nonConformances` |
| NonConformance | Station | `station_code` | `station` / `nonConformances` |

### One deliberate decision worth being able to defend

`Shortage → Aircraft` and `Shortage → Station` are **redundant**. Both are
already reachable by going Shortage → WorkOrder → Aircraft or → Station.

They are here on purpose. The dashboard's main question is "which aircraft are
blocked right now", and answering it through a two-hop traversal on every render
is slower and harder to read than a direct link. The cost is that the foreign
keys must stay consistent with the work order, which is guaranteed here because
one generator writes all of them.

If an interviewer asks why the model is denormalised, that is the answer: a
deliberate read-path optimisation with a known integrity cost, not an oversight.
Worth raising before they ask.

---

## 4. What the data says once it is wired up

The numbers are shaped so the dashboard has something to report:

- **Wiring Harness runs 27 days against a 20-day takt.** The bottleneck. Autonomy & Datalink
  and Integration & Flight Test are marginally over as well, so it is not a single obvious
  outlier.
- **Four work orders are blocked** behind **four open shortages**, hitting tails
  TA7-034, 038, 040 and 042.
- One shortage is a **critical** part, Autonomy compute module 19, and it comes from
  **Halden Autonomy Systems — the best supplier on the list at 97 percent on time**, but
  with a 56-day lead time. This is the more interesting failure of the two the
  data contains: the supplier is not unreliable, the part is simply slow, so
  expediting will not help and the recovery date is eight weeks out.
- **Atlas Harness Systems** is the worst supplier at 71 percent on time and a
  60-day lead time, and carries eight critical parts, **but is not behind any
  open shortage today**. It is exposure, not a live problem. Worth saying out
  loud, because "worst supplier" and "current constraint" are different
  questions and a dashboard that conflates them sends people to the wrong fire.
- **Five tails are forecast late** against plan, three days each, 15 days total.
- **Two further tails, TA7-034 and TA7-035, are past their own forecast delivery
  date and still not delivered.** Their forecast equals their plan, so schedule
  variance reports them as on time while they are in fact the most overdue
  aircraft on the programme. The dashboard treats "past forecast and
  undelivered" as its own state for exactly this reason.
- **Eight open non-conformances**, heaviest at **ST-80 Integration & Flight Test**
  with three, while the throughput constraint is **ST-40 Wiring Harness**, which
  carries only one. Quality and throughput point at *different* stations here,
  so they are two problems rather than one.

Data is generated by `generate.py`, seeded deterministically, so re-running
produces identical rows and the dashboard will not shift underneath you.
