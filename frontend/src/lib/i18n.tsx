'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type Language = 'en' | 'sw';

type Dict = Record<string, string>;

const en: Dict = {
  // Nav
  'nav.home': 'Home',
  'nav.shop': 'Shop',
  'nav.about': 'About',
  'nav.contact': 'Contact',
  'nav.blog': 'Blog',
  'nav.thrifted': 'Thrifted',
  'nav.account': 'Account',
  'nav.wishlist': 'Wishlist',
  'nav.cart': 'Cart',
  'nav.categories': 'Categories',
  'nav.search': 'Search',
  'nav.searchOverlayLabel': 'Search products',
  'nav.searchPlaceholder': 'e.g. baby onesie, feeding bottle…',
  'nav.searchAction': 'Search',
  'nav.menu': 'Menu',
  'nav.close': 'Close',
  'nav.signin': 'Sign In',
  'nav.signout': 'Sign Out',
  'nav.orders': 'My Orders',
  'nav.profile': 'My Profile',
  'nav.admin': 'Admin',
  'nav.new': 'New',
  'nav.bestsellers': 'Best Sellers',
  'nav.sale': 'Sale',
  'nav.shopByAge': 'Shop by Age',
  'nav.featured': 'Featured',
  'nav.allProducts': 'All Products',

  // Mega menu groups
  'mega.shopByCategory': 'Shop by Category',
  'mega.shopByAge': 'Shop by Age',
  'mega.popular': 'Popular Right Now',

  // Age groups
  'age.newborn': 'Newborn (0-3m)',
  'age.infant': 'Infant (3-12m)',
  'age.toddler': 'Toddler (1-3y)',
  'age.preschool': 'Preschool (3-5y)',
  'age.school': 'School Age (5y+)',
  'age.all': 'All Ages',
  'age.newbornRange': '0–1 mo',
  'age.0_3': '0–3 Months', 'age.0_3Range': 'Tiny',
  'age.3_6': '3–6 Months', 'age.3_6Range': 'Growing',
  'age.6_9': '6–9 Months', 'age.6_9Range': 'Active',
  'age.9_12': '9–12 Months', 'age.9_12Range': 'Cruising',
  'age.1_2': '1–2 Years', 'age.1_2Range': 'Walking',
  'age.2_4': '2–4 Years', 'age.2_4Range': 'Talking',
  'age.4_6': '4–6 Years', 'age.4_6Range': 'Playful',
  'age.6_9y': '6–9 Years', 'age.6_9yRange': 'School',
  'age.9_12y': '9–12 Years', 'age.9_12yRange': 'Big kid',

  // Categories (display)
  'cat.clothing': 'Clothing',
  'cat.footwear': 'Footwear',
  'cat.toys': 'Toys',
  'cat.nursery': 'Nursery',
  'cat.feeding': 'Feeding',
  'cat.bath': 'Bath & Skincare',
  'cat.travel': 'Travel & Car Seats',
  'cat.books': 'Books & Learning',
  'cat.thrifted': 'Thrifted',
  'cat.gifts': 'Gifts',
  'cat.clothingDesc': 'Onesies, rompers & more',
  'cat.feedingDesc': 'Feeding, bathing & care',
  'cat.nurseryDesc': 'Furniture, bedding & decor',
  'cat.toysDesc': 'Play, explore & grow',
  'cat.travelDesc': 'Strollers, carriers & safety',
  'cat.booksDesc': 'Curated bundles',
  'cat.giftsDesc': 'Gift sets & bundles',
  'cat.clothingCount': '120+ items',
  'cat.feedingCount': '85+ items',
  'cat.nurseryCount': '64+ items',
  'cat.toysCount': '92+ items',
  'cat.travelCount': '48+ items',
  'cat.booksCount': '36+ items',
  'cat.giftsCount': '40+ items',
  'cat.categoriesLabel': 'Browse collections',
  'cat.categoriesTitle': 'Curated Categories',
  'cat.categoriesSub': 'Thoughtfully selected for every moment of your baby\'s journey.',

  // Hero
  'hero.slide1.title': 'Tiny Styles, Big Smiles',
  'hero.slide1.subtitle': 'Curated baby & kids fashion delivered to your door.',
  'hero.slide1.cta': 'Shop New Arrivals',
  'hero.slide2.title': 'Gentle on Skin, Kind to Planet',
  'hero.slide2.subtitle': 'Organic, breathable fabrics for everyday comfort.',
  'hero.slide2.cta': 'Explore Essentials',
  'hero.slide3.title': 'Grow With Us',
  'hero.slide3.subtitle': 'Sizes from newborn to age 5, all in one place.',
  'hero.slide3.cta': 'Shop by Age',
  'hero.trust1': 'Free delivery over KSh 2,000',
  'hero.trust2': 'Safe & secure checkout',
  'hero.trust3': 'Easy 7-day returns',
  'hero.shopNow': 'Shop Now',

  // Product card
  'product.addToCart': 'Add to Cart',
  'product.quickAdd': 'Quick Add',
  'product.added': 'Added!',
  'product.outOfStock': 'Out of Stock',
  'product.lowStock': 'Low Stock',
  'product.inStock': 'In Stock',
  'product.viewDetails': 'View Details',
  'product.wishlist': 'Add to Wishlist',
  'product.removeWishlist': 'Remove from Wishlist',
  'product.quickView': 'Quick View',
  'product.from': 'From',
  'product.sale': 'Sale',
  'product.new': 'New',

  // Product section
  'section.viewAll': 'View All',
  'section.featured': 'Featured Products',
  'section.bestsellers': 'Best Sellers',
  'section.newArrivals': 'New Arrivals',
  'section.onSale': 'On Sale',

  // Homepage sections
  'home.shopByAge': 'Shop by Age',
  'home.shopByAgeSub': 'Find the perfect picks for every stage of growth.',
  'home.whyChoose': 'Why Parents Choose Us',
  'home.why1.title': 'Safe & Tested',
  'home.why1.desc': 'Every product meets international safety standards.',
  'home.why2.title': 'Fast Delivery',
  'home.why2.desc': 'Same-day dispatch for orders placed before 2pm.',
  'home.why3.title': 'Easy Returns',
  'home.why3.desc': '7-day hassle-free returns on all orders.',
  'home.why4.title': 'Parent Loved',
  'home.why4.desc': 'Thousands of happy families shop with us.',
  'home.testimonials': 'What Parents Say',
  'home.testimonialsLabel': 'Loved by parents',
  'home.aggregateRating': '4.9 / 5 · 1,200+ reviews',
  'home.newsletter': 'Join Our Newsletter',
  'home.newsletterSub': 'Get 10% off your first order plus parenting tips.',
  'home.newsletterEmail': 'Your email address',
  'home.subscribe': 'Subscribe',
  'home.subscribed': 'Thank you for subscribing!',
  'home.subscribing': 'Subscribing…',
  'home.newsletterBadge': 'Join the Nest',
  'home.newsletterDisclaimer': 'No spam, only love. Unsubscribe anytime.',
  'home.brands': 'Trusted Brands',
  'home.instagram': 'Follow Us on Instagram',
  'value.safe': 'Safe Materials',
  'value.safeSub': 'OEKO-TEX certified, tested for your baby',
  'value.delivery': 'Fast Delivery',
  'value.deliverySub': 'Same-day in Mombasa, 1–3 days countrywide',
  'value.parent': 'Parent Approved',
  'value.parentSub': 'Trusted by 5,000+ Kenyan families',
  'value.mpesa': 'Secure M-Pesa',
  'value.mpesaSub': 'Till 3370347 · Pay safely, every time',

  // Footer
  'footer.tagline': 'Tiny styles and gentle essentials for your little ones.',
  'footer.shop': 'Shop',
  'footer.shopAll': 'All Products',
  'footer.help': 'Help',
  'footer.company': 'Company',
  'footer.legal': 'Legal',
  'footer.about': 'About Us',
  'footer.contact': 'Contact Us',
  'footer.faq': 'FAQ',
  'footer.shipping': 'Shipping & Returns',
  'footer.trackOrder': 'Track Order',
  'footer.blog': 'Blog',
  'footer.privacy': 'Privacy Policy',
  'footer.terms': 'Terms of Service',
  'footer.refund': 'Refund Policy',
  'footer.copyright': '© {year} Malaika Nest. All rights reserved.',
  'footer.payments': 'Secure Payments',
  'footer.follow': 'Follow Us',
  'footer.address': 'Nairobi, Kenya',
  'footer.email': 'hello@malaikanest.com',
  'footer.phone': '+254 700 000 000',

  // Cart
  'cart.title': 'Your Cart',
  'cart.empty': 'Your cart is empty',
  'cart.emptySub': 'Looks like you haven’t added anything yet.',
  'cart.continue': 'Continue Shopping',
  'cart.subtotal': 'Subtotal',
  'cart.shipping': 'Shipping',
  'cart.shippingFree': 'Free',
  'cart.tax': 'Tax',
  'cart.total': 'Total',
  'cart.checkout': 'Proceed to Checkout',
  'cart.remove': 'Remove',
  'cart.qty': 'Qty',
  'cart.item': 'Item',
  'cart.items': 'Items',
  'cart.clear': 'Clear Cart',
  'cart.saveLater': 'Save for later',
  'cart.coupon': 'Coupon Code',
  'cart.apply': 'Apply',
  'cart.applied': 'Coupon applied!',
  'cart.invalidCoupon': 'Invalid coupon code',
  'cart.addMore': 'Add KES {amount} more for free delivery',

  // Checkout
  'checkout.title': 'Checkout',
  'checkout.contact': 'Contact Information',
  'checkout.email': 'Email Address',
  'checkout.phone': 'Phone Number',
  'checkout.shippingAddress': 'Shipping Address',
  'checkout.firstName': 'First Name',
  'checkout.lastName': 'Last Name',
  'checkout.address': 'Street Address',
  'checkout.city': 'City',
  'checkout.state': 'County / State',
  'checkout.postal': 'Postal Code',
  'checkout.country': 'Country',
  'checkout.payment': 'Payment Method',
  'checkout.mpesa': 'M-PESA',
  'checkout.mpesaDesc': 'Pay via STK push to your phone',
  'checkout.card': 'Card',
  'checkout.cardDesc': 'Visa, Mastercard accepted',
  'checkout.pesapal': 'Pesapal',
  'checkout.pesapalDesc': 'M-Pesa, cards & mobile money',
  'checkout.placeOrder': 'Place Order',
  'checkout.orderSummary': 'Order Summary',
  'checkout.empty': 'Your cart is empty',
  'checkout.back': 'Back to Cart',
  'checkout.processing': 'Processing…',
  'checkout.success': 'Order Placed Successfully!',
  'checkout.successSub': 'We’ve sent a confirmation to your email.',
  'checkout.orderNumber': 'Order Number',
  'checkout.continueShopping': 'Continue Shopping',
  'checkout.error': 'Something went wrong. Please try again.',
  'checkout.required': 'This field is required',
  'checkout.notes': 'Order Notes (optional)',
  'checkout.over': 'free over',
  'checkout.secured': 'Secured by 256-bit SSL encryption',

  // Auth
  'auth.signin': 'Sign In',
  'auth.signup': 'Sign Up',
  'auth.register': 'Create Account',
  'auth.loginTitle': 'Welcome Back',
  'auth.loginSub': 'Sign in to your Malaika Nest account.',
  'auth.registerTitle': 'Create Your Account',
  'auth.registerSub': 'Join thousands of happy parents.',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Confirm Password',
  'auth.firstName': 'First Name',
  'auth.lastName': 'Last Name',
  'auth.phone': 'Phone Number',
  'auth.forgot': 'Forgot password?',
  'auth.noAccount': 'Don’t have an account?',
  'auth.haveAccount': 'Already have an account?',
  'auth.signinLink': 'Sign In',
  'auth.signupLink': 'Sign Up',
  'auth.remember': 'Remember me',
  'auth.signingIn': 'Signing in…',
  'auth.creating': 'Creating…',
  'auth.orContinue': 'or continue with',
  'auth.google': 'Google',
  'auth.terms': 'By signing up you agree to our Terms & Privacy Policy.',
  'auth.error': 'Invalid email or password.',
  'auth.success': 'Success!',
  'auth.logout': 'Log Out',

  // Common
  'common.loading': 'Loading…',
  'common.back': 'Back',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.confirm': 'Confirm',
  'common.error': 'Error',
  'common.retry': 'Retry',
  'common.close': 'Close',
};

