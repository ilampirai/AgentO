---
description: Design commands - scrape sites, crawl templates, set styles. Example: /AgentO:design scrape https://example.com
---

# Design Command

Web scraping, template management, and style configuration for UI/UX work.

## Usage

```
/AgentO:design [action] [args]
```

## Actions

### scrape
Scrape a single page and extract its template.

```
/AgentO:design scrape [url]
```

Example:
```
/AgentO:design scrape https://stripe.com/payments
```

Process:
1. Use Playwright to load the page
2. Extract HTML structure
3. Extract CSS patterns and variables
4. Save to `.agenticMemory/templates/[domain]/`

Output:
```
## Scraped: stripe.com/payments

### Template Saved
Location: .agenticMemory/templates/stripe-payments/

### Files Created
- structure.html (semantic HTML skeleton)
- styles.css (extracted styles)
- variables.css (CSS custom properties)
- components/hero.html
- components/features.html
- components/pricing.html
- meta.json (template metadata)

### Extracted Design Tokens
Colors: #635bff, #0a2540, #f6f9fc
Fonts: Inter, system-ui
Spacing: 4px base unit
```

### crawl
Crawl an entire website and extract all unique templates.

```
/AgentO:design crawl [url] [--depth N]
```

Example:
```
/AgentO:design crawl https://example.com --depth 2
```

Process:
1. Start at the given URL
2. Follow internal links up to specified depth
3. Identify unique page layouts
4. Extract and deduplicate templates

Output:
```
## Crawled: example.com

### Pages Visited: 15
### Unique Layouts: 4

### Templates Saved
- .agenticMemory/templates/example-com/
  - landing/
  - blog-post/
  - product/
  - contact/

### Layout Summary
| Layout | Pages | Components |
|--------|-------|------------|
| landing | 3 | 8 |
| blog-post | 7 | 5 |
| product | 4 | 6 |
| contact | 1 | 3 |
```

### style
Set or view the active style guide.

```
/AgentO:design style [name]
```

Without name - show current style:
```
/AgentO:design style
→ Current style: stripe-style

Colors: #635bff (primary), #0a2540 (secondary)
Fonts: Inter
Spacing: 4px unit
```

With name - set active style:
```
/AgentO:design style material-design
→ Active style set to: material-design
```

### templates
List all saved templates.

```
/AgentO:design templates
```

Output:
```
## Saved Templates

| Name | Source | Scraped | Components |
|------|--------|---------|------------|
| stripe-payments | stripe.com | 2025-01-07 | 8 |
| github-landing | github.com | 2025-01-06 | 12 |
| material-design | material.io | 2025-01-05 | 15 |

Total: 3 templates, 35 components
```

### apply
Apply a template to create new components.

```
/AgentO:design apply [template] [component]
```

Example:
```
/AgentO:design apply stripe-payments hero
→ Created src/components/Hero.tsx using stripe-payments/hero template
```

### create
Create a new component following the active style.

```
/AgentO:design create [component-name]
```

Example:
```
/AgentO:design create pricing-card
→ Created src/components/PricingCard.tsx
→ Created src/components/PricingCard.css
```

## Implementation

Based on `$ARGUMENTS`:

1. **Parse action**: First word is the action
2. **Route to designer agent** for execution
3. **Designer agent uses Playwright MCP** for web scraping
4. **Save results** to .agenticMemory/templates/

## Requirements

- Playwright MCP server must be configured
- Internet access for scraping external sites
- Write access to .agenticMemory/templates/
