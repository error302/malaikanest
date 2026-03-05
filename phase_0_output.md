# PHASE 0 — CODEBASE MAPPING

## 1. Project structure
### Python:
```
.agents\skills\create-tooluniverse-skill\assets\skill_template\python_implementation.py
.agents\skills\create-tooluniverse-skill\assets\skill_template\test_skill.py
.agents\skills\create-tooluniverse-skill\scripts\test_tools_template.py
.agents\skills\devtu-auto-discover-apis\example_usage.py
.agents\skills\devtu-auto-discover-apis\python_implementation.py
.agents\skills\devtu-create-tool\templates\api_tool_template.py
.agents\skills\devtu-create-tool\templates\simple_tool_template.py
.agents\skills\devtu-create-tool\templates\test_template.py
.agents\skills\protein-interaction-network-analysis\python_implementation.py
.agents\skills\protein-interaction-network-analysis\test_protein_tools.py
.agents\skills\protein-interaction-network-analysis\test_skill_comprehensive.py
.agents\skills\setup-tooluniverse\scripts\check_prerequisites.py
.agents\skills\setup-tooluniverse\scripts\diagnose_setup.py
.agents\skills\setup-tooluniverse\scripts\list_tool_categories.py
.agents\skills\setup-tooluniverse\scripts\test_mcp_connection.py
.agents\skills\setup-tooluniverse\scripts\verify_installation.py
.agents\skills\tooluniverse-adverse-event-detection\test_adverse_event_detection.py
.agents\skills\tooluniverse-antibody-engineering\antibody_pipeline.py
.agents\skills\tooluniverse-antibody-engineering\python_implementation.py
.agents\skills\tooluniverse-cancer-variant-interpretation\test_skill.py
.agents\skills\tooluniverse-chemical-safety\test_skill.py
.agents\skills\tooluniverse-clinical-trial-design\python_implementation.py
.agents\skills\tooluniverse-clinical-trial-design\trial_pipeline.py
.agents\skills\tooluniverse-clinical-trial-matching\test_skill.py
.agents\skills\tooluniverse-drug-drug-interaction\ddi_pipeline.py
.agents\skills\tooluniverse-drug-drug-interaction\ddi_working_example.py
.agents\skills\tooluniverse-drug-drug-interaction\python_implementation.py
.agents\skills\tooluniverse-drug-target-validation\test_skill.py
.agents\skills\tooluniverse-epigenomics\test_skill.py
.agents\skills\tooluniverse-gene-enrichment\scripts\format_enrichment_output.py
.agents\skills\tooluniverse-gene-enrichment\test_gene_enrichment.py
.agents\skills\tooluniverse-gwas-drug-discovery\python_implementation.py
.agents\skills\tooluniverse-gwas-drug-discovery\test_gwas_drug_tools.py
.agents\skills\tooluniverse-gwas-drug-discovery\test_gwas_drug_tools_v2.py
.agents\skills\tooluniverse-gwas-finemapping\python_implementation.py
.agents\skills\tooluniverse-gwas-finemapping\test_skill_comprehensive.py
.agents\skills\tooluniverse-gwas-snp-interpretation\python_implementation.py
.agents\skills\tooluniverse-gwas-snp-interpretation\test_gwas_snp_tools.py
.agents\skills\tooluniverse-gwas-snp-interpretation\test_gwas_snp_tools_simple.py
.agents\skills\tooluniverse-gwas-snp-interpretation\test_skill_comprehensive.py
.agents\skills\tooluniverse-gwas-study-explorer\python_implementation.py
.agents\skills\tooluniverse-gwas-study-explorer\test_skill_comprehensive.py
.agents\skills\tooluniverse-gwas-trait-to-gene\python_implementation.py
.agents\skills\tooluniverse-gwas-trait-to-gene\test_gwas_tools.py
.agents\skills\tooluniverse-gwas-trait-to-gene\test_skill_comprehensive.py
.agents\skills\tooluniverse-image-analysis\scripts\batch_process.py
.agents\skills\tooluniverse-image-analysis\scripts\measure_fluorescence.py
.agents\skills\tooluniverse-image-analysis\scripts\segment_cells.py
.agents\skills\tooluniverse-image-analysis\test_image_analysis.py
.agents\skills\tooluniverse-immunotherapy-response-prediction\test_skill.py
.agents\skills\tooluniverse-metabolomics\diabetes_analysis.py
.agents\skills\tooluniverse-metabolomics\python_implementation.py
.agents\skills\tooluniverse-metabolomics\python_implementation_fixed.py
.agents\skills\tooluniverse-metabolomics\test_detailed.py
.agents\skills\tooluniverse-metabolomics\test_skill.py
.agents\skills\tooluniverse-metabolomics\test_tools_debug.py
.agents\skills\tooluniverse-multiomic-disease-characterization\test_multiomic_disease.py
.agents\skills\tooluniverse-network-pharmacology\test_network_pharmacology.py
.agents\skills\tooluniverse-phylogenetics\scripts\format_alignment.py
.agents\skills\tooluniverse-phylogenetics\scripts\tree_statistics.py
.agents\skills\tooluniverse-phylogenetics\test_phylogenetics.py
.agents\skills\tooluniverse-polygenic-risk-score\check_data.py
.agents\skills\tooluniverse-polygenic-risk-score\python_implementation.py
.agents\skills\tooluniverse-polygenic-risk-score\test_prs_tools.py
.agents\skills\tooluniverse-polygenic-risk-score\test_skill_comprehensive.py
.agents\skills\tooluniverse-precision-medicine-stratification\test_skill.py
.agents\skills\tooluniverse-rnaseq-deseq2\scripts\convert_rds_to_csv.py
.agents\skills\tooluniverse-rnaseq-deseq2\scripts\format_deseq2_output.py
.agents\skills\tooluniverse-rnaseq-deseq2\scripts\load_count_matrix.py
.agents\skills\tooluniverse-rnaseq-deseq2\test_skill.py
.agents\skills\tooluniverse-spatial-omics-analysis\test_spatial_omics.py
.agents\skills\tooluniverse-statistical-modeling\scripts\format_statistical_output.py
.agents\skills\tooluniverse-statistical-modeling\scripts\model_diagnostics.py
.agents\skills\tooluniverse-statistical-modeling\test_skill.py
.agents\skills\tooluniverse-systems-biology\python_implementation.py
.agents\skills\tooluniverse-systems-biology\test_skill.py
.agents\skills\tooluniverse-variant-analysis\python_implementation.py
.agents\skills\tooluniverse-variant-analysis\scripts\annotate_variants.py
.agents\skills\tooluniverse-variant-analysis\scripts\filter_variants.py
.agents\skills\tooluniverse-variant-analysis\scripts\parse_vcf.py
.agents\skills\tooluniverse-variant-analysis\test_variant_analysis.py
backend\apps\accounts\__init__.py
backend\apps\accounts\admin.py
backend\apps\accounts\apps.py
backend\apps\accounts\authentication.py
backend\apps\accounts\models.py
backend\apps\accounts\permissions.py
backend\apps\accounts\serializers.py
backend\apps\accounts\urls.py
backend\apps\accounts\views.py
backend\apps\ai\__init__.py
backend\apps\ai\admin.py
backend\apps\ai\apps.py
backend\apps\ai\management\__init__.py
backend\apps\ai\management\commands\__init__.py
backend\apps\ai\management\commands\index_embeddings.py
backend\apps\ai\models.py
backend\apps\ai\services\__init__.py
backend\apps\ai\services\admin_tools.py
backend\apps\ai\services\bundles.py
backend\apps\ai\services\chatbot.py
backend\apps\ai\services\embeddings.py
backend\apps\ai\services\openai_client.py
backend\apps\ai\services\recommendations.py
backend\apps\ai\urls.py
backend\apps\ai\views.py
backend\apps\core\__init__.py
backend\apps\core\apps.py
backend\apps\core\consumers.py
backend\apps\core\exceptions.py
backend\apps\core\healthcheck.py
backend\apps\core\management\commands\__init__.py
backend\apps\core\management\commands\create_superuser.py
backend\apps\core\management\commands\healthcheck.py
backend\apps\core\management\commands\test_email.py
backend\apps\core\middleware.py
backend\apps\core\routing.py
backend\apps\core\sanitization.py
backend\apps\core\urls.py
backend\apps\core\utils.py
backend\apps\core\validators.py
backend\apps\core\views.py
backend\apps\orders\__init__.py
backend\apps\orders\admin_views.py
backend\apps\orders\apps.py
backend\apps\orders\invoice.py
backend\apps\orders\models.py
backend\apps\orders\serializers.py
backend\apps\orders\signals.py
backend\apps\orders\tasks.py
backend\apps\orders\tests.py
backend\apps\orders\urls.py
backend\apps\orders\views.py
backend\apps\payments\__init__.py
backend\apps\payments\admin.py
backend\apps\payments\apps.py
backend\apps\payments\management\commands\reconcile_payments.py
backend\apps\payments\models.py
backend\apps\payments\serializers.py
backend\apps\payments\tasks.py
backend\apps\payments\tests.py
backend\apps\payments\urls.py
backend\apps\payments\views.py
backend\apps\products\__init__.py
backend\apps\products\admin.py
backend\apps\products\admin_serializers.py
backend\apps\products\admin_views.py
backend\apps\products\apps.py
backend\apps\products\management\commands\bulk_upload_images.py
backend\apps\products\management\commands\seed_categories.py
backend\apps\products\management\commands\seed_products.py
backend\apps\products\models.py
backend\apps\products\serializers.py
backend\apps\products\signals.py
backend\apps\products\urls.py
backend\apps\products\views.py
backend\apps\users\__init__.py
backend\apps\users\admin.py
backend\apps\users\apps.py
backend\apps\users\models.py
backend\apps\users\serializers.py
backend\apps\users\urls.py
backend\apps\users\views.py
backend\config\__init__.py
backend\config\asgi.py
backend\config\celery.py
backend\config\settings\__init__.py
backend\config\settings\base.py
backend\config\settings\dev.py
backend\config\settings\prod.py
backend\config\urls.py
backend\config\wsgi.py
backend\debug_migrate.py
backend\dump_phase_0.py
backend\kenya_ecom\__init__.py
backend\kenya_ecom\asgi.py
backend\kenya_ecom\celery.py
backend\kenya_ecom\settings.py
backend\kenya_ecom\test_settings.py
backend\kenya_ecom\urls.py
backend\kenya_ecom\wsgi.py
backend\manage.py
backend\scripts\upload_banner.py
load\locustfile.py
```

