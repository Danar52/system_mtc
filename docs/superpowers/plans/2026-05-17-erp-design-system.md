# ERP Design System — Slate Industrial Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify all pages under one shared `erp-system.css` design system (Slate Industrial theme) and convert the 3 input pages to a step-by-step wizard workflow.

**Architecture:** A single `assets/style/erp-system.css` replaces all per-page CSS files for input/index pages. Dashboard pages load their existing CSS first then `erp-system.css` last (so shared components like sidebar get overridden). A shared `assets/js/erp-wizard.js` drives the step-by-step wizard on all 3 input pages.

**Tech Stack:** Vanilla HTML/CSS/JS, Plus Jakarta Sans + JetBrains Mono (Google Fonts), Chart.js (existing, unchanged).

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| **Create** | `assets/style/erp-system.css` | Single design system — all tokens, layout, components |
| **Create** | `assets/js/erp-wizard.js` | Shared wizard step navigation + validation logic |
| **Rewrite** | `mc_inputpg.html` | New font import, erp-system.css, wizard structure |
| **Rewrite** | `dies_inputpg.html` | New font import, erp-system.css, wizard structure |
| **Rewrite** | `prod_input_dandori.html` | New font import, erp-system.css, wizard structure |
| **Update** | `index.html` | Swap CSS link to erp-system.css only |
| **Update** | 10× dashboard/data pages | Add erp-system.css as LAST `<link>` (after existing CSS) |

---

## Task 1: Create `assets/style/erp-system.css`

**Files:**
- Create: `assets/style/erp-system.css`

- [ ] **Step 1: Write the full CSS file**

