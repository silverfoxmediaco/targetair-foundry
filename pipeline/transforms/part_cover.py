"""Stock cover per part: how many more airframes the stock on hand will build.

The number a planner actually wants, and it exists in neither source object.
`inventory_lot` knows the quantity; `bom_line` knows the demand per airframe.
Cover is the division, and it is the difference between "we have forty of
those" and "that is five aircraft and the sixth stops".

Floored deliberately: a partial set builds nothing.

`cover_airframes` is null where the part is not on the bill of materials. That
is a different fact from zero. Zero means the next aircraft stops; null means
this part has no demand on this program. Collapsing the two would report every
non-BOM part in the catalogue as a stock-out.
"""

from pyspark.sql import functions as F
from pyspark.sql import types as T
from transforms.api import Input, Output, transform_df

PROJECT = "/Silverformedia-70c170/Target Air Limited"


@transform_df(
    Output(f"{PROJECT}/clean/part_cover"),
    part=Input(f"{PROJECT}/part"),
    inventory_lot=Input(f"{PROJECT}/inventory_lot"),
    bom_line=Input(f"{PROJECT}/bom_line"),
    supplier=Input(f"{PROJECT}/supplier"),
)
def compute(part, inventory_lot, bom_line, supplier):
    p = part.select(
        F.trim(F.col("part_number")).alias("part_number"),
        F.trim(F.col("description")).alias("description"),
        F.trim(F.col("supplier_id")).alias("supplier_id"),
        F.col("lead_time_days").cast(T.IntegerType()).alias("lead_time_days"),
        F.trim(F.col("criticality")).alias("criticality"),
        F.col("unit_cost_usd").cast(T.DoubleType()).alias("unit_cost_usd"),
    )

    on_hand = inventory_lot.groupBy(F.trim(F.col("part_number")).alias("part_number")).agg(
        F.sum(F.col("qty_on_hand").cast(T.IntegerType())).alias("qty_on_hand"),
        F.count(F.lit(1)).alias("lot_count"),
    )

    # A part can be consumed at more than one station, so demand per airframe is
    # the sum across its bill of materials lines, not any single line.
    demand = bom_line.groupBy(F.trim(F.col("part_number")).alias("part_number")).agg(
        F.sum(F.col("qty_per_aircraft").cast(T.IntegerType())).alias("qty_per_aircraft"),
        F.collect_set(F.trim(F.col("station_code"))).alias("consumed_at_stations"),
    )

    v = supplier.select(
        F.trim(F.col("supplier_id")).alias("supplier_id"),
        F.trim(F.col("supplier_name")).alias("supplier_name"),
        F.col("on_time_rate").cast(T.DoubleType()).alias("supplier_on_time_rate"),
    )

    df = (
        p.join(on_hand, "part_number", "left")
        .join(demand, "part_number", "left")
        .join(v, "supplier_id", "left")
        .withColumn("qty_on_hand", F.coalesce(F.col("qty_on_hand"), F.lit(0)))
        .withColumn("lot_count", F.coalesce(F.col("lot_count"), F.lit(0)))
        .withColumn(
            "cover_airframes",
            F.when(
                F.col("qty_per_aircraft").isNotNull() & (F.col("qty_per_aircraft") > 0),
                F.floor(F.col("qty_on_hand") / F.col("qty_per_aircraft")).cast(T.IntegerType()),
            ).otherwise(F.lit(None).cast(T.IntegerType())),
        )
        .withColumn("stock_value_usd", F.round(F.col("qty_on_hand") * F.col("unit_cost_usd"), 2))
        # A critical part with no cover and a long lead is the combination that
        # cannot be recovered by expediting. Worth naming as a column rather
        # than leaving every consumer to rediscover the rule.
        .withColumn(
            "at_risk",
            (F.col("cover_airframes") == 0)
            & (F.col("criticality") == F.lit("critical"))
            & (F.col("lead_time_days") >= 30),
        )
    )

    _validate(df)
    return df


def _validate(df):
    rows = df.select("part_number", "qty_on_hand", "cover_airframes").collect()

    numbers = [r["part_number"] for r in rows]
    if len(numbers) != len(set(numbers)):
        raise ValueError("Duplicate part_number after aggregation — check the group-bys.")

    negative = [r["part_number"] for r in rows if (r["qty_on_hand"] or 0) < 0]
    if negative:
        raise ValueError(f"Negative stock on hand for: {negative}")
