# Contract Classification System

PoodleScrappy employs a two-stage filtering and scoring engine to identify relevant government contracts. This document outlines the logic used in `src/services/contractFilter.ts`.

## 1. The Pipeline
Every contract fetched from the API goes through this pipeline:
`Raw Data` -> **Stage 1: Hard Filters** -> **Stage 2: Scoring** -> **Stage 3: Sorting** -> `Final Report`

---

## 2. Hard Filters (Pass/Fail)
These are binary gates. If a contract fails any of these, it is immediately discarded.

### A. Price Filter
-   **Logic**: Checks the `basePrice` field.
-   **Normalization**: Converts strings like "75.000,00 €" to float `75000.00`.
-   **Rules**:
    -   Must be **>** `minPrice` (Configurable in `weekly_run.ts`)
    -   Must be **<** `maxPrice` (if configured)

### B. Exclusion Filter
-   **Logic**: Checks `contractDesignation` (Title) against a list of "Excluded Terms".
-   **Case Sensitivity**: Case-insensitive.
-   **Action**: If *any* excluded term is found in the title, the contract is dropped.
-   **Example Exclusions**: "Limpeza", "Construção Civil", "Manutenção Predial" (Cleaning, Construction, Maintenance).

---

## 3. Scoring System (Relevance)
Contracts that pass the hard filters are assigned a **Relevance Score**.

### Keyword Matching
-   **Base Logic**: +10 Points per matched keyword.
-   **Source**: Matches `contractDesignation` against `profile.keywords`.
-   **Accumulation**: Score is cumulative. If a title contains 3 distinct keywords, it gets 30 points.
-   **Example**:
    -   Title: *"Aquisição de **Software** para **Gestão** de **Dados**"*
    -   Keywords: "Data", "Software", "Management"
    -   Score: 30

### Value Boosting (Optional/Legacy)
*Note: Currently commented out in v1.0.0 code.*
-   Logic: +5 Points if Price > €50,000.

---

## 4. Configuration
Modify the filtering rules in `src/scripts/weekly_run.ts`:

```typescript
const MY_PROFILE: UserProfile = {
    keywords: [
        'informática', 'software', 'desenvolvimento', 'web', 'plataforma',
        'app', 'digital', 'inteligência artificial', 'dados'
    ],
    minPrice: 5000,
    excludedTerms: ['limpeza', 'construção civil', 'manutenção predial']
};
```
