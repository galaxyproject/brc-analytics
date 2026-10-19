import bs4
import dlt
import requests
from bs4 import BeautifulSoup

from .common import LoadDestinationParams


def get_datacache_directory_listing_urls(directory_url: str, timeout=30):
    """
    Fetch datacache directory listing and extract link URLs.

    Args:
        directory_url: URL of a datacache genomes directory. Must end in a slash.
        timeout: Request timeout.

    Returns:
        Set of link URLs present on the specified directory listing page
    """
    response = requests.get(directory_url, timeout=timeout)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    return {
        href
        for link in soup.find_all("a")
        if isinstance(link, bs4.element.Tag)
        and isinstance(href := link.get("href"), str)
    }


@dlt.resource(name="datacache_directory_listing", write_disposition="replace")
def datacache_directory_listing(url: str):
    yield [{"url": url} for url in get_datacache_directory_listing_urls(url)]


@dlt.source
def galaxy_data(*, datacache_directory_url: str):
    return [datacache_directory_listing(datacache_directory_url)]


def load_galaxy_data(dest: LoadDestinationParams, galaxy_datacache_directory_url: str):
    pipeline = dlt.pipeline(
        pipeline_name=dest.get_dlt_pipeline_name("galaxy"),
        destination=dlt.destinations.duckdb(dest.get_db_path_string()),
        dataset_name="galaxy",
    )
    pipeline.run(galaxy_data(datacache_directory_url=galaxy_datacache_directory_url))
