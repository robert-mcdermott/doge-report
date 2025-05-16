#!/usr/bin/env python3
"""
Convert every UTF-8 CSV in the sibling 'data' directory into an .xlsx file
with the same base-name, scrubbing Excel-illegal control characters on the way.

Requires:  pip install openpyxl
"""

from pathlib import Path
import csv, re
from openpyxl import Workbook
from openpyxl.cell.cell import ILLEGAL_CHARACTERS_RE

# Excel’s maximum characters per cell
EXCEL_TEXT_LIMIT = 32_767

TOOLS_DIR = Path(__file__).resolve().parent       # …/tools
DATA_DIR = TOOLS_DIR.parent / "data"              # …/data
if not DATA_DIR.is_dir():
    raise SystemExit(f"✗ Expected data directory {DATA_DIR} to exist")

def clean(value: str) -> str:
    """Remove control codes Excel won’t accept and enforce 32 767-char limit."""
    value = ILLEGAL_CHARACTERS_RE.sub("", value)
    if len(value) > EXCEL_TEXT_LIMIT:
        value = value[: EXCEL_TEXT_LIMIT]
    return value

for csv_path in DATA_DIR.glob("*.csv"):
    xlsx_path = csv_path.with_suffix(".xlsx")
    print(f"→ {csv_path.name}  →  {xlsx_path.name}")

    wb = Workbook()
    ws = wb.active

    with csv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter=",")
        for row in reader:
            cleaned = [clean(cell) if isinstance(cell, str) else cell for cell in row]
            ws.append(cleaned)

    wb.save(xlsx_path)

print("✓ All files converted without illegal-character errors")
