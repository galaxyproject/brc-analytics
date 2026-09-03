"""The ISO lookup has to be total, and it has to be honest about the map.

Two legs, and the second is the one that is easy to skip.

**Totality.** Every distinct `geo_loc_name_country_calc` value in the mirror
either maps to an ISO code or is listed as deliberately unmapped. A value
that is neither is a country silently missing from the map with no error
anywhere -- the whole failure mode this file exists to prevent.

**The join.** world-110m keys its features by ISO *numeric* id, not alpha-3,
and plenty of ISO-valid codes have no shape at that resolution. So a mapping
that passes the first leg can still lose runs off the map: Hong Kong at
81,649 runs and Singapore at 64,050 are the large cases, Tuvalu, Gibraltar,
Nauru and Johnston Atoll the small ones the plan named. Every emitted code
must therefore either join to a feature the committed asset actually carries,
or be reported as unplaceable.

DISTINCT_COUNTRY_VALUES is a fixture, not a query. It was measured once,
2026-09-03, against the deployed schema_version 3 mirror
(`~/work/sra-poc/sra-slim.duckdb`, 43,522,611 runs, DuckDB 1.5.4):

    SELECT nullif(nullif(geo_loc_name_country_calc, ''), 'uncalculated') AS c,
           count(*) FROM runs GROUP BY 1 ORDER BY 2 DESC

245 distinct usable values over 25,412,289 runs, with 18,110,322 runs NULL or
'uncalculated'. The same 245 values come back from the schema_version 5
builder output (`sra-wide-tax.duckdb`, 43,851,102 runs) -- the two files agree
exactly on the vocabulary, so this list is a property of INSDC's vocabulary
rather than of one snapshot. Re-measure it after a mirror rebuild; do not
query it here, because a test that asks the mirror what is in the mirror
cannot fail.
"""

import json
from pathlib import Path

import pytest

from app.services import country_iso
from app.services.country_iso import COUNTRIES, TOPOJSON_COUNTRY_IDS, UNMAPPED

# Path from backend/api/tests to the asset the frontend actually serves. The
# check has to be against that file and not a copy, or it checks nothing.
TOPOJSON_PATH = (
    Path(__file__).resolve().parents[3]
    / "sites"
    / "brc-analytics"
    / "public"
    / "geo"
    / "countries-110m.json"
)

