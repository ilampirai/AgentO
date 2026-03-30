/**
 * File-level locking for concurrent access safety.
 * Uses proper-lockfile for real (not advisory) locking.
 */

import * as lockfile from 'proper-lockfile';
import * as fs from 'fs';
import * as path from 'path';

const LOCK_DIR = '.agenticMemory';
const LOCK_FILE = '.lockfile';

function ensureLockTarget(): string {
  const lockTarget = path.join(LOCK_DIR, LOCK_FILE);
  try {
    if (!fs.existsSync(LOCK_DIR)) {
      fs.mkdirSync(LOCK_DIR, { recursive: true });
    }
    if (!fs.existsSync(lockTarget)) {
      fs.writeFileSync(lockTarget, '');
    }
  } catch {
    // Non-fatal — lock will fail gracefully
  }
  return lockTarget;
}

/**
 * Acquire a file lock. Returns a release function, or null if lock couldn't be acquired.
 * Caller should skip the protected operation if null is returned.
 */
export async function acquireLock(): Promise<(() => Promise<void>) | null> {
  try {
    const target = ensureLockTarget();
    const release = await lockfile.lock(target, {
      stale: 10000,
      retries: { retries: 3, minTimeout: 100, maxTimeout: 500 },
    });
    return release;
  } catch {
    return null;
  }
}
