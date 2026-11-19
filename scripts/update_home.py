import os

home_html = '''{% extends "storefront/base.html" %}
{% load static %}

{% block title %}Baby & Children's Clothing Store in Mombasa, Kenya | Malaika Nest{% endblock %}
{% block meta_description %}Malaika Nest is Mombasa's premier baby & kids clothing boutique. Shop newborn gift hampers, baby rompers, toddler dresses, and cute essentials with fast Kenya delivery or free shop pickup at Tawakal Toto Shop, Mombasa.{% endblock %}

{% block content %}
  <!-- Dynamic Free Delivery Threshold Bar (Option 1 Baby Mori Benchmark) -->
  <aside class="bg-[#E8ECE9] border-b border-[#D8DFDA] py-2 px-3 sm:px-4 text-center" aria-label="Free delivery promotion">
    <div class="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs font-semibold text-[#2D312E]">
      <svg class="w-4 h-4 text-[#047857] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      <span>Free delivery across Kenya on orders over KES 10,000 · Mombasa Same-Day Delivery</span>
    </div>
  </aside>

  <!-- Baby Mori Organic Hero -->
  <section class="nest-hero">
    <div class="nest-hero-copy">
      <span class="nest-eyebrow">Malaika Nest · Mombasa, Kenya</span>
      <h1>{% if active_banner and active_banner.title %}{{ active_banner.title }}{% else %}For their little days.<br><em>And big moments.</em>{% endif %}</h1>
      <p>{% if active_banner and active_banner.subtitle %}{{ active_banner.subtitle }}{% else %}Discover organic baby and children's clothing from our Mombasa boutique. Everyday soft rompers, celebration dresses, and personal fitting guidance.{% endif %}</p>
      <div class="nest-hero-actions">
        <a class="nest-button" href="{% if active_banner and active_banner.button_link %}{{ active_banner.button_link }}{% else %}{% url 'storefront:product_list' %}{% endif %}">
          <span>{% if active_banner and active_banner.button_text %}{{ active_banner.button_text }}{% else %}Explore Collection{% endif %}</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </a>
        <a class="nest-text-link" href="#categories">Find their next favourite</a>
      </div>
      <div class="nest-hero-note">
        <svg class="w-4 h-4 text-[#8B6914] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span>A local shop. A personal touch.</span>
      </div>
    </div>
    <div class="nest-hero-photo">
      <img src="{% if active_banner and active_banner.get_image_url %}{{ active_banner.get_image_url }}{% else %}{% static 'img/hero.jpg' %}{% endif %}" alt="{% if active_banner and active_banner.title %}{{ active_banner.title }}{% else %}Baby playing on a soft quilt{% endif %}" width="960" height="1000" fetchpriority="high">
      <span class="nest-photo-caption">Little wardrobes, lovingly chosen.</span>
    </div>
  </section>

  <!-- Trust Badges Bar (SVG Icons Only - Zero Emojis) -->
  <section class="bg-white border-y border-[#ECE7E1] py-4 sm:py-5">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
        <div class="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE7E1]">
          <svg class="w-5 h-5 mx-auto mb-1.5 text-[#2D2926]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <p class="text-xs sm:text-sm font-bold text-[#2D2926]">Fast Kenya Delivery</p>
          <p class="text-[11px] text-[#6E6862] leading-snug">Mombasa Same-Day · Nairobi Next-Day</p>
        </div>
        <div class="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE7E1]">
          <svg class="w-5 h-5 mx-auto mb-1.5 text-[#047857]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke-width="1.8"/>
            <line x1="2" y1="10" x2="22" y2="10" stroke-width="1.8"/>
          </svg>
          <p class="text-xs sm:text-sm font-bold text-[#047857]">Lipa na M-Pesa</p>
          <p class="text-[11px] text-[#6E6862] leading-snug">Instant STK Prompt or Till 3370347</p>
        </div>
        <div class="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE7E1]">
          <svg class="w-5 h-5 mx-auto mb-1.5 text-[#2D2926]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <p class="text-xs sm:text-sm font-bold text-[#2D2926]">Hypoallergenic Fabrics</p>
          <p class="text-[11px] text-[#6E6862] leading-snug">100% breathable pure cotton</p>
        </div>
        <div class="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE7E1]">
          <svg class="w-5 h-5 mx-auto mb-1.5 text-[#8B6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <p class="text-xs sm:text-sm font-bold text-[#2D2926]">Tawakal Toto Shop</p>
          <p class="text-[11px] text-[#6E6862] leading-snug">Free pickup at Likoni, Mombasa</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Shop by Category Section -->
  <section id="categories" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
    <div class="flex items-end justify-between gap-3 mb-6 sm:mb-8">
      <div class="min-w-0">
        <span class="text-xs uppercase tracking-[0.2em] font-semibold text-[#8B6914]">Curated Selections</span>
        <h2 class="font-serif text-2xl sm:text-3xl font-bold text-[#2D2926] mt-1">Shop by Category</h2>
      </div>
      <a href="{% url 'storefront:product_list' %}" class="text-xs sm:text-sm font-semibold text-[#8B6914] hover:underline whitespace-nowrap min-h-[44px] inline-flex items-center gap-1">
        <span>View All</span>
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
      </a>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {% for cat in categories %}
        <a href="{% url 'storefront:category_detail' category_slug=cat.slug %}" class="group bg-white rounded-2xl p-3 sm:p-4 border border-[#ECE7E1] hover:border-[#8B6914] hover:shadow-md transition-all text-center flex flex-col items-center min-h-[44px] active:scale-[0.97]">
          <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FAF8F5] border border-[#ECE7E1] flex items-center justify-center font-serif text-xl font-bold text-[#8B6914] group-hover:bg-[#8B6914] group-hover:text-white transition-colors mb-3 overflow-hidden">
            {% if cat.get_image_url %}
              <img src="{{ cat.get_image_url }}" alt="{{ cat.name }}" width="64" height="64" loading="lazy" class="w-full h-full rounded-full object-cover">
            {% elif cat.image %}
              <img src="{{ cat.image.url }}" alt="{{ cat.name }}" width="64" height="64" loading="lazy" class="w-full h-full rounded-full object-cover">
            {% else %}
              <span class="font-serif font-bold text-sm text-[#8B6914]">{{ cat.name|slice:":2"|upper }}</span>
            {% endif %}
          </div>
          <span class="text-xs sm:text-sm font-semibold text-[#2D2926] group-hover:text-[#8B6914] transition-colors leading-tight line-clamp-2">
            {{ cat.name }}
          </span>
        </a>
      {% empty %}
        <div class="col-span-full text-center py-6 text-sm text-gray-500">Categories loading...</div>
      {% endfor %}
    </div>
  </section>

  <!-- Shop by Age Section (Milestone Rails - Baby Mori Benchmark) -->
  <section class="bg-white border-y border-[#ECE7E1] py-8 sm:py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-lg mx-auto mb-6">
        <span class="text-xs uppercase tracking-[0.2em] font-semibold text-[#8B6914]">Every Stage of Growth</span>
        <h2 class="font-serif text-2xl sm:text-3xl font-bold text-[#2D2926] mt-1">Shop by Age</h2>
      </div>

      <div class="nest-scroll-x justify-start sm:justify-center sm:flex-wrap sm:overflow-visible pb-1">
        <a href="{% url 'storefront:product_list' %}" class="px-4 py-2 min-h-[44px] inline-flex items-center rounded-full bg-[#2D2926] text-white border border-[#2D2926] text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 active:scale-[0.97] shadow-sm">
          All Ages
        </a>
        {% for age in age_groups %}
          <a href="{% url 'storefront:product_list' %}?age={{ age.slug }}" class="px-4 py-2 min-h-[44px] inline-flex items-center rounded-full bg-[#FAF8F5] hover:bg-[#2D2926] text-[#2D2926] hover:text-white border border-[#ECE7E1] text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 active:scale-[0.97]">
            {{ age.label }}
          </a>
        {% endfor %}
      </div>
    </div>
  </section>

  <!-- Featured Products Section (2-Column Mobile Feed with Tactile Buttons) -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
    <div class="flex items-end justify-between gap-3 mb-6 sm:mb-8">
      <div class="min-w-0">
        <span class="text-xs uppercase tracking-[0.2em] font-semibold text-[#8B6914]">Boutique Quality</span>
        <h2 class="font-serif text-2xl sm:text-3xl font-bold text-[#2D2926] mt-1">Featured Essentials</h2>
      </div>
      <a href="{% url 'storefront:product_list' %}" class="text-xs sm:text-sm font-semibold text-[#8B6914] hover:underline whitespace-nowrap min-h-[44px] inline-flex items-center gap-1">
        <span>All Products</span>
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
      </a>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
      {% for product in featured_products %}
        <div class="bg-white rounded-2xl overflow-hidden border border-[#ECE7E1] hover:shadow-lg transition-all flex flex-col group">
          <a href="{% url 'storefront:product_detail' slug=product.slug %}" class="block relative aspect-square bg-[#FAF8F5] overflow-hidden">
            {% if product.get_image_url %}
              <img src="{{ product.get_image_url }}" alt="{{ product.name }}" width="600" height="600" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
            {% elif product.image %}
              <img src="{{ product.image.url }}" alt="{{ product.name }}" width="600" height="600" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
            {% elif product.images.first %}
              <img src="{{ product.images.first.image.url }}" alt="{{ product.name }}" width="600" height="600" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
            {% else %}
              <div class="w-full h-full flex items-center justify-center font-serif text-3xl font-bold text-[#ECE7E1]">MN</div>
            {% endif %}

            {% if product.stock <= 0 %}
              <span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2D2926] text-white">Out of stock</span>
            {% elif product.stock <= 3 %}
              <span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C96E4B] text-white">Low stock</span>
            {% endif %}
          </a>

          <div class="p-3 sm:p-4 flex-1 flex flex-col justify-between">
            <div>
              <p class="text-[10px] uppercase tracking-wider text-[#6E6862] font-semibold mb-1 truncate">{{ product.category.name }}</p>
              <h3 class="font-medium text-xs sm:text-sm text-[#2D2926] line-clamp-2 mb-2 group-hover:text-[#8B6914] transition-colors">
                <a href="{% url 'storefront:product_detail' slug=product.slug %}">{{ product.name }}</a>
              </h3>
            </div>
            <div>
              <div class="flex items-center justify-between gap-2 pt-2 border-t border-[#FAF8F5]">
                <div class="min-w-0">
                  <span class="text-xs sm:text-sm font-bold text-[#2D2926]">KES {{ product.price|floatformat:"0" }}</span>
                  {% if product.compare_price %}
                    <span class="text-[10px] text-gray-400 line-through ml-1">KES {{ product.compare_price|floatformat:"0" }}</span>
                  {% endif %}
                </div>
                <a href="{% url 'storefront:product_detail' slug=product.slug %}" class="text-[11px] font-bold text-[#8B6914] hover:text-[#2D2926] flex items-center gap-1 min-h-[44px] px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#ECE7E1] active:scale-[0.97] transition-all">
                  <span>View</span>
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                </a>
              </div>
              <p class="text-[10px] text-[#6E6862] mt-1.5 leading-snug">Mombasa same-day · Free over KES 10,000</p>
            </div>
          </div>
        </div>
      {% empty %}
        <div class="col-span-full bg-white rounded-2xl p-8 sm:p-12 text-center border border-[#ECE7E1]">
          <p class="font-serif text-xl font-bold text-[#2D2926] mb-2">New arrivals are being added</p>
          <p class="text-xs sm:text-sm text-[#6E6862] mb-6 max-w-md mx-auto leading-relaxed">We're stocking the shelves right now. Chat with us on WhatsApp for today's available stock — we'll happily send photos, sizes, and prices.</p>
          <a href="{{ whatsapp_url }}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center px-6 py-3 min-h-[48px] rounded-full bg-[#2D2926] hover:bg-[#3D3935] text-white text-xs font-bold transition-all active:scale-[0.97]">Chat on WhatsApp</a>
        </div>
      {% endfor %}
    </div>
  </section>
{% endblock %}
'''

with open(os.path.join('backend', 'templates', 'storefront', 'home.html'), 'w', encoding='utf-8') as f:
    f.write(home_html)
print("home.html successfully updated!")