```css
/* ============================================================
   ZIEVANA ERP — Shared Design System v1.0
   Theme: Slate Industrial
   ============================================================ */

/* ============ 1. RESET ============ */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ============ 2. TOKENS ============ */
:root {
  /* ---- New Slate Industrial tokens ---- */
  --sidebar-bg:      #0f1117;
  --sidebar-hover:   rgba(255,255,255,0.06);
  --sidebar-active:  rgba(255,255,255,0.10);
  --sidebar-text:    rgba(255,255,255,0.55);
  --sidebar-text-on: #ffffff;
  --sidebar-border:  rgba(255,255,255,0.07);
  --sidebar-width:   256px;

  --bg-canvas:  #f1f3f5;
  --bg-surface: #ffffff;
  --bg-subtle:  #f8f9fa;

  --text-primary:   #1c2025;
  --text-secondary: #5a6475;
  --text-muted:     #8f9db0;
  --text-inverse:   #ffffff;

  --border:       #e2e6eb;
  --border-focus: #1c2025;

  --amber:      #f59e0b;
  --amber-dark: #b45309;
  --amber-bg:   #fef3c7;

  --green:        #22c55e;
  --green-bg:     #f0fdf4;
  --green-border: #bbf7d0;
  --red:          #ef4444;
  --red-bg:       #fef2f2;
  --red-border:   #fecaca;
  --yellow:       #eab308;
  --yellow-bg:    #fefce8;
  --yellow-border:#fef08a;

  --r-sm:  6px;
  --r-md:  10px;
  --r-lg:  14px;
  --r-xl:  18px;
  --r-pill: 999px;

  --sh-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --sh-md: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
  --sh-lg: 0 10px 30px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.04);

  --t: 180ms cubic-bezier(0.4, 0, 0.2, 1);

  --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;

  /* ---- Backward compat — old CSS files use these names ---- */
  --color-primary:       #1c2025;
  --color-secondary:     #ffffff;
  --color-gray-50:       #f8f9fa;
  --color-gray-100:      #f1f3f5;
  --color-gray-200:      #e2e6eb;
  --color-gray-300:      #c8cfd8;
  --color-gray-400:      #8f9db0;
  --color-gray-500:      #5a6475;
  --color-gray-600:      #4a5565;
  --color-gray-700:      #3a4455;
  --color-gray-800:      #2a3445;
  --color-gray-900:      #1c2025;
  --color-success:       #22c55e;
  --color-success-light: #f0fdf4;
  --color-success-dark:  #166534;
  --color-error:         #ef4444;
  --color-error-light:   #fef2f2;
  --color-error-dark:    #991b1b;
  --color-warning:       #f59e0b;
  --color-warning-light: #fef3c7;
  --color-warning-dark:  #b45309;
  --color-info:          #3b82f6;
  --color-info-light:    #dbeafe;
  --color-info-dark:     #1e40af;
  --spacing-xs:  0.5rem;
  --spacing-sm:  0.75rem;
  --spacing-md:  1rem;
  --spacing-lg:  1.5rem;
  --spacing-xl:  2rem;
  --spacing-2xl: 3rem;
  --spacing-3xl: 4rem;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
  --radius-xl:  18px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 10px 30px rgba(0,0,0,0.10);
  --shadow-xl: 0 20px 40px rgba(0,0,0,0.12);
  --font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 180ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  --font-size-xs:  0.75rem;
  --font-size-sm:  0.875rem;
  --font-size-base:1rem;
  --font-size-lg:  1.125rem;
  --font-size-xl:  1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  --z-sidebar: 100;
  --z-dropdown: 200;
}

/* ============ 3. BASE ============ */
html { font-size: 16px; }
body {
  font-family: var(--font-sans);
  background: var(--bg-canvas);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

/* ============ 4. LAYOUT ============ */
.page-wrapper { display: flex; min-height: 100vh; }

.main-content {
  margin-left: var(--sidebar-width);
  flex: 1;
  padding: 36px 40px 64px;
  max-width: 980px;
}

/* ============ 5. SIDEBAR ============ */
.sidebar {
  position: fixed;
  top: 0; left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  z-index: var(--z-sidebar);
  overflow: hidden;
}

.sidebar::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(255,255,255,0.025) 0%, transparent 55%);
  pointer-events: none;
}

.sidebar-header {
  padding: 20px 16px 16px;
  border-bottom: 1px solid var(--sidebar-border);
}

.logo { display: flex; align-items: center; gap: 10px; }

.logo-text h1 {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--sidebar-text-on);
  letter-spacing: 0.10em;
  line-height: 1.2;
}

.logo-text p {
  font-size: 0.68rem;
  color: var(--sidebar-text);
  letter-spacing: 0.04em;
  margin-top: 2px;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--r-md);
  color: var(--sidebar-text);
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all var(--t);
  position: relative;
  white-space: nowrap;
}

.nav-item:hover {
  background: var(--sidebar-hover);
  color: var(--sidebar-text-on);
}

.nav-item.active {
  background: var(--sidebar-active);
  color: var(--sidebar-text-on);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0; top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 55%;
  background: var(--amber);
  border-radius: 0 2px 2px 0;
}

.nav-item svg { flex-shrink: 0; }

.nav-divider {
  height: 1px;
  background: var(--sidebar-border);
  margin: 6px 0;
}

.nav-back { color: rgba(255,255,255,0.35); }
.nav-back:hover { color: rgba(255,255,255,0.65); background: var(--sidebar-hover); }

/* ============ 6. USER PROFILE ============ */
.user-profile {
  padding: 10px;
  border-top: 1px solid var(--sidebar-border);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--r-md);
}

.user-avatar {
  width: 30px; height: 30px;
  background: rgba(255,255,255,0.12);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.72rem; font-weight: 700;
  color: var(--sidebar-text-on);
  flex-shrink: 0;
}

.user-name { font-size: 0.75rem; font-weight: 700; color: var(--sidebar-text-on); line-height: 1.2; }
.user-role { font-size: 0.67rem; color: var(--sidebar-text); margin-top: 1px; }

/* ============ 7. CONTENT HEADER ============ */
.content-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 20px;
}

.header-eyebrow {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.header-left h2, .content-header h2 {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.header-left p, .content-header > div > p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.header-badge, .info-badge, .lkd-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 12px 16px;
  box-shadow: var(--sh-sm);
  white-space: nowrap;
}

.badge-icon {
  width: 32px; height: 32px;
  background: var(--amber-bg);
  border-radius: var(--r-md);
  display: flex; align-items: center; justify-content: center;
  color: var(--amber-dark);
  flex-shrink: 0;
}

.badge-label {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  display: block;
}

.badge-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-mono);
  margin-top: 1px;
  display: block;
}

/* ============ 8. ALERTS ============ */
#alertContainer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.alert {
  padding: 14px 18px;
  border-radius: var(--r-md);
  font-size: 0.875rem;
  border: 1px solid transparent;
  animation: alertIn 280ms cubic-bezier(0.34,1.56,0.64,1);
}

.alert-success {
  background: var(--green-bg);
  border-color: var(--green-border);
  color: #166534;
}

.alert-error {
  background: var(--red-bg);
  border-color: var(--red-border);
  color: #991b1b;
}

/* ============ 9. WIZARD ============ */
.wizard-steps {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 20px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  padding: 16px 20px;
  box-shadow: var(--sh-sm);
  overflow-x: auto;
}

.wizard-step {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  position: relative;
}

.wizard-step:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 28px;
  top: 50%;
  transform: translateY(-50%);
  width: calc(100% - 28px);
  height: 2px;
  background: var(--border);
  z-index: 0;
}

.wizard-step.completed:not(:last-child)::after { background: var(--amber); }

.step-bubble {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 2px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.72rem; font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-subtle);
  flex-shrink: 0;
  z-index: 1;
  transition: all var(--t);
}

.wizard-step.active .step-bubble {
  background: var(--text-primary);
  border-color: var(--text-primary);
  color: var(--text-inverse);
}

.wizard-step.completed .step-bubble {
  background: var(--amber);
  border-color: var(--amber);
  color: var(--text-inverse);
}

.step-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color var(--t);
  z-index: 1;
  background: var(--bg-surface);
  padding-right: 6px;
}

.wizard-step.active .step-label,
.wizard-step.completed .step-label { color: var(--text-primary); }

/* Step panels */
.step-panel { display: none; }
.step-panel.active { display: block; }

/* Wizard bottom bar */
.wizard-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0 0;
}

.step-counter {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

/* ============ 10. FORM SECTION ============ */
.form-container { display: flex; flex-direction: column; gap: 0; }

.form-section {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  padding: 26px 30px;
  box-shadow: var(--sh-sm);
  transition: box-shadow var(--t);
}

.form-section:hover { box-shadow: var(--sh-md); }

.section-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}

.section-number {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-canvas);
  border: 1px solid var(--border);
  padding: 3px 9px;
  border-radius: var(--r-pill);
  letter-spacing: 0.06em;
  flex-shrink: 0;
}

.section-header h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.section-header p {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 2px;
}

/* ============ 11. FORM GRID & FIELDS ============ */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.form-field { display: flex; flex-direction: column; gap: 7px; }
.form-field.full-width { grid-column: 1 / -1; }

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.01em;
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-label svg { width: 14px; height: 14px; flex-shrink: 0; color: var(--text-muted); }
.field-label.required::after { content: ' *'; color: var(--red); }

.field-input,
.field-textarea {
  width: 100%;
  padding: 10px 13px;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  color: var(--text-primary);
  background: var(--bg-surface);
  border: 1.5px solid var(--border);
  border-radius: var(--r-md);
  outline: none;
  transition: all var(--t);
  -webkit-appearance: none;
  appearance: none;
}

.field-input:hover:not(:disabled):not([readonly]):not(.readonly),
.field-textarea:hover:not(:disabled) { border-color: #c8cfd8; }

.field-input:focus,
.field-textarea:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(28,32,37,0.08);
}

.field-input::placeholder,
.field-textarea::placeholder { color: var(--text-muted); font-weight: 400; }

.field-input[readonly],
.field-input.readonly {
  background: var(--bg-subtle);
  color: var(--text-secondary);
  cursor: default;
  border-style: dashed;
}

.field-input[readonly]:focus,
.field-input.readonly:focus {
  border-color: var(--border);
  box-shadow: none;
}

.field-input.field-error {
  border-color: var(--red);
  box-shadow: 0 0 0 3px rgba(239,68,68,0.10);
}

.field-textarea {
  resize: vertical;
  min-height: 88px;
  line-height: 1.6;
}

.field-textarea:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(28,32,37,0.08); }

.field-select,
select.field-input {
  background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%238f9db0' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 11px center;
  padding-right: 38px;
  cursor: pointer;
}

.field-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.field-hint svg { width: 12px; height: 12px; flex-shrink: 0; }
.field-hint strong { color: var(--text-primary); font-family: var(--font-mono); font-weight: 700; }

/* ============ 12. LKM / LKD INPUT GROUP ============ */
.lkm-input-group,
.lkd-input-group {
  display: flex;
  align-items: center;
  border: 1.5px solid var(--border);
  border-radius: var(--r-md);
  overflow: hidden;
  transition: all var(--t);
  background: var(--bg-surface);
}

.lkm-input-group:focus-within,
.lkd-input-group:focus-within {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(28,32,37,0.08);
}

.lkm-number,
.lkd-number {
  border: none !important;
  border-radius: 0 !important;
  width: 96px;
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 1.1rem;
  text-align: center;
  letter-spacing: 0.05em;
  box-shadow: none !important;
  background: transparent !important;
}

.lkm-preview,
.lkd-preview {
  flex: 1;
  padding: 10px 13px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  border-left: 1.5px solid var(--border);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ============ 13. AUTOCOMPLETE ============ */
.autocomplete-container { position: relative; }

.input-with-icon { position: relative; display: flex; align-items: center; }

.input-icon {
  position: absolute;
  left: 11px;
  color: var(--text-muted);
  pointer-events: none;
  z-index: 1;
}

.field-input.has-icon { padding-left: 38px; padding-right: 38px; }

.input-loader { position: absolute; right: 11px; display: none; }
.input-loader.active { display: flex; }

.loader-spin {
  width: 14px; height: 14px;
  border: 2px solid var(--border);
  border-top-color: var(--text-primary);
  border-radius: 50%;
  animation: spin 500ms linear infinite;
}

.autocomplete-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0; right: 0;
  background: var(--bg-surface);
  border: 1.5px solid var(--border);
  border-radius: var(--r-md);
  max-height: 220px;
  overflow-y: auto;
  z-index: var(--z-dropdown);
  box-shadow: var(--sh-lg);
  display: none;
}

.autocomplete-list.active {
  display: block;
  animation: dropIn 140ms cubic-bezier(0.34,1.56,0.64,1);
}

.autocomplete-item {
  padding: 10px 13px;
  cursor: pointer;
  transition: background var(--t);
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.autocomplete-item:last-child { border-bottom: none; }
.autocomplete-item:hover, .autocomplete-item.selected { background: var(--amber-bg); }

.autocomplete-item-id { font-weight: 700; font-size: 0.82rem; font-family: var(--font-mono); }
.autocomplete-item-name { font-size: 0.75rem; color: var(--text-muted); }
.autocomplete-item-name mark { background: transparent; color: var(--text-primary); font-weight: 600; }

.autocomplete-item-main { display: flex; flex-direction: column; gap: 2px; }
.autocomplete-item-sub { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.autocomplete-item-badge {
  display: inline-flex; align-items: center;
  padding: 2px 7px;
  background: var(--bg-subtle);
  color: var(--text-secondary);
  border-radius: var(--r-sm);
  font-size: 0.72rem; font-weight: 500;
}
.autocomplete-item-time { font-size: 0.72rem; color: var(--text-secondary); font-family: var(--font-mono); font-weight: 600; }

.autocomplete-no-results,
.autocomplete-loading { padding: 14px 13px; color: var(--text-muted); font-size: 0.82rem; text-align: center; }

/* ============ 14. DURATION PREVIEW ============ */
.duration-preview {
  display: flex;
  margin-top: 18px;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  overflow: hidden;
}

.duration-item { flex: 1; padding: 13px 16px; display: flex; flex-direction: column; gap: 3px; }
.duration-divider { width: 1px; background: var(--border); align-self: stretch; }

.duration-label {
  font-size: 0.68rem; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--text-muted);
}

.duration-value { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono); }

/* ============ 15. STATUS BADGES ============ */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: var(--r-pill);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  border: 1.5px solid transparent;
}

.status-badge.ringan,
.status-badge.status-ok   { background: var(--green-bg); color: #166534; border-color: var(--green-border); }
.status-badge.sedang      { background: var(--yellow-bg); color: #713f12; border-color: var(--yellow-border); }
.status-badge.berat,
.status-badge.status-over { background: var(--red-bg); color: #991b1b; border-color: var(--red-border); }

/* ============ 16. BUTTONS ============ */
.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 22px;
  border-radius: var(--r-md);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all var(--t);
  white-space: nowrap;
  text-decoration: none;
  line-height: 1;
}

.btn-primary { background: var(--text-primary); color: var(--text-inverse); }
.btn-primary:hover:not(:disabled) { background: #2d3748; transform: translateY(-1px); box-shadow: var(--sh-md); }
.btn-primary:active { transform: translateY(0); }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }

.btn-secondary { background: var(--bg-surface); color: var(--text-primary); border: 1.5px solid var(--border); }
.btn-secondary:hover { background: var(--bg-subtle); border-color: var(--text-primary); }
.btn-secondary:active { transform: translateY(0); }

/* ============ 17. DANDORI ACTIVITY TABLE ============ */
.activities-wrapper { margin-top: 16px; }

.activities-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
}

.activities-table thead th {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-align: left;
  padding: 10px 12px;
  background: var(--bg-subtle);
  border-radius: var(--r-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-header { display: flex; align-items: center; gap: 6px; }
.table-header svg { width: 14px; height: 14px; flex-shrink: 0; }

.activities-table tbody tr { background: var(--bg-surface); transition: box-shadow var(--t); }
.activities-table tbody tr:hover { box-shadow: var(--sh-md); }
.activities-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); }
.activities-table tbody tr:last-child td { border-bottom: none; }

.code-input,
.min-input {
  padding: 8px 12px;
  border: 1.5px solid var(--border);
  border-radius: var(--r-md);
  font-size: 0.875rem;
  text-align: center;
  font-weight: 700;
  transition: all var(--t);
  width: 100%;
  font-family: var(--font-mono);
  outline: none;
}

.code-input:focus,
.min-input:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(28,32,37,0.08); }

.desc-text { font-size: 0.82rem; color: var(--text-secondary); padding: 4px 0; }
.desc-text.text-success { color: #166534; font-weight: 600; }

.btn-delete {
  background: var(--red);
  color: white;
  border: none;
  width: 34px; height: 34px;
  border-radius: var(--r-md);
  cursor: pointer;
  transition: all var(--t);
  display: flex; align-items: center; justify-content: center;
  padding: 0;
}

.btn-delete svg { width: 14px; height: 14px; }
.btn-delete:hover { background: #dc2626; transform: scale(1.08); }

.btn-add-row {
  margin-top: 10px;
  padding: 10px 20px;
  background: var(--bg-surface);
  color: var(--text-secondary);
  border: 1.5px dashed var(--border);
  border-radius: var(--r-lg);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--t);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-sans);
}

.btn-add-row:hover { background: var(--bg-subtle); border-color: var(--text-muted); color: var(--text-primary); }

.total-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: var(--sidebar-bg);
  border-radius: var(--r-lg);
  margin-top: 16px;
  box-shadow: var(--sh-md);
}

.total-left { display: flex; flex-direction: column; gap: 8px; }
.total-label { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
.total-label svg { width: 16px; height: 16px; flex-shrink: 0; }
.total-right { display: flex; align-items: baseline; gap: 8px; }
.total-value { font-size: 2rem; font-weight: 800; color: #ffffff; font-family: var(--font-mono); letter-spacing: -0.02em; }
.total-unit { color: rgba(255,255,255,0.55); font-size: 0.9rem; font-weight: 500; }

.std-time-display { font-family: var(--font-mono); font-weight: 700; }

/* ============ 18. GENERIC DASHBOARD COMPONENTS ============ */
.dash-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  padding: 22px 26px;
  box-shadow: var(--sh-sm);
}

.kpi-block { display: flex; flex-direction: column; gap: 4px; }
.kpi-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); }
.kpi-value { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-mono); line-height: 1.1; letter-spacing: -0.02em; }
.kpi-unit { font-size: 0.8rem; color: var(--text-secondary); font-weight: 500; }

.filter-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }

/* ============ 19. INDEX HOME PAGE ============ */
.welcome-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 96px);
  text-align: center;
  gap: 20px;
}

.avatar-circle {
  width: 80px; height: 80px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: var(--sh-md);
  color: var(--text-primary);
}

.avatar-circle svg { width: 36px; height: 36px; }

.welcome-header h2 {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.decorative-line {
  height: 3px;
  width: 40px;
  background: var(--amber);
  border-radius: var(--r-pill);
  margin: 12px auto;
}

.welcome-header p { color: var(--text-secondary); font-size: 0.95rem; }

.subtitle-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--amber-dark);
  background: var(--amber-bg);
  padding: 6px 14px;
  border-radius: var(--r-pill);
  margin-top: 8px;
}

.subtitle-badge svg { width: 14px; height: 14px; }

/* ============ 20. SCROLLBAR ============ */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

.sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); }
.sidebar-nav::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }

/* ============ 21. ANIMATIONS ============ */
@keyframes alertIn {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-10px); }
}

@keyframes spin { to { transform: rotate(360deg); } }

@keyframes dropIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ============ 22. RESPONSIVE ============ */
@media (max-width: 900px) {
  .form-grid { grid-template-columns: 1fr; }
  .form-field.full-width { grid-column: 1; }
  .main-content { padding: 24px 20px 48px; }
  .content-header { flex-direction: column; }
  .duration-preview { flex-direction: column; }
  .duration-divider { width: auto; height: 1px; }
  .wizard-steps { padding: 12px 14px; }
  .step-label { display: none; }
}

@media (max-width: 768px) {
  .sidebar { transform: translateX(-100%); }
  .main-content { margin-left: 0; }
}
```

