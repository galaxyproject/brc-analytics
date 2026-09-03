"""ISO 3166-1 codes for the country strings SRA records.

`runs.geo_loc_name_country_calc` is NCBI's calculated country: raw INSDC
vocabulary, 245 distinct usable values mirror-wide, no codes attached. A map
needs codes, and it needs them from the backend -- the frontend must never be
in the position of guessing what "Georgia" or "Borneo" means.

Two things about this table are easy to get wrong and silent when you do.

**Georgia is the country.** The INSDC vocabulary names countries, so the US
state would arrive as `geo_loc_name` "USA: Georgia" and never as a country.
19,855 runs ride on that call.

**The world-110m asset keys features by ISO *numeric* id, not alpha-3.** So
every entry carries `iso_n3`, which is what the choropleth actually joins on,
and `drawable` says whether the committed asset has a shape for it at all. It
often does not: 169 of the 229 codes here have a shape at 1:110m, and the 60
that do not include Hong Kong (81,649 runs) and Singapore (64,050). Those
runs must be *reported* as unplaceable, not dropped -- see
`geography_for_accessions`, which routes them to `unmapped_countries`.

Deliberately not `_COUNTRY_SYNONYMS` in sra_mirror. That table maps a user's
search term onto the string the mirror stores, which is the opposite
direction and a different job.

Values measured 2026-09-03 against the deployed schema_version 3 mirror
(`sra-slim.duckdb`, 43,522,611 runs).
"""

from __future__ import annotations

import unicodedata
from typing import Dict, FrozenSet, NamedTuple, Optional


class Country(NamedTuple):
    """One country as the map needs it.

    @param iso_a3: ISO 3166-1 alpha-3, what the API emits.
    @param iso_n3: ISO 3166-1 numeric, zero-padded -- the id world-110m keys
        its features by, and therefore what the choropleth joins on.
    @param name: canonical display name. Several raw values share a code
        (Gaza Strip and West Bank are both PSE), so the rollup is keyed by
        code and labelled with this rather than with whichever raw string
        happened to arrive first.
    @param continent: single assignment, seven-continent model. The
        transcontinental calls are Russia to Europe and Turkey, Cyprus,
        Georgia, Armenia, Azerbaijan and Kazakhstan to Asia.
    """

    iso_a3: str
    iso_n3: str
    name: str
    continent: str

    @property
    def drawable(self) -> bool:
        """Whether the committed world-110m asset can draw this country."""
        return self.iso_n3 in TOPOJSON_COUNTRY_IDS


