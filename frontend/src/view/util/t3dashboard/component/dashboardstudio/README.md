# Dashboard Studio

Dashboard Studio builds, saves, edits, and renders dashboard widgets.

## Data Source Catalog

The widget builder no longer uses static frontend catalog files. Source selection is loaded at runtime through:

- `GET /insight/widget-builder/source-catalog`
- Table/view metadata from `tb_is_meta_table`
- Procedure/function metadata from `tb_is_meta_procedure`

The metadata is prepared by the existing Insight Studio Build Console flow. If the catalog is empty, run DDL schema import and procedure DDL refresh from Build Console first.

## Main Areas

| Area | Role |
| --- | --- |
| `UserDashboardPage.jsx` | Top-level dashboard portal — list/select/access/launch builders. |
| `core` | Shared constants and helpers (grid rules, events, config, WidgetThumbnail, GridLayoutCompat). |
| `widgetbuilder` | Widget Builder popup with 4 tabs (AI / Direct create / Meta management / Library) + runtime DB catalog. |
| `dashboardbuilder` | Dashboard layout builder popup (drag-and-drop widget placement, access control). |
| `generic` | Saved widget spec parsing, runtime data config conversion, and generic widget rendering. |
| `doc` | Business exploration design guides (DomainBrowse 5-step flow — currently inactive, files preserved). |
| `types` | Shared SP parameter metadata helpers. |

## Design Documents

- [T3Dashboard 빌더 화면 설계 로드맵](doc/T3Dashboard_빌더_화면_설계_로드맵.md): Defines `T3Dashboard` as the consultant-facing Dashboard Studio/Builder screen and records the planned separation from a read-only user dashboard viewer.

## Runtime Notes

- Actual table/view execution uses the existing `/common/*` APIs (`/common/table-columns`, `/common/table-query`).
- SP (`STORED_PROCEDURE`) source type is recognized by `normalizeSourceType` for backend/AI response compatibility, but **SP widget creation UI is deprecated** (TABLE + VIEW only). Backend endpoints `/common/sp-params` and `/insight/ai-dashboard/sp-catalog/params` remain available if SP widgets are re-enabled.
