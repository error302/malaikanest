import os
import re

def update_base():
    path = os.path.join('backend', 'templates', 'storefront', 'base.html')
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    dock_replacement = '''  <!-- Floating Mobile Navigation Dock (Horizontally Scrollable Left-to-Right) -->
  <nav class="floating-bottom-dock" aria-label="Mobile navigation">
    <div class="dock-track">
      <!-- Home -->
      <a href="{% url 'storefront:home' %}" class="dock-item {% if request.resolver_match.url_name == 'home' %}active{% endif %}" {% if request.resolver_match.url_name == 'home' %}aria-current="page"{% endif %}>
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h3a1 1 0 001-1v-4h4v4a1 1 0 001 1h3a1 1 0 001-1v-9"/></svg>
        <span>Home</span>
      </a>

      <!-- Shop All -->
      <a href="{% url 'storefront:product_list' %}" class="dock-item {% if request.resolver_match.url_name == 'product_list' and not request.GET.age and not request.GET.category %}active{% endif %}" {% if request.resolver_match.url_name == 'product_list' and not request.GET.age and not request.GET.category %}aria-current="page"{% endif %}>
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
        <span>Shop All</span>
      </a>

      <!-- Newborn & Baby -->
      <a href="{% url 'storefront:product_list' %}?age=newborn" class="dock-item {% if request.GET.age == 'newborn' %}active{% endif %}">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        <span>Newborn</span>
      </a>

      <!-- Toddler -->
      <a href="{% url 'storefront:product_list' %}?age=toddler" class="dock-item {% if request.GET.age == 'toddler' %}active{% endif %}">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span>Toddler</span>
      </a>

      <!-- Hampers & Gifts -->
      <a href="{% url 'storefront:product_list' %}?category=hampers-gifts" class="dock-item {% if request.GET.category == 'hampers-gifts' %}active{% endif %}">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V4.5a2.5 2.5 0 115 0V8h-5zm0 0H7a2 2 0 01-2-2V4.5a2.5 2.5 0 015 0V8zm-7 0h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9a2 2 0 012-2z"/></svg>
        <span>Hampers &amp; Gifts</span>
      </a>

      <!-- Cart -->
      <a href="{% url 'storefront:cart' %}" class="dock-item relative {% if request.resolver_match.url_name == 'cart' or request.resolver_match.url_name == 'checkout' %}active{% endif %}" aria-label="Cart, {{ cart_count|default:'0' }} items">
        <span class="relative flex items-center">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          {% if cart_count %}
          <span class="absolute -top-2 -right-2.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-extrabold bg-[#C96E4B] text-white shadow-sm leading-none">{{ cart_count }}</span>
          {% endif %}
        </span>
        <span>Cart</span>
      </a>

      <!-- Account -->
      <a href="{% url 'storefront:order_lookup' %}" class="dock-item {% if request.resolver_match.url_name == 'order_lookup' or request.resolver_match.url_name == 'order_status' %}active{% endif %}">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        <span>Account</span>
      </a>

      <!-- Track Order -->
      <a href="{% url 'storefront:order_lookup' %}" class="dock-item">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
        <span>Track</span>
      </a>
    </div>
  </nav>'''

    html = re.sub(r'<!-- Floating Mobile Navigation Dock.*?-->\s*<nav.*?</nav>', dock_replacement, html, flags=re.DOTALL)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("base.html dock updated with explicit dock-item classes!")

if __name__ == '__main__':
    update_base()