# Raw `geo_loc_name_country_calc` value -> ISO. Keys are the strings SRA
# actually stores, verbatim, so this table can be read against a
# `SELECT DISTINCT` without translation. Lookups normalise (case, accents,
# curly apostrophes), so a rebuild that starts spelling a value differently
# in any of those ways still matches.
COUNTRIES: Dict[str, Country] = {
    "Afghanistan": Country("AFG", "004", "Afghanistan", "Asia"),
    "Albania": Country("ALB", "008", "Albania", "Europe"),
    "Algeria": Country("DZA", "012", "Algeria", "Africa"),
    "American Samoa": Country("ASM", "016", "American Samoa", "Oceania"),
    "Andorra": Country("AND", "020", "Andorra", "Europe"),
    "Angola": Country("AGO", "024", "Angola", "Africa"),
    "Anguilla": Country("AIA", "660", "Anguilla", "North America"),
    "Antigua and Barbuda": Country(
        "ATG", "028", "Antigua and Barbuda", "North America"
    ),
    "Argentina": Country("ARG", "032", "Argentina", "South America"),
    "Armenia": Country("ARM", "051", "Armenia", "Asia"),
    "Aruba": Country("ABW", "533", "Aruba", "North America"),
    "Australia": Country("AUS", "036", "Australia", "Oceania"),
    "Austria": Country("AUT", "040", "Austria", "Europe"),
    "Azerbaijan": Country("AZE", "031", "Azerbaijan", "Asia"),
    "Bahamas": Country("BHS", "044", "Bahamas", "North America"),
    "Bahrain": Country("BHR", "048", "Bahrain", "Asia"),
    "Bangladesh": Country("BGD", "050", "Bangladesh", "Asia"),
    "Barbados": Country("BRB", "052", "Barbados", "North America"),
    "Belarus": Country("BLR", "112", "Belarus", "Europe"),
    "Belgium": Country("BEL", "056", "Belgium", "Europe"),
    "Belize": Country("BLZ", "084", "Belize", "North America"),
    "Benin": Country("BEN", "204", "Benin", "Africa"),
    "Bermuda": Country("BMU", "060", "Bermuda", "North America"),
    "Bhutan": Country("BTN", "064", "Bhutan", "Asia"),
    "Bolivia": Country("BOL", "068", "Bolivia", "South America"),
    "Bosnia and Herzegovina": Country("BIH", "070", "Bosnia and Herzegovina", "Europe"),
    "Botswana": Country("BWA", "072", "Botswana", "Africa"),
    "Brazil": Country("BRA", "076", "Brazil", "South America"),
    "British Virgin Islands": Country(
        "VGB", "092", "British Virgin Islands", "North America"
    ),
    "Brunei": Country("BRN", "096", "Brunei", "Asia"),
    "Bulgaria": Country("BGR", "100", "Bulgaria", "Europe"),
    "Burkina Faso": Country("BFA", "854", "Burkina Faso", "Africa"),
    "Burundi": Country("BDI", "108", "Burundi", "Africa"),
    "Cambodia": Country("KHM", "116", "Cambodia", "Asia"),
    "Cameroon": Country("CMR", "120", "Cameroon", "Africa"),
    "Canada": Country("CAN", "124", "Canada", "North America"),
    "Cape Verde": Country("CPV", "132", "Cabo Verde", "Africa"),
    "Cayman Islands": Country("CYM", "136", "Cayman Islands", "North America"),
    "Central African Republic": Country(
        "CAF", "140", "Central African Republic", "Africa"
    ),
    "Chad": Country("TCD", "148", "Chad", "Africa"),
    "Chile": Country("CHL", "152", "Chile", "South America"),
    "China": Country("CHN", "156", "China", "Asia"),
    "Christmas Island": Country("CXR", "162", "Christmas Island", "Oceania"),
    "Colombia": Country("COL", "170", "Colombia", "South America"),
    "Comoros": Country("COM", "174", "Comoros", "Africa"),
    "Cook Islands": Country("COK", "184", "Cook Islands", "Oceania"),
    "Costa Rica": Country("CRI", "188", "Costa Rica", "North America"),
    "Croatia": Country("HRV", "191", "Croatia", "Europe"),
    "Cuba": Country("CUB", "192", "Cuba", "North America"),
    "Cyprus": Country("CYP", "196", "Cyprus", "Asia"),
    "Czech Republic": Country("CZE", "203", "Czechia", "Europe"),
    "Democratic Republic of the Congo": Country(
        "COD", "180", "Democratic Republic of the Congo", "Africa"
    ),
    "Denmark": Country("DNK", "208", "Denmark", "Europe"),
    "Djibouti": Country("DJI", "262", "Djibouti", "Africa"),
    "Dominica": Country("DMA", "212", "Dominica", "North America"),
    "Dominican Republic": Country("DOM", "214", "Dominican Republic", "North America"),
    "East Timor": Country("TLS", "626", "Timor-Leste", "Asia"),
    "Ecuador": Country("ECU", "218", "Ecuador", "South America"),
    "Egypt": Country("EGY", "818", "Egypt", "Africa"),
    "El Salvador": Country("SLV", "222", "El Salvador", "North America"),
    "Equatorial Guinea": Country("GNQ", "226", "Equatorial Guinea", "Africa"),
    "Eritrea": Country("ERI", "232", "Eritrea", "Africa"),
    "Estonia": Country("EST", "233", "Estonia", "Europe"),
    "Ethiopia": Country("ETH", "231", "Ethiopia", "Africa"),
    "Faroe Islands": Country("FRO", "234", "Faroe Islands", "Europe"),
    "Fiji": Country("FJI", "242", "Fiji", "Oceania"),
    "Finland": Country("FIN", "246", "Finland", "Europe"),
    "France": Country("FRA", "250", "France", "Europe"),
    "French Guiana": Country("GUF", "254", "French Guiana", "South America"),
    "French Polynesia": Country("PYF", "258", "French Polynesia", "Oceania"),
    "Gabon": Country("GAB", "266", "Gabon", "Africa"),
    "Gambia": Country("GMB", "270", "Gambia", "Africa"),
    "Gaza Strip": Country("PSE", "275", "Palestine", "Asia"),
    "Georgia": Country("GEO", "268", "Georgia", "Asia"),
    "Germany": Country("DEU", "276", "Germany", "Europe"),
    "Ghana": Country("GHA", "288", "Ghana", "Africa"),
    "Gibraltar": Country("GIB", "292", "Gibraltar", "Europe"),
    "Greece": Country("GRC", "300", "Greece", "Europe"),
    "Greenland": Country("GRL", "304", "Greenland", "North America"),
    "Grenada": Country("GRD", "308", "Grenada", "North America"),
    "Guadeloupe": Country("GLP", "312", "Guadeloupe", "North America"),
    "Guam": Country("GUM", "316", "Guam", "Oceania"),
    "Guatemala": Country("GTM", "320", "Guatemala", "North America"),
    "Guernsey": Country("GGY", "831", "Guernsey", "Europe"),
    "Guinea": Country("GIN", "324", "Guinea", "Africa"),
    "Guinea-Bissau": Country("GNB", "624", "Guinea-Bissau", "Africa"),
    "Guyana": Country("GUY", "328", "Guyana", "South America"),
    "Haiti": Country("HTI", "332", "Haiti", "North America"),
    "Honduras": Country("HND", "340", "Honduras", "North America"),
    "Hong Kong": Country("HKG", "344", "Hong Kong", "Asia"),
    "Howland Island": Country(
        "UMI", "581", "United States Minor Outlying Islands", "Oceania"
    ),
    "Hungary": Country("HUN", "348", "Hungary", "Europe"),
    "Iceland": Country("ISL", "352", "Iceland", "Europe"),
    "India": Country("IND", "356", "India", "Asia"),
    "Indonesia": Country("IDN", "360", "Indonesia", "Asia"),
    "Iran": Country("IRN", "364", "Iran", "Asia"),
    "Iraq": Country("IRQ", "368", "Iraq", "Asia"),
    "Ireland": Country("IRL", "372", "Ireland", "Europe"),
    "Israel": Country("ISR", "376", "Israel", "Asia"),
    "Italy": Country("ITA", "380", "Italy", "Europe"),
    "Jamaica": Country("JAM", "388", "Jamaica", "North America"),
    "Jan Mayen": Country("SJM", "744", "Svalbard and Jan Mayen", "Europe"),
    "Japan": Country("JPN", "392", "Japan", "Asia"),
    "Jersey": Country("JEY", "832", "Jersey", "Europe"),
    "Johnston Atoll": Country(
        "UMI", "581", "United States Minor Outlying Islands", "Oceania"
    ),
    "Jordan": Country("JOR", "400", "Jordan", "Asia"),
    "Kazakhstan": Country("KAZ", "398", "Kazakhstan", "Asia"),
    "Kenya": Country("KEN", "404", "Kenya", "Africa"),
    "Kiribati": Country("KIR", "296", "Kiribati", "Oceania"),
    "Kuwait": Country("KWT", "414", "Kuwait", "Asia"),
    "Kyrgyzstan": Country("KGZ", "417", "Kyrgyzstan", "Asia"),
    "Laos": Country("LAO", "418", "Laos", "Asia"),
    "Latvia": Country("LVA", "428", "Latvia", "Europe"),
    "Lebanon": Country("LBN", "422", "Lebanon", "Asia"),
    "Lesotho": Country("LSO", "426", "Lesotho", "Africa"),
    "Liberia": Country("LBR", "430", "Liberia", "Africa"),
    "Libya": Country("LBY", "434", "Libya", "Africa"),
    "Liechtenstein": Country("LIE", "438", "Liechtenstein", "Europe"),
    "Lithuania": Country("LTU", "440", "Lithuania", "Europe"),
    "Luxembourg": Country("LUX", "442", "Luxembourg", "Europe"),
    "Macau": Country("MAC", "446", "Macao", "Asia"),
    "Macedonia": Country("MKD", "807", "North Macedonia", "Europe"),
    "Madagascar": Country("MDG", "450", "Madagascar", "Africa"),
    "Malawi": Country("MWI", "454", "Malawi", "Africa"),
    "Malaysia": Country("MYS", "458", "Malaysia", "Asia"),
    "Maldives": Country("MDV", "462", "Maldives", "Asia"),
    "Mali": Country("MLI", "466", "Mali", "Africa"),
    "Malta": Country("MLT", "470", "Malta", "Europe"),
    "Marshall Islands": Country("MHL", "584", "Marshall Islands", "Oceania"),
    "Martinique": Country("MTQ", "474", "Martinique", "North America"),
    "Mauritania": Country("MRT", "478", "Mauritania", "Africa"),
    "Mauritius": Country("MUS", "480", "Mauritius", "Africa"),
    "Mayotte": Country("MYT", "175", "Mayotte", "Africa"),
    "Mexico": Country("MEX", "484", "Mexico", "North America"),
    "Midway Islands": Country(
        "UMI", "581", "United States Minor Outlying Islands", "Oceania"
    ),
    "Moldova": Country("MDA", "498", "Moldova", "Europe"),
    "Monaco": Country("MCO", "492", "Monaco", "Europe"),
    "Mongolia": Country("MNG", "496", "Mongolia", "Asia"),
    "Montserrat": Country("MSR", "500", "Montserrat", "North America"),
    "Morocco": Country("MAR", "504", "Morocco", "Africa"),
    "Mozambique": Country("MOZ", "508", "Mozambique", "Africa"),
    "Myanmar": Country("MMR", "104", "Myanmar", "Asia"),
    "Namibia": Country("NAM", "516", "Namibia", "Africa"),
    "Nauru": Country("NRU", "520", "Nauru", "Oceania"),
    "Navassa Island": Country(
        "UMI", "581", "United States Minor Outlying Islands", "Oceania"
    ),
    "Nepal": Country("NPL", "524", "Nepal", "Asia"),
    "Netherlands": Country("NLD", "528", "Netherlands", "Europe"),
    "New Caledonia": Country("NCL", "540", "New Caledonia", "Oceania"),
    "New Zealand": Country("NZL", "554", "New Zealand", "Oceania"),
    "Nicaragua": Country("NIC", "558", "Nicaragua", "North America"),
    "Niger": Country("NER", "562", "Niger", "Africa"),
    "Nigeria": Country("NGA", "566", "Nigeria", "Africa"),
    "Niue": Country("NIU", "570", "Niue", "Oceania"),
    "Norfolk Island": Country("NFK", "574", "Norfolk Island", "Oceania"),
    "North Korea": Country("PRK", "408", "North Korea", "Asia"),
    "Northern Mariana Islands": Country(
        "MNP", "580", "Northern Mariana Islands", "Oceania"
    ),
    "Norway": Country("NOR", "578", "Norway", "Europe"),
    "Oman": Country("OMN", "512", "Oman", "Asia"),
    "Pakistan": Country("PAK", "586", "Pakistan", "Asia"),
    "Palau": Country("PLW", "585", "Palau", "Oceania"),
    "Palmyra Atoll": Country(
        "UMI", "581", "United States Minor Outlying Islands", "Oceania"
    ),
    "Panama": Country("PAN", "591", "Panama", "North America"),
    "Papua New Guinea": Country("PNG", "598", "Papua New Guinea", "Oceania"),
    "Paraguay": Country("PRY", "600", "Paraguay", "South America"),
    "Peru": Country("PER", "604", "Peru", "South America"),
    "Philippines": Country("PHL", "608", "Philippines", "Asia"),
    "Pitcairn Islands": Country("PCN", "612", "Pitcairn Islands", "Oceania"),
    "Poland": Country("POL", "616", "Poland", "Europe"),
    "Portugal": Country("PRT", "620", "Portugal", "Europe"),
    "Puerto Rico": Country("PRI", "630", "Puerto Rico", "North America"),
    "Qatar": Country("QAT", "634", "Qatar", "Asia"),
    "Reunion": Country("REU", "638", "Reunion", "Africa"),
    "Romania": Country("ROU", "642", "Romania", "Europe"),
    "Russia": Country("RUS", "643", "Russia", "Europe"),
    "Rwanda": Country("RWA", "646", "Rwanda", "Africa"),
    "Saint Helena": Country("SHN", "654", "Saint Helena", "Africa"),
    "Saint Kitts and Nevis": Country(
        "KNA", "659", "Saint Kitts and Nevis", "North America"
    ),
    "Saint Lucia": Country("LCA", "662", "Saint Lucia", "North America"),
    "Saint Pierre and Miquelon": Country(
        "SPM", "666", "Saint Pierre and Miquelon", "North America"
    ),
    "Saint Vincent and the Grenadines": Country(
        "VCT", "670", "Saint Vincent and the Grenadines", "North America"
    ),
    "Samoa": Country("WSM", "882", "Samoa", "Oceania"),
    "San Marino": Country("SMR", "674", "San Marino", "Europe"),
    "Sao Tome and Principe": Country("STP", "678", "Sao Tome and Principe", "Africa"),
    "Saudi Arabia": Country("SAU", "682", "Saudi Arabia", "Asia"),
    "Senegal": Country("SEN", "686", "Senegal", "Africa"),
    "Serbia": Country("SRB", "688", "Serbia", "Europe"),
    "Seychelles": Country("SYC", "690", "Seychelles", "Africa"),
    "Sierra Leone": Country("SLE", "694", "Sierra Leone", "Africa"),
    "Singapore": Country("SGP", "702", "Singapore", "Asia"),
    "Slovakia": Country("SVK", "703", "Slovakia", "Europe"),
    "Slovenia": Country("SVN", "705", "Slovenia", "Europe"),
    "Solomon Islands": Country("SLB", "090", "Solomon Islands", "Oceania"),
    "Somalia": Country("SOM", "706", "Somalia", "Africa"),
    "South Africa": Country("ZAF", "710", "South Africa", "Africa"),
    "South Korea": Country("KOR", "410", "South Korea", "Asia"),
    "Spain": Country("ESP", "724", "Spain", "Europe"),
    "Sri Lanka": Country("LKA", "144", "Sri Lanka", "Asia"),
    "Sudan": Country("SDN", "729", "Sudan", "Africa"),
    "Suriname": Country("SUR", "740", "Suriname", "South America"),
    "Svalbard": Country("SJM", "744", "Svalbard and Jan Mayen", "Europe"),
    "Swaziland": Country("SWZ", "748", "Eswatini", "Africa"),
    "Sweden": Country("SWE", "752", "Sweden", "Europe"),
    "Switzerland": Country("CHE", "756", "Switzerland", "Europe"),
    "Syria": Country("SYR", "760", "Syria", "Asia"),
    "Taiwan": Country("TWN", "158", "Taiwan", "Asia"),
    "Tajikistan": Country("TJK", "762", "Tajikistan", "Asia"),
    "Tanzania": Country("TZA", "834", "Tanzania", "Africa"),
    "Thailand": Country("THA", "764", "Thailand", "Asia"),
    "Togo": Country("TGO", "768", "Togo", "Africa"),
    "Tokelau": Country("TKL", "772", "Tokelau", "Oceania"),
    "Tonga": Country("TON", "776", "Tonga", "Oceania"),
    "Trinidad and Tobago": Country(
        "TTO", "780", "Trinidad and Tobago", "North America"
    ),
    "Tunisia": Country("TUN", "788", "Tunisia", "Africa"),
    "Turkey": Country("TUR", "792", "Turkey", "Asia"),
    "Turkmenistan": Country("TKM", "795", "Turkmenistan", "Asia"),
    "Turks and Caicos Islands": Country(
        "TCA", "796", "Turks and Caicos Islands", "North America"
    ),
    "Tuvalu": Country("TUV", "798", "Tuvalu", "Oceania"),
    "USA": Country("USA", "840", "United States of America", "North America"),
    "Uganda": Country("UGA", "800", "Uganda", "Africa"),
    "Ukraine": Country("UKR", "804", "Ukraine", "Europe"),
    "United Arab Emirates": Country("ARE", "784", "United Arab Emirates", "Asia"),
    "United Kingdom": Country("GBR", "826", "United Kingdom", "Europe"),
    "Uruguay": Country("URY", "858", "Uruguay", "South America"),
    "Uzbekistan": Country("UZB", "860", "Uzbekistan", "Asia"),
    "Vanuatu": Country("VUT", "548", "Vanuatu", "Oceania"),
    "Venezuela": Country("VEN", "862", "Venezuela", "South America"),
    "Viet Nam": Country("VNM", "704", "Viet Nam", "Asia"),
    "Wallis and Futuna": Country("WLF", "876", "Wallis and Futuna", "Oceania"),
    "West Bank": Country("PSE", "275", "Palestine", "Asia"),
    "Western Sahara": Country("ESH", "732", "Western Sahara", "Africa"),
    "Yemen": Country("YEM", "887", "Yemen", "Asia"),
    "Zambia": Country("ZMB", "894", "Zambia", "Africa"),
    "Zimbabwe": Country("ZWE", "716", "Zimbabwe", "Africa"),
}