# (value, runs), largest first. See the module docstring for provenance.
DISTINCT_COUNTRY_VALUES: list[tuple[str, int]] = [
    ("USA", 9242738),
    ("United Kingdom", 3575930),
    ("China", 3405643),
    ("Denmark", 698758),
    ("Canada", 645937),
    ("Germany", 579088),
    ("Japan", 558489),
    ("Australia", 506498),
    ("France", 435362),
    ("Switzerland", 344757),
    ("Spain", 336319),
    ("Netherlands", 259041),
    ("Sweden", 238191),
    ("Italy", 237043),
    ("Brazil", 202273),
    ("India", 189863),
    ("South Korea", 189466),
    ("Norway", 156221),
    ("Finland", 151676),
    ("Ireland", 148612),
    ("New Zealand", 135558),
    ("South Africa", 132060),
    ("Austria", 121398),
    ("Kenya", 118963),
    ("Belgium", 115099),
    ("Portugal", 113041),
    ("Mexico", 103663),
    ("Israel", 95911),
    ("Russia", 83242),
    ("Hong Kong", 81649),
    ("Poland", 74598),
    ("Thailand", 69927),
    ("Singapore", 64050),
    ("Czech Republic", 63567),
    ("Estonia", 61930),
    ("Slovakia", 60883),
    ("Taiwan", 60234),
    ("Uganda", 56743),
    ("Ghana", 53450),
    ("Chile", 53349),
    ("Viet Nam", 51630),
    ("Madagascar", 50454),
    ("Tanzania", 48991),
    ("Ethiopia", 47579),
    ("Peru", 47404),
    ("Greece", 46201),
    ("Bangladesh", 45456),
    ("Argentina", 45387),
    ("Saudi Arabia", 44116),
    ("Colombia", 42629),
    ("Costa Rica", 41881),
    ("Malaysia", 40351),
    ("Malawi", 38395),
    ("Ecuador", 31720),
    ("Turkey", 30138),
    ("Nigeria", 29256),
    ("Indonesia", 29012),
    ("Panama", 28701),
    ("Hungary", 27696),
    ("Mali", 27020),
    ("Cambodia", 26615),
    ("Philippines", 21259),
    ("Georgia", 19855),
    ("Slovenia", 19331),
    ("Puerto Rico", 18764),
    ("Cameroon", 18197),
    ("Iran", 17478),
    ("Democratic Republic of the Congo", 17295),
    ("Pakistan", 16824),
    ("Greenland", 15856),
    ("Papua New Guinea", 15835),
    ("Romania", 15535),
    ("Ukraine", 15117),
    ("French Polynesia", 14978),
    ("Iceland", 14769),
    ("Kazakhstan", 14092),
    ("Croatia", 13700),
    ("Laos", 13364),
    ("Latvia", 13237),
    ("Mozambique", 12182),
    ("Botswana", 11671),
    ("Svalbard", 11557),
    ("Gambia", 11551),
    ("French Guiana", 11084),
    ("Burkina Faso", 10755),
    ("Zambia", 10542),
    ("Fiji", 10517),
    ("Zimbabwe", 9745),
    ("Bulgaria", 9589),
    ("Morocco", 9521),
    ("Guadeloupe", 9385),
    ("United Arab Emirates", 9257),
    ("Senegal", 8864),
    ("Egypt", 8844),
    ("Nepal", 8316),
    ("Guyana", 7803),
    ("Nicaragua", 7802),
    ("Rwanda", 7112),
    ("Bolivia", 7081),
    ("Belize", 7066),
    ("Reunion", 7047),
    ("Moldova", 6981),
    ("Qatar", 6911),
    ("Tunisia", 6890),
    ("New Caledonia", 6748),
    ("Namibia", 6745),
    ("Luxembourg", 6539),
    ("Mongolia", 6274),
    ("Seychelles", 6214),
    ("Myanmar", 6171),
    ("Venezuela", 5875),
    ("Lithuania", 5869),
    ("Guatemala", 5648),
    ("Serbia", 5423),
    ("Uruguay", 5392),
    ("Jordan", 5272),
    ("Sri Lanka", 5234),
    ("Mauritius", 4850),
    ("Honduras", 4818),
    ("Lebanon", 4766),
    ("Niger", 4521),
    ("Gabon", 4460),
    ("Afghanistan", 4422),
    ("Cyprus", 4318),
    ("Northern Mariana Islands", 4176),
    ("Oman", 4160),
    ("Central African Republic", 4049),
    ("Benin", 3944),
    ("Sierra Leone", 3853),
    ("Guinea", 3771),
    ("Kuwait", 3564),
    ("Bermuda", 3474),
    ("Sudan", 3313),
    ("Haiti", 3283),
    ("Syria", 3217),
    ("Guam", 3059),
    ("Cuba", 3024),
    ("Kiribati", 2988),
    ("Trinidad and Tobago", 2938),
    ("Dominican Republic", 2921),
    ("Angola", 2866),
    ("Iraq", 2717),
    ("Algeria", 2711),
    ("Guinea-Bissau", 2396),
    ("Bahamas", 2395),
    ("Palau", 2324),
    ("Albania", 2182),
    ("Cape Verde", 2078),
    ("Sao Tome and Principe", 1935),
    ("Belarus", 1919),
    ("Solomon Islands", 1915),
    ("Paraguay", 1846),
    ("Mauritania", 1803),
    ("Mayotte", 1746),
    ("Kyrgyzstan", 1537),
    ("Uzbekistan", 1497),
    ("Tonga", 1466),
    ("Paracel Islands", 1440),
    ("Vanuatu", 1428),
    ("Coral Sea Islands", 1420),
    ("Cayman Islands", 1411),
    ("Jersey", 1410),
    ("El Salvador", 1408),
    ("Malta", 1333),
    ("Faroe Islands", 1297),
    ("Eritrea", 1292),
    ("Bhutan", 1286),
    ("Liberia", 1279),
    ("Armenia", 1276),
    ("Bosnia and Herzegovina", 1269),
    ("Azerbaijan", 1219),
    ("Samoa", 1189),
    ("American Samoa", 1127),
    ("Maldives", 1095),
    ("Tajikistan", 1092),
    ("Suriname", 1008),
    ("Libya", 1005),
    ("Togo", 991),
    ("Turkmenistan", 979),
    ("Barbados", 968),
    ("Jamaica", 889),
    ("Martinique", 840),
    ("Chad", 837),
    ("Borneo", 827),
    ("North Korea", 821),
    ("Djibouti", 794),
    ("Yemen", 794),
    ("West Bank", 753),
    ("Equatorial Guinea", 731),
    ("Macau", 720),
    ("Comoros", 698),
    ("Burundi", 678),
    ("Brunei", 657),
    ("Wallis and Futuna", 651),
    ("Yugoslavia", 573),
    ("Palmyra Atoll", 538),
    ("Netherlands Antilles", 479),
    ("Spratly Islands", 418),
    ("Cook Islands", 398),
    ("Dominica", 378),
    ("Macedonia", 358),
    ("Saint Kitts and Nevis", 328),
    ("Christmas Island", 296),
    ("Somalia", 284),
    ("Turks and Caicos Islands", 275),
    ("Europa Island", 269),
    ("Bahrain", 261),
    ("Marshall Islands", 224),
    ("Saint Helena", 224),
    ("Lesotho", 217),
    ("Juan de Nova Island", 199),
    ("Swaziland", 177),
    ("Grenada", 151),
    ("Saint Vincent and the Grenadines", 151),
    ("Monaco", 139),
    ("Andorra", 125),
    ("Saint Lucia", 120),
    ("British Virgin Islands", 115),
    ("Liechtenstein", 86),
    ("Montserrat", 69),
    ("Aruba", 63),
    ("Gaza Strip", 61),
    ("Guernsey", 58),
    ("Antigua and Barbuda", 48),
    ("Norfolk Island", 42),
    ("East Timor", 37),
    ("Glorioso Islands", 36),
    ("Midway Islands", 24),
    ("Western Sahara", 19),
    ("Navassa Island", 14),
    ("Clipperton Island", 12),
    ("Anguilla", 11),
    ("San Marino", 9),
    ("Gibraltar", 8),
    ("Tuvalu", 8),
    ("Pitcairn Islands", 6),
    ("Tromelin Island", 6),
    ("Jan Mayen", 5),
    ("Nauru", 5),
    ("Serbia and Montenegro", 5),
    ("Niue", 4),
    ("Tokelau", 3),
    ("Johnston Atoll", 2),
    ("Howland Island", 1),
    ("Saint Pierre and Miquelon", 1),
]

