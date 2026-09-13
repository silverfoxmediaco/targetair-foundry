"""Prove the transform validations actually fail on bad data.

A validation that has never fired is a comment. Each case here corrupts one
thing the real data gets right, and asserts the transform refuses to build.

    python3 test_validations.py
"""

import sys
import types
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"


class _Marker:
    def __init__(self, path):
        self.path = path


def _transform_df(output, **inputs):
    def wrap(fn):
        fn._output = output
        fn._inputs = inputs
        return fn

    return wrap


_api = types.ModuleType("transforms.api")
_api.Input = _Marker
_api.Output = _Marker
_api.transform_df = _transform_df
_transforms = types.ModuleType("transforms")
_transforms.api = _api
sys.modules["transforms"] = _transforms
sys.modules["transforms.api"] = _api

sys.path.insert(0, str(Path(__file__).resolve().parent / "transforms"))

from pyspark.sql import SparkSession  # noqa: E402
from pyspark.sql import functions as F  # noqa: E402

import clean_aircraft  # noqa: E402
import clean_station  # noqa: E402
import shortage_enriched  # noqa: E402


def read(spark, name):
    return spark.read.csv(str(DATA / f"{name}.csv"), header=True, inferSchema=True)


def expect_failure(label, fn, fragment):
    """Run something that must raise, and check the message is the useful one."""
    try:
        df = fn()
        df.count()  # force evaluation in case validation is lazy
    except Exception as exc:  # noqa: BLE001
        message = str(exc)
        if fragment.lower() in message.lower():
            print(f"  PASS  {label}")
            return True
        print(f"  WRONG ERROR  {label}\n          expected to mention {fragment!r}\n          got: {message[:160]}")
        return False
    print(f"  DID NOT FAIL  {label}")
    return False


def main():
    spark = (
        SparkSession.builder.appName("targetair-validations")
        .master("local[2]")
        .config("spark.sql.shuffle.partitions", "2")
        .config("spark.ui.enabled", "false")
        .getOrCreate()
    )
    spark.sparkContext.setLogLevel("ERROR")

    station_raw = read(spark, "station")
    aircraft_raw = read(spark, "aircraft")
    clean_st = clean_station.compute(station_raw)

    results = []

    print("clean_station")
    results.append(
        expect_failure(
            "duplicate station_code",
            lambda: clean_station.compute(
                station_raw.union(station_raw.limit(1))
            ),
            "duplicate",
        )
    )
    results.append(
        expect_failure(
            "gap in sequence",
            lambda: clean_station.compute(
                station_raw.withColumn(
                    "sequence",
                    F.when(F.col("station_code") == "ST-40", F.lit(99)).otherwise(F.col("sequence")),
                )
            ),
            "complete 1..",
        )
    )
    results.append(
        expect_failure(
            "non-positive takt",
            lambda: clean_station.compute(station_raw.withColumn("takt_days", F.lit(0))),
            "takt_days must be positive",
        )
    )

    print("clean_aircraft")
    results.append(
        expect_failure(
            "unknown status",
            lambda: clean_aircraft.compute(
                aircraft_raw.withColumn(
                    "status",
                    F.when(F.col("serial_number") == "TA7-040", F.lit("Scrapped")).otherwise(
                        F.col("status")
                    ),
                ),
                clean_st,
            ),
            "unexpected aircraft status",
        )
    )
    results.append(
        expect_failure(
            "forecast before build start",
            lambda: clean_aircraft.compute(
                aircraft_raw.withColumn("forecast_delivery_date", F.lit("2020-01-01")),
                clean_st,
            ),
            "precedes build start",
        )
    )
    results.append(
        expect_failure(
            "undelivered aircraft with no station",
            lambda: clean_aircraft.compute(
                aircraft_raw.withColumn(
                    "current_station_code",
                    F.when(F.col("status") != "Delivered", F.lit("")).otherwise(
                        F.col("current_station_code")
                    ),
                ),
                clean_st,
            ),
            "no current station",
        )
    )

    print("shortage_enriched")
    results.append(
        expect_failure(
            "shortage referencing a part that does not exist",
            lambda: shortage_enriched.compute(
                read(spark, "shortage").withColumn("part_number", F.lit("P-9999")),
                read(spark, "part"),
                read(spark, "supplier"),
                read(spark, "work_order"),
                aircraft_raw,
                clean_st,
            ),
            "not in the catalogue",
        )
    )
    results.append(
        expect_failure(
            "duplicate part inflating the join",
            lambda: shortage_enriched.compute(
                read(spark, "shortage"),
                read(spark, "part").union(read(spark, "part")),
                read(spark, "supplier"),
                read(spark, "work_order"),
                aircraft_raw,
                clean_st,
            ),
            "row count changed",
        )
    )

    spark.stop()
    print("\n" + "=" * 56)
    passed = sum(results)
    print(f"{passed} of {len(results)} validations fired correctly.")
    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    main()
