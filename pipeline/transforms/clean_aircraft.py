"""Aircraft: typed dates and schedule variance.

`slip_days` is forecast minus planned. Positive means late, negative means the
tail is forecast to beat its plan, and the sign is kept rather than clamped —
a program pulling in is information too.

Deliberately absent: any notion of "overdue". Whether a tail has passed its
forecast date depends on today, and a value computed at build time would be
wrong every morning until the next build, confidently and invisibly. That
judgement stays in the client, in derive.ts, where it is given the current date
as an argument and tested against it.
"""

from pyspark.sql import functions as F
from pyspark.sql import types as T
from transforms.api import Input, Output, transform_df

PROJECT = "/Silverformedia-70c170/Target Air Limited"

VALID_STATUSES = ["In Build", "In Test", "Delivered"]


@transform_df(
    Output(f"{PROJECT}/clean/aircraft"),
    raw=Input(f"{PROJECT}/aircraft"),
    station=Input(f"{PROJECT}/clean/station"),
)
def compute(raw, station):
    df = (
        raw.select(
            F.trim(F.col("serial_number")).alias("serial_number"),
            F.trim(F.col("program")).alias("program"),
            F.trim(F.col("status")).alias("status"),
            F.trim(F.col("current_station_code")).alias("current_station_code"),
            F.to_date(F.col("build_start_date")).alias("build_start_date"),
            F.to_date(F.col("planned_delivery_date")).alias("planned_delivery_date"),
            F.to_date(F.col("forecast_delivery_date")).alias("forecast_delivery_date"),
            F.trim(F.col("customer")).alias("customer"),
        )
        .withColumn(
            "slip_days",
            F.datediff(F.col("forecast_delivery_date"), F.col("planned_delivery_date")),
        )
        .withColumn("is_late", F.col("slip_days") > 0)
        .withColumn(
            "build_days_planned",
            F.datediff(F.col("planned_delivery_date"), F.col("build_start_date")),
        )
    )

    # Resolve the station name so consumers do not each repeat the lookup.
    st = station.select(
        F.col("station_code").alias("current_station_code"),
        F.col("station_name").alias("current_station_name"),
        F.col("is_bottleneck").alias("at_the_constraint"),
    )
    df = df.join(st, "current_station_code", "left").withColumn(
        "at_the_constraint", F.coalesce(F.col("at_the_constraint"), F.lit(False))
    )

    _validate(df)
    return df


def _validate(df):
    rows = df.collect()

    serials = [r["serial_number"] for r in rows]
    if len(serials) != len(set(serials)):
        raise ValueError(f"Duplicate serial_number: {serials}")

    bad_status = sorted({r["status"] for r in rows} - set(VALID_STATUSES))
    if bad_status:
        raise ValueError(
            f"Unexpected aircraft status {bad_status}; expected one of {VALID_STATUSES}. "
            "A new status is fine, but the dashboard branches on these values, so "
            "adding one without updating it would render the tail as neither "
            "delivered nor in work."
        )

    # A forecast before the build even starts is not a tight schedule, it is a
    # data error, and it would show as a large negative slip.
    impossible = [
        r["serial_number"]
        for r in rows
        if r["build_start_date"] is not None
        and r["forecast_delivery_date"] is not None
        and r["forecast_delivery_date"] < r["build_start_date"]
    ]
    if impossible:
        raise ValueError(f"Forecast delivery precedes build start for: {impossible}")

    # Delivered aircraft are off the line; anything still in work must be at a
    # station or it cannot be found.
    adrift = [
        r["serial_number"]
        for r in rows
        if r["status"] != "Delivered" and not r["current_station_code"]
    ]
    if adrift:
        raise ValueError(f"Undelivered aircraft with no current station: {adrift}")
