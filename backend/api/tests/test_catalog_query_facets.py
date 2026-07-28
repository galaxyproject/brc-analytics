"""Guards for the facet-field contract.

A live conversation died on `query_catalog(entity="organism",
facet_by=["taxonomicGroup"])`: the field is a list, GROUP BY rejected it after
validation, the model repeated the call on its single retry, and the run failed.
"""

import pydantic
import pytest

from app.services.tools.catalog_query import (
    ENTITY_SCHEMA,
    FACETABLE_FIELDS,
    CatalogQuery,
)


def test_list_fields_are_not_offered_as_facets():
    """The model picks from this enum, so a list field must not appear in it."""
    for name, schema in ENTITY_SCHEMA.items():
        offered = schema.list_fields & set(FACETABLE_FIELDS)
        assert not offered, f"{name} offers un-facetable list field(s) {offered}"


def test_facetable_fields_are_not_empty_and_include_a_real_grouping():
    assert "taxonomicLevelKingdom" in FACETABLE_FIELDS
    assert "taxonomicGroup" not in FACETABLE_FIELDS


def test_faceting_on_a_list_field_is_rejected_by_the_schema():
    with pytest.raises(pydantic.ValidationError):
        CatalogQuery(entity="organism", operation="facets", facet_by=["taxonomicGroup"])


def test_faceting_on_a_scalar_field_is_accepted():
    q = CatalogQuery(
        entity="organism", operation="facets", facet_by=["taxonomicLevelKingdom"]
    )
    assert q.facet_by == ["taxonomicLevelKingdom"]


def test_wrong_entity_facet_still_names_the_valid_fields():
    """Cross-entity fields stay in the enum, so the per-entity check catches them
    -- and has to say what would have worked, or a retry is blind."""
    with pytest.raises(pydantic.ValidationError) as exc:
        CatalogQuery(entity="organism", operation="facets", facet_by=["level"])

    message = str(exc.value)
    assert "valid fields" in message
    assert "taxonomicLevelKingdom" in message
