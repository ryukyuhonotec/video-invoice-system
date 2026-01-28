# System Improvement Report (Stress Test Results)

**Date**: 2026-01-29
**Coverage**: Stress Test (50+ Clients, 20 Partners), UI Audit
**Total Findings**: 23 Items

---

## 🚨 Critical & High Priority (Must Fix)

| ID | Issue | Description | Recommendation |
|----|-------|-------------|----------------|
| **1** | **No Pagination** | Dashboard and Client lists load all 50+ records at once. Infinite scroll or pagination is missing. | Implement server-side pagination (10-20 items/page). |
| **2** | **Broken Partner Filter** | "Role" filter on Partners page is non-functional (only shows "ALL"). | Fix the filtering logic in `PartnerList` component. |
| **3** | **Missing Partner Options** | **Critical Bug**: In Invoice Creation, adding a task results in an empty Partner dropdown. | Fix `useEffect` or data passing in `InvoiceForm` to ensure partners load for tasks. |
| **4** | **Unsafe Deletion** | Deleting a Pricing Rule happens immediately without confirmation. | Add `AlertDialog` confirmation before delete action. |
| **5** | **Native Selectors** | Using native `<select>` for 50+ clients is unusable. Hard to find names. | Replace all Client/Partner selectors with `SearchableMultiSelect` (Combobox). |
| **6** | **Validation UX** | Validation errors do not scroll the user to the error field. | Implement `scrollToError` logic on form submit failure. |

---

## 🚀 Performance & Scalability

| ID | Issue | Description | Recommendation |
|----|-------|-------------|----------------|
| **7** | **UI Jumps** | Adding 10+ items rapidly causes layout shifts/jumping. | Optimize `InvoiceItemRow` rendering and use `scrollIntoView` for new items. |
| **8** | **Lack of Feedback** | "Add Item" button has no loading state or visual feedback during processing. | Add specific loading state to the button while adding. |
| **9** | **Grand Total Visibility** | Total Amount is buried at the bottom of long invoices. | Add a "Sticky Footer" or "Floating Header" showing the running total. |
| **10** | **Small Scroll Areas** | Pricing Rule "Individual" selectors are too small for large lists. | Increase max-height of dropdowns or use a modal. |

---

## 💡 UX & Usability

| ID | Issue | Description | Recommendation |
|----|-------|-------------|----------------|
| **11** | **Plain Text Emails** | Email addresses in lists are not clickable. | Convert to `<a href="mailto:...">` links. |
| **12** | **Hidden Validation** | Error messages (red borders) are hard to spot in complex forms. | Add a summary error banner at the top of the form. |
| **13** | **English Terms** | "(Fixed)", "(Individual)" etc. visible in UI. | Translate to Japanese (固定, 個別). |
| **14** | **Status Localization** | Status badges show "PAID" instead of "支払い済み". | Use a mapping function to display Japanese status. |
| **15** | **Tiny Badges** | "Junior/Senior" text is too small to read easily. | Increase font size or use distinct colors/icons. |
| **16** | **Negative Values** | Negative profit is shown in red but lacks context. | Add tooltip breaking down (Revenue - Cost). |
| **17** | **Button Colors** | "Add" and "Save" buttons use identical blue colors. | Use Green for "Save/Complete" and Blue/Gray for "Add". |
| **18** | **Active State** | Sidebar active menu item is too subtle. | Use a clearer background color/border for active state. |
| **19** | **Empty States** | Searching for non-existent items leaves a blank table with no message. | Add a "No results found" empty state component. |
| **20** | **Quick Navigation** | Cannot click Client Name in Invoice to go to their profile. | Make Client Name a link to `/clients/[id]`. |

---

## 🛠️ Code Quality (Internal)

| ID | Issue | Recommendation |
|----|-------|----------------|
| **21** | **Magic Strings** | Hardcoded status strings ("受注前") in multiple files. | Refactor to use shared `StatusEnum`. |
| **22** | **Type Safety** | extensive use of `any` in `InvoiceForm`. | Define strict interfaces for all props and state. |
| **23** | **Component Size** | `InvoiceForm.tsx` is too large (>700 lines). | Refactor into `DeliverySection`, `ItemRow`, `TotalSummary`. |
