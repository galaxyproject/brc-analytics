/* eslint-disable sort-keys */
function pad(n: number): string {
  return n.toString().padStart(3, "0");
}

function buildGroup(
  groupName: string,
  fixedEntries: { name: string; children: { name: string; size: number }[] }[]
): { name: string; children: { name: string; size: number }[] }[] {
  const arr = [];
  // Add fixed entries (an array of objects already defined)
  fixedEntries.forEach((entry) => arr.push(entry));
  // Add species 3 to a random number between 20 and 100
  const maxSpecies = Math.floor(Math.random() * (100 - 20 + 1)) + 20;
  for (let i = 3; i <= maxSpecies; i++) {
    arr.push({
      name: groupName + " Species " + i,
      children: [{ name: groupName + "_" + pad(i), size: 1 }],
    });
  }
  return arr;
}

export const data = {
  name: "BRC Analytics",
  children: [
    {
      name: "Fungi",
      children: buildGroup("Fungi", [
        { name: "Candida albicans", children: [{ name: "235443", size: 1 }] },
        {
          name: "Aspergillus fumigatus",
          children: [{ name: "214684", size: 1 }],
        },
      ]),
    },
    {
      name: "Bacteria",
      children: buildGroup("Bacteria", [
        { name: "Escherichia coli", children: [{ name: "562", size: 1 }] },
        {
          name: "Staphylococcus aureus",
          children: [{ name: "1280", size: 1 }],
        },
      ]),
    },
    {
      name: "Insecta",
      children: buildGroup("Insecta", [
        { name: "Apis mellifera", children: [{ name: "7460", size: 1 }] },
        {
          name: "Drosophila melanogaster",
          children: [{ name: "7227", size: 1 }],
        },
      ]),
    },
    {
      name: "Viruses",
      children: buildGroup("Viruses", [
        { name: "Influenza A virus", children: [{ name: "11320", size: 1 }] },
        {
          name: "Human immunodeficiency virus",
          children: [{ name: "11676", size: 1 }],
        },
      ]),
    },
  ],
};
