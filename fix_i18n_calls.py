with open("frontend/src/app/(store)/cart/page.tsx", "r") as f:
    content = f.read()

# Fix the translation interpolation to pass a single object argument with the string
# Because the `vars` object is the second argument, if the user doesn't pass one,
# it falls back. The agent noticed we had an issue but actually the t function in i18n
# accepts `(key: string, vars?: Record<string, string | number>)`. Wait, let me check the signature again.
