---
name: web-scraping
description: Web scraping capabilities using Playwright MCP for extracting design patterns, templates, and content from websites.
---

# Web Scraping Skill

Extract design patterns, templates, and content from websites using Playwright MCP.

## Capabilities

- Screenshot capture
- DOM inspection
- CSS extraction
- Content scraping
- Form interaction

## Use Cases

### Design Inspiration

```javascript
// Capture design from reference site
await page.goto('https://example.com');
await page.screenshot({ path: 'reference.png', fullPage: true });
```

### Extract Color Palette

```javascript
const colors = await page.evaluate(() => {
  const elements = document.querySelectorAll('*');
  const colorSet = new Set();
  
  elements.forEach(el => {
    const style = getComputedStyle(el);
    if (style.color !== 'rgba(0, 0, 0, 0)') colorSet.add(style.color);
    if (style.backgroundColor !== 'rgba(0, 0, 0, 0)') colorSet.add(style.backgroundColor);
  });
  
  return [...colorSet];
});
```

### Extract Typography

```javascript
const typography = await page.evaluate(() => {
  const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, span');
  const fonts = new Map();
  
  textElements.forEach(el => {
    const style = getComputedStyle(el);
    const key = `${style.fontFamily}|${style.fontSize}|${style.fontWeight}`;
    fonts.set(key, {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight
    });
  });
  
  return [...fonts.values()];
});
```

### Extract Component HTML

```javascript
const component = await page.evaluate(() => {
  const card = document.querySelector('.card');
  return card ? card.outerHTML : null;
});
```

## Storage Structure

Save scraped content to `.agenticMemory/templates/`:

```
.agenticMemory/templates/
├── stripe/
│   ├── screenshots/
│   │   ├── homepage.png
│   │   └── pricing.png
│   ├── colors.css
│   ├── typography.css
│   └── components/
│       ├── button.html
│       ├── card.html
│       └── nav.html
├── tailwind-ui/
│   ├── screenshots/
│   ├── colors.css
│   └── components/
└── linear/
    ├── screenshots/
    ├── colors.css
    └── components/
```

## Output Formats

### colors.css

```css
/* Extracted from: https://stripe.com */
/* Date: 2024-01-12 */

:root {
  /* Primary */
  --color-primary: #635bff;
  --color-primary-dark: #4b45c6;
  
  /* Text */
  --color-text: #425466;
  --color-text-dark: #0a2540;
  
  /* Background */
  --color-bg: #ffffff;
  --color-bg-alt: #f6f9fc;
  
  /* Accent */
  --color-success: #00d4aa;
  --color-warning: #ffbb00;
  --color-error: #ff5567;
}
```

### typography.css

```css
/* Extracted from: https://stripe.com */
/* Date: 2024-01-12 */

:root {
  --font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'SF Mono', 'Fira Code', monospace;
}

.text-h1 {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.2;
}

.text-h2 {
  font-size: 2.5rem;
  font-weight: 600;
  line-height: 1.3;
}

.text-body {
  font-size: 1.125rem;
  font-weight: 400;
  line-height: 1.6;
}

.text-small {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
}
```

## Ethical Guidelines

- Respect robots.txt
- Don't scrape personal data
- Use for inspiration, not copying
- Add attribution comments
- Don't overload servers (add delays)

## After Scraping

Report to orchestrator:
- Site scraped
- Components extracted
- Files saved to templates/
- Suggested usage
