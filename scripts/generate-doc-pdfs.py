"""Generate the committed TravelPort reference PDFs from current Markdown sources."""

from __future__ import annotations

import re
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "docs" / "pdfs"
DOCUMENTS = {
    "API_REFERENCE.pdf": ROOT / "docs" / "API_DOCUMENTATION.md",
    "DEPLOYMENT_GUIDE.pdf": ROOT / "docs" / "DEPLOYMENT.md",
    "SRS.pdf": ROOT / "docs" / "SRS.md",
    "TECHNICAL_DESIGN.pdf": ROOT / "docs" / "TECHNICAL_DESIGN.md",
}


def register_fonts() -> tuple[str, str, str]:
    fonts = Path("C:/Windows/Fonts")
    regular = fonts / "arial.ttf"
    bold = fonts / "arialbd.ttf"
    mono = fonts / "consola.ttf"
    if regular.exists() and bold.exists() and mono.exists():
        pdfmetrics.registerFont(TTFont("TravelPortSans", regular))
        pdfmetrics.registerFont(TTFont("TravelPortSansBold", bold))
        pdfmetrics.registerFont(TTFont("TravelPortMono", mono))
        return "TravelPortSans", "TravelPortSansBold", "TravelPortMono"
    return "Helvetica", "Helvetica-Bold", "Courier"


FONT, FONT_BOLD, FONT_MONO = register_fonts()
PAGE_WIDTH, PAGE_HEIGHT = A4
CONTENT_WIDTH = PAGE_WIDTH - 34 * mm


def clean_text(value: str) -> str:
    replacements = {
        "✅": "Required",
        "❌": "None",
        "⚠️": "[warning]",
        "→": "->",
        "←": "<-",
        "│": "|",
        "─": "-",
        "┌": "+",
        "┐": "+",
        "└": "+",
        "┘": "+",
        "├": "+",
        "┤": "+",
        "┬": "+",
        "┴": "+",
        "┼": "+",
    }
    for old, new in replacements.items():
        value = value.replace(old, new)
    return "".join(ch for ch in value if ord(ch) <= 0xFFFF)


def inline(value: str) -> str:
    value = clean_text(value.strip())
    value = re.sub(r"!\[([^]]*)\]\([^)]+\)", r"\1", value)
    value = re.sub(r"\[([^]]+)\]\(([^)]+)\)", r"\1 (\2)", value)
    value = escape(value)
    value = re.sub(r"`([^`]+)`", rf'<font name="{FONT_MONO}">\1</font>', value)
    value = re.sub(r"\*\*([^*]+)\*\*", rf'<font name="{FONT_BOLD}">\1</font>', value)
    return value


def styles():
    sample = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "TravelPortTitle", parent=sample["Title"], fontName=FONT_BOLD,
            fontSize=24, leading=29, textColor=colors.HexColor("#12355B"),
            alignment=TA_CENTER, spaceAfter=12 * mm,
        ),
        "h1": ParagraphStyle(
            "TravelPortH1", parent=sample["Heading1"], fontName=FONT_BOLD,
            fontSize=17, leading=21, textColor=colors.HexColor("#12355B"),
            spaceBefore=7 * mm, spaceAfter=3 * mm,
        ),
        "h2": ParagraphStyle(
            "TravelPortH2", parent=sample["Heading2"], fontName=FONT_BOLD,
            fontSize=13, leading=17, textColor=colors.HexColor("#1976A3"),
            spaceBefore=5 * mm, spaceAfter=2 * mm,
        ),
        "h3": ParagraphStyle(
            "TravelPortH3", parent=sample["Heading3"], fontName=FONT_BOLD,
            fontSize=11, leading=14, textColor=colors.HexColor("#2F4858"),
            spaceBefore=4 * mm, spaceAfter=1.5 * mm,
        ),
        "body": ParagraphStyle(
            "TravelPortBody", parent=sample["BodyText"], fontName=FONT,
            fontSize=9.2, leading=13, textColor=colors.HexColor("#202A33"),
            spaceAfter=2.2 * mm,
        ),
        "bullet": ParagraphStyle(
            "TravelPortBullet", parent=sample["BodyText"], fontName=FONT,
            fontSize=9.2, leading=13, leftIndent=6 * mm, firstLineIndent=-3.5 * mm,
            spaceAfter=1.2 * mm,
        ),
        "code": ParagraphStyle(
            "TravelPortCode", parent=sample["Code"], fontName=FONT_MONO,
            fontSize=7.2, leading=9.4, leftIndent=3 * mm, rightIndent=3 * mm,
            borderColor=colors.HexColor("#D8E2E8"), borderWidth=0.5,
            borderPadding=5, backColor=colors.HexColor("#F5F8FA"),
            wordWrap="CJK", spaceAfter=3 * mm,
        ),
        "table": ParagraphStyle(
            "TravelPortTable", parent=sample["BodyText"], fontName=FONT,
            fontSize=7.2, leading=9.2, wordWrap="CJK",
        ),
        "table_head": ParagraphStyle(
            "TravelPortTableHead", parent=sample["BodyText"], fontName=FONT_BOLD,
            fontSize=7.2, leading=9.2, textColor=colors.white, wordWrap="CJK",
        ),
    }


