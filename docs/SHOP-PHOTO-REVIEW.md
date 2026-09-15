# Review your shop photos

Open https://malaikanest.com/manage-store/ and choose **Review unpublished products**.

76 original shop photos were imported on 14 September 2026. Each photo currently has its own draft record. Different photos may show the same item: these are photo-based drafts, not a verified count of distinct products.

## Before making a product active

1. Click its name and confirm that the photo matches the item.
2. Replace the source-filename title with the customer-facing product name.
3. Choose the correct category, not **Shop photo review**.
4. Confirm the price. Most drafts have a **KES 1,000 placeholder**, not a valuation. Five inspected photos have individual provisional prices; photo 15 showed a 1600 label, which still needs checking.
5. Replace the owner-review description with a genuine description. Confirm condition, material and included pieces rather than assuming them from an image.
6. Enter the available stock. For size/colour variants, also check the variant inventory records; don't assume the product quantity creates stock for every size.
7. Add known sizes and additional photographs. Where two draft records show the same product, keep one product and attach the other photo as an additional image. Leave the redundant draft inactive until you decide what to do with it.
8. Set status to **Published** and check **Is active** only once the above is correct. Save and inspect the product on the storefront.

All imports started with **zero stock**, **Draft** status, and **Is active unchecked**. No public product prices or invented quantities were introduced. Originals in Downloads were not edited or removed.

## What changed in the design

- Light split homepage hero; sea-green, ivory and peach palette.
- Larger shopping text, visible keyboard focus, reduced-motion support, and product images displayed without cropping.
- Matching Django admin branding, operational shortcuts and photo thumbnails.
- Restored native Django popup and sidebar behavior; disabled the obsolete flat-theme app whose assets conflicted with current Django.
- Product names open the editor; admin lists paginate at 24 records.

## Scope and verification

No payment provider, checkout calculation, credentials or product model fields were changed by this upgrade. Payment processing has not been end-to-end retested as part of this visual upgrade.

The photo import validates files before writing and skips existing photo fingerprints, including records whose merchant SKU has changed. Nine focused tests cover admin template behavior, correct admin assets, import input validation and preserving owner edits on reruns.

Pre-upgrade database and source backup: `/home/admin/malaikanest-backups/coastal-20260914/` on the VM. The source patch is left uncommitted locally, with existing user changes preserved.