# In the INSDC vocabulary and drawable at 110m, but with zero runs in the
# mirror as measured. Here so the next rebuild does not silently drop them
# into `unmapped_countries` -- and because the Scattered Islands decision
# below turns on ATF meaning Kerguelen, which is only checkable if ATF is
# reachable by some name.
COUNTRIES.update(
    {
        "Antarctica": Country("ATA", "010", "Antarctica", "Antarctica"),
        "Cote d'Ivoire": Country("CIV", "384", "Cote d'Ivoire", "Africa"),
        "Falkland Islands (Islas Malvinas)": Country(
            "FLK", "238", "Falkland Islands", "South America"
        ),
        "French Southern and Antarctic Lands": Country(
            "ATF", "260", "French Southern Territories", "Antarctica"
        ),
        "Montenegro": Country("MNE", "499", "Montenegro", "Europe"),
        "Republic of the Congo": Country("COG", "178", "Congo", "Africa"),
        "South Sudan": Country("SSD", "728", "South Sudan", "Africa"),
    }
)

# Values that are real and counted but are not a country, so no alpha-3
# honestly describes them. They ship to the UI in `unmapped_countries` with
# their run counts; they are never folded into a neighbour.
#
# The rule, applied uniformly: a value maps only when some ISO 3166-1 code
# covers that entity, possibly aggregated with its siblings -- which is why
# Gaza Strip and West Bank both map to PSE, the five US minor outlying
# islands to UMI, and Svalbard and Jan Mayen to SJM, while the entries below
# do not map at all. Mapping Coral Sea Islands to AUS would colour a
# continent for a reef survey.
UNMAPPED: Dict[str, str] = {
    "Borneo": "an island shared by Indonesia, Malaysia and Brunei",
    "Clipperton Island": "no ISO 3166-1 code; CP/CPT is only reserved",
    "Coral Sea Islands": "Australian territory with no code of its own",
    # The four Iles Eparses. ATF exists and would take them administratively,
    # but the ATF shape at 110m is Kerguelen and Adelie Land -- a Mozambique
    # Channel islet drawn in the southern Indian Ocean is worse than absent.
    "Europa Island": "Iles Eparses; ATF's 110m shape is thousands of km away",
    "Glorioso Islands": "Iles Eparses; ATF's 110m shape is thousands of km away",
    "Juan de Nova Island": "Iles Eparses; ATF's 110m shape is thousands of km away",
    "Tromelin Island": "Iles Eparses; ATF's 110m shape is thousands of km away",
    # Dissolved states. ISO 3166-3 records them, ISO 3166-1 does not, and
    # each split into successors no single code stands for.
    "Netherlands Antilles": "dissolved 2010 into CUW, SXM and BES",
    "Serbia and Montenegro": "dissolved 2006 into SRB and MNE",
    "Yugoslavia": "dissolved; no single successor",
    # Disputed, claimed by several states, no ISO code.
    "Paracel Islands": "disputed; no ISO 3166-1 code",
    "Spratly Islands": "disputed; no ISO 3166-1 code",
}

