"""
Synthetic data for Target Air Limited, a fictional contract manufacturer of
unmanned aircraft. The TA-7 is a fixed-wing group 3 platform flown either by a
remote operator on an FPV link or by an onboard autonomy stack, so the line
carries no cockpit, no crew systems and no avionics bay in the crewed sense.
What it does carry is a flight computer, a command and video datalink, and an
electric propulsion train.

Nine datasets that become nine object types. The point of the model is the
join: a shortage traces through a part, to the bill of materials, to a work
order, to an airframe, to a delivery date. That chain is what lets one view
answer "what is blocking the line and what does it cost", which no single
source system can answer on its own.

The numbers are deliberately shaped so the dashboard has something to say:
one genuine bottleneck station, a small number of shortages with one of them
critical, and a quality problem concentrated in a single station.

Deterministic: same seed, same data, so the dashboard does not change shape
between runs.
"""

import csv
import random
from datetime import date, timedelta
from pathlib import Path

random.seed(1947)  # first flight of the Bell X-1

OUT = Path(__file__).parent / "data"
OUT.mkdir(exist_ok=True)

TODAY = date(2026, 9, 11)
PROGRAM = "TA-7"
TAKT_DAYS = 20

# --------------------------------------------------------------------------
# stations: the line, in order. Wiring is the deliberate bottleneck.
# --------------------------------------------------------------------------

STATIONS = [
    # code, name, sequence, standard hours, actual cycle days
    ("ST-10", "Airframe Build", 1, 320, 18),
    ("ST-20", "Wing & Boom Mate", 2, 280, 19),
    ("ST-30", "Actuation & Control Surfaces", 3, 240, 17),
    ("ST-40", "Wiring Harness", 4, 400, 27),   # bottleneck, 27 against takt 20
    ("ST-50", "Autonomy & Datalink", 5, 300, 21),
    ("ST-60", "Propulsion & Power", 6, 260, 18),
    ("ST-70", "Finish & Coatings", 7, 160, 12),
    ("ST-80", "Integration & Flight Test", 8, 340, 22),
]