- [ ] **Step 2: Verify file exists**

```bash
ls -lh assets/style/erp-system.css
```
Expected: file exists, size > 10KB

- [ ] **Step 3: Commit**

```bash
git add assets/style/erp-system.css
git commit -m "feat: add shared erp-system.css design system (Slate Industrial theme)"
```

---

## Task 2: Create `assets/js/erp-wizard.js`

**Files:**
- Create: `assets/js/erp-wizard.js`

- [ ] **Step 1: Write the wizard JS**

```javascript
// erp-wizard.js — shared step-by-step wizard logic
(function () {
  let currentStep = 1;
  let totalSteps = 1;

  function init() {
    const panels = document.querySelectorAll('.step-panel');
    totalSteps = panels.length;
    if (totalSteps <= 1) return;
    goToStep(1);
  }

  function goToStep(n) {
    if (n < 1 || n > totalSteps) return;
    currentStep = n;

    document.querySelectorAll('.step-panel').forEach((p, i) => {
      p.classList.toggle('active', i + 1 === currentStep);
    });

    document.querySelectorAll('.wizard-step').forEach((s, i) => {
      s.classList.remove('active', 'completed');
      if (i + 1 < currentStep) s.classList.add('completed');
      if (i + 1 === currentStep) s.classList.add('active');
      const bubble = s.querySelector('.step-bubble');
      if (bubble) bubble.textContent = i + 1 < currentStep ? '✓' : String(i + 1);
    });

    const btnBack = document.getElementById('btnBack');
    const btnNext = document.getElementById('btnNext');
    const counter = document.getElementById('stepCounter');

    if (btnBack) btnBack.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
    if (counter) counter.textContent = 'Step ' + currentStep + ' / ' + totalSteps;

    if (btnNext) {
      if (currentStep === totalSteps) {
        btnNext.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8H14M14 8L9 3M14 8L9 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Simpan Data`;
        btnNext.onclick = function () {
          var form = document.getElementById('formBreakdown') || document.getElementById('dandoriForm');
          if (form) form.requestSubmit(); else nextStep();
        };
      } else {
        btnNext.innerHTML = `Next <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        btnNext.onclick = nextStep;
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nextStep() {
    if (!validateCurrentStep()) return;
    if (currentStep < totalSteps) goToStep(currentStep + 1);
  }

  function prevStep() {
    if (currentStep > 1) goToStep(currentStep - 1);
  }

  function validateCurrentStep() {
    var panel = document.querySelector('.step-panel[data-step="' + currentStep + '"]');
    if (!panel) return true;
    var valid = true;
    panel.querySelectorAll('[required]').forEach(function (el) {
      if (!el.value.trim()) {
        el.classList.add('field-error');
        valid = false;
      } else {
        el.classList.remove('field-error');
      }
    });
    if (!valid) {
      var first = panel.querySelector('.field-error');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return valid;
  }

  // Remove field-error class on user input
  document.addEventListener('input', function (e) {
    if (e.target.matches && e.target.matches('[required]') && e.target.value.trim()) {
      e.target.classList.remove('field-error');
    }
  });
  document.addEventListener('change', function (e) {
    if (e.target.matches && e.target.matches('[required]') && e.target.value.trim()) {
      e.target.classList.remove('field-error');
    }
  });

  window.wizardNextStep = nextStep;
  window.wizardPrevStep = prevStep;
  window.wizardGoToStep = goToStep;
  window.wizardInit = init;

  document.addEventListener('DOMContentLoaded', init);
})();
```

- [ ] **Step 2: Verify file exists**

```bash
ls -lh assets/js/erp-wizard.js
```

- [ ] **Step 3: Commit**

```bash
git add assets/js/erp-wizard.js
git commit -m "feat: add shared erp-wizard.js step navigation"
```

---

## Task 3: Update `index.html`

**Files:**
- Modify: `index.html`

Only changes needed: swap font import and CSS link. Structure is already clean.

- [ ] **Step 1: Replace `<head>` section**

Replace the existing `<head>...</head>` with:

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Zievana Workspace</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <link rel="stylesheet" href="assets/style/erp-system.css">
</head>
```

- [ ] **Step 2: Verify in browser** — open `index.html` in a browser and check sidebar is dark slate with amber active indicator, background is `#f1f3f5`.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: update index.html to use erp-system.css"
```

---

## Task 4: Rewrite `mc_inputpg.html` with Wizard

**Files:**
- Modify: `mc_inputpg.html`

Replace entire file content. Keep all inline JS logic (API calls, LKM preview, mesin dropdown) but wrap sections in wizard step-panels, update head, and replace form-actions with wizard-actions.

- [ ] **Step 1: Replace the entire `mc_inputpg.html`** with the following content:

```html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Input Data Breakdown - Maintenance Mesin System</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/style/erp-system.css">
</head>
<body>
<div class="page-wrapper">
    <aside class="sidebar">
        <div class="sidebar-header">
            <div class="logo">
                <div class="logo-icon">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="white"/><path d="M16 8L8 12V20L16 24L24 20V12L16 8Z" stroke="black" stroke-width="2" stroke-linejoin="round"/><path d="M16 16L8 12M16 16L24 12M16 16V24" stroke="black" stroke-width="2" stroke-linejoin="round"/></svg>
                </div>
                <div class="logo-text">
                    <h1>MTC MACHINE</h1>
                    <p>Monitoring System</p>
                </div>
            </div>
        </div>
        <nav class="sidebar-nav">
            <a href="mc_inputpg.html" class="nav-item active">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3L3 7V13L10 17L17 13V7L10 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                <span>Input Breakdown</span>
            </a>
            <a href="mc_breakdown.html" class="nav-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 8H17M8 3V17" stroke="currentColor" stroke-width="1.5"/></svg>
                <span>Data Breakdown</span>
            </a>
            <a href="mc_mttr.html" class="nav-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="8" width="4" height="9" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="8" y="3" width="4" height="14" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="13" y="10" width="4" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>
                <span>Dashboard MTTR</span>
            </a>
            <a href="mc_mtbf.html" class="nav-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10L7 6L11 10L17 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 4H17V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                <span>Dashboard MTBF</span>
            </a>
            <a href="mc_availability.html" class="nav-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M10 6V10L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                <span>Dashboard Availability</span>
            </a>
            <div class="nav-divider"></div>
            <a href="index.html" class="nav-item nav-back">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13 17H16C16.5523 17 17 16.5523 17 16V4C17 3.44772 16.5523 3 16 3H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 13L3 10M3 10L8 7M3 10H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>Kembali ke Menu</span>
            </a>
        </nav>
    </aside>

    <main class="main-content">
        <div class="content-header">
            <div class="header-left">
                <div class="header-eyebrow">Form Input</div>
                <h2>Input Data Breakdown</h2>
                <p>Pengisian data breakdown mesin untuk monitoring MTTR &amp; MTBF</p>
            </div>
            <div class="header-right">
                <div class="header-badge">
                    <div class="badge-icon">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 8H11M8 5V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    </div>
                    <div>
                        <span class="badge-label">No. LKM Terakhir</span>
                        <span class="badge-value" id="lastNoLkm">Loading...</span>
                    </div>
                </div>
            </div>
        </div>

        <div id="alertContainer"></div>

        <!-- Wizard Steps Indicator -->
        <div class="wizard-steps">
            <div class="wizard-step"><div class="step-bubble">1</div><span class="step-label">No. LKM</span></div>
            <div class="wizard-step"><div class="step-bubble">2</div><span class="step-label">Data Mesin</span></div>
            <div class="wizard-step"><div class="step-bubble">3</div><span class="step-label">Waktu BD</span></div>
            <div class="wizard-step"><div class="step-bubble">4</div><span class="step-label">Perbaikan</span></div>
            <div class="wizard-step"><div class="step-bubble">5</div><span class="step-label">Detail</span></div>
            <div class="wizard-step"><div class="step-bubble">6</div><span class="step-label">PIC</span></div>
        </div>

        <form id="formBreakdown" novalidate>

            <!-- Step 1 -->
            <div class="step-panel" data-step="1">
                <div class="form-section">
                    <div class="section-header">
                        <div class="section-number">01</div>
                        <div><h3>Informasi LKM</h3><p>Nomor Laporan Kerusakan Mesin</p></div>
                    </div>
                    <div class="form-grid">
                        <div class="form-field full-width">
                            <label for="no_lkm_number" class="field-label required">Nomor LKM</label>
                            <div class="lkm-input-group">
                                <input type="text" id="no_lkm_number" class="field-input lkm-number" placeholder="001" required maxlength="3">
                                <div class="lkm-preview" id="noLkmPreview">/LKM/MTC/KMI/XII/25</div>
                            </div>
                            <div class="field-hint">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M7 10V7M7 4H7.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                                <span>Nomor disarankan: <strong id="suggestedNoLkm">Loading...</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Step 2 -->
            <div class="step-panel" data-step="2">
                <div class="form-section">
                    <div class="section-header">
                        <div class="section-number">02</div>
                        <div><h3>Data Mesin</h3><p>Identitas mesin yang mengalami breakdown</p></div>
                    </div>
                    <div class="form-grid">
                        <div class="form-field">
                            <label for="id_mesin" class="field-label required">ID Mesin</label>
                            <select id="id_mesin" class="field-input field-select" required>
                                <option value="">Pilih mesin...</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label for="nama_mesin" class="field-label required">Nama Mesin</label>
                            <input type="text" id="nama_mesin" class="field-input" placeholder="Otomatis terisi" readonly>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Step 3 -->
            <div class="step-panel" data-step="3">
                <div class="form-section">
                    <div class="section-header">
                        <div class="section-number">03</div>
                        <div><h3>Waktu Breakdown</h3><p>Tanggal dan jam terjadinya breakdown</p></div>
                    </div>
                    <div class="form-grid">
                        <div class="form-field">
                            <label for="tanggal_breakdown" class="field-label required">Tanggal Breakdown</label>
                            <input type="date" id="tanggal_breakdown" class="field-input" required>
                        </div>
                        <div class="form-field">
                            <label for="jam_breakdown" class="field-label required">Jam Breakdown</label>
                            <input type="time" id="jam_breakdown" class="field-input" required>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Step 4 -->
            <div class="step-panel" data-step="4">
                <div class="form-section">
                    <div class="section-header">
                        <div class="section-number">04</div>
                        <div><h3>Waktu Perbaikan</h3><p>Jadwal mulai dan selesai proses perbaikan</p></div>
                    </div>
                    <div class="form-grid">
                        <div class="form-field">
                            <label for="tanggal_mulai_perbaikan" class="field-label required">Tanggal Mulai Perbaikan</label>
                            <input type="date" id="tanggal_mulai_perbaikan" class="field-input" required>
                        </div>
                        <div class="form-field">
                            <label for="jam_mulai_perbaikan" class="field-label required">Jam Mulai Perbaikan</label>
                            <input type="time" id="jam_mulai_perbaikan" class="field-input" required>
                        </div>
                        <div class="form-field">
                            <label for="tanggal_selesai_perbaikan" class="field-label required">Tanggal Selesai Perbaikan</label>
                            <input type="date" id="tanggal_selesai_perbaikan" class="field-input" required>
                        </div>
                        <div class="form-field">
                            <label for="jam_selesai_perbaikan" class="field-label required">Jam Selesai Perbaikan</label>
                            <input type="time" id="jam_selesai_perbaikan" class="field-input" required>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Step 5 -->
            <div class="step-panel" data-step="5">
                <div class="form-section">
                    <div class="section-header">
                        <div class="section-number">05</div>
                        <div><h3>Detail Breakdown</h3><p>Informasi lengkap mengenai kerusakan dan perbaikan</p></div>
                    </div>
                    <div class="form-grid">
                        <div class="form-field full-width">
                            <label for="problem_mesin" class="field-label required">Problem Mesin</label>
                            <textarea id="problem_mesin" class="field-textarea" rows="3" placeholder="Deskripsikan masalah yang terjadi pada mesin..." required></textarea>
                        </div>
                        <div class="form-field full-width">
                            <label for="penyebab_breakdown" class="field-label required">Penyebab Breakdown</label>
                            <textarea id="penyebab_breakdown" class="field-textarea" rows="3" placeholder="Jelaskan penyebab terjadinya breakdown..." required></textarea>
                        </div>
                        <div class="form-field full-width">
                            <label for="tindakan_perbaikan" class="field-label required">Tindakan Perbaikan</label>
                            <textarea id="tindakan_perbaikan" class="field-textarea" rows="3" placeholder="Deskripsikan tindakan perbaikan yang dilakukan..." required></textarea>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Step 6 -->
            <div class="step-panel" data-step="6">
                <div class="form-section">
                    <div class="section-header">
                        <div class="section-number">06</div>
                        <div><h3>Person In Charge</h3><p>Penanggung jawab maintenance</p></div>
                    </div>
                    <div class="form-grid">
                        <div class="form-field full-width">
                            <label for="pic_maintenance" class="field-label required">PIC Maintenance</label>
                            <select id="pic_maintenance" class="field-input field-select" required>
                                <option value="">Pilih PIC Maintenance...</option>
                                <option value="Sarijan">Sarijan</option>
                                <option value="Gunawan">Gunawan</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Wizard Navigation -->
            <div class="wizard-actions">
                <button type="button" id="btnBack" class="btn-secondary" onclick="wizardPrevStep()">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    Back
                </button>
                <span class="step-counter" id="stepCounter">Step 1 / 6</span>
                <button type="button" id="btnNext" class="btn-primary" onclick="wizardNextStep()">
                    Next
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
            </div>

        </form>
    </main>
</div>

<script src="assets/js/erp-wizard.js"></script>
<script>
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxdmtsD_5BY38UqiQM_U_8anFSeUGBKU3PYrgBXCPHO1pzvgmSWC1dgHJlqcpDfUVNV3g/exec';
let masterMesinData = [];

document.addEventListener('DOMContentLoaded', function() {
    loadMasterMesin();
    loadLastNoLKM();
    setupEventListeners();
    setDefaultDates();
});

function setupEventListeners() {
    document.getElementById('id_mesin').addEventListener('change', handleMesinChange);
    document.getElementById('no_lkm_number').addEventListener('input', updateNoLkmPreview);
    document.getElementById('tanggal_breakdown').addEventListener('change', updateNoLkmPreview);
    document.getElementById('formBreakdown').addEventListener('submit', handleFormSubmit);
}

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggal_breakdown').value = today;
    document.getElementById('tanggal_mulai_perbaikan').value = today;
    document.getElementById('tanggal_selesai_perbaikan').value = today;
}