# ISO numeric ids present in the committed world-110m asset
# (`sites/brc-analytics/public/geo/countries-110m.json`, world-atlas 2.0.2 /
# Natural Earth 4.1.0, 1:110m). 174 of its 177 features carry an id; the
# three that do not -- Kosovo, N. Cyprus, Somaliland -- have no ISO 3166-1
# code either.
#
# Held here rather than derived at runtime so the API can say up front which
# countries it cannot place. A test reads the asset and asserts this set
# still matches it, so swapping the file cannot silently invalidate the
# claim.
TOPOJSON_COUNTRY_IDS: FrozenSet[str] = frozenset(
    {
        "004",
        "008",
        "010",
        "012",
        "024",
        "031",
        "032",
        "036",
        "040",
        "044",
        "050",
        "051",
        "056",
        "064",
        "068",
        "070",
        "072",
        "076",
        "084",
        "090",
        "096",
        "100",
        "104",
        "108",
        "112",
        "116",
        "120",
        "124",
        "140",
        "144",
        "148",
        "152",
        "156",
        "158",
        "170",
        "178",
        "180",
        "188",
        "191",
        "192",
        "196",
        "203",
        "204",
        "208",
        "214",
        "218",
        "222",
        "226",
        "231",
        "232",
        "233",
        "238",
        "242",
        "246",
        "250",
        "260",
        "262",
        "266",
        "268",
        "270",
        "275",
        "276",
        "288",
        "300",
        "304",
        "320",
        "324",
        "328",
        "332",
        "340",
        "348",
        "352",
        "356",
        "360",
        "364",
        "368",
        "372",
        "376",
        "380",
        "384",
        "388",
        "392",
        "398",
        "400",
        "404",
        "408",
        "410",
        "414",
        "417",
        "418",
        "422",
        "426",
        "428",
        "430",
        "434",
        "440",
        "442",
        "450",
        "454",
        "458",
        "466",
        "478",
        "484",
        "496",
        "498",
        "499",
        "504",
        "508",
        "512",
        "516",
        "524",
        "528",
        "540",
        "548",
        "554",
        "558",
        "562",
        "566",
        "578",
        "586",
        "591",
        "598",
        "600",
        "604",
        "608",
        "616",
        "620",
        "624",
        "626",
        "630",
        "634",
        "642",
        "643",
        "646",
        "682",
        "686",
        "688",
        "694",
        "703",
        "704",
        "705",
        "706",
        "710",
        "716",
        "724",
        "728",
        "729",
        "732",
        "740",
        "748",
        "752",
        "756",
        "760",
        "762",
        "764",
        "768",
        "780",
        "784",
        "788",
        "792",
        "795",
        "800",
        "804",
        "807",
        "818",
        "826",
        "834",
        "840",
        "854",
        "858",
        "860",
        "862",
        "887",
        "894",
    }
)


