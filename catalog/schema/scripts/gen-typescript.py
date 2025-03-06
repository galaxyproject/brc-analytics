import sys
from linkml.generators.typescriptgen import TypescriptGenerator

"""
LinkML TypeScript generator extended to handle enums more correctly.
"""
class TypescriptGeneratorFixed(TypescriptGenerator):
  def range(self, slot):
    range = slot.range
    all_enums = self.schemaview.all_enums()
    if range in all_enums:
      name = self.generate_enums({range: all_enums[range]})[range]["name"]
      if slot.multivalued:
        return f"{name}[]"
      else:
        return name
    return super().range(slot)

print(TypescriptGeneratorFixed(sys.argv[1]).serialize())