async function loadMasterMesin() {
    try {
        const url = `${SCRIPT_URL}?action=getMasterMesin&_=${Date.now()}`;
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        const result = await response.json();
        if (result.status === 'success') {
            masterMesinData = result.data;
            populateMesinDropdown(result.data);
        } else {
            showAlert('Gagal memuat data mesin: ' + result.message, 'error');
        }
    } catch (error) {
        showAlert('Gagal memuat data mesin. Periksa koneksi.', 'error');
    }
}

function populateMesinDropdown(data) {
    const select = document.getElementById('id_mesin');
    select.innerHTML = '<option value="">Pilih mesin...</option>';
    data.forEach(mesin => {
        const option = document.createElement('option');
        option.value = mesin.id_mesin;
        option.textContent = `${mesin.id_mesin} - ${mesin.nama_mesin}`;
        select.appendChild(option);
    });
}

function handleMesinChange(e) {
    const mesin = masterMesinData.find(m => m.id_mesin === e.target.value);
    document.getElementById('nama_mesin').value = mesin ? mesin.nama_mesin : '';
}

async function loadLastNoLKM() {
    try {
        const url = `${SCRIPT_URL}?action=getLastNoLKM&_=${Date.now()}`;
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        const result = await response.json();
        if (result.status === 'success') {
            document.getElementById('lastNoLkm').textContent = result.lastNumber || '-';
            document.getElementById('suggestedNoLkm').textContent = result.suggestedNumber || '001';
            document.getElementById('no_lkm_number').placeholder = result.suggestedNumber || '001';
        }
    } catch (error) {
        document.getElementById('lastNoLkm').textContent = 'Error';
        document.getElementById('suggestedNoLkm').textContent = 'Error';
    }
}

