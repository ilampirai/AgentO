---
name: web-scraping
description: Web scraping and template extraction using Playwright. Captures HTML structure, CSS patterns, and design tokens from websites. Use when building UI based on existing sites or extracting templates.
---

# Web Scraping Skill

This skill enables scraping websites to extract templates and design patterns.

## When to Invoke

Use this skill when:
- User provides a URL to replicate
- Building UI "like" another site
- Extracting design tokens
- Creating template library

## Capabilities

### 1. Single Page Scraping

Extract from one URL:
- HTML structure (semantic skeleton)
- CSS patterns (colors, typography, spacing)
- Component identification
- Design tokens

### 2. Full Site Crawling

Crawl entire sites to:
- Identify unique layouts
- Extract component libraries
- Build comprehensive templates
- Map site structure

### 3. Design Token Extraction

Capture design system:
- Color palette
- Typography scale
- Spacing system
- Border radii
- Shadow styles

## Process

### Step 1: Load Page

Using Playwright MCP:
```
1. Navigate to URL
2. Wait for full load
3. Capture rendered state
```

### Step 2: Extract Structure

```
1. Parse DOM structure
2. Identify semantic elements
3. Extract component boundaries
4. Remove unnecessary attributes
```

### Step 3: Extract Styles

```
1. Capture computed styles
2. Identify CSS variables
3. Extract color values
4. Calculate spacing patterns
```

### Step 4: Save Template

Store in `.agenticMemory/templates/[name]/`:
- structure.html
- styles.css
- variables.css
- components/
- meta.json

## Template Format

### structure.html
Clean HTML skeleton without content:
```html
<section class="hero">
  <div class="hero__content">
    <h1 class="hero__title"><!-- title --></h1>
    <p class="hero__subtitle"><!-- subtitle --></p>
    <div class="hero__actions">
      <button class="btn btn--primary"><!-- cta --></button>
    </div>
  </div>
</section>
```

### variables.css
Extracted design tokens:
```css
:root {
  --color-primary: #635bff;
  --color-secondary: #0a2540;
  --font-family: 'Inter', sans-serif;
  --spacing-unit: 4px;
  --radius-medium: 8px;
}
```

### meta.json
Template metadata:
```json
{
  "source": "https://example.com",
  "scrapedAt": "2025-01-07T10:30:00Z",
  "components": ["hero", "features", "pricing"],
  "colors": ["#635bff", "#0a2540"],
  "fonts": ["Inter"]
}
```

## Usage

After scraping, templates can be:
1. Applied to new components
2. Used as style reference
3. Customized for project needs

## Requirements

- Playwright MCP server must be running
- Network access to target URLs
- Write access to .agenticMemory/templates/