def table_rows(lines: list[str], style_map) -> Table | None:
    rows: list[list[str]] = []
    for line in lines:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if cells and all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells):
            continue
        rows.append(cells)
    if not rows:
        return None
    column_count = max(len(row) for row in rows)
    normalized = [row + [""] * (column_count - len(row)) for row in rows]
    data = []
    for row_index, row in enumerate(normalized):
        style = style_map["table_head"] if row_index == 0 else style_map["table"]
        data.append([Paragraph(inline(cell), style) for cell in row])
    table = Table(data, colWidths=[CONTENT_WIDTH / column_count] * column_count, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1976A3")),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#B7C5CE")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F8FA")]),
    ]))
    return table


def markdown_story(source: Path):
    style_map = styles()
    lines = source.read_text(encoding="utf-8").splitlines()
    story = []
    in_code = False
    code_lines: list[str] = []
    i = 0
    title_used = False
    while i < len(lines):
        line = lines[i]
        if line.startswith("```"):
            if in_code:
                content = escape(clean_text("\n".join(code_lines))) or " "
                story.append(Paragraph(content.replace("\n", "<br/>"), style_map["code"]))
                code_lines = []
                in_code = False
            else:
                in_code = True
            i += 1
            continue
        if in_code:
            code_lines.append(line)
            i += 1
            continue
        if line.strip().startswith("|") and i + 1 < len(lines) and lines[i + 1].strip().startswith("|"):
            block = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                block.append(lines[i])
                i += 1
            table = table_rows(block, style_map)
            if table:
                story.extend([table, Spacer(1, 3 * mm)])
            continue
        if not line.strip():
            story.append(Spacer(1, 1.5 * mm))
        elif line.startswith("# ") and not title_used:
            story.append(Paragraph(inline(line[2:]), style_map["title"]))
            title_used = True
        elif line.startswith("# "):
            story.append(Paragraph(inline(line[2:]), style_map["h1"]))
        elif line.startswith("## "):
            story.append(Paragraph(inline(line[3:]), style_map["h1"]))
        elif line.startswith("### "):
            story.append(Paragraph(inline(line[4:]), style_map["h2"]))
        elif line.startswith("#### "):
            story.append(Paragraph(inline(line[5:]), style_map["h3"]))
        elif re.match(r"^\s*[-*] ", line):
            text = re.sub(r"^\s*[-*] ", "", line)
            story.append(Paragraph("• " + inline(text), style_map["bullet"]))
        elif re.match(r"^\s*\d+\. ", line):
            match = re.match(r"^\s*(\d+)\. (.*)", line)
            story.append(Paragraph(f"{match.group(1)}. " + inline(match.group(2)), style_map["bullet"]))
        elif line.strip() == "---":
            story.append(Spacer(1, 2 * mm))
        elif line.startswith("> "):
            story.append(Paragraph(inline(line[2:]), style_map["bullet"]))
        else:
            story.append(Paragraph(inline(line), style_map["body"]))
        i += 1
    return story


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#D8E2E8"))
    canvas.line(17 * mm, 14 * mm, PAGE_WIDTH - 17 * mm, 14 * mm)
    canvas.setFont(FONT, 7.5)
    canvas.setFillColor(colors.HexColor("#60717C"))
    canvas.drawString(17 * mm, 9 * mm, "TravelPort | Prakash Infotech")
    canvas.drawRightString(PAGE_WIDTH - 17 * mm, 9 * mm, f"Page {doc.page}")
    canvas.restoreState()


def generate(output: Path, source: Path):
    doc = SimpleDocTemplate(
        str(output), pagesize=A4, rightMargin=17 * mm, leftMargin=17 * mm,
        topMargin=16 * mm, bottomMargin=20 * mm,
        title=source.stem.replace("_", " ").title(),
        author="Prakash Infotech",
        subject="TravelPort project documentation",
    )
    doc.build(markdown_story(source), onFirstPage=footer, onLaterPages=footer)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for filename, source in DOCUMENTS.items():
        if not source.exists():
            raise FileNotFoundError(source)
        generate(OUTPUT_DIR / filename, source)
        print(f"Generated {OUTPUT_DIR / filename}")


if __name__ == "__main__":
    main()