function updateNoLkmPreview() {
    const number = document.getElementById('no_lkm_number').value.padStart(3, '0') || '000';
    const breakdownDate = document.getElementById('tanggal_breakdown').value;
    if (breakdownDate) {
        const date = new Date(breakdownDate);
        const month = toRoman(date.getMonth() + 1);
        const year = date.getFullYear().toString().slice(-2);
        document.getElementById('noLkmPreview').textContent = `/${number}/LKM/MTC/KMI/${month}/${year}`;
    } else {
        document.getElementById('noLkmPreview').textContent = `/${number}/LKM/MTC/KMI/XII/25`;
    }
}

function toRoman(num) {
    const r = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
    return r[num - 1] || 'I';
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btnNext');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="animation:spin 1s linear infinite"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="28" stroke-dashoffset="8"/></svg> Menyimpan...`;

    const formData = new URLSearchParams();
    ['action','no_lkm_number','id_mesin','nama_mesin','tanggal_breakdown','jam_breakdown',
     'tanggal_mulai_perbaikan','jam_mulai_perbaikan','tanggal_selesai_perbaikan','jam_selesai_perbaikan',
     'problem_mesin','penyebab_breakdown','tindakan_perbaikan','pic_maintenance'].forEach(key => {
        if (key === 'action') { formData.append(key, 'addBreakdown'); return; }
        const el = document.getElementById(key);
        if (el) formData.append(key, el.value);
    });

    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData, redirect: 'follow' });
        const result = await response.json();
        if (result.status === 'success') {
            showAlert(`<strong>Data berhasil disimpan!</strong><br>No LKM: ${result.data.no_lkm} | Repair: ${result.data.repair_time.toFixed(2)} jam | Downtime: ${result.data.total_downtime.toFixed(2)} jam`, 'success');
            document.getElementById('formBreakdown').reset();
            setDefaultDates();
            loadLastNoLKM();
            updateNoLkmPreview();
            wizardGoToStep(1);
        } else {
            showAlert(result.message, 'error');
        }
    } catch (error) {
        showAlert('Gagal menyimpan data: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

function showAlert(message, type) {
    const container = document.getElementById('alertContainer');
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.innerHTML = message;
    container.appendChild(div);
    setTimeout(() => {
        div.style.animation = 'slideUp 200ms ease forwards';
        setTimeout(() => div.remove(), 200);
    }, 6000);
}
</script>
</body>
</html>
```

- [ ] **Step 2: Verify in browser** — open `mc_inputpg.html`, confirm wizard steps appear at top, Step 1 shows LKM input, Next button advances to Step 2, Back on Step 1 is invisible.

- [ ] **Step 3: Commit**

```bash
git add mc_inputpg.html
git commit -m "feat: refactor mc_inputpg.html to ERP wizard layout"
```

---

## Task 5: Rewrite `dies_inputpg.html` with Wizard

**Files:**
- Modify: `dies_inputpg.html`

Replace only the `<head>` and add wizard wrapper structure. The JS is external (`script_input_data.js`) and doesn't change. After `resetForm()` succeeds, call `wizardGoToStep(1)`.

- [ ] **Step 1: Replace `<head>` block** (lines 1-11)

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Input Data Breakdown - Maintenance Dies System</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/style/erp-system.css">
</head>
```

- [ ] **Step 2: Replace content-header block**

Replace the existing `.content-header` div (which has `.header-eyebrow` + `h2` + `.lkd-badge`) with:

```html
<div class="content-header">
    <div class="header-left">
        <div class="header-eyebrow">Form Input</div>
        <h2>Input Data Breakdown Dies</h2>
        <p>Pengisian data laporan kerusakan dies untuk monitoring maintenance</p>
    </div>
    <div class="header-right">
        <div class="header-badge">
            <div class="badge-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 8H11M8 5V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </div>
            <div>
                <span class="badge-label">No. LKD Terakhir</span>
                <span class="badge-value" id="lastNoLkd">Memuat...</span>
            </div>
        </div>
    </div>
</div>
```

- [ ] **Step 3: Add wizard-steps indicator** immediately after `<div id="alertContainer"></div>`:

```html
<!-- Wizard Steps Indicator -->
<div class="wizard-steps">
    <div class="wizard-step"><div class="step-bubble">1</div><span class="step-label">No. LKD</span></div>
    <div class="wizard-step"><div class="step-bubble">2</div><span class="step-label">Data Dies</span></div>
    <div class="wizard-step"><div class="step-bubble">3</div><span class="step-label">Waktu BD</span></div>
    <div class="wizard-step"><div class="step-bubble">4</div><span class="step-label">Perbaikan</span></div>
    <div class="wizard-step"><div class="step-bubble">5</div><span class="step-label">Detail</span></div>
    <div class="wizard-step"><div class="step-bubble">6</div><span class="step-label">PIC</span></div>
</div>
```

- [ ] **Step 4: Wrap each `.form-section` in a step-panel div**

The form currently has 6 sections. Wrap each in `<div class="step-panel" data-step="N">...</div>`.

Section 1 (Informasi LKD) → `data-step="1"`
Section 2 (Data Dies) → `data-step="2"`
Section 3 (Waktu Breakdown) → `data-step="3"`
Section 4 (Waktu Perbaikan, includes `#durationPreview`) → `data-step="4"`
Section 5 (Detail Breakdown) → `data-step="5"`
Section 6 (Person In Charge) → `data-step="6"`

- [ ] **Step 5: Replace `.form-actions` div** (the Reset + Simpan buttons) with wizard-actions:

```html
<div class="wizard-actions">
    <button type="button" id="btnBack" class="btn-secondary" onclick="wizardPrevStep()">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Back
    </button>
    <span class="step-counter" id="stepCounter">Step 1 / 6</span>
    <button type="button" id="btnNext" class="btn-primary" onclick="wizardNextStep()">
        Next
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
</div>
```

- [ ] **Step 6: Replace `<script src="assets/js/script_input_data.js"></script>`** with:

```html
<script src="assets/js/erp-wizard.js"></script>
<script src="assets/js/script_input_data.js"></script>
```

- [ ] **Step 7: In `assets/js/script_input_data.js`**, find the `resetForm` function and add `wizardGoToStep(1);` call after the reset logic:

In `script_input_data.js`, find:
```javascript
function resetForm() {
```
Add `if (window.wizardGoToStep) wizardGoToStep(1);` as the last line inside the function (before the closing `}`).

Also find where `result.status === 'success'` is handled in `handleFormSubmit` and add `wizardGoToStep(1);` after the reset sequence.

- [ ] **Step 8: Verify in browser** — `dies_inputpg.html`, wizard should work with 6 steps, duration preview visible in step 4, autocomplete in step 2.

- [ ] **Step 9: Commit**

```bash
git add dies_inputpg.html assets/js/script_input_data.js
git commit -m "feat: refactor dies_inputpg.html to ERP wizard layout"
```

---

## Task 6: Rewrite `prod_input_dandori.html` with Wizard

**Files:**
- Modify: `prod_input_dandori.html`

Dandori form has 3 logical sections → 3 wizard steps.

- [ ] **Step 1: Replace `<head>` block**

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Input Data Dandori - Production System</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/style/erp-system.css">
</head>
```

- [ ] **Step 2: Replace content-header**

```html
<div class="content-header">
    <div class="header-left">
        <div class="header-eyebrow">Form Input</div>
        <h2>Input Data Dandori</h2>
        <p>Pengisian data dandori produksi untuk monitoring waktu pergantian</p>
    </div>
    <div class="header-right">
        <div class="header-badge">
            <div class="badge-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 6H14M5 1V3M11 1V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </div>
            <div>
                <span class="badge-label">Tanggal</span>
                <span class="badge-value" id="currentDate">Loading...</span>
            </div>
        </div>
    </div>
</div>
```

- [ ] **Step 3: Add wizard-steps indicator** after `<div id="alertContainer"></div>`:

```html
<div class="wizard-steps">
    <div class="wizard-step"><div class="step-bubble">1</div><span class="step-label">Info Umum</span></div>
    <div class="wizard-step"><div class="step-bubble">2</div><span class="step-label">Data Part</span></div>
    <div class="wizard-step"><div class="step-bubble">3</div><span class="step-label">Aktivitas</span></div>
</div>
```

- [ ] **Step 4: Wrap sections in step-panels**

Section "Informasi Umum" → `<div class="step-panel" data-step="1">...</div>`
Section "Data Part & Proses" → `<div class="step-panel" data-step="2">...</div>`
Section "Rincian Aktivitas Dandori" → `<div class="step-panel" data-step="3">...</div>`

Add section-number badges to each section-header:
- Section 1: `<div class="section-number">01</div>`
- Section 2: `<div class="section-number">02</div>`
- Section 3: `<div class="section-number">03</div>`

Also update `.section-header` structure to use `<div>` wrapper for title+desc (matching the new format):
```html
<div class="section-header">
    <div class="section-number">01</div>
    <div>
        <h3>Informasi Umum</h3>
        <p>Data tanggal, operator dan mesin produksi</p>
    </div>
</div>
```

- [ ] **Step 5: Replace `.form-actions`** with wizard-actions (3 steps total):

```html
<div class="wizard-actions">
    <button type="button" id="btnBack" class="btn-secondary" onclick="wizardPrevStep()">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Back
    </button>
    <span class="step-counter" id="stepCounter">Step 1 / 3</span>
    <button type="button" id="btnNext" class="btn-primary" onclick="wizardNextStep()">
        Next
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
</div>
```

- [ ] **Step 6: Replace script tag**

```html
<script src="assets/js/erp-wizard.js"></script>
<script src="assets/js/script_prod_dandori.js"></script>
```

- [ ] **Step 7: Verify in browser** — open `prod_input_dandori.html`, confirm 3-step wizard, activity table in step 3, total-box visible.

- [ ] **Step 8: Commit**

```bash
git add prod_input_dandori.html
git commit -m "feat: refactor prod_input_dandori.html to ERP wizard layout"
```

---

## Task 7: Update All Dashboard & Data Pages

**Files:**
- Modify: `mc_breakdown.html`, `dies_breakdown.html`
- Modify: `mc_mttr.html`, `mc_mtbf.html`, `mc_availability.html`
- Modify: `dies_mttr.html`, `dies_mtbf.html`, `dies_availability.html`
- Modify: `prod_dashb_dandori.html`, `prod_dashb_achv.html`
- Modify: `prod_achievement.html`, `prod_report_export.html`

Strategy: For each file, (1) update the font import to include JetBrains Mono, and (2) add `erp-system.css` as the **last** `<link>` in `<head>` (after the existing page CSS). This ensures `erp-system.css` overrides shared components (sidebar, nav, buttons, form fields) while page-specific dashboard styles survive.

- [ ] **Step 1: For each of the 12 dashboard/data pages**, make these two changes in `<head>`:

**A) Replace the font `<link>` from:**
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```
**To:**
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**B) Add erp-system.css as the last `<link>` before `</head>`:**
```html
    <link rel="stylesheet" href="assets/style/erp-system.css">
</head>
```

Apply to all 12 files:
- `mc_breakdown.html` (currently uses `style_data_breakdown.css`)
- `mc_mttr.html` (currently uses `style_dashboard_mttr.css`)
- `mc_mtbf.html` (currently uses `style_dashboard_mtbf.css`)
- `mc_availability.html` (currently uses `style_availability.css`)
- `dies_breakdown.html` (currently uses `style_data_breakdown.css`)
- `dies_mttr.html` (currently uses `style_dashboard_mttr.css`)
- `dies_mtbf.html` (currently uses `style_dashboard_mtbf.css`)
- `dies_availability.html` (currently uses `style_availability.css`)
- `prod_dashb_dandori.html` (currently uses `style_dashboard_dandori.css`)
- `prod_dashb_achv.html` (currently uses `style_dashb_achv.css`)
- `prod_achievement.html` (currently uses `style_prod_achv.css`)
- `prod_report_export.html` (currently uses `style_prod_report_export.css`)

- [ ] **Step 2: Spot-check 3 pages in browser** — open `mc_breakdown.html`, `mc_mttr.html`, `prod_dashb_dandori.html`. Verify: sidebar is dark slate with amber active indicator, fonts updated, no layout breakage on charts/tables.

- [ ] **Step 3: Commit all 12 updated files**

```bash
git add mc_breakdown.html dies_breakdown.html \
        mc_mttr.html mc_mtbf.html mc_availability.html \
        dies_mttr.html dies_mtbf.html dies_availability.html \
        prod_dashb_dandori.html prod_dashb_achv.html \
        prod_achievement.html prod_report_export.html
git commit -m "feat: apply erp-system.css to all dashboard/data pages"
```

---

## Task 8: Final Check & Cleanup

- [ ] **Step 1: Open all 3 input pages in browser and test the full wizard flow**

For each of `mc_inputpg.html`, `dies_inputpg.html`, `prod_input_dandori.html`:
1. Step 1 loads — Back button is invisible
2. Click Next without filling required field — red border appears on the empty field
3. Fill field and click Next — advances to step 2
4. Continue through all steps
5. On last step, "Next" label changes to "Simpan Data" with submit icon

- [ ] **Step 2: Verify cross-page consistency**

Check: sidebar, font, background color is identical between `mc_inputpg.html`, `mc_breakdown.html`, and `mc_mttr.html`.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: ERP design system implementation complete"
```
