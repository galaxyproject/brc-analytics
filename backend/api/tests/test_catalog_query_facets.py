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


def test_wrong_entity_facet_only_suggests_fields_that_would_work():
    """The enum spans both entities, so an assembly scalar reaches the per-entity
    check. Every field it suggests has to be facetable *for this entity* -- offer
    a list field here and the model takes the suggestion, the Literal rejects it,
    and the retry is gone. That is the exhaustion this whole change prevents."""
    with pytest.raises(pydantic.ValidationError) as exc:
        CatalogQuery(entity="organism", operation="facets", facet_by=["level"])

    message = str(exc.value)
    assert "taxonomicLevelKingdom" in message
    organism = ENTITY_SCHEMA["organism"]
    for list_field in organism.list_fields:
        assert list_field not in message, (
            f"suggested {list_field}, which would fail on the retry"
        )


def test_every_suggested_facet_is_facetable_for_that_entity():
    for name, schema in ENTITY_SCHEMA.items():
        other = next(k for k in ENTITY_SCHEMA if k != name)
        foreign = sorted(
            ENTITY_SCHEMA[other].facetable_fields - schema.facetable_fields
        )
        if not foreign:
            continue
        with pytest.raises(pydantic.ValidationError) as exc:
            CatalogQuery(entity=name, operation="facets", facet_by=[foreign[0]])
        message = str(exc.value)
        for bad in schema.list_fields:
            assert bad not in message, f"{name} suggested un-facetable {bad}"
