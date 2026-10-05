# Boundary geometry for the Logan search map

## `countries-110m.json`

World country outlines as TopoJSON, 1:110m. Served as a static asset from
`/geo/countries-110m.json` and read by the Vega-Lite choropleth in
`CohortGeography`.

|               |                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| Source        | [`world-atlas`](https://github.com/topojson/world-atlas) 2.0.2, file `countries-110m.json`, byte-identical |
| Upstream data | [Natural Earth](https://www.naturalearthdata.com/) 4.1.0, Admin 0 country boundaries, 1:110m               |
| Licence       | ISC (`LICENSE` alongside), Copyright 2013-2019 Michael Bostock. Natural Earth itself is public domain      |
| Size          | 107,761 bytes                                                                                              |
| Retrieved     | 2026-09-03, `npm pack world-atlas@2.0.2`                                                                   |

Committed rather than fetched from a CDN at runtime, so the page has no
third-party request on its render path and the geometry cannot change under
us between deploys.

### Two things to know before touching this file

**Features are keyed by ISO 3166-1 _numeric_ id, not alpha-3.** `id` is the
zero-padded numeric string (`"454"` is Malawi) and `properties.name` is a
short display name (`"Dem. Rep. Congo"`, `"eSwatini"`). The backend emits
`iso_n3` for exactly this join; nothing joins on the name.

**A lot of real countries have no shape at this resolution.** 177 features,
174 of them with an id -- Kosovo, N. Cyprus and Somaliland have no ISO code
and so no id. Hong Kong, Singapore, Malta, Bermuda, most of the Caribbean and
most of the Pacific are simply absent. The backend knows which ids exist
(`TOPOJSON_COUNTRY_IDS` in `app/services/country_iso.py`) and reports the
countries it cannot place instead of dropping them, and a test asserts that
constant still matches this file. **Replacing this file without rerunning
that test will silently invalidate the map's own account of what it left
out.**
