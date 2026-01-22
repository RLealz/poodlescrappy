<div align="center">

# PoodleScrappy
### BaseGov Contract Intelligence & Automation Engine

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Axios](https://img.shields.io/badge/HTTP-Axios-purple.svg?style=flat-square)](https://axios-http.com/)
[![License](https://img.shields.io/badge/License-ISC-grey.svg?style=flat-square)](LICENSE)
[![Security Status](https://img.shields.io/badge/Security-Audited-success.svg?style=flat-square&logo=security)](security_audit_report.md)

**An enterprise-grade, stealth-optimized scraping automation tool designed to extract, filter, and analyze government contract data from the Portuguese Public Contracts Portal (BASE).**

[Overview](#overview) • [Architecture](#architecture) • [Installation](#installation--setup) • [Usage](#usage-guide) • [Security](#security-considerations)

</div>

---

## Overview

**PoodleScrappy** (formerly CloudyTool) is a specialized backend automation utility engineered to reverse-engineer and interface with the `base.gov.pt` internal API. Unlike generic scrapers, PoodleScrappy implements sophisticated heuristic evasion techniques to mimic human traffic patterns, ensuring reliable operation without triggering WAF (Web Application Firewall) blocking mechanisms.

It autonomously polls the portal for public procurement announcements, applies a rigorous set of business logic filters (keyword matching, price thresholds, exclusion patterns), and generates structured intelligence reports in JSON format. This tool serves as the data ingestion layer for downstream analytics dashboards or alert systems.

### Key Features
-   **🕵️‍♂️ Stealth Operations**: Implements advanced jitter algorithms and header emulation to mimic legitimate browser traffic (Chrome 120+).
-   **🧠 Intelligent Filtering**: Customizable filtering engine that classifies contracts based on relevance scores, keywords, and financial thresholds.
-   **🛡️ WAF Evasion**: Built-in rate limiting and connection pooling to maintain long-term session stability.
-   **📄 Structured Reporting**: Outputs normalized, machine-readable JSON data ready for integration with BI tools or databases.
-   **⚡ TypeScript Core**: Built on a strictly typed codebase for maximum reliability and maintainability.

---

## Architecture

PoodleScrappy operates as a headless Node.js service, designed for deployment on VPS or containerized environments.

### Technology Stack
-   **Runtime Environment**: Node.js (LTS 20.x Recommended)
-   **Language**: TypeScript 5.0 (Strict Mode)
-   **HTTP Client**: Axios (Custom configured instance)
-   **Parser**: Cheerio (High-performance DOM manipulation)

### Data Flow
1.  **Injection**: The `BaseGovService` constructs signed payloads mimicking the official portal's frontend requests.
2.  **Extraction**: Raw HTML/JSON responses are parsed and normalized into `Contract` objects.
3.  **Filtration**: The `ContractFilter` service applies the `UserProfile` ruleset (Keywords, Min/Max Price, Exclusions).
4.  **Classification**: Contracts are scored for relevance and sorted.
5.  **Persistence**: Final dataset is verified and serialized to `weekly_report.json`.

---

## Installation & Setup

### Prerequisites
-   **Node.js**: v18.0.0 or higher
-   **npm**: v9.0.0 or higher
-   **Git**: Latest version

### Step-by-Step Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/RLealz/PoodleScrappy.git
    cd PoodleScrappy
    ```

2.  **Install Dependencies**
    A clean install is recommended to ensure lockfile synchronization.
    ```bash
    npm ci
    ```

3.  **Build the Project**
    Compile the TypeScript source to JavaScript artifacts (optional for dev, required for prod).
    ```bash
    npm run build
    ```

---

## Configuration

PoodleScrappy adheres to the **12-Factor App** principles but currently favors code-based configuration for complex filtering logic.

### User Profile Configuration
Modify `src/scripts/weekly_run.ts` to adjust the targeting parameters:

```typescript
const MY_PROFILE: UserProfile = {
    keywords: [
        'informática', 'cybersecurity', 'AI', 'cloud'
    ],
    minPrice: 5000, // Minimum contract value in EUR
    maxPrice: 500000,
    excludedTerms: ['hardware', 'printers', 'consumables']
};
```

### Operational Parameters
-   **`DAYS_TO_FETCH`**: Defines the lookback window (default: 14 days).
-   **`randomDelay`**: Jitter range (default: 2000-5000ms). *Warning: Decreasing this increases blocking risk.*

---

## Usage Guide

### Manual Execution
To run an immediate scrape and report generation cycle:

```bash
npx ts-node src/scripts/weekly_run.ts
```

**Output**:
-   Console logs indicating progress (Page 1, Page 2...).
-   `weekly_report.json` generated in the project root.

### Automated Scheduling (Cron/Windows Task Scheduler)
For production environments, schedule the run weekly (e.g., Monday 09:00 AM).

**Cron Example (Linux/VPS):**
```bash
0 9 * * 1 cd /path/to/PoodleScrappy && /usr/bin/npx ts-node src/scripts/weekly_run.ts >> /var/log/poodlescrappy.log 2>&1
```

---

## Development Structure

```text
src/
├── scripts/
│   ├── weekly_run.ts       # Main entry point / Orchestrator
│   └── probe_api.ts        # Utility for testing API endpoints
├── services/
│   ├── baseGovService.ts   # API Interaction Layer (HTTP, Headers)
│   └── contractFilter.ts   # Business Logic & Classification Engine
└── index.ts                # Application Bootstrapper
```

### Testing
Verify the build integrity:
```bash
npm run build
```
*Note: A full test suite is planned for v1.1.0.*

---

## Security Considerations

This project has undergone a **Blue Team Security Audit** (Date: 2026-01-22).

### Network Security
-   **HTTPS Only**: All traffic is encrypted via TLS 1.2+.
-   **No Open Ports**: The application acts as a client only; no inbound ports are required.

### Operational Security (OpSec)
-   **Rate Limiting**: STRICTLY ENFORCED. Do not remove the `delay()` calls in `weekly_run.ts`.
-   **User-Agent**: The service masquerades as `Chrome/120` on Windows 10. Do not use generic bot headers.

### Data Privacy
-   **No PII Storage**: The tool only processes public corporate contract data.
-   **Git Hygiene**: `*.json` reports and `node_modules` are git-ignored to prevent data leakage.

---

## Troubleshooting

| Issue | Probable Cause | Solution |
| :--- | :--- | :--- |
| **HTTP 403 Forbidden** | IP Ban or Bad User-Agent | Check Internet connection; Increase `randomDelay`; Verify `baseGovService.ts` headers. |
| **No Results Found** | Strict Filters | Relax `minPrice` or add broader keywords in `MY_PROFILE`. |
| **Timeout Error** | Slow API Response | The API is notoriously slow. Retrying immediately is usually safe. |

---

## Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add amazing feature'`).
4.  **Verify Security**: Ensure no rate limits were removed.
5.  Push to the branch (`git push origin feature/amazing-feature`).
6.  Open a Pull Request.

---

## License

This project is licensed under the **ISC License**.

**Disclaimer**: This tool is for educational and internal business intelligence purposes only. Use responsibly and adhere to the Terms of Service of the target platform.
