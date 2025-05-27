import os.path
from argparse import ArgumentParser

from linkml.generators import JsonSchemaGenerator, PydanticGenerator

from .gen_typescript import TypescriptGeneratorFixed

SCHEMA_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../schema")

# Mapping from name to tuple of generator class and output file extension
GENERATOR_TYPES = {
    "Pydantic": (PydanticGenerator, "py"),
    "TypeScript": (TypescriptGeneratorFixed, "ts"),
    "JSON Schema": (JsonSchemaGenerator, "json"),
}


def gen_schema_type(type_name, out_dir, schema_names, default_schema_names):
    if out_dir is None:
        if schema_names is not None:
            print(f"No output path specified for {type_name} generator\n")
        return

    if not schema_names:
        if not default_schema_names:
            print(f"No schemas specified for {type_name} generator\n")
            return
        schema_names = default_schema_names

    print(f"Generating {type_name}")

    generator, extension = GENERATOR_TYPES[type_name]

    for name in schema_names:
        result_text = generator(os.path.join(SCHEMA_DIR, f"{name}.yaml")).serialize()
        out_path = os.path.join(out_dir, f"{name}.{extension}")
        with open(out_path, "w") as file:
            file.write(result_text + "\n")
            print(f"Wrote to {out_path}")

    print("")


def gen_schema(
    default_schema_names,
    *,
    py_path=None,
    py_names=None,
    ts_path=None,
    ts_names=None,
    json_path=None,
    json_names=None,
):
    gen_schema_type("Pydantic", py_path, py_names, default_schema_names)
    gen_schema_type("TypeScript", ts_path, ts_names, default_schema_names)
    gen_schema_type("JSON Schema", json_path, json_names, default_schema_names)


def cli():
    parser = ArgumentParser()
    parser.add_argument("schema_name", nargs="*")
    parser.add_argument("--py-path")
    parser.add_argument("--py-name", action="append")
    parser.add_argument("--ts-path")
    parser.add_argument("--ts-name", action="append")
    parser.add_argument("--json-path")
    parser.add_argument("--json-name", action="append")
    args = parser.parse_args()
    gen_schema(
        args.schema_name,
        py_path=args.py_path,
        py_names=args.py_name,
        ts_path=args.ts_path,
        ts_names=args.ts_name,
        json_path=args.json_path,
        json_names=args.json_name,
    )


if __name__ == "__main__":
    cli()
