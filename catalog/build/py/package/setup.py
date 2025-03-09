from setuptools import setup

setup(
  name="catalog_build",
  version="1.4.1",
  packages=["catalog_build"],
  install_requires=["pandas", "requests", "PyYAML", "BeautifulSoup4", "lxml"],
)
