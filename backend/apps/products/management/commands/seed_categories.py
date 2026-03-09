from django.core.management.base import BaseCommand

from apps.products.models import Category


CATEGORY_TREE = [
    {
        "name": "Clothing",
        "slug": "clothing",
        "description": "Apparel for babies, toddlers, and kids up to 12 years old.",
        "children": [
            {
                "name": "Baby",
                "slug": "baby",
                "description": "Clothing for newborns and babies from 0 to 2 years.",
                "children": [
                    {
                        "name": "Baby Boys",
                        "slug": "boys",
                        "description": "Baby boys clothing essentials.",
                        "children": [
                            {"name": "T-Shirts", "slug": "t-shirts"},
                            {"name": "Hoodies", "slug": "hoodies"},
                            {"name": "Jeans", "slug": "jeans"},
                            {"name": "Pants", "slug": "pants"},
                            {"name": "Shorts", "slug": "shorts"},
                            {"name": "Jackets", "slug": "jackets"},
                            {"name": "Dresses", "slug": "dresses"},
                            {"name": "Skirts", "slug": "skirts"},
                            {"name": "Pajamas", "slug": "pajamas"},
                            {"name": "Sweaters", "slug": "sweaters"},
                            {"name": "Sportswear", "slug": "sportswear"},
                            {"name": "School Wear", "slug": "school-wear"},
                        ],
                    },
                    {
                        "name": "Baby Girls",
                        "slug": "girls",
                        "description": "Baby girls clothing essentials.",
                        "children": [
                            {"name": "T-Shirts", "slug": "t-shirts"},
                            {"name": "Hoodies", "slug": "hoodies"},
                            {"name": "Jeans", "slug": "jeans"},
                            {"name": "Pants", "slug": "pants"},
                            {"name": "Shorts", "slug": "shorts"},
                            {"name": "Jackets", "slug": "jackets"},
                            {"name": "Dresses", "slug": "dresses"},
                            {"name": "Skirts", "slug": "skirts"},
                            {"name": "Pajamas", "slug": "pajamas"},
                            {"name": "Sweaters", "slug": "sweaters"},
                            {"name": "Sportswear", "slug": "sportswear"},
                            {"name": "School Wear", "slug": "school-wear"},
                        ],
                    },
                ],
            },
            {
                "name": "Toddler",
                "slug": "toddler",
                "description": "Clothing for toddlers from 2 to 5 years.",
                "children": [
                    {
                        "name": "Toddler Boys",
                        "slug": "boys",
                        "description": "Toddler boys clothing essentials.",
                        "children": [
                            {"name": "T-Shirts", "slug": "t-shirts"},
                            {"name": "Hoodies", "slug": "hoodies"},
                            {"name": "Jeans", "slug": "jeans"},
                            {"name": "Pants", "slug": "pants"},
                            {"name": "Shorts", "slug": "shorts"},
                            {"name": "Jackets", "slug": "jackets"},
                            {"name": "Dresses", "slug": "dresses"},
                            {"name": "Skirts", "slug": "skirts"},
                            {"name": "Pajamas", "slug": "pajamas"},
                            {"name": "Sweaters", "slug": "sweaters"},
                            {"name": "Sportswear", "slug": "sportswear"},
                            {"name": "School Wear", "slug": "school-wear"},
                        ],
                    },
                    {
                        "name": "Toddler Girls",
                        "slug": "girls",
                        "description": "Toddler girls clothing essentials.",
                        "children": [
                            {"name": "T-Shirts", "slug": "t-shirts"},
                            {"name": "Hoodies", "slug": "hoodies"},
                            {"name": "Jeans", "slug": "jeans"},
                            {"name": "Pants", "slug": "pants"},
                            {"name": "Shorts", "slug": "shorts"},
                            {"name": "Jackets", "slug": "jackets"},
                            {"name": "Dresses", "slug": "dresses"},
                            {"name": "Skirts", "slug": "skirts"},
                            {"name": "Pajamas", "slug": "pajamas"},
                            {"name": "Sweaters", "slug": "sweaters"},
                            {"name": "Sportswear", "slug": "sportswear"},
                            {"name": "School Wear", "slug": "school-wear"},
                        ],
                    },
                ],
            },
            {
                "name": "Kids",
                "slug": "kids",
                "description": "Clothing for children from 6 to 12 years.",
                "children": [
                    {
                        "name": "Boys (6-12)",
                        "slug": "boys",
                        "description": "Boys clothing for ages 6 to 12.",
                        "children": [
                            {"name": "T-Shirts", "slug": "t-shirts"},
                            {"name": "Hoodies", "slug": "hoodies"},
                            {"name": "Jeans", "slug": "jeans"},
                            {"name": "Pants", "slug": "pants"},
                            {"name": "Shorts", "slug": "shorts"},
                            {"name": "Jackets", "slug": "jackets"},
                            {"name": "Dresses", "slug": "dresses"},
                            {"name": "Skirts", "slug": "skirts"},
                            {"name": "Pajamas", "slug": "pajamas"},
                            {"name": "Sweaters", "slug": "sweaters"},
                            {"name": "Sportswear", "slug": "sportswear"},
                            {"name": "School Wear", "slug": "school-wear"},
                        ],
                    },
                    {
                        "name": "Girls (6-12)",
                        "slug": "girls",
                        "description": "Girls clothing for ages 6 to 12.",
                        "children": [
                            {"name": "T-Shirts", "slug": "t-shirts"},
                            {"name": "Hoodies", "slug": "hoodies"},
                            {"name": "Jeans", "slug": "jeans"},
                            {"name": "Pants", "slug": "pants"},
                            {"name": "Shorts", "slug": "shorts"},
                            {"name": "Jackets", "slug": "jackets"},
                            {"name": "Dresses", "slug": "dresses"},
                            {"name": "Skirts", "slug": "skirts"},
                            {"name": "Pajamas", "slug": "pajamas"},
                            {"name": "Sweaters", "slug": "sweaters"},
                            {"name": "Sportswear", "slug": "sportswear"},
                            {"name": "School Wear", "slug": "school-wear"},
                        ],
                    },
                ],
            },
        ],
    },
    {
        "name": "Baby Essentials",
        "slug": "baby-essentials",
        "description": "Daily baby care essentials for feeding, diapering, bath time, and health.",
        "children": [
            {"name": "Feeding", "slug": "feeding"},
            {"name": "Diapering", "slug": "diapering"},
            {"name": "Bath & Baby Care", "slug": "bath-baby-care"},
            {"name": "Baby Health", "slug": "baby-health"},
        ],
    },
    {
        "name": "Nursery",
        "slug": "nursery",
        "description": "Furniture, bedding, and decor for a cozy nursery setup.",
        "children": [
            {"name": "Cribs", "slug": "cribs"},
            {"name": "Mattresses", "slug": "mattresses"},
            {"name": "Bedding", "slug": "bedding"},
            {"name": "Changing Tables", "slug": "changing-tables"},
            {"name": "Nursery Decor", "slug": "nursery-decor"},
        ],
    },
    {
        "name": "Toys & Learning",
        "slug": "toys",
        "description": "Playtime and learning essentials for every growth stage.",
        "children": [
            {"name": "Soft Toys", "slug": "soft-toys"},
            {"name": "Educational Toys", "slug": "educational"},
            {"name": "Teething Toys", "slug": "teething-toys"},
            {"name": "Activity Toys", "slug": "activity-toys"},
            {"name": "Bath Toys", "slug": "bath-toys"},
        ],
    },
    {
        "name": "Travel & Safety",
        "slug": "travel",
        "description": "On-the-go gear and safety essentials for every outing.",
        "children": [
            {"name": "Strollers", "slug": "strollers"},
            {"name": "Car Seats", "slug": "car-seats"},
            {"name": "Baby Carriers", "slug": "baby-carriers"},
            {"name": "Walkers", "slug": "walkers"},
            {"name": "Safety Gates", "slug": "safety-gates"},
        ],
    },
    {
        "name": "Gifts",
        "slug": "gifts",
        "description": "Thoughtful gift collections for newborns, showers, and celebrations.",
        "children": [
            {"name": "Baby Gift Sets", "slug": "baby-gift-sets"},
            {"name": "Baby Shower Gifts", "slug": "baby-shower-gifts"},
            {"name": "Newborn Starter Kits", "slug": "newborn-starter-kits"},
        ],
    },
]


class Command(BaseCommand):
    help = "Seed the database with the production category architecture"

    def upsert_category(self, node, parent=None):
        category, created = Category.objects.get_or_create(
            parent=parent,
            slug=node["slug"],
            defaults={
                "name": node["name"],
                "description": node.get("description", ""),
                "group": parent.group if parent else node["name"],
            },
        )

        updates = []
        if category.name != node["name"]:
            category.name = node["name"]
            updates.append("name")
        if category.description != node.get("description", ""):
            category.description = node.get("description", "")
            updates.append("description")
        expected_group = parent.group if parent else node["name"]
        if category.group != expected_group:
            category.group = expected_group
            updates.append("group")
        if updates:
            category.save(update_fields=updates + ["slug"])

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} category: {category.full_slug}"))

        for child in node.get("children", []):
            self.upsert_category(child, category)

    def handle(self, *args, **kwargs):
        for category in CATEGORY_TREE:
            self.upsert_category(category)
        self.stdout.write(self.style.SUCCESS("Category seeding complete."))
