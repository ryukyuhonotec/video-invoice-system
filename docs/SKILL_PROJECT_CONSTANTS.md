
# Project Constants & Rules

## CRITICAL RULE: Status Strings
This project uses **Japanese** strings for database status values.
**NEVER** use English enum keys (e.g., "DRAFT", "IN_PROGRESS", "PAID") directly in database seeding or UI verification.

### Valid Invoice Statuses
- `受注前` (Draft)
- `受注確定` (Order Confirmed)
- `制作中` (In Progress)
- `納品済` (Delivered)
- `請求済` (Invoiced)
- `入金済み` (Paid)

### Valid Task/Outsource Statuses
- `受注前`
- `制作中`
- `納品済`
- `請求済`
- `入金済み`
- `失注` (Cancelled/Lost)

## Testing Guidelines
- When seeding data, ALWAYS use these Japanese strings.
- When verifying UI, look for these Japanese strings.
- "Ghost Revenue" occurs when data is inserted with English status "PAID" but the UI filters for "入金済み".

## Data Entry Simulation
- Do not use direct DB seeding for "Manual Entry" requests.
- Use Playwright/Browser scripts that interact with the UI to ensure application logic (validation, hooks) is exercised.