### TS/JS:
```
.agents\skills\systematic-debugging\condition-based-waiting-example.ts
.agents\skills\writing-skills\render-graphs.js
backend\ecosystem.config.js
frontend\ecosystem.config.js
frontend\middleware.ts
frontend\next-env.d.ts
frontend\next.config.js
frontend\postcss.config.js
frontend\src\app\about\page.tsx
frontend\src\app\account\orders\page.tsx
frontend\src\app\admin\banners\page.tsx
frontend\src\app\admin\categories\page.tsx
frontend\src\app\admin\customers\page.tsx
frontend\src\app\admin\dashboard\page.tsx
frontend\src\app\admin\layout.tsx
frontend\src\app\admin\login\page.tsx
frontend\src\app\admin\orders\page.tsx
frontend\src\app\admin\page.tsx
frontend\src\app\admin\products\new\page.tsx
frontend\src\app\admin\products\page.tsx
frontend\src\app\admin\reports\page.tsx
frontend\src\app\admin\settings\page.tsx
frontend\src\app\bundle\page.tsx
frontend\src\app\cart\page.tsx
frontend\src\app\categories\page.tsx
frontend\src\app\checkout\page.tsx
frontend\src\app\checkout\success\page.tsx
frontend\src\app\contact\page.tsx
frontend\src\app\dashboard\page.tsx
frontend\src\app\error.tsx
frontend\src\app\faq\page.tsx
frontend\src\app\forgot-password\page.tsx
frontend\src\app\global-error.tsx
frontend\src\app\layout.tsx
frontend\src\app\loading.tsx
frontend\src\app\login\page.tsx
frontend\src\app\page.tsx
frontend\src\app\privacy-policy\page.tsx
frontend\src\app\products\[slug]\page.tsx
frontend\src\app\register\page.tsx
frontend\src\app\reset-password\page.tsx
frontend\src\app\shipping\page.tsx
frontend\src\app\terms-of-service\page.tsx
frontend\src\app\verify-email\page.tsx
frontend\src\components\AIChatWidget.tsx
frontend\src\components\AIRecommendations.tsx
frontend\src\components\Banners.tsx
frontend\src\components\DarkModeToggle.tsx
frontend\src\components\ErrorBoundary.tsx
frontend\src\components\FeaturedProducts.tsx
frontend\src\components\Filters.tsx
frontend\src\components\Footer.tsx
frontend\src\components\Hero.tsx
frontend\src\components\HeroSlider.tsx
frontend\src\components\Loading.tsx
frontend\src\components\Logo.tsx
frontend\src\components\MiniCart.tsx
frontend\src\components\Navbar.tsx
frontend\src\components\OrderStatus.tsx
frontend\src\components\ProductCard.tsx
frontend\src\components\ProductImageUploader.tsx
frontend\src\components\ProductsList.tsx
frontend\src\components\Toast.tsx
frontend\src\components\TrustBadges.tsx
frontend\src\components\ui\Badge.tsx
frontend\src\components\ui\Button.tsx
frontend\src\components\ui\Card.tsx
frontend\src\components\ui\Input.tsx
frontend\src\components\ui\SectionHeader.tsx
frontend\src\components\ui\SkeletonCard.tsx
frontend\src\lib\api.ts
frontend\src\lib\cache.ts
frontend\src\lib\cartContext.tsx
frontend\src\lib\providers.tsx
frontend\tailwind.config.js
```