def _key(value: str) -> str:
    """Normalise a raw country string for lookup.

    Case, surrounding whitespace, combining accents and curly apostrophes all
    vary between SRA snapshots and none of them change which country is meant
    -- the named risk here is exactly a "Cote d'Ivoire" that stops matching
    because a rebuild started writing "Cote d'Ivoire" with a combining accent.
    """
    unified = value.replace("’", "'").replace("ʼ", "'")
    decomposed = unicodedata.normalize("NFKD", unified)
    stripped = "".join(c for c in decomposed if not unicodedata.combining(c))
    return " ".join(stripped.casefold().split())


_BY_KEY: Dict[str, Country] = {_key(raw): iso for raw, iso in COUNTRIES.items()}
_UNMAPPED_KEYS: FrozenSet[str] = frozenset(_key(raw) for raw in UNMAPPED)


def lookup(value: str) -> Optional[Country]:
    """The ISO entry for a raw country string, or None.

    None covers both "deliberately not a country" (`UNMAPPED`) and "we have
    never seen this string", because the caller does the same thing with
    either: count it, report it as unplaceable, and never guess.
    """
    return _BY_KEY.get(_key(value))


def is_unmapped(value: str) -> bool:
    """Whether a value is one we decided not to map, rather than one we missed.

    Only for telling those two apart -- in a log line, or in the test that
    asserts every distinct value in the mirror is one or the other.
    """
    return _key(value) in _UNMAPPED_KEYS