RECORDED_RUNS = 25_412_289
MIRROR_RUNS = 43_522_611


@pytest.fixture(scope="module")
def topojson_ids() -> set:
    """Feature ids in the committed asset, read from the asset itself."""
    topology = json.loads(TOPOJSON_PATH.read_text())
    return {
        geometry["id"]
        for geometry in topology["objects"]["countries"]["geometries"]
        if "id" in geometry
    }


class TestTheFixtureIsWhatWasMeasured:
    """Guard rails on the fixture, so a later edit to it is deliberate."""

    def test_the_measured_shape_is_unchanged(self):
        assert len(DISTINCT_COUNTRY_VALUES) == 245
        assert sum(n for _v, n in DISTINCT_COUNTRY_VALUES) == RECORDED_RUNS
        assert len({v for v, _n in DISTINCT_COUNTRY_VALUES}) == 245

    def test_recorded_is_a_minority_of_the_mirror(self):
        # 58.4% -- and real Logan cohorts land far below it, because Logan's
        # index froze before the well-annotated era. The map's denominator
        # line is not decoration.
        assert RECORDED_RUNS / MIRROR_RUNS < 0.6


class TestTheLookupIsTotal:
    """Leg one: no distinct value falls through unaccounted for."""

    @pytest.mark.parametrize("value", [v for v, _n in DISTINCT_COUNTRY_VALUES])
    def test_every_distinct_value_maps_or_is_declared_unmapped(self, value):
        assert (country_iso.lookup(value) is not None) or country_iso.is_unmapped(
            value
        ), f"{value!r} is neither mapped nor declared unmapped"

    def test_mapped_and_unmapped_do_not_overlap(self):
        assert not set(COUNTRIES) & set(UNMAPPED)

    def test_nothing_is_declared_unmapped_that_the_mirror_never_sends(self):
        # An UNMAPPED entry is a decision about a value that exists. One for a
        # value the mirror does not have is a decision about nothing, and it
        # hides the fact that nobody has looked at the real list lately.
        measured = {v for v, _n in DISTINCT_COUNTRY_VALUES}
        assert set(UNMAPPED) <= measured

    def test_every_unmapped_entry_says_why(self):
        for value, reason in UNMAPPED.items():
            assert reason.strip(), value

    def test_unmapped_is_a_small_share_of_recorded_runs(self):
        # 5,684 runs of 25,412,289. If this ever grows by an order of
        # magnitude something has changed about the vocabulary and the table
        # needs a fresh pass, not a bigger threshold.
        counts = dict(DISTINCT_COUNTRY_VALUES)
        unmapped_runs = sum(counts[v] for v in UNMAPPED)
        assert unmapped_runs == 5_684
        assert unmapped_runs / RECORDED_RUNS < 0.001