## 2. All installed Django packages
```
amqp==5.3.1
annotated-types==0.7.0
anyio==4.12.1
asgiref==3.11.1
billiard==4.2.4
celery==5.5.0
certifi==2026.1.4
charset-normalizer==3.4.4
click==8.3.1
click-didyoumean==0.3.1
click-plugins==1.1.1.2
click-repl==0.3.0
cloudinary==1.31.0
colorama==0.4.6
cron_descriptor==2.0.6
distlib==0.4.0
distro==1.9.0
Django==4.2.28
django-celery-beat==2.5.0
django-cloudinary-storage==0.2.0
django-cors-headers==3.14.0
django-filter==24.3
django-ratelimit==4.1.0
django-timezone-field==7.2.1
djangorestframework==3.14.0
djangorestframework-simplejwt==5.2.2
filelock==3.24.3
gunicorn==20.1.0
h11==0.16.0
httpcore==1.0.9
httpx==0.28.1
idna==3.11
jiter==0.13.0
kombu==5.5.4
numpy==2.4.2
openai==2.21.0
packaging==26.0
pillow==12.1.1
platformdirs==4.9.2
prompt_toolkit==3.0.52
psycopg2-binary==2.9.10
pydantic==2.12.5
pydantic_core==2.41.5
pygame==2.6.1
PyJWT==2.11.0
PyOpenGL==3.1.10
PyOpenGL-accelerate==3.1.10
python-crontab==3.3.0
python-dateutil==2.9.0.post0
python-dotenv==1.0.0
pytz==2024.1
redis==4.5.5
regex==2026.2.19
requests==2.31.0
setuptools==74.1.3
six==1.17.0
sniffio==1.3.1
sqlparse==0.5.5
stripe==7.8.0
tiktoken==0.12.0
tqdm==4.67.3
typing-inspection==0.4.2
typing_extensions==4.15.0
tzdata==2025.3
urllib3==1.26.20
vine==5.1.0
virtualenv==20.38.0
wcwidth==0.6.0
```

## 3. All Django apps and models
```
Using SQLite database (no PostgreSQL config found)
Running in DEVELOPMENT mode
django.contrib.admin.LogEntry: ['id', 'action_time', 'user', 'content_type', 'object_id', 'object_repr', 'action_flag', 'change_message']
django.contrib.auth.Permission: ['group', 'user', 'id', 'name', 'content_type', 'codename']
django.contrib.auth.Group: ['user', 'id', 'name', 'permissions']
django.contrib.contenttypes.ContentType: ['logentry', 'permission', 'id', 'app_label', 'model']
django.contrib.sessions.Session: ['session_key', 'session_data', 'expire_date']
apps.accounts.User: ['logentry', 'cart', 'order', 'id', 'password', 'last_login', 'is_superuser', 'email', 'phone', 'first_name', 'last_name', 'is_active', 'is_staff', 'role', 'date_joined', 'password_reset_token', 'password_reset_expires', 'verification_token', 'email_verified', 'groups', 'user_permissions']
apps.products.Brand: ['products', 'id', 'name', 'slug', 'logo', 'description', 'is_active', 'created_at']
apps.products.Category: ['children', 'products', 'id', 'name', 'slug', 'image', 'parent', 'group']
apps.products.Banner: ['id', 'title', 'subtitle', 'button_text', 'button_link', 'image', 'mobile_image', 'is_active', 'start_date', 'end_date', 'position', 'created_at']
apps.products.Product: ['inventory', 'variants', 'reviews', 'wishlist', 'cartitem', 'orderitem', 'embedding', 'id', 'name', 'slug', 'sku', 'description', 'category', 'brand', 'price', 'discount_price', 'stock', 'low_stock_threshold', 'weight', 'gender', 'age_range', 'featured', 'status', 'seo_title', 'seo_description', 'created_at', 'updated_at', 'image', 'is_active']
apps.products.Inventory: ['id', 'product', 'quantity', 'reserved']
apps.products.ProductVariant: ['id', 'product', 'size', 'color', 'sku', 'price_modifier', 'is_active']
apps.products.Review: ['id', 'product', 'user_email', 'rating', 'title', 'body', 'created_at']
apps.products.Wishlist: ['id', 'user_email', 'product', 'created_at']
apps.orders.Coupon: ['order', 'id', 'code', 'amount', 'active', 'created_at']
apps.orders.Cart: ['items', 'id', 'user', 'session_key', 'created_at']
apps.orders.CartItem: ['id', 'cart', 'product', 'quantity']
apps.orders.Order: ['items', 'payment', 'id', 'user', 'total', 'status', 'created_at', 'updated_at', 'coupon', 'receipt_number', 'delivery_region', 'is_gift', 'gift_message', 'guest_email', 'guest_phone']
apps.orders.OrderItem: ['id', 'order', 'product', 'price', 'quantity']
apps.payments.Payment: ['id', 'order', 'amount', 'payment_method', 'phone', 'checkout_request_id', 'mpesa_receipt_number', 'paypal_transaction_id', 'card_last_four', 'card_brand', 'status', 'raw_callback', 'created_at', 'updated_at']
apps.ai.ChatHistory: ['id', 'session_id', 'user_email', 'message', 'response', 'intent', 'products_shown', 'created_at']
apps.ai.ProductEmbedding: ['id', 'product', 'embedding', 'created_at', 'updated_at']
apps.ai.AIGenerationLog: ['id', 'generation_type', 'input_data', 'output_data', 'tokens_used', 'success', 'error_message', 'created_at']
```

## 4. All API endpoints
```

[ERROR]
Traceback (most recent call last):
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\management\__init__.py", line 255, in fetch_command
    app_name = commands[subcommand]
               ~~~~~~~~^^^^^^^^^^^^
KeyError: 'show_urls'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "C:\Users\ADMIN\Desktop\PROJECT BABY\malaika nest\backend\manage.py", line 13, in <module>
    execute_from_command_line(sys.argv)
    ~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\management\__init__.py", line 442, in execute_from_command_line
    utility.execute()
    ~~~~~~~~~~~~~~~^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\management\__init__.py", line 436, in execute
    self.fetch_command(subcommand).run_from_argv(self.argv)
    ~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\management\__init__.py", line 262, in fetch_command
    settings.INSTALLED_APPS
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\conf\__init__.py", line 102, in __getattr__
    self._setup(name)
    ~~~~~~~~~~~^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\conf\__init__.py", line 89, in _setup
    self._wrapped = Settings(settings_module)
                    ~~~~~~~~^^^^^^^^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\conf\__init__.py", line 217, in __init__
    mod = importlib.import_module(self.SETTINGS_MODULE)
  File "C:\Python313\Lib\importlib\__init__.py", line 88, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 1023, in exec_module
  File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
  File "C:\Users\ADMIN\Desktop\PROJECT BABY\malaika nest\backend\kenya_ecom\settings.py", line 102, in <module>
    import dj_database_url
ModuleNotFoundError: No module named 'dj_database_url'

```

## 5. All environment variables currently loaded
```
Using SQLite database (no PostgreSQL config found)
Running in DEVELOPMENT mode
SECRET_KEY: change...
DEBUG: True
ALLOWED_HOSTS: ['*']
DATABASE_URL: NOT SET
CLOUDINARY_CLOUD_NAME: NOT SET
CLOUDINARY_API_KEY: NOT SE...
EMAIL_HOST_USER: None
EMAIL_HOST_PASSWORD: None
MPESA_CONSUMER_KEY: NOT SE...
MPESA_CONSUMER_SECRET: NOT SE...
CORS_ALLOWED_ORIGINS: ['http://localhost:3000']
DEFAULT_FILE_STORAGE: django.core.files.storage.FileSystemStorage
```

