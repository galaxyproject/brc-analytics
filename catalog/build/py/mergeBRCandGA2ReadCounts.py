import json

BRC_READ_COUNT_PATH = "catalog/build/intermediate/taxIdReadCount.json"
GA2_READ_COUNT_PATH = "catalog/ga2/build/intermediate/taxIdReadCount.json"
OUTPUT_PATH = "app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/hooks/UseENADataByTaxonomyId/taxonomy_read_counts.json"


def merge_read_counts():
    """Merge BRC and GA2 taxonomy read counts into a single file."""
    # Load both JSON files
    with open(BRC_READ_COUNT_PATH, "r") as f:
        brc_read_counts = json.load(f)

    with open(GA2_READ_COUNT_PATH, "r") as f:
        ga2_read_counts = json.load(f)

    # Check for duplicate taxonomy IDs
    duplicates = set(brc_read_counts.keys()) & set(ga2_read_counts.keys())

    # Track duplicates with differing values
    conflicting_duplicates = []

    if duplicates:
        for tax_id in duplicates:
            brc_value = brc_read_counts[tax_id]
            ga2_value = ga2_read_counts[tax_id]

            if brc_value != ga2_value:
                # Values differ - use the largest
                if ga2_value > brc_value:
                    brc_read_counts[tax_id] = ga2_value
                    conflicting_duplicates.append((tax_id, brc_value, ga2_value, "ga2"))
                else:
                    # BRC value is already in merged_read_counts and is larger
                    ga2_read_counts[tax_id] = brc_value
                    conflicting_duplicates.append((tax_id, brc_value, ga2_value, "brc"))
            # If equal, no action needed (already in merged_read_counts)

        if conflicting_duplicates:
            print(
                f"Warning: Duplicate taxonomy IDs found with differing values. Using the largest value:",
            )
            for tax_id, brc_val, ga2_val, source in conflicting_duplicates:
                print(
                    f"  Tax ID {tax_id}: brc={brc_val}, ga2={ga2_val} -> using {source} value ({max(brc_val, ga2_val)})",
                )
            print(
                "\033[31mEither the intermediate file for GA2 or BRC have to be updated, please run `npm run build-brc-from-ncbi` or `npm run build-ga2-from-ncbi`!\033[0m",
            )

    # Merge dictionaries (ga2 values override brc for duplicates)
    merged_read_counts = {**brc_read_counts, **ga2_read_counts}

    # Write merged results to output file
    with open(OUTPUT_PATH, "w") as f:
        json.dump(merged_read_counts, f, indent=2)

    print(f"Successfully merged read counts to {OUTPUT_PATH}")


if __name__ == "__main__":
    merge_read_counts()
