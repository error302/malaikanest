from django.core.management.base import BaseCommand
from apps.ai.services import embeddings


class Command(BaseCommand):
    help = 'Index all products with embeddings for vector search'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=100,
            help='Number of products to index'
        )

    def handle(self, *args, **options):
        limit = options['limit']
        self.stdout.write(f'Indexing up to {limit} products...')
        
        count = embeddings.index_all_products(limit=limit)
        
        self.stdout.write(self.style.SUCCESS(f'Successfully indexed {count} products'))
