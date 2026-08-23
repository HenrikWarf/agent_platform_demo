# Multi-Client Context Engine & Retailer Workspace Architecture

> **Architecture Specification for Dynamic Multi-Tenant Client Context Management, Dual Retailer Engines (Crazy Fashion + ICA Sverige), and Seamless Workspace Switching.**

---

## 1. Executive Overview

To enable the GCP Multi-Agent Marketing Platform to serve diverse enterprise clients across industries, the platform implements a **Modular Context Engine**. 

Users can seamlessly switch between client workspaces from the landing page or navbar. When a client workspace is selected, all system instructions, BigQuery database targets, currency standards, brand voice guidelines, product catalogs, and A2UI renderers dynamically adapt to that client.

```
                                    +-----------------------------------+
                                    |     React Frontend Workspace      |
                                    |   (Landing Screen & Switcher)     |
                                    +-----------------+-----------------+
                                                      |
                                     [Select: crazy_fashion | ica_sweden]
                                                      |
                                                      v
                                    +-----------------------------------+
                                    |      Context Registry Engine      |
                                    |    (app/contexts/registry.py)     |
                                    +--------+-----------------+--------+
                                             |                 |
                        +--------------------+                 +--------------------+
                        v                                                           v
        +-------------------------------+                           +-------------------------------+
        |  Client A: Crazy Fashion      |                           |  Client B: ICA Sverige        |
        |  • Industry: Fashion Apparel  |                           |  • Industry: Grocery & Health |
        |  • Currency: EUR (€)          |                           |  • Currency: SEK (kr)         |
        |  • Loyalty: Crazy Club        |                           |  • Loyalty: ICA Stammis       |
        |  • Dataset: marketing_analytics|                          |  • Dataset: marketing_analytics_ica
        |  • Catalogs: 50 Fashion SKUs  |                           |  • Catalogs: 50 Grocery SKUs  |
        |  • Deliverables: Lookbooks    |                           |  • Deliverables: A2UI Banners |
        +-------------------------------+                           +-------------------------------+
```

---

## 2. Client Profiles & Domain Contexts

### 2.1 Client A — Crazy Fashion
* **Company Profile**: Fast-growing Nordic fashion retailer operating 3,200+ stores across Europe.
* **Industry**: Fast-fashion, denim, knitwear, sustainable apparel, and accessories.
* **Currency**: EUR (`€`).
* **Loyalty Program**: **Crazy Club** (Bronze, Silver, Gold, Platinum tiers; 10 points per €1).
* **BigQuery Dataset**: `marketing_analytics` (Tables: `customer_rfm_summary`, `customer_demographics_360`, `customer_transactions`, `product_catalog`, `customer_events`).
* **Customer Segments**: `VIP Fashionistas`, `Loyal Regulars`, `Seasonal Shoppers`, `New Explorers`, `Dormant At-Risk`.
* **Primary Brand Colors**: Royal Indigo (`#4f46e5`), Black (`#111827`), Warm Amber (`#d97706`).

### 2.2 Client B — ICA Sverige (Food, Grocery & Health)
* **Company Profile**: Sweden's leading grocery retailer (~1,300 stores across ICA Maxi, ICA Kvantum, ICA Supermarket, ICA Nära, Apotek Hjärtat).
* **Industry**: Food retail, fresh produce, organic (ICA I love eco / KRAV), Swedish staples, health & wellness.
* **Currency**: SEK (`kr` / `:-`).
* **Loyalty Program**: **ICA Stammis** (Stammispris, 1 point per 1 SEK, monthly bonus cheques, personal app coupons).
* **BigQuery Dataset**: `marketing_analytics_ica` (Tables: `customer_rfm_summary`, `customer_demographics_360`, `customer_transactions`, `product_catalog`, `customer_events`).
* **Customer Segments**: `Ekologiskt Medvetna`, `Barnfamiljer Storhandlare`, `Lojala Veckohandlare`, `Prisjägare & Studenter`, `Inaktiva Stammisar`.
* **Primary Brand Colors**: Iconic ICA Red (`#E01E26`), Stammis Yellow (`#FFE600`), Fresh Green (`#008744`).
* **Special Capabilities**: **A2UI Interactive Offer Banners** ("Ladda till kortet", "Lägg i inköpslista", "Receptförslag", "Snabbkassa Självscanning").

---

## 3. Context Engine Structure

To ensure clean separation of concerns, company configurations are structured in `app/contexts/`:

```
app/
├── contexts/
│   ├── __init__.py
│   ├── base.py              # BaseClientContext abstract interface
│   ├── crazy_fashion.py     # Crazy Fashion configuration & prompt instructions
│   ├── ica_sweden.py        # ICA Sverige configuration & prompt instructions
│   └── registry.py          # ContextRegistry factory (resolve by client_id)
```

### 3.1 BaseClientContext Interface (`app/contexts/base.py`)
Each context class provides:
- `client_id`: Unique identifier (e.g. `crazy_fashion`, `ica_sweden`).
- `client_name`: Display name (e.g. "Crazy Fashion", "ICA Sverige").
- `tagline`: Industry description.
- `currency_symbol`: `€` vs `kr`.
- `currency_code`: `EUR` vs `SEK`.
- `bigquery_dataset`: Target BigQuery dataset.
- `company_prompt`: Injected system instructions describing brand, vision, products, and loyalty.
- `brand_colors`: Primary, secondary, accent, and background palette.
- `objective_categories`: Tailored suggestion categories for the chat interface.

---

## 4. API Endpoints for Workspace Management

| Endpoint | Method | Description |
|---|:---:|---|
| `/api/clients` | `GET` | Returns list of all supported client profiles with metadata and sample prompts. |
| `/api/clients/active` | `GET` | Returns active client profile for current session. |
| `/api/clients/switch` | `POST` | Switches active client context for the session (`{ "client_id": "ica_sweden" }`). |
| `/api/chat` & `/api/chat/stream` | `POST` | Accepts optional `client_id` in request body to execute against target context. |

---

## 5. Frontend User Experience

1. **Client Workspace Selector Landing Page (`ClientWorkspaceSelector.jsx`)**:
   - First-load welcome page featuring dual visual client cards with logos, industry tags, key statistics, and "Enter Workspace" actions.
2. **Persistent Navbar Client Switcher Dropdown**:
   - Allows instant switching between Crazy Fashion and ICA Sverige from any screen.
3. **Reactive UI Theming**:
   - Header accent color, sample prompts, and BigQuery data columns adapt dynamically based on the active client.
