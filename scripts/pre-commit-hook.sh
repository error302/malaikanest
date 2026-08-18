#!/usr/bin/env bash
#
# pre-commit hook: block bare `except Exception: pass/return` patterns
# that silently swallow errors without logging.
#

set -euo pipefail

# Get staged Python files
STAGED_PY=$(git diff --cached --name-only --diff-filter=ACM | grep '\.py$' || true)

if [ -z "$STAGED_PY" ]; then
    exit 0
fi

VIOLATIONS=0

for FILE in $STAGED_PY; do
    # Only scan files in backend/
    case "$FILE" in
        backend/*) ;;
        *) continue ;;
    esac

    # Get the staged content (not working tree)
    STAGED_CONTENT=$(git show ":$FILE" 2>/dev/null || true)
    if [ -z "$STAGED_CONTENT" ]; then
        continue
    fi

    # Check for silent except blocks: except Exception followed by pass/return on next line
    # or except Exception: pass on same line
    MATCHES=$(echo "$STAGED_CONTENT" | grep -nE 'except\s+Exception[^:]*:' | while IFS= read -r LINE; do
        LINE_NUM=$(echo "$LINE" | cut -d: -f1)
        # Get the next line
        NEXT_LINE=$(echo "$STAGED_CONTENT" | sed -n "$((LINE_NUM + 1))p" | sed 's/^[[:space:]]*//')
        # Check if next line is pass, return {}, return None, return "", return False
        if echo "$NEXT_LINE" | grep -qE '^(pass|return\s*\{\}|return\s*None|return\s*""|return\s*False)\s*$'; then
            echo "$LINE_NUM: $(echo "$LINE" | cut -d: -f2-)"
        fi
        # Check for except Exception: pass on same line
        if echo "$LINE" | grep -qE 'except\s+Exception[^:]*:\s*(pass|return\s*\{\}|return\s*None|return\s*""|return\s*False)\s*$'; then
            echo "$LINE_NUM: $(echo "$LINE" | cut -d: -f2-)"
        fi
    done || true)

    if [ -n "$MATCHES" ]; then
        while IFS= read -r MATCH; do
            echo "  ❌ $FILE:$MATCH"
            VIOLATIONS=$((VIOLATIONS + 1))
        done <<< "$MATCHES"
    fi
done

if [ "$VIOLATIONS" -gt 0 ]; then
    echo ""
    echo "🚨 Blocked: $VIOLATIONS bare except Exception block(s) found without logging."
    echo ""
    echo "Every exception must have structured logging. Examples:"
    echo "  except Exception as exc:"
    echo "      logger.error(\"Something failed: %s\", exc)"
    echo ""
    echo "  except Exception:"
    echo "      logger.debug(\"Expected fallback for %s\", key)"
    echo ""
    echo "If this is a genuine no-op (e.g. cloudinary import in dev), use:"
    echo "  except ImportError:"
    echo "      pass  # optional dependency"
    echo ""
    exit 1
fi

exit 0
