from setuptools import setup

setup(
  name="catalog_build",
  version="1.5.0",
  packages=["catalog_build"],
  install_requires=["pandas", "requests", "PyYAML", "BeautifulSoup4", "lxml"],
)
