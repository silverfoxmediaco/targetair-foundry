"""Station: typed, validated, and with the takt comparison precomputed.

A station is the unit of throughput on the line. The whole program moves at the
speed of whichever station is furthest past takt, so `over_takt_days` and
`is_bottleneck` are the two derived columns that matter, and neither depends on
the current date — which is why they belong here rather than in the browser.
"""

from pyspark.sql import functions as F
from pyspark.sql import types as T
from transforms.api import Input, Output, transform_df

PROJECT = "/Silverformedia-70c170/Target Air Limited"

SCHEMA = T.StructType(
    [
        T.StructField("station_code", T.StringType(), False),
        T.StructField("station_name", T.StringType(), False),
        T.StructField("sequence", T.IntegerType(), False),
        T.StructField("standard_hours", T.IntegerType(), True),
        T.StructField("takt_days", T.IntegerType(), False),
        T.StructField("avg_cycle_days", T.IntegerType(), False),
    ]
)


@transform_df(
    Output(f"{PROJECT}/clean/station"),
    raw=Input(f"{PROJECT}/station"),
)
def compute(raw):
    df = (
        raw.select(
            F.trim(F.col("station_code")).alias("station_code"),
            F.trim(F.col("station_name")).alias("station_name"),
            F.col("sequence").cast(T.IntegerType()).alias("sequence"),
            F.col("standard_hours").cast(T.IntegerType()).alias("standard_hours"),
            F.col("takt_days").cast(T.IntegerType()).alias("takt_days"),
            F.col("avg_cycle_days").cast(T.IntegerType()).alias("avg_cycle_days"),
        )
        # Positive means the station is slower than the beat the program needs.
        .withColumn("over_takt_days", F.col("avg_cycle_days") - F.col("takt_days"))
    )

    # The constraint is the single worst station, not every station over takt.
    # Flagging all of them would send people to three places at once, and the
    # line only moves when the worst one moves.
    worst = df.agg(F.max("over_takt_days").alias("worst")).collect()[0]["worst"]
    df = df.withColumn(
        "is_bottleneck",
        (F.col("over_takt_days") == F.lit(worst)) & (F.col("over_takt_days") > 0),
    )

    _validate(df)
    return df


def _validate(df):
    """Fail the build rather than publish a line that cannot work.

    These are cheap checks on eight rows. They exist because the failures they
    catch are invisible downstream: a duplicate station code silently doubles
    every work order joined to it, and a gap in the sequence means an aircraft
    can never reach the end of the line.
    """
    rows = df.collect()

    codes = [r["station_code"] for r in rows]
    if len(codes) != len(set(codes)):
        raise ValueError(f"Duplicate station_code in station: {codes}")

    sequences = sorted(r["sequence"] for r in rows)
    expected = list(range(1, len(rows) + 1))
    if sequences != expected:
        raise ValueError(
            f"station.sequence must be a complete 1..{len(rows)} run with no "
            f"gaps or duplicates; got {sequences}"
        )

    bad_takt = [r["station_code"] for r in rows if (r["takt_days"] or 0) <= 0]
    if bad_takt:
        raise ValueError(f"takt_days must be positive; offending stations: {bad_takt}")

    bottlenecks = [r["station_code"] for r in rows if r["is_bottleneck"]]
    if len(bottlenecks) > 1:
        raise ValueError(
            f"More than one station flagged as the constraint: {bottlenecks}. "
            "A tie is possible in principle but means the downstream 'the "
            "bottleneck is X' copy is wrong, so it is treated as a failure."
        )