const sw: Dict = {
  // Nav
  'nav.home': 'Nyumbani',
  'nav.shop': 'Duka',
  'nav.about': 'Kuhusu',
  'nav.contact': 'Wasiliana',
  'nav.blog': 'Blogu',
  'nav.thrifted': 'Zilizotumika',
  'nav.account': 'Akaunti',
  'nav.wishlist': 'Orodha ya Matamanio',
  'nav.cart': 'Rakibu',
  'nav.categories': 'Jamii',
  'nav.search': 'Tafuta',
  'nav.searchOverlayLabel': 'Tafuta bidhaa',
  'nav.searchPlaceholder': 'mfano: vazi la mtoto, chupa ya kulisha…',
  'nav.searchAction': 'Tafuta',
  'nav.menu': 'Menyu',
  'nav.close': 'Funga',
  'nav.signin': 'Ingia',
  'nav.signout': 'Toka',
  'nav.orders': 'Maagizo Yangu',
  'nav.profile': 'Wasifu Wangu',
  'nav.admin': 'Msimamizi',
  'nav.new': 'Mpya',
  'nav.bestsellers': 'Wanaozipwa Zaidi',
  'nav.sale': 'Suku',
  'nav.shopByAge': 'Duka kwa Umri',
  'nav.featured': 'Inayopendelewa',
  'nav.allProducts': 'Bidhaa Zote',

  // Mega menu groups
  'mega.shopByCategory': 'Duka kwa Jamii',
  'mega.shopByAge': 'Duka kwa Umri',
  'mega.popular': 'Inayopendwa Sasa',

  // Age groups
  'age.newborn': 'Mtoto Mchanga (0-3m)',
  'age.infant': 'Mtoto Mdogo (3-12m)',
  'age.toddler': 'Mtoto Mdogo (1-3y)',
  'age.preschool': 'Kurea (3-5y)',
  'age.school': 'Umri wa Shule (5y+)',
  'age.all': 'Umri Wote',
  'age.newbornRange': '0–1 m',
  'age.0_3': '0–3 Miezi', 'age.0_3Range': 'Vidogo',
  'age.3_6': '3–6 Miezi', 'age.3_6Range': 'Inakua',
  'age.6_9': '6–9 Miezi', 'age.6_9Range': 'Hai',
  'age.9_12': '9–12 Miezi', 'age.9_12Range': 'Inatembea',
  'age.1_2': '1–2 Miaka', 'age.1_2Range': 'Inatembea',
  'age.2_4': '2–4 Miaka', 'age.2_4Range': 'Inazungumza',
  'age.4_6': '4–6 Miaka', 'age.4_6Range': 'Mcheshi',
  'age.6_9y': '6–9 Miaka', 'age.6_9yRange': 'Shule',
  'age.9_12y': '9–12 Miaka', 'age.9_12yRange': 'Mtoto mkubwa',

  // Categories (display)
  'cat.clothing': 'Nguo',
  'cat.footwear': 'Viatu',
  'cat.toys': 'Vyombo vya Kuchezea',
  'cat.nursery': 'Chumba cha Mtoto',
  'cat.feeding': 'Ulishaji',
  'cat.bath': 'Bafu na Utunzaji wa Ngozi',
  'cat.travel': 'Usafiri na Viti vya Gari',
  'cat.books': 'Vitabu na Kujifunza',
  'cat.thrifted': 'Zilizotumika',
  'cat.gifts': 'Zawadi',
  'cat.clothingDesc': 'Onesies, rompers na zaidi',
  'cat.feedingDesc': 'Ulishaji, kuoga na utunzaji',
  'cat.nurseryDesc': 'Fanicha, matandza na mapambo',
  'cat.toysDesc': 'Cheza, gundua na kua',
  'cat.travelDesc': 'Strollers, wabebaji na usalama',
  'cat.booksDesc': 'Vifurushi vilivyochaguliwa',
  'cat.giftsDesc': 'Vifurushi vya zawadi',
  'cat.clothingCount': 'Bidhaa 120+',
  'cat.feedingCount': 'Bidhaa 85+',
  'cat.nurseryCount': 'Bidhaa 64+',
  'cat.toysCount': 'Bidhaa 92+',
  'cat.travelCount': 'Bidhaa 48+',
  'cat.booksCount': 'Bidhaa 36+',
  'cat.giftsCount': 'Bidhaa 40+',
  'cat.categoriesLabel': 'Vinjari makusanyo',
  'cat.categoriesTitle': 'Jamii Zilizochaguliwa',
  'cat.categoriesSub': 'Zimechaguliwa kwa uangalifu kwa kila hatua ya safari ya mtoto wako.',

  // Hero
  'hero.slide1.title': 'Mitindo Midogo, Tabasamu Kubwa',
  'hero.slide1.subtitle': 'Nguo za watoto na watoto wachanga zilizochaguliwa, zikaletewe mlangoni mwako.',
  'hero.slide1.cta': 'Nunua Mambo Mapya',
  'hero.slide2.title': 'Nyororo kwa Ngozi, Mkarimu kwa Mazingira',
  'hero.slide2.subtitle': 'Nguo za asili, zinazopumua kwa faraja ya kila siku.',
  'hero.slide2.cta': 'Chunguza Muhimu',
  'hero.slide3.title': 'Kua na Sisi',
  'hero.slide3.subtitle': 'Vipimo kuanzia mtoto mchanga hadi umri wa miaka 5, mahali pamoja.',
  'hero.slide3.cta': 'Duka kwa Umri',
  'hero.trust1': 'Utoaji bure zaidi ya KSh 2,000',
  'hero.trust2': 'Malipo salama na ya kuaminika',
  'hero.trust3': 'Marudio rahisi ya siku 7',
  'hero.shopNow': 'Nunua Sasa',

  // Product card
  'product.addToCart': 'Weka kwenye Rakibu',
  'product.quickAdd': 'Ongeza Haraka',
  'product.added': 'Imeongezwa!',
  'product.outOfStock': 'Haina Stock',
  'product.lowStock': 'Stock Kidogo',
  'product.inStock': 'Ina Stock',
  'product.viewDetails': 'Tazama Maelezo',
  'product.wishlist': 'Weka kwenye Orodha ya Matamanio',
  'product.removeWishlist': 'Ondoa kwenye Orodha ya Matamanio',
  'product.quickView': 'Tazama Haraka',
  'product.from': 'Kuanzia',
  'product.sale': 'Suku',
  'product.new': 'Mpya',

  // Product section
  'section.viewAll': 'Tazama Zote',
  'section.featured': 'Bidhaa Zinazopendelewa',
  'section.bestsellers': 'Zinazouzwa Zaidi',
  'section.newArrivals': 'Mambo Mapya',
  'section.onSale': 'Zinazopunguzwa',

  // Homepage sections
  'home.shopByAge': 'Duka kwa Umri',
  'home.shopByAgeSub': 'Pata kilichofaa kwa kila hatua ya ukuaji.',
  'home.whyChoose': 'Kwa Nini Wazazi Hutuchagua',
  'home.why1.title': 'Salama na Imetestwa',
  'home.why1.desc': 'Kila bidhaa inakidhi viwango vya kimataifa vya usalama.',
  'home.why2.title': 'Utoaji wa Haraka',
  'home.why2.desc': 'Tunatuma siku iyo hiyo kwa maagizo kabla ya saa 2 alasiri.',
  'home.why3.title': 'Marudio Rahisi',
  'home.why3.desc': 'Marudio ya siku 7 bila shida kwa maagizo yote.',
  'home.why4.title': 'Wazazi Wanapenda',
  'home.why4.desc': 'Mamia ya familia za furaha zinanunua na sisi.',
  'home.testimonials': 'Wazazi Wasemavyo',
  'home.testimonialsLabel': 'Wanaozipendwa na wazazi',
  'home.aggregateRating': '4.9 / 5 · maoni 1,200+',
  'home.newsletter': 'Jiunge na Barua Yetu',
  'home.newsletterSub': 'Pata punguzo la 10% kwa agizo lako la kwanza na vidokezo vya ukuzaji watoto.',
  'home.newsletterEmail': 'Anwani yako ya barua pepe',
  'home.subscribe': 'Jiandikishe',
  'home.subscribed': 'Asante kwa kujiandikisha!',
  'home.subscribing': 'Inajiandikisha…',
  'home.newsletterBadge': 'Jiunge na Nest',
  'home.newsletterDisclaimer': 'Hakuna barua taka, mapenzi tu. Jiondoe wakati wowote.',
  'home.brands': 'Bidhaa za Kuaminika',
  'home.instagram': 'Tufuate kwenye Instagram',
  'value.safe': 'Vifaa Salama',
  'value.safeSub': 'Imethibitishwa OEKO-TEX, imejaribiwa kwa mtoto wako',
  'value.delivery': 'Utoaji wa Haraka',
  'value.deliverySub': 'Siku iyo hiyo Mombasa, siku 1–3 nchini kote',
  'value.parent': 'Wazazi Wameidhinisha',
  'value.parentSub': 'Inaaminiwa na familia 5,000+ za Kenya',
  'value.mpesa': 'M-Pesa Salama',
  'value.mpesaSub': 'Till 3370347 · Lipa salama kila wakati',

  // Footer
  'footer.tagline': 'Mitindo midogo na vitu vyororo kwa watoto wako wadogo.',
  'footer.shop': 'Duka',
  'footer.shopAll': 'Bidhaa Zote',
  'footer.help': 'Msaada',
  'footer.company': 'Kampuni',
  'footer.legal': 'Sheria',
  'footer.about': 'Kuhusu Sisi',
  'footer.contact': 'Wasiliana Nasi',
  'footer.faq': 'Maswali Yanayoulizwa',
  'footer.shipping': 'Usafirishaji na Marudio',
  'footer.trackOrder': 'Fuatilia Agizo',
  'footer.blog': 'Blogu',
  'footer.privacy': 'Sera ya Faragha',
  'footer.terms': 'Masharti ya Huduma',
  'footer.refund': 'Sera ya Marudio ya Fedha',
  'footer.copyright': '© {year} Malaika Nest. Haki zote zimehifadhiwa.',
  'footer.payments': 'Malipo Salama',
  'footer.follow': 'Tufuate',
  'footer.address': 'Nairobi, Kenya',
  'footer.email': 'hello@malaikanest.com',
  'footer.phone': '+254 700 000 000',

  // Cart
  'cart.title': 'Rakibu Yako',
  'cart.empty': 'Rakibu yako ni tupu',
  'cart.emptySub': 'Inaonekana hujaongeza chochote bado.',
  'cart.continue': 'Endelea kununua',
  'cart.subtotal': 'Jumla Ndogo',
  'cart.shipping': 'Usafirishaji',
  'cart.shippingFree': 'Bure',
  'cart.tax': 'Kodi',
  'cart.total': 'Jumla',
  'cart.checkout': 'Nenda kulipa',
  'cart.remove': 'Ondoa',
  'cart.qty': 'Idadi',
  'cart.item': 'Bidhaa',
  'cart.items': 'Bidhaa',
  'cart.clear': 'Futa Rakibu',
  'cart.saveLater': 'Hifadhi baadaye',
  'cart.coupon': 'Msimbo wa Punguzo',
  'cart.apply': 'Tuma',
  'cart.applied': 'Punguzo limewekwa!',
  'cart.invalidCoupon': 'Msimbo wa punguzo si sahihi',
  'cart.addMore': 'Ongeza KES {amount} zaidi kwa usafirishaji bure',

  // Checkout
  'checkout.title': 'Malipo',
  'checkout.contact': 'Taarifa za Mwasiliani',
  'checkout.email': 'Anwani ya Barua Pepe',
  'checkout.phone': 'Nambari ya Simu',
  'checkout.shippingAddress': 'Anwani ya Usafirishaji',
  'checkout.firstName': 'Jina la Kwanza',
  'checkout.lastName': 'Jina la Ukoo',
  'checkout.address': 'Anwani ya Mtaa',
  'checkout.city': 'Jiji',
  'checkout.state': 'Kaunti / Jimbo',
  'checkout.postal': 'Msimbo wa Posta',
  'checkout.country': 'Nchi',
  'checkout.payment': 'Njia ya Malipo',
  'checkout.mpesa': 'M-PESA',
  'checkout.mpesaDesc': 'Lipa kupitia STK push kwenye simu yako',
  'checkout.card': 'Card',
  'checkout.cardDesc': 'Visa, Mastercard zinakubalika',
  'checkout.pesapal': 'Pesapal',
  'checkout.pesapalDesc': 'M-Pesa, kadi na pesa za simu',
  'checkout.placeOrder': 'Weka Agizo',
  'checkout.orderSummary': 'Muhtasari wa Agizo',
  'checkout.empty': 'Rakibu yako ni tupu',
  'checkout.back': 'Rudi kwenye Rakibu',
  'checkout.processing': 'Inashughulikiwa…',
  'checkout.success': 'Agizo Limewekwa!',
  'checkout.successSub': 'Tumetuma uthibitisho kwenye barua pepe yako.',
  'checkout.orderNumber': 'Nambari ya Agizo',
  'checkout.continueShopping': 'Endelea kununua',
  'checkout.error': 'Kuna hitilafu. Tafadhali jaribu tena.',
  'checkout.required': 'Sehemu hii inahitajika',
  'checkout.notes': 'Maelezo ya Agizo (hiari)',
  'checkout.over': 'bure zaidi ya',
  'checkout.secured': 'Imelindwa na usimbaji fiche wa SSL wa 256-bit',

  // Auth
  'auth.signin': 'Ingia',
  'auth.signup': 'Jisajili',
  'auth.register': 'Fungua Akaunti',
  'auth.loginTitle': 'Karibu Tena',
  'auth.loginSub': 'Ingia kwenye akaunti yako ya Malaika Nest.',
  'auth.registerTitle': 'Fungua Akaunti Yako',
  'auth.registerSub': 'Jiunge na mamilioni ya wazazi wa furaha.',
  'auth.email': 'Barua Pepe',
  'auth.password': 'Nenosiri',
  'auth.confirmPassword': 'Thibitisha Nenosiri',
  'auth.firstName': 'Jina la Kwanza',
  'auth.lastName': 'Jina la Ukoo',
  'auth.phone': 'Nambari ya Simu',
  'auth.forgot': 'Umesahau nenosiri?',
  'auth.noAccount': 'Huna akaunti?',
  'auth.haveAccount': 'Tayari una akaunti?',
  'auth.signinLink': 'Ingia',
  'auth.signupLink': 'Jisajili',
  'auth.remember': 'Nikumbuke',
  'auth.signingIn': 'Inaingia…',
  'auth.creating': 'Inaunda…',
  'auth.orContinue': 'au endelea na',
  'auth.google': 'Google',
  'auth.terms': 'Kwa kujisajili unakubali Masharti yetu na Sera ya Faragha.',
  'auth.error': 'Barua pepe au nenosiri si sahihi.',
  'auth.success': 'Imefanikiwa!',
  'auth.logout': 'Toka',

  // Common
  'common.loading': 'Inapakia…',
  'common.back': 'Rudi',
  'common.cancel': 'Ghairi',
  'common.save': 'Hifadhi',
  'common.delete': 'Futa',
  'common.confirm': 'Thibitisha',
  'common.error': 'Hitilafu',
  'common.retry': 'Jaribu tena',
  'common.close': 'Funga',
};

const translations: Record<Language, Dict> = { en, sw };

interface I18nContextValue {
  lang: Language;
  toggle: () => void;
  setLang: (l: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'mn_lang';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const stored = (typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY)) as Language | null;
    if (stored === 'en' || stored === 'sw') {
      setLangState(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang === 'sw' ? 'sw' : 'en';
    }
  }, [lang]);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, l);
    }
  }, []);

  const toggle = useCallback(() => {
    setLangState((prev) => {
      const next = prev === 'en' ? 'sw' : 'en';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let str = translations[lang][key] ?? translations.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return str;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, toggle, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
