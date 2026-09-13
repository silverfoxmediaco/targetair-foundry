"""Run the Foundry transforms on a local Spark against the real CSVs.

Foundry transforms are ordinary PySpark functions wearing a decorator. The
decorator only wires inputs and outputs to dataset paths; it does nothing to the
dataframe logic. So if `transforms.api` is stubbed out, the same code runs
locally against `../data/*.csv`.

That matters because the alternative is pasting untested Spark into a Foundry
repository and finding out from a failed build. This catches a typo'd column or
a broken join in seconds rather than minutes, and it means the validation rules
are exercised rather than merely written.

    pip install pyspark
    python3 run_locally.py

What it does NOT verify: that the Foundry dataset paths are right, that the
scheduling works, or that the output schemas match what the object types expect.
Those are only true in Foundry.
"""

import sys
import types
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"


# --- Stub `transforms.api` before importing any transform ------------------
#
# Input/Output become markers that remember their path; transform_df records the
# wiring on the function and otherwise leaves it alone.

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

import clean_aircraft  # noqa: E402
import clean_station  # noqa: E402
import part_cover  # noqa: E402
import shortage_enriched  # noqa: E402


def read_csv(spark, name):
    return spark.read.csv(str(DATA / f"{name}.csv"), header=True, inferSchema=True)


def dataset_name(path):
    """`/Project/clean/station` -> `clean/station`."""
    return path.split("Target Air Limited/")[-1]


def main():
    spark = (
        SparkSession.builder.appName("targetair-local")
        .master("local[2]")
        .config("spark.sql.shuffle.partitions", "2")
        .config("spark.ui.enabled", "false")
        .getOrCreate()
    )
    spark.sparkContext.setLogLevel("ERROR")

    produced = {}
    failures = []

    # Dependency order: station feeds aircraft and shortage_enriched.
    for module in (clean_station, clean_aircraft, part_cover, shortage_enriched):
        fn = module.compute
        name = dataset_name(fn._output.path)

        args = {}
        for arg, marker in fn._inputs.items():
            source = dataset_name(marker.path)
            if source in produced:
                args[arg] = produced[source]          # an upstream transform
            else:
                args[arg] = read_csv(spark, source)   # a raw CSV

        try:
            df = fn(**args)
            df.cache()
            produced[name] = df
            print(f"\n=== {name} — {df.count()} rows, {len(df.columns)} columns ===")
            df.show(5, truncate=28)
        except Exception as exc:  # noqa: BLE001 — report every failure, not the first
            failures.append((name, exc))
            print(f"\n=== {name} — FAILED ===\n  {type(exc).__name__}: {exc}")

    print("\n" + "=" * 64)
    if failures:
        for name, exc in failures:
            print(f"FAILED  {name}: {exc}")
        spark.stop()
        sys.exit(1)

    print(f"All {len(produced)} transforms produced output and passed their validations.")
    spark.stop()


if __name__ == "__main__":
    main()