class TestTheTopoJSONJoin:
    """Leg two: the codes we emit have to be codes the asset can draw.

    Skipping this leaves the mapping test passing while runs vanish off the
    map, which is precisely the silent failure the map is supposed to avoid.
    """

    def test_the_constant_matches_the_committed_asset(self, topojson_ids):
        # Swap the asset and this fails, rather than the API quietly making
        # claims about a file that no longer exists in that shape.
        assert TOPOJSON_COUNTRY_IDS == topojson_ids

    def test_the_asset_is_the_expected_file(self):
        topology = json.loads(TOPOJSON_PATH.read_text())
        assert topology["type"] == "Topology"
        assert set(topology["objects"]) == {"countries", "land"}
        assert len(topology["objects"]["countries"]["geometries"]) == 177
        # 177 features, 174 ids: Kosovo, N. Cyprus and Somaliland carry no
        # ISO code, so nothing here can ever join to them.
        assert len(TOPOJSON_COUNTRY_IDS) == 174

    def test_drawable_agrees_with_the_asset_for_every_entry(self, topojson_ids):
        for raw, country in COUNTRIES.items():
            assert country.drawable == (country.iso_n3 in topojson_ids), raw

    def test_every_distinct_value_is_drawable_or_accounted_for(self, topojson_ids):
        # The requirement in one assertion: for each of the 245, either the
        # asset can draw it, or it is reportable as unplaceable -- with a
        # reason (UNMAPPED) or with a code that simply has no shape.
        for value, _runs in DISTINCT_COUNTRY_VALUES:
            country = country_iso.lookup(value)
            if country is None:
                assert country_iso.is_unmapped(value), value
                continue
            if country.iso_n3 in topojson_ids:
                continue
            # Not drawable: it must say so, so the API can report it rather
            # than hand the frontend a code that joins to nothing.
            assert country.drawable is False, value

    def test_the_countries_with_no_shape_are_the_ones_we_think(self):
        counts = dict(DISTINCT_COUNTRY_VALUES)
        no_shape = {
            value
            for value in counts
            if (c := country_iso.lookup(value)) is not None and not c.drawable
        }
        # Named in the plan as the ones that would vanish silently.
        assert {"Tuvalu", "Gibraltar", "Nauru", "Johnston Atoll"} <= no_shape
        # And the two that actually cost something.
        assert counts["Hong Kong"] == 81_649 and "Hong Kong" in no_shape
        assert counts["Singapore"] == 64_050 and "Singapore" in no_shape
        # 65 of the 245 values, 250,989 runs -- just under 1% of recorded.
        assert len(no_shape) == 65
        assert sum(counts[v] for v in no_shape) == 250_989

    def test_drawable_runs_are_the_overwhelming_majority(self):
        counts = dict(DISTINCT_COUNTRY_VALUES)
        drawable = sum(
            n
            for v, n in counts.items()
            if (c := country_iso.lookup(v)) is not None and c.drawable
        )
        assert drawable == 25_155_616
        assert drawable / RECORDED_RUNS > 0.98


