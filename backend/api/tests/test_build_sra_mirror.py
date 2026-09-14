"""Tests for the coordinate parse in the SRA mirror builder.

`lat_lon` is BioSample free text and the mirror turns it into two DOUBLEs
once, at build time, so the serving path can group on numbers. Everything the
map draws is downstream of the expressions checked here, and every value in
these cases is a real string measured in the v5 mirror rather than an invented
one -- the failures worth catching are the ones the data actually contains.

The builder parses its command line at import time, so it cannot be imported.
Its SQL is lifted out of the source instead of copied, because a copy would go
on passing while the builder drifted away from it.
"""

import ast
from pathlib import Path

import duckdb
import pytest

BUILDER = Path(__file__).resolve().parents[1] / "scripts" / "build_sra_mirror.py"


def _constant(name: str) -> str:
    """Read one module-level string constant out of the builder's source.

    @param name: the constant to read.
    @returns: its value.
    """
    for node in ast.parse(BUILDER.read_text()).body:
        if isinstance(node, ast.Assign) and any(
            isinstance(target, ast.Name) and target.id == name
            for target in node.targets
        ):
            return ast.literal_eval(node.value)
    raise AssertionError(f"{name} is not a module-level constant in {BUILDER.name}")


@pytest.fixture(scope="module")
def parse():
    """Run the builder's own coordinate SQL over one raw `lat_lon` value.

    @returns: a callable taking the raw string and returning (lat, lon).
    """
    sql = _constant("COORDINATE_SQL").format(
        pattern=_constant("LAT_LON_PATTERN"),
        in_range=_constant("LAT_LON_IN_RANGE"),
        source="(SELECT ? AS lat_lon)",
    )
    con = duckdb.connect()

    def run(raw):
        return con.execute(f"SELECT lat, lon FROM ({sql})", [raw]).fetchone()

    yield run
    con.close()


class TestTheCanonicalSpelling:
    """ "<dd> N <dd> E" -- 7,387,967 of the 12,182,056 filled values, 60.6%."""

    def test_south_and_east_get_their_signs(self, parse):
        # SRR7590703, Malawi. The one accession this whole feature has an
        # end-to-end control for: it should land in the same country the
        # cohort's country facet reports for it.
        assert parse("16.040532 S 34.797692 E") == (-16.040532, 34.797692)

    def test_north_and_west_get_their_signs(self, parse):
        # 40.4406 N 79.9959 W is Pittsburgh, and it carries 14,688 runs across
        # 147 organisms -- an institutional default entered as the sample
        # attribute. It parses like any other coordinate on purpose: no filter
        # can tell it from a real sampling site, and inventing one would drop
        # real positions with it.
        assert parse("40.4406 N 79.9959 W") == (40.4406, -79.9959)

    def test_a_negative_magnitude_keeps_its_own_sign(self, parse):
        # 280 rows write a western position as a negative magnitude against an
        # E letter. Multiplying by the hemisphere rather than rewriting the
        # number puts them where they belong; no row in the mirror pairs a
        # negative magnitude with S or W, so nothing gets flipped back.
        assert parse("20.20394 N -91.97077 E") == (20.20394, -91.97077)

    def test_integer_degrees_parse(self, parse):
        assert parse("5 N 3 W") == (5.0, -3.0)

    def test_surrounding_and_internal_whitespace_is_tolerated(self, parse):
        assert parse("  12.5 N   7.25W  ") == (12.5, -7.25)

    def test_the_equator_prime_meridian_pair_is_kept(self, parse):
        # 254 runs record 0 N 0 E. It is very probably a placeholder, but it
        # is also a real position in the Gulf of Guinea, and there is nothing
        # in the row that distinguishes the two. Dropping it would mean
        # deciding on the submitter's behalf, so it is drawn like anything
        # else and left visible.
        assert parse("0.0 N 0.0 E") == (0.0, 0.0)


class TestPositionsThatCannotExist:
    """84 rows parse cleanly to somewhere off the planet.

    These are the reason the range check is mandatory rather than tidy: an
    equal-area projection does not misplace them by a little, it fails.
    """

    def test_a_longitude_in_the_0_to_360_convention_is_refused(self, parse):
        assert parse("34 N 248 E") == (None, None)

    def test_a_transposed_pair_is_refused(self, parse):
        # Sendai with the pair the wrong way round.
        assert parse("141.4674 N 38.5515 E") == (None, None)

    def test_one_bad_half_takes_the_other_with_it(self, parse):
        # A row is a position or it is nothing. Keeping the good half would
        # put the point on a meridian it was never recorded at, which is worse
        # than not drawing it.
        assert parse("120.06 N 34.175 W") == (None, None)


class TestSentinelsAndOtherNotations:
    """39% of filled values are missing-value strings, not coordinates.

    Parsed harder they would still be sentinels, which is why only the
    canonical spelling is read.
    """

    @pytest.mark.parametrize(
        "raw",
        [
            "missing",
            "Missing",
            "not collected",
            "not applicable",
            "NA",
            "",
            None,
        ],
    )
    def test_a_sentinel_yields_no_position(self, parse, raw):
        assert parse(raw) == (None, None)

    def test_a_bare_numeric_pair_is_not_read(self, parse):
        # 2,052 rows mirror-wide. Without hemisphere letters the sign
        # convention is a guess, and a guessed sign is a different continent.
        assert parse("-16.04 34.80") == (None, None)

    def test_a_degrees_minutes_string_is_not_read(self, parse):
        assert parse("42 deg 21' N 71 deg 3' W") == (None, None)


class TestTheColumnsThemselves:
    def test_a_row_never_carries_half_a_position(self, parse):
        # Measured over all 43,851,102 rows: lat and lon are null together or
        # not at all. The serving side leans on that -- it tests lat alone.
        for raw in ("16.040532 S 34.797692 E", "34 N 248 E", "missing", None):
            lat, lon = parse(raw)
            assert (lat is None) == (lon is None), raw
