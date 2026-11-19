with open('backend/apps/products/admin.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    "        if obj.image:\n            return format_html('<img src=\"{}\" alt=\"\" width=\"52\" height=\"64\" loading=\"lazy\" style=\"object-fit:contain;border-radius:6px\" />', obj.image.url)\n        return '—'",
    "        url = obj.get_image_url\n        if url:\n            return format_html('<img src=\"{}\" alt=\"\" width=\"52\" height=\"64\" loading=\"lazy\" style=\"object-fit:contain;border-radius:6px\" />', url)\n        return '—'"
)

text = text.replace(
    "        ('Images', {\n            'fields': ('image',)\n        }),",
    "        ('Images', {\n            'fields': ('image', 'image_url')\n        }),"
)

with open('backend/apps/products/admin.py', 'w', encoding='utf-8') as f:
    f.write(text)

print('Admin patch complete.')