def write(name, header, rows):
    path = OUT / f"{name}.csv"
    with path.open("w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(header)
        writer.writerows(rows)
    print(f"  {name}.csv  {len(rows)} rows")


# --------------------------------------------------------------------------
# 1. stations
# --------------------------------------------------------------------------

station_rows = [
    [code, name, seq, hours, TAKT_DAYS, cycle]
    for code, name, seq, hours, cycle in STATIONS
]
write(
    "station",
    ["station_code", "station_name", "sequence", "standard_hours",
     "takt_days", "avg_cycle_days"],
    station_rows,
)

# --------------------------------------------------------------------------
# 2. suppliers
# --------------------------------------------------------------------------

SUPPLIERS = [
    ("SUP-001", "Meridian Composites", 0.94, 21, "Wichita, KS"),
    ("SUP-002", "Corvus Machining", 0.88, 35, "Hartford, CT"),
    ("SUP-003", "Halden Autonomy Systems", 0.97, 45, "San Jose, CA"),
    ("SUP-004", "Ferrostone Fasteners", 0.99, 10, "Cleveland, OH"),
    ("SUP-005", "Lyra Propulsion", 0.82, 90, "Indianapolis, IN"),
    ("SUP-006", "Atlas Harness Systems", 0.71, 60, "Monterrey, MX"),
]
write(
    "supplier",
    ["supplier_id", "supplier_name", "on_time_rate", "avg_lead_time_days", "location"],
    [list(s) for s in SUPPLIERS],
)

# --------------------------------------------------------------------------
# 3. parts
# --------------------------------------------------------------------------

# Slot order, supplier, lead time and criticality are load bearing: the part
# loop indexes this list and the random draws that follow depend on the
# sequence, so only the names change when the domain vocabulary changes.
#
# The fifth field is the station that consumes the family. It is explicit for a
# reason: this used to be derived as STATIONS[index % 8] while the family was
# PART_FAMILIES[index % 8], so a family landed at whatever station shared its
# slot. The 1:1 mapping was a coincidence of two equal-length lists, and it put
# autonomy compute modules on the wiring station.
PART_FAMILIES = [
    ("Structural bracket", "SUP-002", 35, "standard", "ST-10"),
    ("Composite panel", "SUP-001", 21, "standard", "ST-20"),
    ("Wiring harness assembly", "SUP-006", 60, "critical", "ST-40"),
    ("Autonomy compute module", "SUP-003", 45, "critical", "ST-50"),
    ("Servo actuator", "SUP-002", 40, "standard", "ST-30"),
    ("Fastener kit", "SUP-004", 10, "standard", "ST-70"),
    ("Propulsion mount", "SUP-005", 90, "critical", "ST-60"),
    ("Navigation sensor assembly", "SUP-003", 30, "standard", "ST-80"),
]

parts = []
for index in range(1, 61):
    family, supplier, lead, crit, _station = PART_FAMILIES[index % len(PART_FAMILIES)]
    parts.append([
        f"P-{1000 + index}",
        f"{family} {index:02d}",
        supplier,
        lead + random.randint(-5, 12),
        crit,
        round(random.uniform(40, 9800), 2),
        random.choice(["EA", "EA", "EA", "KIT"]),
    ])
write(
    "part",
    ["part_number", "description", "supplier_id", "lead_time_days",
     "criticality", "unit_cost_usd", "uom"],
    parts,
)

# --------------------------------------------------------------------------
# 4. bill of materials: which part is consumed at which station
# --------------------------------------------------------------------------

bom = []
for row in parts:
    part_number = row[0]
    # Consumed where the family says, not where the index happens to land.
    index = int(part_number[2:]) - 1000
    station_code = PART_FAMILIES[index % len(PART_FAMILIES)][4]
    bom.append([
        f"BOM-{part_number}",
        PROGRAM,
        station_code,
        part_number,
        random.choice([1, 1, 2, 2, 4, 8]),
    ])
write(
    "bom_line",
    ["bom_line_id", "program", "station_code", "part_number", "qty_per_aircraft"],
    bom,
)

# --------------------------------------------------------------------------
# 5. airframes: 12 tails spread across the line
# --------------------------------------------------------------------------

aircraft = []
for index in range(1, 13):
    serial = f"TA7-{30 + index:03d}"
    if index <= 3:
        status, station_index = "Delivered", 8
    elif index <= 5:
        status, station_index = "In Test", 8
    else:
        status, station_index = "In Build", min(8, 9 - (index - 5))
    station_code = STATIONS[station_index - 1][0]
    start = TODAY - timedelta(days=(13 - index) * TAKT_DAYS + random.randint(-4, 4))
    planned = start + timedelta(days=TAKT_DAYS * 8)
    aircraft.append([
        serial,
        PROGRAM,
        status,
        station_code if status != "Delivered" else "",
        start.isoformat(),
        planned.isoformat(),
        (planned + timedelta(days=random.choice([0, 0, 0, 3, 9]))).isoformat()
        if status != "Delivered" else planned.isoformat(),
        random.choice(["Customer A", "Customer A", "Customer B", "Internal"]),
    ])
write(
    "aircraft",
    ["serial_number", "program", "status", "current_station_code",
     "build_start_date", "planned_delivery_date", "forecast_delivery_date",
     "customer"],
    aircraft,
)

# --------------------------------------------------------------------------
# 6. work orders: one per aircraft per station it has reached
# --------------------------------------------------------------------------

work_orders = []
wo_index = 0
for row in aircraft:
    serial, _, status, current, start_iso, *_ = row
    start_date = date.fromisoformat(start_iso)
    reached = 8 if status in ("Delivered", "In Test") else next(
        s[2] for s in STATIONS if s[0] == current
    )
    cursor = start_date
    for code, name, seq, hours, cycle in STATIONS:
        if seq > reached:
            break
        wo_index += 1
        if seq < reached or status == "Delivered":
            wo_status = "Complete"
            completed = cursor + timedelta(days=cycle)
        else:
            wo_status = random.choice(["In Progress", "In Progress", "Blocked"])
            completed = ""
        work_orders.append([
            f"WO-{5000 + wo_index}",
            serial,
            code,
            wo_status,
            cursor.isoformat(),
            completed.isoformat() if completed else "",
            hours if wo_status == "Complete" else round(hours * random.uniform(0.2, 0.8)),
            hours,
        ])
        cursor = cursor + timedelta(days=cycle)
write(
    "work_order",
    ["work_order_id", "serial_number", "station_code", "status",
     "started_date", "completed_date", "hours_booked", "standard_hours"],
    work_orders,
)

# --------------------------------------------------------------------------
# 7. inventory on hand
# --------------------------------------------------------------------------

inventory = []
for index, row in enumerate(parts):
    part_number = row[0]
    # a handful are deliberately at or below zero cover
    qty = 0 if index in (2, 18, 34) else random.randint(4, 240)
    inventory.append([
        f"LOT-{7000 + index}",
        part_number,
        qty,
        random.choice(["STORES-A", "STORES-A", "STORES-B", "LINESIDE-4"]),
        (TODAY - timedelta(days=random.randint(3, 120))).isoformat(),
    ])

# inventory_lot is written further down, after shortages, so the two datasets
# can be reconciled. See the note at the end of section 8.

# --------------------------------------------------------------------------
# 8. shortages: the ones that actually stop work
# --------------------------------------------------------------------------

blocked = [w for w in work_orders if w[3] == "Blocked"]
shortages = []
for index, wo in enumerate(blocked[:6]):
    station_code = wo[2]
    candidates = [b for b in bom if b[2] == station_code]
    if not candidates:
        continue
    bom_row = candidates[index % len(candidates)]
    part_number = bom_row[3]
    part = next(p for p in parts if p[0] == part_number)
    opened = TODAY - timedelta(days=random.randint(2, 26))
    shortages.append([
        f"SHT-{index + 1:03d}",
        part_number,
        wo[0],
        wo[1],
        station_code,
        random.choice([2, 4, 6, 12]),
        opened.isoformat(),
        (opened + timedelta(days=part[3])).isoformat(),
        "Open",
        part[4],
    ])
write(
    "shortage",
    ["shortage_id", "part_number", "work_order_id", "serial_number",
     "station_code", "qty_short", "opened_date", "expected_recovery_date",
     "status", "criticality"],
    shortages,
)

# A part cannot be short and well stocked at the same time. The stock-out used
# to be three hardcoded part indices chosen before the shortages existed, so a
# shorted part could show 229 on hand, which is visibly wrong on any screen
# that puts the two side by side. Reconcile after the fact instead.
#
# Patched here rather than by reordering the generation, because the random
# draws above must keep their sequence or every other number in the dataset
# shifts.
short_part_numbers = {row[1] for row in shortages}
for lot in inventory:
    if lot[1] in short_part_numbers:
        lot[2] = 0
write(
    "inventory_lot",
    ["lot_id", "part_number", "qty_on_hand", "location", "received_date"],
    inventory,
)

# --------------------------------------------------------------------------
# 9. non-conformances, concentrated in wiring
# --------------------------------------------------------------------------

ncr_rows = []
for index in range(1, 23):
    station_code = "ST-40" if index % 3 == 0 else random.choice(
        [s[0] for s in STATIONS]
    )
    serial = random.choice([a[0] for a in aircraft])
    opened = TODAY - timedelta(days=random.randint(1, 90))
    severity = random.choice(["Minor", "Minor", "Minor", "Major", "Critical"])
    status = random.choice(["Open", "Open", "Dispositioned", "Closed", "Closed"])
    ncr_rows.append([
        f"NCR-{2000 + index}",
        serial,
        station_code,
        severity,
        status,
        random.choice([
            "Hole position out of tolerance",
            "Surface finish below spec",
            "Torque value not recorded",
            "Connector pin damage",
            "Sealant cure time not met",
        ]),
        opened.isoformat(),
        "" if status == "Open" else
        (opened + timedelta(days=random.randint(2, 21))).isoformat(),
        random.choice(["Use As Is", "Rework", "Rework", "Scrap"])
        if status != "Open" else "",
    ])
write(
    "non_conformance",
    ["ncr_id", "serial_number", "station_code", "severity", "status",
     "description", "opened_date", "closed_date", "disposition"],
    ncr_rows,
)

print(f"\nwritten to {OUT}")
