from pathlib import Path


def get_db_path_string(temp_folder_path: Path) -> str:
    return str(get_db_path(temp_folder_path))


def get_db_path(temp_folder_path: Path) -> Path:
    return temp_folder_path / "catalog.duckdb"
