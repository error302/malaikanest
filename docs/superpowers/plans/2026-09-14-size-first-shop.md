# Size-first shop implementation plan

> Execute inline using executing-plans, with test-first changes and a review before deployment.

**Goal:** Clarify category paths and deliver the owner's approved white-and-blue, size-first shopping experience.

**Architecture:** Keep the deployed Django monolith. Preserve all catalog records. Use existing size and inventory models, an optional product measurement text field, and server-rendered filters without new services.

**Design:** White #FFFFFF, blue #0074BC, navy #12324A, sky #EEF7FD, text #576875, borders #D5E3EC. Keep system typography; 40px catalog title, 16px body, 44px controls. Open four-column desktop/two-column mobile product grid, 4:5 contained photos, 6px control radii. The signature is a prominent size-button row. Generated references are preview-only and never merchandise or measurement sources.

## Tasks

- [ ] Category labels: test two same-name leaves under different parents; preserve UUID filtering; render full paths in admin filter and product form using one ancestor lookup. Modify products/admin.py; add products/tests_admin_categories.py. No model/data merge.
- [ ] Sizing: add storefront/tests_sizing.py for in-stock variants, reserved/inactive exclusion, simple-product fallback, filter preservation, and escaped measurement output. Run against isolated Postgres test DB before implementation.
- [ ] Add storefront/sizing.py helpers for available variants and sizes; integrate views.py; add optional Product.size_guide and migration 0008; expose field in admin.
- [ ] Templates: add blue theme, size controls, card sizes, stock-aware variant choices, and owner-provided fit notes replacing unverified generic table. Preserve search, age, condition, category, sort across pagination.
- [ ] Verify focused regression suite and migration consistency in isolated container. Back up source/database before scoped release. Build, migrate, restart web only; verify health, public desktop/mobile and admin labels. Do not publish drafts or change owner prices.

## Validation commands

`python manage.py test apps.products.tests_admin_categories apps.storefront.tests_sizing apps.storefront.tests apps.products.tests_shop_import apps.storefront.tests_admin_theme --noinput`

`python manage.py makemigrations --check --dry-run`

Tests run in an isolated Postgres test database; no test products are inserted into the production database. Deploy only explicit source files, never local environment files. Preserve rollback source and a compressed database backup on the server. Leave changes uncommitted for owner review.