## 6. Migration status
```

[ERROR]
Traceback (most recent call last):
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\management\base.py", line 412, in run_from_argv
    self.execute(*args, **cmd_options)
    ~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\management\base.py", line 453, in execute
    self.check()
    ~~~~~~~~~~^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\management\base.py", line 485, in check
    all_issues = checks.run_checks(
        app_configs=app_configs,
    ...<2 lines>...
        databases=databases,
    )
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\checks\registry.py", line 88, in run_checks
    new_errors = check(app_configs=app_configs, databases=databases)
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\checks\translation.py", line 53, in check_setting_languages_bidi
    for tag in settings.LANGUAGES_BIDI
               ^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\conf\__init__.py", line 102, in __getattr__
    self._setup(name)
    ~~~~~~~~~~~^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\conf\__init__.py", line 89, in _setup
    self._wrapped = Settings(settings_module)
                    ~~~~~~~~^^^^^^^^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\conf\__init__.py", line 217, in __init__
    mod = importlib.import_module(self.SETTINGS_MODULE)
  File "C:\Python313\Lib\importlib\__init__.py", line 88, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 1023, in exec_module
  File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
  File "C:\Users\ADMIN\Desktop\PROJECT BABY\malaika nest\backend\kenya_ecom\settings.py", line 102, in <module>
    import dj_database_url
ModuleNotFoundError: No module named 'dj_database_url'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "C:\Users\ADMIN\Desktop\PROJECT BABY\malaika nest\backend\manage.py", line 13, in <module>
    execute_from_command_line(sys.argv)
    ~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\management\__init__.py", line 442, in execute_from_command_line
    utility.execute()
    ~~~~~~~~~~~~~~~^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\management\__init__.py", line 436, in execute
    self.fetch_command(subcommand).run_from_argv(self.argv)
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\management\base.py", line 425, in run_from_argv
    connections.close_all()
    ~~~~~~~~~~~~~~~~~~~~~^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\utils\connection.py", line 84, in close_all
    for conn in self.all(initialized_only=True):
                ~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\utils\connection.py", line 78, in all
    for alias in self
                 ^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\utils\connection.py", line 73, in __iter__
    return iter(self.settings)
                ^^^^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\utils\functional.py", line 57, in __get__
    res = instance.__dict__[self.name] = self.func(instance)
                                         ~~~~~~~~~^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\utils\connection.py", line 45, in settings
    self._settings = self.configure_settings(self._settings)
                     ~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\db\utils.py", line 148, in configure_settings
    databases = super().configure_settings(databases)
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\utils\connection.py", line 50, in configure_settings
    settings = getattr(django_settings, self.settings_name)
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\conf\__init__.py", line 102, in __getattr__
    self._setup(name)
    ~~~~~~~~~~~^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\conf\__init__.py", line 89, in _setup
    self._wrapped = Settings(settings_module)
                    ~~~~~~~~^^^^^^^^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\conf\__init__.py", line 217, in __init__
    mod = importlib.import_module(self.SETTINGS_MODULE)
  File "C:\Python313\Lib\importlib\__init__.py", line 88, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 1023, in exec_module
  File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
  File "C:\Users\ADMIN\Desktop\PROJECT BABY\malaika nest\backend\kenya_ecom\settings.py", line 102, in <module>
    import dj_database_url
ModuleNotFoundError: No module named 'dj_database_url'

```

## 7. Check for unapplied model changes
```

[ERROR]
Traceback (most recent call last):
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\management\base.py", line 412, in run_from_argv
    self.execute(*args, **cmd_options)
    ~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\management\base.py", line 453, in execute
    self.check()
    ~~~~~~~~~~^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\management\base.py", line 485, in check
    all_issues = checks.run_checks(
        app_configs=app_configs,
    ...<2 lines>...
        databases=databases,
    )
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\checks\registry.py", line 88, in run_checks
    new_errors = check(app_configs=app_configs, databases=databases)
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\checks\translation.py", line 53, in check_setting_languages_bidi
    for tag in settings.LANGUAGES_BIDI
               ^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\conf\__init__.py", line 102, in __getattr__
    self._setup(name)
    ~~~~~~~~~~~^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\conf\__init__.py", line 89, in _setup
    self._wrapped = Settings(settings_module)
                    ~~~~~~~~^^^^^^^^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\conf\__init__.py", line 217, in __init__
    mod = importlib.import_module(self.SETTINGS_MODULE)
  File "C:\Python313\Lib\importlib\__init__.py", line 88, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 1023, in exec_module
  File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
  File "C:\Users\ADMIN\Desktop\PROJECT BABY\malaika nest\backend\kenya_ecom\settings.py", line 102, in <module>
    import dj_database_url
ModuleNotFoundError: No module named 'dj_database_url'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "C:\Users\ADMIN\Desktop\PROJECT BABY\malaika nest\backend\manage.py", line 13, in <module>
    execute_from_command_line(sys.argv)
    ~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\management\__init__.py", line 442, in execute_from_command_line
    utility.execute()
    ~~~~~~~~~~~~~~~^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\management\__init__.py", line 436, in execute
    self.fetch_command(subcommand).run_from_argv(self.argv)
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\core\management\base.py", line 425, in run_from_argv
    connections.close_all()
    ~~~~~~~~~~~~~~~~~~~~~^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\utils\connection.py", line 84, in close_all
    for conn in self.all(initialized_only=True):
                ~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\utils\connection.py", line 78, in all
    for alias in self
                 ^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\utils\connection.py", line 73, in __iter__
    return iter(self.settings)
                ^^^^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\utils\functional.py", line 57, in __get__
    res = instance.__dict__[self.name] = self.func(instance)
                                         ~~~~~~~~~^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\utils\connection.py", line 45, in settings
    self._settings = self.configure_settings(self._settings)
                     ~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\db\utils.py", line 148, in configure_settings
    databases = super().configure_settings(databases)
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\utils\connection.py", line 50, in configure_settings
    settings = getattr(django_settings, self.settings_name)
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\conf\__init__.py", line 102, in __getattr__
    self._setup(name)
    ~~~~~~~~~~~^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\conf\__init__.py", line 89, in _setup
    self._wrapped = Settings(settings_module)
                    ~~~~~~~~^^^^^^^^^^^^^^^^^
  File "C:\Users\ADMIN\AppData\Roaming\Python\Python313\site-packages\django\conf\__init__.py", line 217, in __init__
    mod = importlib.import_module(self.SETTINGS_MODULE)
  File "C:\Python313\Lib\importlib\__init__.py", line 88, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
           ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
  File "<frozen importlib._bootstrap_external>", line 1023, in exec_module
  File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
  File "C:\Users\ADMIN\Desktop\PROJECT BABY\malaika nest\backend\kenya_ecom\settings.py", line 102, in <module>
    import dj_database_url
ModuleNotFoundError: No module named 'dj_database_url'

```

## 8. Nginx config
*Skipped: Running on local Windows environment.*

## 9. Systemd services
*Skipped: Running on local Windows environment.*

