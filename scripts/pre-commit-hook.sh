#!/usr/bin/env bash
#
# pre-commit hook: block bare `except Exception: pass/return` patterns
# that silently swallow errors without logging.
#

set -euo pipefail

# Patterns that indicate a silently swallowed error
PATTERNS=(
    'except Exception:\s*$'
    'except Exception:\s*pass\s*$'
)

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

    # Check each pattern
    for PATTERN in "${PATTERNS[@]}"; do
        MATCHES=$(echo "$STAGED_CONTENT" | grep -nE "$PATTERN" || true)
        if [ -n "$MATCHES" ]; then
            while IFS= read -r MATCH; do
                LINE_NUM=$(echo "$MATCH" | cut -d: -f1)
                LINE_TEXT=$(echo "$MATCH" | cut -d: -f2-)
                echo "  ❌ $FILE:$LINE_NUM: $LINE_TEXT"
                VIOLATIONS=$((VIOLATIONS + 1))
            done <<< "$MATCHES"
        fi
    done
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
