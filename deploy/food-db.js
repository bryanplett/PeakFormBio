/* ────────────────────────────────────────────────────────────────────────────
   PeakForm Bio — Food database
   Common foods with per-serving macros. Values are factual nutrition data
   (USDA FoodData Central-style), compiled in-house — not scraped from any
   proprietary app. Each item: base serving (qty + unit) and macros for that
   serving. The meal planner scales by a servings multiplier.
   Fields: id, name, cat, qty (number), unit, kcal, p (protein g), c (carbs g), f (fat g)
   ──────────────────────────────────────────────────────────────────────────── */
(function () {
  window.FOOD_CATEGORIES = ['Protein', 'Carbs & Grains', 'Vegetables', 'Fruit', 'Dairy & Eggs', 'Fats & Nuts', 'Legumes', 'Snacks & Other'];

  const F = [
    /* ─── Protein ─────────────────────────────────────────────────────── */
    { name: 'Chicken breast, grilled', cat: 'Protein', qty: 100, unit: 'g', kcal: 165, p: 31, c: 0, f: 3.6 },
    { name: 'Chicken thigh, roasted', cat: 'Protein', qty: 100, unit: 'g', kcal: 209, p: 26, c: 0, f: 11 },
    { name: 'Turkey breast, roasted', cat: 'Protein', qty: 100, unit: 'g', kcal: 135, p: 30, c: 0, f: 1 },
    { name: 'Lean ground beef (93/7), cooked', cat: 'Protein', qty: 100, unit: 'g', kcal: 182, p: 25, c: 0, f: 9 },
    { name: 'Ground beef (80/20), cooked', cat: 'Protein', qty: 100, unit: 'g', kcal: 254, p: 26, c: 0, f: 16 },
    { name: 'Sirloin steak, grilled', cat: 'Protein', qty: 100, unit: 'g', kcal: 206, p: 29, c: 0, f: 9 },
    { name: 'Pork tenderloin, roasted', cat: 'Protein', qty: 100, unit: 'g', kcal: 143, p: 26, c: 0, f: 4 },
    { name: 'Salmon, baked', cat: 'Protein', qty: 100, unit: 'g', kcal: 206, p: 22, c: 0, f: 13 },
    { name: 'Tuna, canned in water', cat: 'Protein', qty: 100, unit: 'g', kcal: 116, p: 26, c: 0, f: 1 },
    { name: 'Tilapia, baked', cat: 'Protein', qty: 100, unit: 'g', kcal: 128, p: 26, c: 0, f: 3 },
    { name: 'Cod, baked', cat: 'Protein', qty: 100, unit: 'g', kcal: 105, p: 23, c: 0, f: 1 },
    { name: 'Shrimp, cooked', cat: 'Protein', qty: 100, unit: 'g', kcal: 99, p: 24, c: 0, f: 0.3 },
    { name: 'Whey protein powder', cat: 'Protein', qty: 1, unit: 'scoop (30g)', kcal: 120, p: 24, c: 3, f: 1.5 },
    { name: 'Egg whites', cat: 'Protein', qty: 1, unit: 'cup (243g)', kcal: 117, p: 26, c: 2, f: 0.4 },
    { name: 'Bison, ground, cooked', cat: 'Protein', qty: 100, unit: 'g', kcal: 179, p: 26, c: 0, f: 8 },
    { name: 'Deli turkey slices', cat: 'Protein', qty: 100, unit: 'g', kcal: 104, p: 17, c: 4, f: 2 },

    /* ─── Carbs & Grains ──────────────────────────────────────────────── */
    { name: 'White rice, cooked', cat: 'Carbs & Grains', qty: 1, unit: 'cup (158g)', kcal: 205, p: 4, c: 45, f: 0.4 },
    { name: 'Brown rice, cooked', cat: 'Carbs & Grains', qty: 1, unit: 'cup (195g)', kcal: 218, p: 5, c: 46, f: 1.6 },
    { name: 'Jasmine rice, cooked', cat: 'Carbs & Grains', qty: 1, unit: 'cup (158g)', kcal: 205, p: 4, c: 45, f: 0.4 },
    { name: 'Quinoa, cooked', cat: 'Carbs & Grains', qty: 1, unit: 'cup (185g)', kcal: 222, p: 8, c: 39, f: 3.6 },
    { name: 'Sweet potato, baked', cat: 'Carbs & Grains', qty: 1, unit: 'medium (150g)', kcal: 130, p: 3, c: 30, f: 0.1 },
    { name: 'White potato, baked', cat: 'Carbs & Grains', qty: 1, unit: 'medium (173g)', kcal: 161, p: 4, c: 37, f: 0.2 },
    { name: 'Oats, dry', cat: 'Carbs & Grains', qty: 0.5, unit: 'cup (40g)', kcal: 150, p: 5, c: 27, f: 3 },
    { name: 'Whole wheat bread', cat: 'Carbs & Grains', qty: 1, unit: 'slice (43g)', kcal: 110, p: 5, c: 20, f: 1.5 },
    { name: 'White bread', cat: 'Carbs & Grains', qty: 1, unit: 'slice (29g)', kcal: 77, p: 2, c: 15, f: 1 },
    { name: 'Bagel, plain', cat: 'Carbs & Grains', qty: 1, unit: 'medium (105g)', kcal: 277, p: 11, c: 55, f: 1.7 },
    { name: 'Pasta, cooked', cat: 'Carbs & Grains', qty: 1, unit: 'cup (140g)', kcal: 220, p: 8, c: 43, f: 1.3 },
    { name: 'Whole wheat tortilla', cat: 'Carbs & Grains', qty: 1, unit: 'large (49g)', kcal: 140, p: 4, c: 24, f: 4 },
    { name: 'Rice cakes', cat: 'Carbs & Grains', qty: 1, unit: 'cake (9g)', kcal: 35, p: 1, c: 7, f: 0.3 },
    { name: 'Cream of rice, cooked', cat: 'Carbs & Grains', qty: 1, unit: 'cup (245g)', kcal: 127, p: 2, c: 28, f: 0.2 },
    { name: 'Cereal (bran flakes)', cat: 'Carbs & Grains', qty: 1, unit: 'cup (30g)', kcal: 100, p: 3, c: 24, f: 0.7 },
    { name: 'Couscous, cooked', cat: 'Carbs & Grains', qty: 1, unit: 'cup (157g)', kcal: 176, p: 6, c: 36, f: 0.3 },

    /* ─── Vegetables ──────────────────────────────────────────────────── */
    { name: 'Broccoli, steamed', cat: 'Vegetables', qty: 1, unit: 'cup (156g)', kcal: 55, p: 4, c: 11, f: 0.6 },
    { name: 'Spinach, raw', cat: 'Vegetables', qty: 1, unit: 'cup (30g)', kcal: 7, p: 1, c: 1, f: 0.1 },
    { name: 'Asparagus, cooked', cat: 'Vegetables', qty: 1, unit: 'cup (180g)', kcal: 40, p: 4, c: 7, f: 0.4 },
    { name: 'Green beans, cooked', cat: 'Vegetables', qty: 1, unit: 'cup (125g)', kcal: 44, p: 2, c: 10, f: 0.4 },
    { name: 'Bell pepper', cat: 'Vegetables', qty: 1, unit: 'medium (119g)', kcal: 31, p: 1, c: 7, f: 0.3 },
    { name: 'Mixed salad greens', cat: 'Vegetables', qty: 2, unit: 'cups (60g)', kcal: 15, p: 1, c: 3, f: 0.2 },
    { name: 'Carrots, raw', cat: 'Vegetables', qty: 1, unit: 'cup (128g)', kcal: 52, p: 1, c: 12, f: 0.3 },
    { name: 'Zucchini, cooked', cat: 'Vegetables', qty: 1, unit: 'cup (180g)', kcal: 29, p: 2, c: 7, f: 0.5 },
    { name: 'Cauliflower, steamed', cat: 'Vegetables', qty: 1, unit: 'cup (124g)', kcal: 29, p: 2, c: 5, f: 0.3 },
    { name: 'Tomato', cat: 'Vegetables', qty: 1, unit: 'medium (123g)', kcal: 22, p: 1, c: 5, f: 0.2 },
    { name: 'Mushrooms, cooked', cat: 'Vegetables', qty: 1, unit: 'cup (156g)', kcal: 44, p: 3, c: 8, f: 0.7 },
    { name: 'Brussels sprouts, roasted', cat: 'Vegetables', qty: 1, unit: 'cup (155g)', kcal: 56, p: 4, c: 11, f: 0.8 },

    /* ─── Fruit ───────────────────────────────────────────────────────── */
    { name: 'Banana', cat: 'Fruit', qty: 1, unit: 'medium (118g)', kcal: 105, p: 1, c: 27, f: 0.4 },
    { name: 'Apple', cat: 'Fruit', qty: 1, unit: 'medium (182g)', kcal: 95, p: 0.5, c: 25, f: 0.3 },
    { name: 'Blueberries', cat: 'Fruit', qty: 1, unit: 'cup (148g)', kcal: 84, p: 1, c: 21, f: 0.5 },
    { name: 'Strawberries', cat: 'Fruit', qty: 1, unit: 'cup (152g)', kcal: 49, p: 1, c: 12, f: 0.5 },
    { name: 'Orange', cat: 'Fruit', qty: 1, unit: 'medium (131g)', kcal: 62, p: 1, c: 15, f: 0.2 },
    { name: 'Grapes', cat: 'Fruit', qty: 1, unit: 'cup (151g)', kcal: 104, p: 1, c: 27, f: 0.2 },
    { name: 'Pineapple, chunks', cat: 'Fruit', qty: 1, unit: 'cup (165g)', kcal: 82, p: 1, c: 22, f: 0.2 },
    { name: 'Mango, sliced', cat: 'Fruit', qty: 1, unit: 'cup (165g)', kcal: 99, p: 1, c: 25, f: 0.6 },
    { name: 'Avocado', cat: 'Fruit', qty: 0.5, unit: 'medium (100g)', kcal: 160, p: 2, c: 9, f: 15 },
    { name: 'Dates, pitted', cat: 'Fruit', qty: 2, unit: 'dates (48g)', kcal: 133, p: 1, c: 36, f: 0.1 },

    /* ─── Dairy & Eggs ────────────────────────────────────────────────── */
    { name: 'Whole eggs', cat: 'Dairy & Eggs', qty: 1, unit: 'large (50g)', kcal: 72, p: 6, c: 0.4, f: 5 },
    { name: 'Greek yogurt, nonfat', cat: 'Dairy & Eggs', qty: 1, unit: 'cup (245g)', kcal: 130, p: 23, c: 9, f: 0.5 },
    { name: 'Greek yogurt, 2%', cat: 'Dairy & Eggs', qty: 1, unit: 'cup (245g)', kcal: 173, p: 24, c: 10, f: 4.5 },
    { name: 'Cottage cheese, low-fat', cat: 'Dairy & Eggs', qty: 0.5, unit: 'cup (113g)', kcal: 90, p: 12, c: 5, f: 2.5 },
    { name: 'Skim milk', cat: 'Dairy & Eggs', qty: 1, unit: 'cup (245g)', kcal: 83, p: 8, c: 12, f: 0.2 },
    { name: 'Whole milk', cat: 'Dairy & Eggs', qty: 1, unit: 'cup (244g)', kcal: 149, p: 8, c: 12, f: 8 },
    { name: 'Cheddar cheese', cat: 'Dairy & Eggs', qty: 1, unit: 'oz (28g)', kcal: 113, p: 7, c: 0.4, f: 9 },
    { name: 'Mozzarella, part-skim', cat: 'Dairy & Eggs', qty: 1, unit: 'oz (28g)', kcal: 72, p: 7, c: 1, f: 4.5 },
    { name: 'String cheese', cat: 'Dairy & Eggs', qty: 1, unit: 'stick (28g)', kcal: 80, p: 7, c: 1, f: 6 },
    { name: 'Almond milk, unsweetened', cat: 'Dairy & Eggs', qty: 1, unit: 'cup (240g)', kcal: 30, p: 1, c: 1, f: 2.5 },

    /* ─── Fats & Nuts ─────────────────────────────────────────────────── */
    { name: 'Olive oil', cat: 'Fats & Nuts', qty: 1, unit: 'tbsp (14g)', kcal: 119, p: 0, c: 0, f: 14 },
    { name: 'Almonds', cat: 'Fats & Nuts', qty: 1, unit: 'oz (28g)', kcal: 164, p: 6, c: 6, f: 14 },
    { name: 'Peanut butter', cat: 'Fats & Nuts', qty: 2, unit: 'tbsp (32g)', kcal: 188, p: 8, c: 6, f: 16 },
    { name: 'Almond butter', cat: 'Fats & Nuts', qty: 2, unit: 'tbsp (32g)', kcal: 196, p: 7, c: 6, f: 18 },
    { name: 'Walnuts', cat: 'Fats & Nuts', qty: 1, unit: 'oz (28g)', kcal: 185, p: 4, c: 4, f: 18 },
    { name: 'Cashews', cat: 'Fats & Nuts', qty: 1, unit: 'oz (28g)', kcal: 157, p: 5, c: 9, f: 12 },
    { name: 'Chia seeds', cat: 'Fats & Nuts', qty: 1, unit: 'tbsp (12g)', kcal: 58, p: 2, c: 5, f: 4 },
    { name: 'Ground flaxseed', cat: 'Fats & Nuts', qty: 1, unit: 'tbsp (7g)', kcal: 37, p: 1, c: 2, f: 3 },
    { name: 'Butter', cat: 'Fats & Nuts', qty: 1, unit: 'tbsp (14g)', kcal: 102, p: 0.1, c: 0, f: 12 },
    { name: 'Coconut oil', cat: 'Fats & Nuts', qty: 1, unit: 'tbsp (14g)', kcal: 121, p: 0, c: 0, f: 14 },

    /* ─── Legumes ─────────────────────────────────────────────────────── */
    { name: 'Black beans, cooked', cat: 'Legumes', qty: 1, unit: 'cup (172g)', kcal: 227, p: 15, c: 41, f: 0.9 },
    { name: 'Chickpeas, cooked', cat: 'Legumes', qty: 1, unit: 'cup (164g)', kcal: 269, p: 15, c: 45, f: 4 },
    { name: 'Lentils, cooked', cat: 'Legumes', qty: 1, unit: 'cup (198g)', kcal: 230, p: 18, c: 40, f: 0.8 },
    { name: 'Edamame, shelled', cat: 'Legumes', qty: 1, unit: 'cup (155g)', kcal: 188, p: 18, c: 14, f: 8 },
    { name: 'Tofu, firm', cat: 'Legumes', qty: 100, unit: 'g', kcal: 144, p: 17, c: 3, f: 9 },
    { name: 'Tempeh', cat: 'Legumes', qty: 100, unit: 'g', kcal: 192, p: 20, c: 8, f: 11 },
    { name: 'Hummus', cat: 'Legumes', qty: 2, unit: 'tbsp (30g)', kcal: 70, p: 2, c: 6, f: 5 },

    /* ─── Snacks & Other ──────────────────────────────────────────────── */
    { name: 'Protein bar', cat: 'Snacks & Other', qty: 1, unit: 'bar (60g)', kcal: 220, p: 20, c: 23, f: 7 },
    { name: 'Beef jerky', cat: 'Snacks & Other', qty: 1, unit: 'oz (28g)', kcal: 80, p: 13, c: 5, f: 1 },
    { name: 'Dark chocolate (70%)', cat: 'Snacks & Other', qty: 1, unit: 'oz (28g)', kcal: 170, p: 2, c: 13, f: 12 },
    { name: 'Popcorn, air-popped', cat: 'Snacks & Other', qty: 3, unit: 'cups (24g)', kcal: 93, p: 3, c: 19, f: 1 },
    { name: 'Pretzels', cat: 'Snacks & Other', qty: 1, unit: 'oz (28g)', kcal: 108, p: 3, c: 23, f: 0.8 },
    { name: 'Honey', cat: 'Snacks & Other', qty: 1, unit: 'tbsp (21g)', kcal: 64, p: 0, c: 17, f: 0 },
    { name: 'Maple syrup', cat: 'Snacks & Other', qty: 1, unit: 'tbsp (20g)', kcal: 52, p: 0, c: 13, f: 0 },
    { name: 'Marinara sauce', cat: 'Snacks & Other', qty: 0.5, unit: 'cup (125g)', kcal: 70, p: 2, c: 13, f: 1.5 },
    { name: 'Salsa', cat: 'Snacks & Other', qty: 2, unit: 'tbsp (32g)', kcal: 10, p: 0, c: 2, f: 0 },
    { name: 'Granola', cat: 'Snacks & Other', qty: 0.5, unit: 'cup (61g)', kcal: 280, p: 7, c: 38, f: 12 },
  ];

  // Stable ids + rounded macro helper
  F.forEach((x, i) => { x.id = 'f' + (i + 1); });
  window.FOOD_DB = F;
})();