## 10. Frontend environment files
```

--- .env.example ---
# Root .env.example for Malaika Nest (copy to .env.production and fill values)
# This file documents all environment variables needed for the project

# Django
SECRET_KEY=replace-with-a-long-secret
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kenya_ecom
DB_USER=kenya_user
DB_PASSWORD=replace-with-db-password
DB_HOST=127.0.0.1
DB_PORT=5432

# Redis
REDIS_URL=redis://127.0.0.1:6379/0

# Cloudinary (optional - leave empty if not using)
CLOUDINARY_URL=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# JWT Authentication
SIMPLE_JWT_SECRET=replace-with-jwt-secret
ACCESS_TOKEN_LIFETIME=300
REFRESH_TOKEN_LIFETIME=86400

# Safaricom M-Pesa Daraja API (Production)
MPESA_CONSUMER_KEY=your_consumer_key_from_safaricom
MPESA_CONSUMER_SECRET=your_consumer_secret_from_safaricom
MPESA_SHORTCODE=your_shortcode (e.g., 174379)
MPESA_PASSKEY=your_passkey_from_safaricom
MPESA_ENV=production
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback/

# Email (SMTP)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=you@example.com
EMAIL_HOST_PASSWORD=emailpassword
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# Admin URL Secret
ADMIN_URL_SECRET=admin-very-secret-change-this

# OpenAI (optional - for AI features)
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=1000

# PayPal (optional)
PAYPAL_CLIENT_ID=
PAYPAL_SECRET=

# Stripe (optional)
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=

# Sentry (optional - for error tracking)
SENTRY_DSN=

# Frontend URL
NEXT_PUBLIC_API_URL=https://yourdomain.com

# Project root path
PROJECT_ROOT=/opt/kenya_baby_ecommerce

--- .env.production ---
# Kenya Baby E-Commerce Production Environment Variables
# ======================================================
# COPY THIS FILE TO .env.proDUCTION AND FILL IN ALL VALUES
# BEFORE RUNNING docker-compose.prod.yml

# ======================================================
# DJANGO SETTINGS
# ======================================================
SECRET_KEY=replace-this-with-a-very-long-random-secret-key-at-least-50-chars
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,your-server-ip

# ======================================================
# DATABASE (PostgreSQL)
# ======================================================
DB_NAME=kenya_ecom
DB_USER=kenya_user
DB_PASSWORD=replace-with-very-strong-db-password-min-20-chars
DB_HOST=db
DB_PORT=5432

# ======================================================
# REDIS
# ======================================================
REDIS_URL=redis://redis:6379/0

# ======================================================
# CLOUDINARY (Image Storage)
# ======================================================
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME

# ======================================================
# JWT AUTHENTICATION
# ======================================================
SIMPLE_JWT_SECRET=replace-with-another-very-long-random-secret-key
ACCESS_TOKEN_LIFETIME=300
REFRESH_TOKEN_LIFETIME=86400

# ======================================================
# M-PESA DARaja API (PRODUCTION - Get from Safaricom)
# ======================================================
# Obtain these from Safaricom Daraja Portal: https://developer.safaricom.co.ke/
MPESA_CONSUMER_KEY=your_consumer_key_from_safaricom
MPESA_CONSUMER_SECRET=your_consumer_secret_from_safaricom
MPESA_SHORTCODE=your_business_shortcode
MPESA_PASSKEY=your_passkey_from_safaricom
MPESA_ENV=production
# This must be a publicly accessible HTTPS URL that Safaricom can reach
# You'll need to configure your server with SSL first, then update this
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback/

# ======================================================
# PAYPAL (Optional - Get from PayPal Developer Dashboard)
# ======================================================
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret
PAYPAL_MODE=sandbox  # Use 'live' for production

# ======================================================
# STRIPE (Optional - Get from Stripe Dashboard)
# ======================================================
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# ======================================================
# EMAIL (SMTP)
# ======================================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-specific-password
EMAIL_USE_TLS=True

# ======================================================
# SECURITY
# ======================================================
ADMIN_URL_SECRET=make-this-very-secret-random-string

# ======================================================
# CORS & SECURITY
# ======================================================
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# ======================================================
# FRONTEND
# ======================================================
NEXT_PUBLIC_API_URL=https://yourdomain.com

--- .env.production.example ---
# =============================================================================
# MALAIKA NEST - PRODUCTION ENVIRONMENT VARIABLES
# =============================================================================
# Copy this file to .env.production and fill in all values
# IMPORTANT: Change all placeholder values to secure, production-ready values

# =============================================================================
# DOMAIN & URLs
# =============================================================================
DOMAIN=malaikanest.shop
FRONTEND_URL=https://malaikanest.shop
NEXT_PUBLIC_API_URL=https://malaikanest.shop/api

# =============================================================================
# DJANGO SECRET KEYS
# =============================================================================
# Generate a strong secret key: python -c "import secrets; print(secrets.token_hex(50))"
SECRET_KEY=your-super-secret-key-here-min-50-chars-change-this

# JWT Secret - Generate: python -c "import secrets; print(secrets.token_hex(32))"
SIMPLE_JWT_SECRET=your-jwt-secret-here-min-32-chars-change-this

# Admin URL secret (for protected admin access like /secret-admin/)
ADMIN_URL_SECRET=your-admin-url-secret-change-this

# =============================================================================
# ALLOWED HOSTS
# =============================================================================
ALLOWED_HOSTS=malaikanest.shop,www.malaikanest.shop

# =============================================================================
# DEBUG MODE
# =============================================================================
DEBUG=False

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
POSTGRES_DB=kenya_ecom
POSTGRES_USER=kenya_user
POSTGRES_PASSWORD=change-this-to-a-strong-database-password-min-20-chars
DB_NAME=kenya_ecom
DB_USER=kenya_user
DB_PASSWORD=change-this-to-a-strong-database-password-min-20-chars
DB_HOST=db
DB_PORT=5432

# =============================================================================
# REDIS CONFIGURATION
# =============================================================================
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/1

# =============================================================================
# CLOUDINARY (Image Storage)
# =============================================================================
# Get these from your Cloudinary dashboard
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_KEY=your-cloudinary-api-key
CLOUDINARY_SECRET=your-cloudinary-api-secret
CLOUDINARY_URL=cloudinary://your-cloudinary-key:your-cloudinary-secret@your-cloudinary-name

# =============================================================================
# M-PESA CONFIGURATION (Safaricom Daraja API)
# =============================================================================
# Get these from https://developer.safaricom.co.ke/
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your-mpesa-passkey
MPESA_ENV=production
MPESA_CALLBACK_URL=https://malaikanest.shop/api/payments/mpesa/callback/
MPESA_RESULT_URL=https://malaikanest.shop/api/payments/mpesa/callback/
MPESA_TIMEOUT_URL=https://malaikanest.shop/api/payments/mpesa/timeout/

# =============================================================================
# EMAIL CONFIGURATION (SMTP)
# =============================================================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password-here
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=Malaika Nest <noreply@malaikanest.shop>

# =============================================================================
# PAYSTACK CONFIGURATION (Alternative Payment)
# =============================================================================
PAYSTACK_PUBLIC_KEY=your-paystack-public-key
PAYSTACK_SECRET_KEY=your-paystack-secret-key
PAYSTACK_EMAIL=your-paystack-email

# =============================================================================
# CORS & SECURITY
# =============================================================================
CORS_ALLOWED_ORIGINS=https://malaikanest.shop,https://www.malaikanest.shop
CSRF_TRUSTED_ORIGINS=https://malaikanest.shop,https://www.malaikanest.shop

# =============================================================================
# CELERY CONFIGURATION
# =============================================================================
CELERY_TASK_ALWAYS_EAGER=False
CELERY_TASK_EAGER_PROPAGATES=False

# =============================================================================
# LOGGING
# =============================================================================
LOG_LEVEL=WARNING

# =============================================================================
# DJANGO SETTINGS MODULE
# =============================================================================
DJANGO_SETTINGS_MODULE=config.settings.prod

--- .agents\skills\protein-interaction-network-analysis\.env.template ---
# API Keys for ToolUniverse
# Copy this file to .env and fill in your actual API keys

BIOGRID_API_KEY=your_api_key_here

BOLTZ_MCP_SERVER_HOST=your_api_key_here

BRENDA_EMAIL=your_api_key_here

BRENDA_PASSWORD=your_api_key_here

DISGENET_API_KEY=your_api_key_here

EXPERT_FEEDBACK_MCP_SERVER_URL=your_api_key_here

NVIDIA_API_KEY=your_api_key_here

OMIM_API_KEY=your_api_key_here

TXAGENT_MCP_SERVER_HOST=your_api_key_here

USPTO_API_KEY=your_api_key_here

USPTO_MCP_SERVER_HOST=your_api_key_here


--- .agents\skills\tooluniverse\.env.template ---
# API Keys for ToolUniverse
# Copy this file to .env and fill in your actual API keys

BIOGRID_API_KEY=your_api_key_here

BOLTZ_MCP_SERVER_HOST=your_api_key_here

BRENDA_EMAIL=your_api_key_here

BRENDA_PASSWORD=your_api_key_here

DISGENET_API_KEY=your_api_key_here

EXPERT_FEEDBACK_MCP_SERVER_URL=your_api_key_here

NVIDIA_API_KEY=your_api_key_here

OMIM_API_KEY=your_api_key_here

TXAGENT_MCP_SERVER_HOST=your_api_key_here

USPTO_API_KEY=your_api_key_here

USPTO_MCP_SERVER_HOST=your_api_key_here


--- .agents\skills\tooluniverse-antibody-engineering\.env.template ---
# API Keys for ToolUniverse
# Copy this file to .env and fill in your actual API keys

BIOGRID_API_KEY=your_api_key_here

BOLTZ_MCP_SERVER_HOST=your_api_key_here

BRENDA_EMAIL=your_api_key_here

BRENDA_PASSWORD=your_api_key_here

DISGENET_API_KEY=your_api_key_here

EXPERT_FEEDBACK_MCP_SERVER_URL=your_api_key_here

NVIDIA_API_KEY=your_api_key_here

OMIM_API_KEY=your_api_key_here

TXAGENT_MCP_SERVER_HOST=your_api_key_here

USPTO_API_KEY=your_api_key_here

USPTO_MCP_SERVER_HOST=your_api_key_here


--- .agents\skills\tooluniverse-clinical-trial-design\.env.template ---
# API Keys for ToolUniverse
# Copy this file to .env and fill in your actual API keys

BIOGRID_API_KEY=your_api_key_here

BOLTZ_MCP_SERVER_HOST=your_api_key_here

BRENDA_EMAIL=your_api_key_here

BRENDA_PASSWORD=your_api_key_here

DISGENET_API_KEY=your_api_key_here

EXPERT_FEEDBACK_MCP_SERVER_URL=your_api_key_here

NVIDIA_API_KEY=your_api_key_here

OMIM_API_KEY=your_api_key_here

TXAGENT_MCP_SERVER_HOST=your_api_key_here

USPTO_API_KEY=your_api_key_here

USPTO_MCP_SERVER_HOST=your_api_key_here


--- .agents\skills\tooluniverse-drug-drug-interaction\.env.template ---
# API Keys for ToolUniverse
# Copy this file to .env and fill in your actual API keys

BIOGRID_API_KEY=your_api_key_here

BOLTZ_MCP_SERVER_HOST=your_api_key_here

BRENDA_EMAIL=your_api_key_here

BRENDA_PASSWORD=your_api_key_here

DISGENET_API_KEY=your_api_key_here

EXPERT_FEEDBACK_MCP_SERVER_URL=your_api_key_here

NVIDIA_API_KEY=your_api_key_here

OMIM_API_KEY=your_api_key_here

TXAGENT_MCP_SERVER_HOST=your_api_key_here

USPTO_API_KEY=your_api_key_here

USPTO_MCP_SERVER_HOST=your_api_key_here


--- .agents\skills\tooluniverse-epigenomics\.env.template ---
# API Keys for ToolUniverse
# Copy this file to .env and fill in your actual API keys

BIOGRID_API_KEY=your_api_key_here

BOLTZ_MCP_SERVER_HOST=your_api_key_here

BRENDA_EMAIL=your_api_key_here

BRENDA_PASSWORD=your_api_key_here

DISGENET_API_KEY=your_api_key_here

EXPERT_FEEDBACK_MCP_SERVER_URL=your_api_key_here

NVIDIA_API_KEY=your_api_key_here

OMIM_API_KEY=your_api_key_here

TXAGENT_MCP_SERVER_HOST=your_api_key_here

USPTO_API_KEY=your_api_key_here

USPTO_MCP_SERVER_HOST=your_api_key_here


--- .agents\skills\tooluniverse-gene-enrichment\.env.template ---
# API Keys for ToolUniverse
# Copy this file to .env and fill in your actual API keys

BIOGRID_API_KEY=your_api_key_here

BOLTZ_MCP_SERVER_HOST=your_api_key_here

BRENDA_EMAIL=your_api_key_here

BRENDA_PASSWORD=your_api_key_here

DISGENET_API_KEY=your_api_key_here

EXPERT_FEEDBACK_MCP_SERVER_URL=your_api_key_here

NVIDIA_API_KEY=your_api_key_here

OMIM_API_KEY=your_api_key_here

TXAGENT_MCP_SERVER_HOST=your_api_key_here

USPTO_API_KEY=your_api_key_here

USPTO_MCP_SERVER_HOST=your_api_key_here


--- .agents\skills\tooluniverse-gwas-finemapping\.env.template ---
# API Keys for ToolUniverse
# Copy this file to .env and fill in your actual API keys

BIOGRID_API_KEY=your_api_key_here

BOLTZ_MCP_SERVER_HOST=your_api_key_here

BRENDA_EMAIL=your_api_key_here

BRENDA_PASSWORD=your_api_key_here

DISGENET_API_KEY=your_api_key_here

EXPERT_FEEDBACK_MCP_SERVER_URL=your_api_key_here

NVIDIA_API_KEY=your_api_key_here

OMIM_API_KEY=your_api_key_here

TXAGENT_MCP_SERVER_HOST=your_api_key_here

USPTO_API_KEY=your_api_key_here

USPTO_MCP_SERVER_HOST=your_api_key_here


--- .agents\skills\tooluniverse-gwas-snp-interpretation\.env.template ---
# API Keys for ToolUniverse
# Copy this file to .env and fill in your actual API keys

BIOGRID_API_KEY=your_api_key_here

BOLTZ_MCP_SERVER_HOST=your_api_key_here

BRENDA_EMAIL=your_api_key_here

BRENDA_PASSWORD=your_api_key_here

DISGENET_API_KEY=your_api_key_here

EXPERT_FEEDBACK_MCP_SERVER_URL=your_api_key_here

NVIDIA_API_KEY=your_api_key_here

OMIM_API_KEY=your_api_key_here

TXAGENT_MCP_SERVER_HOST=your_api_key_here

USPTO_API_KEY=your_api_key_here

USPTO_MCP_SERVER_HOST=your_api_key_here


--- .agents\skills\tooluniverse-gwas-study-explorer\.env.template ---
# API Keys for ToolUniverse
# Copy this file to .env and fill in your actual API keys

BIOGRID_API_KEY=your_api_key_here

BOLTZ_MCP_SERVER_HOST=your_api_key_here

BRENDA_EMAIL=your_api_key_here

BRENDA_PASSWORD=your_api_key_here

DISGENET_API_KEY=your_api_key_here

EXPERT_FEEDBACK_MCP_SERVER_URL=your_api_key_here

NVIDIA_API_KEY=your_api_key_here

OMIM_API_KEY=your_api_key_here

TXAGENT_MCP_SERVER_HOST=your_api_key_here

USPTO_API_KEY=your_api_key_here

USPTO_MCP_SERVER_HOST=your_api_key_here


--- .agents\skills\tooluniverse-gwas-trait-to-gene\.env.template ---
# API Keys for ToolUniverse
# Copy this file to .env and fill in your actual API keys

BIOGRID_API_KEY=your_api_key_here

BOLTZ_MCP_SERVER_HOST=your_api_key_here

BRENDA_EMAIL=your_api_key_here

BRENDA_PASSWORD=your_api_key_here

DISGENET_API_KEY=your_api_key_here

EXPERT_FEEDBACK_MCP_SERVER_URL=your_api_key_here

NVIDIA_API_KEY=your_api_key_here

OMIM_API_KEY=your_api_key_here

TXAGENT_MCP_SERVER_HOST=your_api_key_here

USPTO_API_KEY=your_api_key_here

USPTO_MCP_SERVER_HOST=your_api_key_here


--- .agents\skills\tooluniverse-metabolomics\.env.template ---
# API Keys for ToolUniverse
# Copy this file to .env and fill in your actual API keys

BIOGRID_API_KEY=your_api_key_here

BOLTZ_MCP_SERVER_HOST=your_api_key_here

BRENDA_EMAIL=your_api_key_here

BRENDA_PASSWORD=your_api_key_here

DISGENET_API_KEY=your_api_key_here

EXPERT_FEEDBACK_MCP_SERVER_URL=your_api_key_here

NVIDIA_API_KEY=your_api_key_here

OMIM_API_KEY=your_api_key_here

TXAGENT_MCP_SERVER_HOST=your_api_key_here

USPTO_API_KEY=your_api_key_here

USPTO_MCP_SERVER_HOST=your_api_key_here


--- .agents\skills\tooluniverse-multiomic-disease-characterization\.env.template ---
# API Keys for ToolUniverse
# Copy this file to .env and fill in your actual API keys

BIOGRID_API_KEY=your_api_key_here

BOLTZ_MCP_SERVER_HOST=your_api_key_here

BRENDA_EMAIL=your_api_key_here

BRENDA_PASSWORD=your_api_key_here

DISGENET_API_KEY=your_api_key_here

EXPERT_FEEDBACK_MCP_SERVER_URL=your_api_key_here

NVIDIA_API_KEY=your_api_key_here

OMIM_API_KEY=your_api_key_here

TXAGENT_MCP_SERVER_HOST=your_api_key_here

USPTO_API_KEY=your_api_key_here

USPTO_MCP_SERVER_HOST=your_api_key_here


--- .agents\skills\tooluniverse-phylogenetics\.env.template ---
# No API keys required for this skill.
# All computation is done locally using PhyKIT, Biopython, and DendroPy.
# ToolUniverse integration (NCBI, UniProt, Ensembl) is optional and uses
# the same keys as any other ToolUniverse skill.

--- .agents\skills\tooluniverse-polygenic-risk-score\.env.template ---
# API Keys for ToolUniverse
# Copy this file to .env and fill in your actual API keys

BIOGRID_API_KEY=your_api_key_here

BOLTZ_MCP_SERVER_HOST=your_api_key_here

BRENDA_EMAIL=your_api_key_here

BRENDA_PASSWORD=your_api_key_here

DISGENET_API_KEY=your_api_key_here

EXPERT_FEEDBACK_MCP_SERVER_URL=your_api_key_here

NVIDIA_API_KEY=your_api_key_here

OMIM_API_KEY=your_api_key_here

TXAGENT_MCP_SERVER_HOST=your_api_key_here

USPTO_API_KEY=your_api_key_here

USPTO_MCP_SERVER_HOST=your_api_key_here


--- .agents\skills\tooluniverse-precision-medicine-stratification\.env.template ---
# API Keys for ToolUniverse
# Copy this file to .env and fill in your actual API keys

BIOGRID_API_KEY=your_api_key_here

BOLTZ_MCP_SERVER_HOST=your_api_key_here

BRENDA_EMAIL=your_api_key_here

BRENDA_PASSWORD=your_api_key_here

DISGENET_API_KEY=your_api_key_here

EXPERT_FEEDBACK_MCP_SERVER_URL=your_api_key_here

NVIDIA_API_KEY=your_api_key_here

OMIM_API_KEY=your_api_key_here

TXAGENT_MCP_SERVER_HOST=your_api_key_here

USPTO_API_KEY=your_api_key_here

USPTO_MCP_SERVER_HOST=your_api_key_here


--- .agents\skills\tooluniverse-rnaseq-deseq2\.env.template ---
# API Keys for ToolUniverse
# Copy this file to .env and fill in your actual API keys

BIOGRID_API_KEY=your_api_key_here

BOLTZ_MCP_SERVER_HOST=your_api_key_here

BRENDA_EMAIL=your_api_key_here

BRENDA_PASSWORD=your_api_key_here

DISGENET_API_KEY=your_api_key_here

EXPERT_FEEDBACK_MCP_SERVER_URL=your_api_key_here

NVIDIA_API_KEY=your_api_key_here

OMIM_API_KEY=your_api_key_here

TXAGENT_MCP_SERVER_HOST=your_api_key_here

USPTO_API_KEY=your_api_key_here

USPTO_MCP_SERVER_HOST=your_api_key_here


--- .agents\skills\tooluniverse-systems-biology\.env.template ---
# API Keys for ToolUniverse
# Copy this file to .env and fill in your actual API keys

BIOGRID_API_KEY=your_api_key_here

BOLTZ_MCP_SERVER_HOST=your_api_key_here

BRENDA_EMAIL=your_api_key_here

BRENDA_PASSWORD=your_api_key_here

DISGENET_API_KEY=your_api_key_here

EXPERT_FEEDBACK_MCP_SERVER_URL=your_api_key_here

NVIDIA_API_KEY=your_api_key_here

OMIM_API_KEY=your_api_key_here

TXAGENT_MCP_SERVER_HOST=your_api_key_here

USPTO_API_KEY=your_api_key_here

USPTO_MCP_SERVER_HOST=your_api_key_here


--- .agents\skills\tooluniverse-variant-analysis\.env.template ---
# API Keys for ToolUniverse
# Copy this file to .env and fill in your actual API keys

BIOGRID_API_KEY=your_api_key_here

BOLTZ_MCP_SERVER_HOST=your_api_key_here

BRENDA_EMAIL=your_api_key_here

BRENDA_PASSWORD=your_api_key_here

DISGENET_API_KEY=your_api_key_here

EXPERT_FEEDBACK_MCP_SERVER_URL=your_api_key_here

NVIDIA_API_KEY=your_api_key_here

OMIM_API_KEY=your_api_key_here

TXAGENT_MCP_SERVER_HOST=your_api_key_here

USPTO_API_KEY=your_api_key_here

USPTO_MCP_SERVER_HOST=your_api_key_here


--- backend\.env ---
DEBUG=True
SECRET_KEY=django-insecure-ksjdfhkjshdfkjshdfkjshdfkjshdfkjshdfkjshdfk
SIMPLE_JWT_SECRET=jwt-secret-key-here-change-in-production
DB_ENGINE=django.db.backends.postgresql
DB_NAME=malaika_nest
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1

# Email - SMTP (Gmail)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=malaikanest7@gmail.com
EMAIL_HOST_PASSWORD=mugdbqsmjindvaht
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=Malaika Nest <malaikanest7@gmail.com>

# Cloudinary
CLOUDINARY_NAME=dnnr5zo0w
CLOUDINARY_KEY=813993979849791
CLOUDINARY_SECRET=sFh_pqIPKiBvRgfH9VCF9nTli34

# M-Pesa
MPESA_CONSUMER_KEY=test
MPESA_CONSUMER_SECRET=test
MPESA_PASSKEY=test
MPESA_ENV=sandbox

--- backend\.env.example ---
# Production Environment Variables for Malaika Nest Backend
# Copy this file to .env and fill in the values

# Django Settings
SECRET_KEY=your-super-secret-key-here-change-this
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,your-vm-ip

# Database - PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/malaikanest

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
SIMPLE_JWT_SECRET=your-jwt-secret-key-here
ACCESS_TOKEN_LIFETIME=3600
REFRESH_TOKEN_LIFETIME=86400

# CORS - Important for frontend to connect
# Use your domain or IP address
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://your-vm-ip:3000

# Email Settings (for order confirmations)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=Malaika Nest <malaikanest7@gmail.com>

# Cloudinary (for image uploads)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Optional: Create superuser on first deploy
CREATE_SUPERUSER=false

# AI Settings (optional)
# OPENAI_API_KEY=your-openai-key

--- backend\.env.production ---
# Kenya Baby E-Commerce Production Environment
# ======================================================

# Django
# Replace the placeholders below with real secrets before deploying.
SECRET_KEY=replace-with-a-very-long-secret
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database (PostgreSQL)
# DB_PASSWORD should be set to a strong password or fetched from a secret manager
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kenya_ecom
DB_USER=kenya_user
DB_PASSWORD=replace-with-db-password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# Cloudinary
# Set CLOUDINARY_URL only if you use Cloudinary for media; leave blank otherwise
CLOUDINARY_URL=

# JWT
SIMPLE_JWT_SECRET=replace-with-jwt-secret
ACCESS_TOKEN_LIFETIME=300
REFRESH_TOKEN_LIFETIME=86400

# M-Pesa
# Replace with your M-Pesa credentials if used
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_ENV=sandbox
MPESA_CALLBACK_URL=

# Email
# Configure email provider credentials for transactional emails
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
EMAIL_USE_TLS=True

# Security
ADMIN_URL_SECRET=replace-with-admin-secret

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

--- backend\.env.production.example ---
# Example production environment for Kenya Baby E-Commerce
# Copy this to backend/.env.production and fill values before deploying

# Django
SECRET_KEY=replace-with-a-very-long-secret
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database (PostgreSQL)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kenya_ecom
DB_USER=kenya_user
DB_PASSWORD=replace-with-db-password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# Cloudinary
CLOUDINARY_URL=

# JWT
SIMPLE_JWT_SECRET=replace-with-jwt-secret
ACCESS_TOKEN_LIFETIME=300
REFRESH_TOKEN_LIFETIME=86400

# M-Pesa (optional)
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_ENV=sandbox
MPESA_CALLBACK_URL=

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
EMAIL_USE_TLS=True

# Security
ADMIN_URL_SECRET=replace-with-admin-secret

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

--- backend\.env.template ---
# =============================================================================
# MALAIKA NEST - ENVIRONMENT VARIABLES TEMPLATE
# =============================================================================
# Copy this file to .env and fill in your values
# cp .env.template .env

# =============================================================================
# CORE SETTINGS (REQUIRED)
# =============================================================================
SECRET_KEY=your-super-secret-key-here-change-in-production
DATABASE_URL=postgres://user:password@localhost:5432/malaika_db
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

# =============================================================================
# DEBUG & PRODUCTION
# =============================================================================
DEBUG=False

# =============================================================================
# FRONTEND URL (for password reset links, etc.)
# =============================================================================
FRONTEND_URL=http://localhost:3000
# For production, use your domain:
# FRONTEND_URL=https://malaikanest.com

# =============================================================================
# CORS SETTINGS
# =============================================================================
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://localhost:3000
# For production, add your domain:
# CORS_ALLOWED_ORIGINS=http://localhost:3000,https://malaikanest.com

# =============================================================================
# EMAIL / SMTP SETTINGS (REQUIRED FOR PASSWORD RESET)
# =============================================================================
# Using Gmail (requires App Password, not your regular password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-character-app-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=Malaika Nest <your-email@gmail.com>

# Alternative: Using SendGrid
# EMAIL_HOST=smtp.sendgrid.net
# EMAIL_PORT=587
# EMAIL_HOST_USER=apikey
# EMAIL_HOST_PASSWORD=your-sendgrid-api-key

# Alternative: Using Mailgun
# EMAIL_HOST=smtp.mailgun.org
# EMAIL_PORT=587
# EMAIL_HOST_USER=postmaster@yourdomain.com
# EMAIL_HOST_PASSWORD=your-mailgun-smtp-password

# =============================================================================
# JWT SETTINGS
# =============================================================================
JWT_SIGNING_KEY=your-super-secret-key-here-change-in-production

# =============================================================================
# CACHE & REDIS
# =============================================================================
REDIS_URL=redis://localhost:6379/0

# =============================================================================
# CLOUDINARY (for image uploads)
# =============================================================================
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# =============================================================================
# ADMIN SUPERUSER (optional - auto-create on first deploy)
# =============================================================================
CREATE_SUPERUSER=false
SUPERUSER_EMAIL=admin@malaikanest.com
SUPERUSER_PASSWORD=your-secure-password

# =============================================================================
# AI SETTINGS (optional)
# =============================================================================
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o

# =============================================================================
# AUTH COOKIE DOMAIN (optional)
# =============================================================================
# AUTH_COOKIE_DOMAIN=.malaikanest.com

--- frontend\.env.example ---
# Production API URL - set in Vercel dashboard
NEXT_PUBLIC_API_URL=https://your.server.domain

--- frontend\.env.local ---
# API Configuration - Point to your backend server
NEXT_PUBLIC_API_URL=http://104.154.161.10

--- frontend\.env.production ---
# Production Environment Variables
NEXT_PUBLIC_API_URL=http://104.154.161.10

--- frontend\.env.production.example ---
# Production Environment Variables for Malaika Nest Frontend
# Copy this file to .env.production and fill in the values

# API URL - Point to your backend (use the IP or domain)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Environment
NEXT_PUBLIC_ENV=production

# Optional: Analytics
# NEXT_PUBLIC_GA_TRACKING_ID=

# Optional: Other configurations
# NEXT_PUBLIC_SITE_URL=https://malaikanest.com

```
