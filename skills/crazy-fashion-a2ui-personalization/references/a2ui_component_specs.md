# A2UI Component Visual Specification — Crazy Fashion

## 1. Component Type: `crazy_fashion_drop_card`
- **Visual Theme**: Minimalist high-contrast dark/monochrome editorial layout with serif collection typography.
- **Hero Product Card Elements**:
  - `collection_headline`: Uppercase headline (e.g. `STUDIO COLLECTION // AUTUMN 2026`).
  - `sustainable_materials_tag`: Pill badge (`100% Recycled Italian Wool 🌿`).
  - `member_price`: Bold pricing (`€59.99`) alongside crossed-out public price (`€79.99`).
  - `crazy_club_points_awarded`: Value pill (`+150 Club Points`).
  - `available_sizes`: Interactive sizes (`["XS", "S", "M", "L", "XL"]`).
  - `color_swatches`: Hex codes (`["#2C2C2C", "#D3C5B4", "#7A8B7B"]`).
  - `products`: List of up to 5 `FashionProductDetail` items for carousel navigation (`activeProductIdx` controls, tabs, and quick-switch rail).

## 2. Cardinality Constraints
- Single-product banner by default (`additional_look_items = null`).
- Multi-product carousel list populated when multiple recommendations are generated.
