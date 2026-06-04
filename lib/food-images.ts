interface FoodImageConfig {
  src: string;
  srcSet: string;
  sizes: string;
}

const foodImages: Record<string, { w400: string; w600: string; w800: string }> = {
  'Doro Wat': {
    w400: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop&q=75&auto=format',
    w600: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&h=450&fit=crop&q=75&auto=format',
    w800: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&h=600&fit=crop&q=75&auto=format',
  },
  'Kitfo': {
    w400: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop&q=75&auto=format',
    w600: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=450&fit=crop&q=75&auto=format',
    w800: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&q=75&auto=format',
  },
  'Tibs': {
    w400: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=75&auto=format',
    w600: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=450&fit=crop&q=75&auto=format',
    w800: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop&q=75&auto=format',
  },
  'Shiro': {
    w400: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop&q=75&auto=format',
    w600: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=450&fit=crop&q=75&auto=format',
    w800: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=600&fit=crop&q=75&auto=format',
  },
  'Misir Wot': {
    w400: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&q=75&auto=format',
    w600: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=450&fit=crop&q=75&auto=format',
    w800: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop&q=75&auto=format',
  },
  'Gomen': {
    w400: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop&q=75&auto=format',
    w600: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=450&fit=crop&q=75&auto=format',
    w800: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=600&fit=crop&q=75&auto=format',
  },
  'Injera': {
    w400: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop&q=75&auto=format',
    w600: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&h=450&fit=crop&q=75&auto=format',
    w800: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&h=600&fit=crop&q=75&auto=format',
  },
  'Ayib': {
    w400: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=300&fit=crop&q=75&auto=format',
    w600: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&h=450&fit=crop&q=75&auto=format',
    w800: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&h=600&fit=crop&q=75&auto=format',
  },
  'Ethiopian Coffee': {
    w400: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&h=300&fit=crop&q=75&auto=format',
    w600: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&h=450&fit=crop&q=75&auto=format',
    w800: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&h=600&fit=crop&q=75&auto=format',
  },
  'Spiced Tea': {
    w400: 'https://images.unsplash.com/photo-1571934811356-5cc061b6201f?w=400&h=300&fit=crop&q=75&auto=format',
    w600: 'https://images.unsplash.com/photo-1571934811356-5cc061b6201f?w=600&h=450&fit=crop&q=75&auto=format',
    w800: 'https://images.unsplash.com/photo-1571934811356-5cc061b6201f?w=800&h=600&fit=crop&q=75&auto=format',
  },
  'Fruit Juice': {
    w400: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=300&fit=crop&q=75&auto=format',
    w600: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600&h=450&fit=crop&q=75&auto=format',
    w800: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=800&h=600&fit=crop&q=75&auto=format',
  },
  'Yebeg Alicha': {
    w400: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop&q=75&auto=format',
    w600: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=450&fit=crop&q=75&auto=format',
    w800: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&h=600&fit=crop&q=75&auto=format',
  },
  'Firfir': {
    w400: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop&q=75&auto=format',
    w600: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=450&fit=crop&q=75&auto=format',
    w800: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop&q=75&auto=format',
  },
  'Ful Medames': {
    w400: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=300&fit=crop&q=75&auto=format',
    w600: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&h=450&fit=crop&q=75&auto=format',
    w800: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&h=600&fit=crop&q=75&auto=format',
  },
  'Spris': {
    w400: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop&q=75&auto=format',
    w600: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=450&fit=crop&q=75&auto=format',
    w800: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop&q=75&auto=format',
  },
};

const fallbackImage = {
  w400: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&q=75&auto=format',
  w600: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=450&fit=crop&q=75&auto=format',
  w800: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=75&auto=format',
};

export function getFoodImages(name: string) {
  return foodImages[name] || fallbackImage;
}

export function getFoodImageSrcSet(name: string): string {
  const images = foodImages[name] || fallbackImage;
  return `${images.w400} 400w, ${images.w600} 600w, ${images.w800} 800w`;
}

export function getFoodImageSrc(name: string, size: 'w400' | 'w600' | 'w800' = 'w400'): string {
  const images = foodImages[name] || fallbackImage;
  return images[size];
}

export function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    'All': '🍽️', 'Main Course': '🥘', 'Vegan': '🌱', 'Sides': '🫓', 'Beverages': '☕', 'Breakfast': '🌅',
  };
  return map[category] || '🍽️';
}

export function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    'Main Course': 'from-amber-500 to-orange-600', 'Vegan': 'from-green-500 to-emerald-600',
    'Sides': 'from-yellow-500 to-amber-600', 'Beverages': 'from-amber-600 to-orange-700',
    'Breakfast': 'from-orange-400 to-red-500',
  };
  return map[category] || 'from-amber-500 to-orange-600';
}
