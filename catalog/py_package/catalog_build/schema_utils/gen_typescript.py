import sys

from linkml.generators.typescriptgen import TypescriptGenerator

# The source for the base TypeScript generator can be found at https://github.com/linkml/linkml/blob/main/linkml/generators/typescriptgen.py

"""
LinkML TypeScript generator extended to handle enums and optional fields more correctly.
"""


class TypescriptGeneratorFixed(TypescriptGenerator):
    def range(self, slot):
        range = slot.range
        all_enums = self.schemaview.all_enums()
        if range in all_enums:
            name = self.generate_enums({range: all_enums[range]})[range]["name"]
            if slot.multivalued:
                base_result = f"{name}[]"
            else:
                base_result = name
        else:
            base_result = super().range(slot)
        return base_result if slot.required else f"{base_result} | null"


if __name__ == "__main__":
    print(TypescriptGeneratorFixed(sys.argv[1]).serialize())
