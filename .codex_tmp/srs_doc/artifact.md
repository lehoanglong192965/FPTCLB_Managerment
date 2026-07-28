# Template Style Artifact

## Reference Evidence

- Source: `reference.docx`
- SHA-256: `88ed6ed56331cae779994d0750c119a9fbb09f0e561a24188a2f951f5fbd2489`
- Inventory: `reference_inventory.txt`
- Render: `reference_render/reference.pdf` and `reference_render/page-01.png` through `page-38.png`
- Verified page count: 38
- Sections: 1
- Body paragraphs: 234
- Tables: 12
- Inline images: 10, plus one floating drawing

## Page System

- A4 portrait, 8.27 x 11.69 inches.
- Margins: 1 inch on all sides.
- Header and footer are visually empty; do not add ornamental furniture.
- Primary page background is white with black text and thin black table/diagram rules.
- Cover is a right-aligned typographic composition with generous blank space.
- Body sections use simple numbered headings, prose, bordered tables, and centered figures.
- Major sections may start on a fresh page where this prevents awkward table or figure splits.

## Typography

- Theme-derived sans serif typeface, visually compatible with Arial/Calibri.
- Cover title: 36 pt bold, right aligned.
- Cover connector line: 24 pt bold, right aligned.
- Cover system name and metadata: 27 pt and 23 pt bold, right aligned.
- Table of contents title: 23 pt bold.
- Table of contents entries: 14 pt; top-level entries bold.
- Major body heading: 23 pt bold.
- Subsection heading: 12 pt bold in the rendered reference, with restrained spacing.
- Body copy: 12 pt, black, left aligned, compact paragraph spacing.
- Figure captions: centered, bold, 11-12 pt.
- Table text: compact sans serif, normally 9-11 pt depending on table density.

## Table System

- Thin black borders on all cells.
- Header rows use bold text and light gray shading.
- Use-case specifications use a compact two-column field/value table; nested flows may use numbered rows.
- Data dictionaries use five columns when field-level detail is required and two-to-four columns for aggregate summaries.
- Prevent row splitting where possible and repeat header rows across pages.
- Avoid empty filler rows and oversized blank spaces found in the source reference.

## Figure System

- Figures are centered and sized within the printable area.
- Diagrams use monochrome or restrained gray-blue fills, black outlines, and readable sans serif labels.
- Captions follow `Figure N. Description for FPTU Club Management System`.
- Flow diagrams use rounded start/end nodes, rectangular activities, and explicit directional arrows.

## Slot Map

| Reference slot | FCMS replacement |
|---|---|
| Cover | FCMS title, release/version, team, institution context, and date |
| Manual contents | Dynamic Word TOC covering headings 1-3 |
| Introduction | FCMS purpose, conventions, scope, references |
| Overall Description | FCMS architecture, actors, runtime, constraints, dependencies |
| System Features | FCMS use-case overview and domain use-case specifications |
| Data Requirements | FCMS conceptual/logical models, entity dictionary, business rules |
| External Interfaces | React/Spring REST, SQL Server, OAuth2, SePay, Cloudinary, SMTP, Gemini, ClamAV |
| Quality Attributes | Security, performance, availability, integrity, maintainability, privacy |
| Appendix flowcharts | Event, payment/registration, attendance/report/contribution lifecycles |
| Additional appendices | Role matrix, scheduler catalog, implementation traceability, known gaps |

## Content Preservation and Rewrite Decision

- The user's instruction requires a complete domain rewrite from an unrelated EV charging SRS to the FCMS project.
- Preserve the document's visual system, page geometry, hierarchy, table treatment, and figure-caption conventions.
- Replace all EV-domain prose, tables, images, and references; no source-domain business content is authoritative for FCMS.
- Reuse the original DOCX as the package/style base, remove its body content, and rebuild the body in the documented slot order.
- Update Word fields after generation so the TOC and page references reflect the final pagination.

## Known Risks and Mitigations

- The source contains malformed decimal OOXML indentation values; normalize these before processing.
- The source's manual TOC and several tables have weak pagination; use a real TOC field and explicit keep/split controls.
- Rendering through LibreOffice is unavailable in this environment; Microsoft Word PDF export is the reference renderer.
- The source mixes direct formatting with heading styles; normalize final headings and body copy while preserving the visible hierarchy.
