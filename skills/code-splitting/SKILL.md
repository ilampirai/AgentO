# Code Splitting Skill

Automatically split files when they exceed 500 lines.

## When to Split

**Trigger**: File will exceed 500 lines after a write operation.

**Action**: Automatic - no user confirmation needed.

## Split Process

```
File approaching 500 lines
         ↓
1. ANALYZE: Find extractable code
   - Classes (entire class)
   - Function groups (related functions)
   - Constants/configs
   - Utility functions
         ↓
2. CREATE: New module file
   - Name: [Purpose]Manager.js, [Feature]Utils.js, etc.
   - Move extracted code
   - Add exports
         ↓
3. UPDATE: Original file
   - Remove extracted code
   - Add import statement
   - Keep references working
         ↓
4. REPORT: What was done
   📦 Auto-split: Game.js → GameMovement.js (120 lines moved)
```

## What to Extract (Priority Order)

### 1. Entire Classes
```javascript
// BEFORE: Game.js (600 lines)
class Game { ... }
class PowerUpManager { ... }  // ← Extract this

// AFTER: Game.js (450 lines) + PowerUpManager.js (150 lines)
import { PowerUpManager } from './PowerUpManager.js';
class Game { ... }
```

### 2. Function Groups
```javascript
// BEFORE: utils.js (550 lines)
function validateEmail() { ... }
function validatePhone() { ... }
function validateAddress() { ... }
function formatDate() { ... }
function formatCurrency() { ... }

// AFTER: utils.js (300 lines) + validators.js (150 lines) + formatters.js (100 lines)
```

### 3. Constants & Config
```javascript
// BEFORE: Game.js (520 lines)
const POWER_UPS = { ... };  // 50 lines
const BOARD_CONFIG = { ... };  // 30 lines

// AFTER: Game.js (440 lines) + gameConfig.js (80 lines)
import { POWER_UPS, BOARD_CONFIG } from './gameConfig.js';
```

## Naming Conventions

| Extracted Content | New File Name |
|-------------------|---------------|
| `class XManager` | `XManager.js` |
| `class XController` | `XController.js` |
| Validation functions | `validators.js` |
| Format functions | `formatters.js` |
| API calls | `api.js` or `XApi.js` |
| Constants | `constants.js` or `XConfig.js` |
| Utilities | `utils.js` or `XUtils.js` |
| Types/Interfaces | `types.js` or `X.types.ts` |

## Import Patterns

### JavaScript (ES Modules)
```javascript
// Named exports
export { PowerUpManager };
import { PowerUpManager } from './PowerUpManager.js';

// Default export
export default PowerUpManager;
import PowerUpManager from './PowerUpManager.js';
```

### JavaScript (CommonJS)
```javascript
module.exports = { PowerUpManager };
const { PowerUpManager } = require('./PowerUpManager');
```

### TypeScript
```typescript
export class PowerUpManager { ... }
import { PowerUpManager } from './PowerUpManager';
```

### Python
```python
# powerup_manager.py
class PowerUpManager: ...

# game.py
from powerup_manager import PowerUpManager
```

## Output Format

When auto-split happens:

```
📦 Auto-split: Game.js → GameMovement.js

Moved (120 lines):
  - class MovementController
  - function calculatePath()
  - function animateMovement()

Added import:
  import { MovementController, calculatePath, animateMovement } from './GameMovement.js';

Game.js: 656 → 536 lines
GameMovement.js: 120 lines (new)

Continuing with original task...
```

## Rules

1. **Always preserve functionality** - code must work after split
2. **Maintain imports** - all references must be updated
3. **Keep related code together** - don't split a class across files
4. **Name clearly** - new file name should indicate contents
5. **Update memory** - add new file to FUNCTIONS.md and ARCHITECTURE.md

## Integration

After split:
1. Add new file to `.agenticMemory/ARCHITECTURE.md`
2. Add new functions to `.agenticMemory/FUNCTIONS.md`
3. Update DISCOVERY.md if new area

