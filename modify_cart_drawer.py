with open('frontend/src/components/malaika/cart-drawer.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '''                          <button
                            onClick={() => remove(item.id)}
                            disabled={loading}
                            className="text-xs text-ink-muted hover:text-danger transition-colors ml-2 disabled:opacity-50"
                          >
                            Remove
                          </button>''',
    '''                          <button
                            onClick={() => remove(item.id)}
                            disabled={loading}
                            className="text-xs text-ink-muted hover:text-danger transition-colors ml-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)] rounded px-1"
                            aria-label={`Remove ${item.name} from cart`}
                          >
                            Remove
                          </button>'''
)

with open('frontend/src/components/malaika/cart-drawer.tsx', 'w') as f:
    f.write(content)
