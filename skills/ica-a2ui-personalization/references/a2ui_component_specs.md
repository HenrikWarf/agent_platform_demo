# A2UI Component Visual Specification — ICA Sverige

## 1. Component Type: `ica_stammis_offer_banner`
- **Visual Theme**: Swedish red/white grocery design tokens, bold high-contrast deal badges, and rounded card containers.
- **Hero Deal Typography**:
  - `deal_price`: Price numeral in large red font (`24:90 kr/st` or `119:-`).
  - `comparison_price`: Smaller secondary text (`Jmf-pris: 16:60/kg`).
  - `discount_label`: Green or red savings pill (`Spara 10:-` or `Veckans Stammispris`).
- **Origin & Eco Badges**: Display `svensk_kott_flag` (true) and `krav_certified` (true) when appropriate.
- **Card CTA**: Must be `Ladda till kortet` with active Stammis card icon.

## 2. Cardinality Constraints
- Single-product banner by default (`additional_deals = null`).
- Multi-product bundle ONLY when explicitly requested by user.
