"""Shortage, joined out to everything that explains it.

    shortage → part → supplier
             → work_order → aircraft
             → station

One row per shortage carrying the part it is short of, who owes it, how
reliable they are, how long a replacement takes, which work order it blocks,
which tail that work order belongs to, and what the tail's schedule position is.

This is the same join `dashboard/src/data/useOperations.ts` performs in
TypeScript. Both exist on purpose. The client-side version has to be there so
that applying an action updates the screen immediately. This version is what
anything else consumes — a scheduled report, an alerting rule, a Workshop
module, or a second application that should not have to re-derive the same
thing and risk deriving it differently.

Nothing here depends on the current date. `days_to_recovery` deliberately is
NOT computed: it would be correct only until the next build.
"""

from pyspark.sql import functions as F
from pyspark.sql import types as T
from transforms.api import Input, Output, transform_df

PROJECT = "/Silverformedia-70c170/Target Air Limited"


@transform_df(
    Output(f"{PROJECT}/clean/shortage_enriched"),
    shortage=Input(f"{PROJECT}/shortage"),
    part=Input(f"{PROJECT}/part"),
    supplier=Input(f"{PROJECT}/supplier"),
    work_order=Input(f"{PROJECT}/work_order"),
    aircraft=Input(f"{PROJECT}/aircraft"),
    station=Input(f"{PROJECT}/clean/station"),
)
def compute(shortage, part, supplier, work_order, aircraft, station):
    s = shortage.select(
        F.trim(F.col("shortage_id")).alias("shortage_id"),
        F.trim(F.col("part_number")).alias("part_number"),
        F.trim(F.col("work_order_id")).alias("work_order_id"),
        F.trim(F.col("serial_number")).alias("serial_number"),
        F.trim(F.col("station_code")).alias("station_code"),
        F.col("qty_short").cast(T.IntegerType()).alias("qty_short"),
        F.to_date(F.col("opened_date")).alias("opened_date"),
        F.to_date(F.col("expected_recovery_date")).alias("expected_recovery_date"),
        F.trim(F.col("status")).alias("status"),
        F.trim(F.col("criticality")).alias("criticality"),
    )

    p = part.select(
        F.trim(F.col("part_number")).alias("part_number"),
        F.trim(F.col("description")).alias("part_description"),
        F.trim(F.col("supplier_id")).alias("supplier_id"),
        F.col("lead_time_days").cast(T.IntegerType()).alias("part_lead_time_days"),
        F.col("unit_cost_usd").cast(T.DoubleType()).alias("unit_cost_usd"),
    )

    v = supplier.select(
        F.trim(F.col("supplier_id")).alias("supplier_id"),
        F.trim(F.col("supplier_name")).alias("supplier_name"),
        F.col("on_time_rate").cast(T.DoubleType()).alias("supplier_on_time_rate"),
        F.col("avg_lead_time_days").cast(T.IntegerType()).alias("supplier_lead_time_days"),
        F.trim(F.col("location")).alias("supplier_location"),
    )

    w = work_order.select(
        F.trim(F.col("work_order_id")).alias("work_order_id"),
        F.trim(F.col("status")).alias("work_order_status"),
        F.col("hours_booked").cast(T.IntegerType()).alias("work_order_hours_booked"),
        F.col("standard_hours").cast(T.IntegerType()).alias("work_order_standard_hours"),
    )

    a = aircraft.select(
        F.trim(F.col("serial_number")).alias("serial_number"),
        F.trim(F.col("customer")).alias("customer"),
        F.trim(F.col("status")).alias("aircraft_status"),
        F.to_date(F.col("planned_delivery_date")).alias("planned_delivery_date"),
        F.to_date(F.col("forecast_delivery_date")).alias("forecast_delivery_date"),
    ).withColumn(
        "tail_slip_days",
        F.datediff(F.col("forecast_delivery_date"), F.col("planned_delivery_date")),
    )

    st = station.select(
        F.col("station_code"),
        F.col("station_name"),
        F.col("over_takt_days").alias("station_over_takt_days"),
        F.col("is_bottleneck").alias("station_is_bottleneck"),
    )

    # Left joins throughout. An inner join would silently drop a shortage whose
    # part had been deleted from the catalogue — which is exactly the shortage
    # someone most needs to see. A null supplier is a data problem worth
    # surfacing, not a row worth hiding.
    df = (
        s.join(p, "part_number", "left")
        .join(v, "supplier_id", "left")
        .join(w, "work_order_id", "left")
        .join(a, "serial_number", "left")
        .join(st, "station_code", "left")
        .withColumn(
            "exposure_usd",
            F.round(F.col("qty_short") * F.coalesce(F.col("unit_cost_usd"), F.lit(0.0)), 2),
        )
        # True where the constraint station is also the one starved of parts.
        # When that lines up, expediting the part and unblocking the line are
        # the same action; when it does not, they compete for attention.
        .withColumn(
            "blocks_the_constraint",
            F.coalesce(F.col("station_is_bottleneck"), F.lit(False))
            & (F.col("status") == F.lit("Open")),
        )
    )

    _validate(df, s)
    return df


def _validate(df, source):
    """Catch the failures that a left join turns into silent nulls."""
    if df.count() != source.count():
        raise ValueError(
            "Row count changed across the joins. A one-to-many join has "
            "duplicated shortages, most likely a duplicate primary key in "
            "part, supplier, work_order, aircraft or station."
        )

    orphaned = df.filter(F.col("part_description").isNull()).select("shortage_id").collect()
    if orphaned:
        raise ValueError(
            f"Shortages reference parts that are not in the catalogue: "
            f"{[r['shortage_id'] for r in orphaned]}"
        )

    no_supplier = df.filter(F.col("supplier_name").isNull()).select("shortage_id").collect()
    if no_supplier:
        raise ValueError(
            f"Shortages whose part has no supplier, so there is nobody to "
            f"chase: {[r['shortage_id'] for r in no_supplier]}"
        )
