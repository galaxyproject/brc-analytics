from setuptools import setup

setup(
  name="catalog_build",
  version="2.1.0",
  packages=["catalog_build"],
  install_requires=["pandas", "requests", "PyYAML", "BeautifulSoup4", "lxml"],
)