class TestCodeIntegrity:
    """The table's own invariants, independent of the mirror and the asset."""

    def test_alpha3_and_numeric_agree_one_to_one(self):
        by_a3: dict[str, str] = {}
        by_n3: dict[str, str] = {}
        for country in COUNTRIES.values():
            assert by_a3.setdefault(country.iso_a3, country.iso_n3) == country.iso_n3
            assert by_n3.setdefault(country.iso_n3, country.iso_a3) == country.iso_a3

    def test_a_shared_code_carries_one_name_and_one_continent(self):
        # Several raw values legitimately share a code -- Gaza Strip and West
        # Bank are both PSE -- and the rollup keys on the code, so they must
        # not disagree about what to call it.
        seen: dict[str, tuple] = {}
        for raw, country in COUNTRIES.items():
            key = (country.name, country.continent)
            assert seen.setdefault(country.iso_a3, key) == key, raw

    def test_codes_are_well_formed(self):
        for raw, country in COUNTRIES.items():
            assert len(country.iso_a3) == 3 and country.iso_a3.isupper(), raw
            assert len(country.iso_n3) == 3 and country.iso_n3.isdigit(), raw

    def test_continents_are_from_the_closed_set(self):
        allowed = {
            "Africa",
            "Antarctica",
            "Asia",
            "Europe",
            "North America",
            "Oceania",
            "South America",
        }
        assert {c.continent for c in COUNTRIES.values()} <= allowed


class TestHandCheckedEntries:
    """The hand-checked calls, named so a later edit has to argue with them."""

    def test_georgia_maps_to_the_country_knowing_it_is_contaminated(self):
        # 19,855 runs, and NCBI's calculation is not clean: measured over the
        # schema_version 5 file, which is the only one carrying geo_loc_name,
        # 1,139 of the 9,392 labelled Georgia-coded runs name the US state
        # (Atlanta 730, United States 215, USA 170, America 10, tail) -- 5.7%
        # of all of them, 12.1% of the labelled ones, and a floor rather than
        # an estimate. GEO is still right: the country is the resolvable
        # majority, and a country-granularity table cannot undo a
        # country-granularity error made upstream. See the module docstring.
        assert country_iso.lookup("Georgia").iso_a3 == "GEO"
        assert country_iso.lookup("Georgia").continent == "Asia"

    @pytest.mark.parametrize(
        "spelling",
        ["Cote d'Ivoire", "Côte d'Ivoire", "Côte d’Ivoire", "COTE D'IVOIRE"],
    )
    def test_cote_divoire_matches_through_accents_and_apostrophes(self, spelling):
        # Not in the measured 245 -- but it is in the INSDC vocabulary, and a
        # rebuild that starts emitting it must not miss on an accent.
        assert country_iso.lookup(spelling).iso_a3 == "CIV"

    def test_the_defunct_states_are_unmapped_not_guessed(self):
        for value in ("Yugoslavia", "Serbia and Montenegro", "Netherlands Antilles"):
            assert country_iso.lookup(value) is None
            assert country_iso.is_unmapped(value)

    def test_borneo_is_an_island_not_a_country(self):
        assert country_iso.is_unmapped("Borneo")

    def test_the_two_palestinian_territories_share_one_code(self):
        gaza = country_iso.lookup("Gaza Strip")
        west_bank = country_iso.lookup("West Bank")
        assert gaza == west_bank == country_iso.lookup("West Bank")
        assert gaza.iso_a3 == "PSE"
        # PSE does have a shape at 110m, so these runs reach the map.
        assert gaza.drawable

    def test_the_us_minor_outlying_islands_share_one_code(self):
        values = [
            "Howland Island",
            "Johnston Atoll",
            "Midway Islands",
            "Navassa Island",
            "Palmyra Atoll",
        ]
        assert {country_iso.lookup(v).iso_a3 for v in values} == {"UMI"}

    def test_the_renamed_states_map_to_their_current_codes(self):
        assert country_iso.lookup("Swaziland").iso_a3 == "SWZ"
        assert country_iso.lookup("Macedonia").iso_a3 == "MKD"
        assert country_iso.lookup("East Timor").iso_a3 == "TLS"
        assert country_iso.lookup("Cape Verde").iso_a3 == "CPV"

    def test_lookup_tolerates_the_junk_around_a_value(self):
        assert country_iso.lookup("  malawi  ").iso_a3 == "MWI"
        assert country_iso.lookup("VIET  NAM").iso_a3 == "VNM"

    def test_an_unknown_string_returns_none_rather_than_a_guess(self):
        assert country_iso.lookup("Freedonia") is None
        assert country_iso.is_unmapped("Freedonia") is False
