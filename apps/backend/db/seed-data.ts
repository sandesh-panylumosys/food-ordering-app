import type { CustomizationGroup } from '@food/shared-types';

/**
 * Development seed data. Images are public Unsplash URLs — run
 * `pnpm db:seed --cloudinary` to copy them into your Cloudinary account, or
 * replace them from the admin panel.
 */
export const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

export interface SeedCategory {
  slug: string;
  name: string;
  description: string;
  image: string;
  sortOrder: number;
}

export interface SeedProduct {
  slug: string;
  category: string;
  name: string;
  shortDescription: string;
  description: string;
  ingredients: string[];
  price: number;
  compareAtPrice?: number;
  image: string;
  gallery?: string[];
  isVeg: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  rating: number;
  ratingCount: number;
  prepTimeMinutes: number;
  calories?: number;
  customizations?: CustomizationGroup[];
}

const IMG = {
  pizzaMushroom: unsplash('1513104890138-7c749659a591'),
  pizzaChicken: unsplash('1565299624946-b28f40a0ae38'),
  pizzaMargherita: unsplash('1574071318508-1cdbab80d002'),
  pizzaGarden: unsplash('1594007654729-407eedc4be65'),
  pizzaPepperoni: unsplash('1628840042765-356cda07504e'),
  burgerClassic: unsplash('1568901346375-23c9450c58cd'),
  burgerSignature: unsplash('1571091718767-18b5b1457add'),
  burgerSliders: unsplash('1550547660-d9450f859349'),
  burgerBacon: unsplash('1553979459-d2229ba7433b'),
  burgerTruffle: unsplash('1586190848861-99aa4a171e90'),
  pastaPenne: unsplash('1621996346565-e3dbc646d9a9'),
  pastaFarfalle: unsplash('1473093295043-cdd812d0e601'),
  pastaTruffle: unsplash('1551183053-bf91a1d81141'),
  pastaPrawn: unsplash('1563379926898-05f4575a45d8'),
  pastaCacio: unsplash('1612874742237-6526221588e3'),
  dessertDonut: unsplash('1551024601-bec78aea704b'),
  dessertCupcake: unsplash('1563729784474-d77dbb933a9e'),
  dessertTiramisu: unsplash('1571877227200-a0d98ea607e9'),
  dessertPannaCotta: unsplash('1488477181946-6428a0291777'),
  dessertCake: unsplash('1578985545062-69928b1d9587'),
  coffeeTable: unsplash('1509042239860-f550ce710b93'),
  coffeeCappuccino: unsplash('1495474472287-4d71bcdd2085'),
  coffeeIced: unsplash('1461023058943-07fcbe16d735'),
  coffeeFlatWhite: unsplash('1572442388796-11668a67e53d'),
  coffeeSpanish: unsplash('1517701604599-bb29b565090c'),
  drinkMojito: unsplash('1513558161293-cdaf765ed2fd'),
  drinkIcedTea: unsplash('1556679343-c7306c1976bc'),
  drinkSmoothie: unsplash('1622597467836-f3285f2131b8'),
  drinkLemonade: unsplash('1497534446932-c925b458314e'),
  drinkSparkler: unsplash('1544145945-f90425340c7e'),
};

const pizzaOptions: CustomizationGroup[] = [
  {
    id: 'size',
    name: 'Size',
    type: 'single',
    required: true,
    options: [
      { id: 'regular', name: 'Regular · 10"', price: 0 },
      { id: 'large', name: 'Large · 12"', price: 150 },
    ],
  },
  {
    id: 'toppings',
    name: 'Extra toppings',
    type: 'multiple',
    required: false,
    maxSelect: 3,
    options: [
      { id: 'burrata', name: 'Burrata', price: 120 },
      { id: 'cheese', name: 'Extra mozzarella', price: 60 },
      { id: 'jalapeno', name: 'Jalapeños', price: 40 },
      { id: 'olives', name: 'Kalamata olives', price: 40 },
    ],
  },
];

const burgerOptions = (veg: boolean): CustomizationGroup[] => [
  {
    id: 'addons',
    name: 'Add-ons',
    type: 'multiple',
    required: false,
    maxSelect: 3,
    options: [
      veg
        ? { id: 'patty', name: 'Extra mushroom patty', price: 100 }
        : { id: 'patty', name: 'Extra smashed patty', price: 120 },
      { id: 'cheese', name: 'Aged cheddar slice', price: 40 },
      { id: 'egg', name: 'Fried egg', price: 40 },
    ],
  },
  {
    id: 'side',
    name: 'Make it a meal',
    type: 'single',
    required: false,
    options: [
      { id: 'fries', name: 'Rosemary fries', price: 90 },
      { id: 'salad', name: 'House side salad', price: 80 },
    ],
  },
];

const pastaOptions: CustomizationGroup[] = [
  {
    id: 'extras',
    name: 'Extras',
    type: 'multiple',
    required: false,
    maxSelect: 2,
    options: [
      { id: 'parmesan', name: 'Extra parmesan', price: 50 },
      { id: 'garlic-bread', name: 'Garlic sourdough', price: 80 },
    ],
  },
];

const coffeeOptions: CustomizationGroup[] = [
  {
    id: 'size',
    name: 'Size',
    type: 'single',
    required: true,
    options: [
      { id: 'regular', name: 'Regular · 8oz', price: 0 },
      { id: 'large', name: 'Large · 12oz', price: 40 },
    ],
  },
  {
    id: 'milk',
    name: 'Milk',
    type: 'single',
    required: true,
    options: [
      { id: 'whole', name: 'Whole milk', price: 0 },
      { id: 'oat', name: 'Oat milk', price: 50 },
      { id: 'almond', name: 'Almond milk', price: 50 },
    ],
  },
  {
    id: 'extras',
    name: 'Extras',
    type: 'multiple',
    required: false,
    maxSelect: 3,
    options: [
      { id: 'shot', name: 'Extra espresso shot', price: 40 },
      { id: 'vanilla', name: 'Vanilla syrup', price: 30 },
      { id: 'caramel', name: 'Salted caramel syrup', price: 30 },
    ],
  },
];

const drinkOptions: CustomizationGroup[] = [
  {
    id: 'size',
    name: 'Size',
    type: 'single',
    required: true,
    options: [
      { id: 'regular', name: 'Regular · 350ml', price: 0 },
      { id: 'large', name: 'Large · 500ml', price: 40 },
    ],
  },
];

const dessertOptions: CustomizationGroup[] = [
  {
    id: 'pairing',
    name: 'Pair it with',
    type: 'single',
    required: false,
    options: [
      { id: 'gelato', name: 'Scoop of vanilla gelato', price: 70 },
      { id: 'espresso', name: 'Single espresso', price: 90 },
    ],
  },
];

export const categories: SeedCategory[] = [
  { slug: 'pizza', name: 'Pizza', description: 'Wood-fired, 48-hour fermented dough.', image: IMG.pizzaMargherita, sortOrder: 1 },
  { slug: 'burgers', name: 'Burgers', description: 'Brioche buns, smashed to order.', image: IMG.burgerClassic, sortOrder: 2 },
  { slug: 'pasta', name: 'Pasta', description: 'Hand-rolled every morning.', image: IMG.pastaPenne, sortOrder: 3 },
  { slug: 'desserts', name: 'Desserts', description: 'Baked in-house, daily.', image: IMG.dessertTiramisu, sortOrder: 4 },
  { slug: 'coffee', name: 'Coffee', description: 'Single-origin, roasted locally.', image: IMG.coffeeTable, sortOrder: 5 },
  { slug: 'drinks', name: 'Drinks', description: 'Fresh-pressed and house-brewed.', image: IMG.drinkLemonade, sortOrder: 6 },
];

export const products: SeedProduct[] = [
  // ─── Pizza ────────────────────────────────────────────────────────────────
  {
    slug: 'margherita-napoletana',
    category: 'pizza',
    name: 'Margherita Napoletana',
    shortDescription: 'San Marzano, fior di latte, basil',
    description:
      'Our purest pizza. Slow-fermented dough blistered at 450°C, crushed San Marzano tomatoes, torn fior di latte and a ribbon of cold-pressed olive oil.',
    ingredients: ['San Marzano tomato', 'Fior di latte', 'Fresh basil', 'Extra virgin olive oil', 'Sea salt'],
    price: 399,
    image: IMG.pizzaMargherita,
    isVeg: true,
    isBestseller: true,
    rating: 4.8,
    ratingCount: 1240,
    prepTimeMinutes: 18,
    calories: 780,
    customizations: pizzaOptions,
  },
  {
    slug: 'wild-mushroom-truffle-pizza',
    category: 'pizza',
    name: 'Wild Mushroom & Truffle',
    shortDescription: 'Roasted mushrooms, taleggio, truffle oil',
    description:
      'A white pizza layered with roasted shiitake and button mushrooms, melting taleggio, thyme and a finishing drizzle of black truffle oil.',
    ingredients: ['Shiitake', 'Button mushroom', 'Taleggio', 'Thyme', 'Black truffle oil'],
    price: 549,
    image: IMG.pizzaMushroom,
    isVeg: true,
    isFeatured: true,
    rating: 4.7,
    ratingCount: 682,
    prepTimeMinutes: 20,
    calories: 860,
    customizations: pizzaOptions,
  },
  {
    slug: 'spicy-pepperoni',
    category: 'pizza',
    name: 'Spicy Pepperoni',
    shortDescription: 'Cupped pepperoni, hot honey, chilli',
    description:
      'Crisp-edged cupped pepperoni over our house tomato sauce and mozzarella, finished with Calabrian chilli and a drizzle of hot honey.',
    ingredients: ['Pepperoni', 'Mozzarella', 'Tomato sauce', 'Calabrian chilli', 'Hot honey'],
    price: 499,
    compareAtPrice: 549,
    image: IMG.pizzaPepperoni,
    isVeg: false,
    isBestseller: true,
    rating: 4.8,
    ratingCount: 1530,
    prepTimeMinutes: 18,
    calories: 920,
    customizations: pizzaOptions,
  },
  {
    slug: 'smoked-chicken-caramelised-onion',
    category: 'pizza',
    name: 'Smoked Chicken & Onion',
    shortDescription: 'Applewood chicken, caramelised onion',
    description:
      'Applewood-smoked chicken, slow-caramelised red onions, smoked scamorza and fresh rocket on a garlic oil base.',
    ingredients: ['Smoked chicken', 'Caramelised onion', 'Scamorza', 'Rocket', 'Garlic oil'],
    price: 529,
    image: IMG.pizzaChicken,
    isVeg: false,
    rating: 4.6,
    ratingCount: 418,
    prepTimeMinutes: 20,
    calories: 890,
    customizations: pizzaOptions,
  },
  {
    slug: 'garden-harvest-pizza',
    category: 'pizza',
    name: 'Garden Harvest',
    shortDescription: 'Charred peppers, olives, ricotta',
    description:
      'Fire-charred bell peppers, cherry tomatoes, kalamata olives and whipped lemon ricotta on our classic tomato base.',
    ingredients: ['Bell peppers', 'Cherry tomato', 'Kalamata olives', 'Lemon ricotta', 'Oregano'],
    price: 449,
    image: IMG.pizzaGarden,
    isVeg: true,
    rating: 4.5,
    ratingCount: 296,
    prepTimeMinutes: 18,
    calories: 740,
    customizations: pizzaOptions,
  },

  // ─── Burgers ──────────────────────────────────────────────────────────────
  {
    slug: 'classic-smash-burger',
    category: 'burgers',
    name: 'Classic Smash Burger',
    shortDescription: 'Double smashed patty, cheddar, pickles',
    description:
      'Two smashed patties with crispy lacy edges, aged cheddar, house pickles, shaved onion and Ember sauce on a toasted brioche bun.',
    ingredients: ['Smashed patty', 'Aged cheddar', 'Pickles', 'Onion', 'Ember sauce', 'Brioche'],
    price: 349,
    image: IMG.burgerClassic,
    isVeg: false,
    isBestseller: true,
    rating: 4.9,
    ratingCount: 2105,
    prepTimeMinutes: 15,
    calories: 820,
    customizations: burgerOptions(false),
  },
  {
    slug: 'ember-signature-burger',
    category: 'burgers',
    name: 'Ember Signature',
    shortDescription: 'Chargrilled patty, smoked aioli, lettuce',
    description:
      'Our flagship: a thick chargrilled patty, butter lettuce, heirloom tomato, smoked garlic aioli and melted gruyère.',
    ingredients: ['Chargrilled patty', 'Gruyère', 'Butter lettuce', 'Heirloom tomato', 'Smoked aioli'],
    price: 399,
    image: IMG.burgerSignature,
    isVeg: false,
    isFeatured: true,
    rating: 4.7,
    ratingCount: 874,
    prepTimeMinutes: 16,
    calories: 860,
    customizations: burgerOptions(false),
  },
  {
    slug: 'double-smoked-bacon-burger',
    category: 'burgers',
    name: 'Double Smoked Bacon',
    shortDescription: 'Two patties, smoked bacon, BBQ glaze',
    description:
      'Stacked high: two patties, crisp smoked bacon, American cheese and a bourbon-free BBQ glaze. Bring an appetite.',
    ingredients: ['Two patties', 'Smoked bacon', 'American cheese', 'BBQ glaze', 'Brioche'],
    price: 499,
    image: IMG.burgerBacon,
    isVeg: false,
    rating: 4.6,
    ratingCount: 512,
    prepTimeMinutes: 18,
    calories: 1120,
    customizations: burgerOptions(false),
  },
  {
    slug: 'truffle-mushroom-burger',
    category: 'burgers',
    name: 'Truffle Mushroom Burger',
    shortDescription: 'Portobello patty, truffle mayo, swiss',
    description:
      'A meaty portobello and black-bean patty, melted swiss, caramelised onion and truffle mayonnaise. Entirely vegetarian, entirely indulgent.',
    ingredients: ['Portobello patty', 'Swiss cheese', 'Caramelised onion', 'Truffle mayo', 'Brioche'],
    price: 379,
    image: IMG.burgerTruffle,
    isVeg: true,
    rating: 4.6,
    ratingCount: 455,
    prepTimeMinutes: 15,
    calories: 690,
    customizations: burgerOptions(true),
  },
  {
    slug: 'crispy-chicken-sliders',
    category: 'burgers',
    name: 'Crispy Chicken Sliders',
    shortDescription: 'Buttermilk chicken, slaw, chipotle mayo',
    description:
      'Two mini brioche sliders with buttermilk-fried chicken thigh, crunchy red cabbage slaw and chipotle mayo.',
    ingredients: ['Buttermilk chicken', 'Red cabbage slaw', 'Chipotle mayo', 'Mini brioche'],
    price: 329,
    image: IMG.burgerSliders,
    isVeg: false,
    rating: 4.5,
    ratingCount: 389,
    prepTimeMinutes: 15,
    calories: 640,
    customizations: burgerOptions(false),
  },

  // ─── Pasta ────────────────────────────────────────────────────────────────
  {
    slug: 'slow-cooked-truffle-pasta',
    category: 'pasta',
    name: 'Slow-cooked Truffle Pasta',
    shortDescription: 'Braised beef, wild mushroom cream, truffle',
    description:
      "Today's special. Fresh tagliatelle folded through slow-braised beef, a wild mushroom cream, aged parmesan and shaved black truffle. Rich. Creamy. Made fresh today.",
    ingredients: ['Fresh tagliatelle', 'Braised beef', 'Wild mushrooms', 'Cream', 'Aged parmesan', 'Black truffle'],
    price: 449,
    compareAtPrice: 499,
    image: IMG.pastaTruffle,
    gallery: [IMG.pastaCacio],
    isVeg: false,
    isFeatured: true,
    isBestseller: true,
    rating: 4.9,
    ratingCount: 1688,
    prepTimeMinutes: 20,
    calories: 910,
    customizations: pastaOptions,
  },
  {
    slug: 'penne-arrabbiata',
    category: 'pasta',
    name: 'Penne Arrabbiata',
    shortDescription: 'Fiery tomato, garlic, parsley',
    description:
      'Bronze-cut penne in a fiery sauce of slow-cooked tomatoes, garlic and dried chilli, finished with flat-leaf parsley and pecorino.',
    ingredients: ['Penne', 'Tomato', 'Garlic', 'Dried chilli', 'Pecorino', 'Parsley'],
    price: 329,
    image: IMG.pastaPenne,
    isVeg: true,
    rating: 4.5,
    ratingCount: 602,
    prepTimeMinutes: 16,
    calories: 640,
    customizations: pastaOptions,
  },
  {
    slug: 'basil-pesto-farfalle',
    category: 'pasta',
    name: 'Basil Pesto Farfalle',
    shortDescription: 'Genovese pesto, cherry tomato, pine nuts',
    description:
      'Farfalle tossed in bright Genovese basil pesto with blistered cherry tomatoes, toasted pine nuts and baby spinach.',
    ingredients: ['Farfalle', 'Basil pesto', 'Cherry tomato', 'Pine nuts', 'Spinach'],
    price: 349,
    compareAtPrice: 399,
    image: IMG.pastaFarfalle,
    isVeg: true,
    rating: 4.6,
    ratingCount: 377,
    prepTimeMinutes: 16,
    calories: 690,
    customizations: pastaOptions,
  },
  {
    slug: 'prawn-aglio-olio',
    category: 'pasta',
    name: 'Prawn Aglio e Olio',
    shortDescription: 'Tiger prawns, garlic, chilli, lemon',
    description:
      'Spaghetti with seared tiger prawns, golden garlic, chilli flakes, lemon zest and plenty of good olive oil.',
    ingredients: ['Spaghetti', 'Tiger prawns', 'Garlic', 'Chilli flakes', 'Lemon', 'Olive oil'],
    price: 519,
    image: IMG.pastaPrawn,
    isVeg: false,
    rating: 4.7,
    ratingCount: 498,
    prepTimeMinutes: 18,
    calories: 720,
    customizations: pastaOptions,
  },
  {
    slug: 'cacio-e-pepe',
    category: 'pasta',
    name: 'Cacio e Pepe',
    shortDescription: 'Pecorino, cracked black pepper',
    description:
      'The Roman classic: spaghetti emulsified with pecorino romano, parmesan and freshly toasted, coarsely cracked black pepper.',
    ingredients: ['Spaghetti', 'Pecorino romano', 'Parmesan', 'Black pepper'],
    price: 369,
    image: IMG.pastaCacio,
    isVeg: true,
    rating: 4.6,
    ratingCount: 341,
    prepTimeMinutes: 14,
    calories: 670,
    customizations: pastaOptions,
  },

  // ─── Desserts ─────────────────────────────────────────────────────────────
  {
    slug: 'classic-tiramisu',
    category: 'desserts',
    name: 'Classic Tiramisu',
    shortDescription: 'Espresso-soaked savoiardi, mascarpone',
    description:
      'Layers of espresso-soaked savoiardi and airy mascarpone cream, dusted with Valrhona cocoa. Made every morning.',
    ingredients: ['Mascarpone', 'Espresso', 'Savoiardi', 'Cocoa', 'Egg'],
    price: 299,
    image: IMG.dessertTiramisu,
    isVeg: true,
    isBestseller: true,
    rating: 4.9,
    ratingCount: 1320,
    prepTimeMinutes: 5,
    calories: 450,
    customizations: dessertOptions,
  },
  {
    slug: 'dark-chocolate-ganache-cake',
    category: 'desserts',
    name: 'Dark Chocolate Ganache Cake',
    shortDescription: '70% dark chocolate, salted ganache',
    description:
      'Three layers of moist cocoa sponge, 70% dark chocolate ganache and a pinch of flaky sea salt.',
    ingredients: ['Dark chocolate', 'Cocoa sponge', 'Cream', 'Sea salt'],
    price: 279,
    image: IMG.dessertCake,
    isVeg: true,
    isFeatured: true,
    rating: 4.8,
    ratingCount: 806,
    prepTimeMinutes: 5,
    calories: 520,
    customizations: dessertOptions,
  },
  {
    slug: 'strawberry-panna-cotta',
    category: 'desserts',
    name: 'Strawberry Panna Cotta',
    shortDescription: 'Vanilla bean cream, macerated berries',
    description:
      'Silky vanilla bean panna cotta crowned with macerated strawberries and a crumble of shortbread.',
    ingredients: ['Cream', 'Vanilla bean', 'Strawberries', 'Shortbread'],
    price: 249,
    image: IMG.dessertPannaCotta,
    isVeg: true,
    rating: 4.6,
    ratingCount: 287,
    prepTimeMinutes: 5,
    calories: 380,
    customizations: dessertOptions,
  },
  {
    slug: 'glazed-donut-trio',
    category: 'desserts',
    name: 'Glazed Donut Trio',
    shortDescription: 'Brioche donuts, three glazes',
    description:
      'Three pillowy brioche donuts — vanilla sprinkle, chocolate fudge and salted caramel. Limited batches daily.',
    ingredients: ['Brioche dough', 'Vanilla glaze', 'Chocolate fudge', 'Salted caramel'],
    price: 229,
    compareAtPrice: 279,
    image: IMG.dessertDonut,
    isVeg: true,
    rating: 4.5,
    ratingCount: 450,
    prepTimeMinutes: 5,
    calories: 690,
  },
  {
    slug: 'strawberry-cream-cupcakes',
    category: 'desserts',
    name: 'Strawberry Cream Cupcakes',
    shortDescription: 'Pair of vanilla cupcakes, berry frosting',
    description:
      'Two soft vanilla cupcakes piped with fresh strawberry buttercream and topped with a sugared berry.',
    ingredients: ['Vanilla sponge', 'Strawberry buttercream', 'Fresh strawberry'],
    price: 199,
    image: IMG.dessertCupcake,
    isVeg: true,
    rating: 4.4,
    ratingCount: 198,
    prepTimeMinutes: 5,
    calories: 420,
  },

  // ─── Coffee ───────────────────────────────────────────────────────────────
  {
    slug: 'cappuccino',
    category: 'coffee',
    name: 'Cappuccino',
    shortDescription: 'Double shot, velvety microfoam',
    description:
      'A double shot of our seasonal single-origin espresso under a cap of velvety microfoam. Balanced, sweet, cocoa finish.',
    ingredients: ['Espresso', 'Steamed milk', 'Microfoam'],
    price: 199,
    image: IMG.coffeeCappuccino,
    isVeg: true,
    isBestseller: true,
    rating: 4.8,
    ratingCount: 2410,
    prepTimeMinutes: 5,
    calories: 130,
    customizations: coffeeOptions,
  },
  {
    slug: 'flat-white',
    category: 'coffee',
    name: 'Flat White',
    shortDescription: 'Ristretto, silky thin milk',
    description:
      'Two ristretto shots with a thin layer of silky steamed milk — stronger and smoother than a latte.',
    ingredients: ['Ristretto', 'Steamed milk'],
    price: 219,
    image: IMG.coffeeFlatWhite,
    isVeg: true,
    rating: 4.7,
    ratingCount: 1105,
    prepTimeMinutes: 5,
    calories: 110,
    customizations: coffeeOptions,
  },
  {
    slug: 'iced-caramel-latte',
    category: 'coffee',
    name: 'Iced Caramel Latte',
    shortDescription: 'Espresso, salted caramel, cold milk',
    description:
      'Espresso poured over cold milk and house-made salted caramel, served over clear ice.',
    ingredients: ['Espresso', 'Cold milk', 'Salted caramel', 'Ice'],
    price: 249,
    compareAtPrice: 289,
    image: IMG.coffeeIced,
    isVeg: true,
    isFeatured: true,
    rating: 4.7,
    ratingCount: 932,
    prepTimeMinutes: 5,
    calories: 210,
    customizations: coffeeOptions,
  },
  {
    slug: 'spanish-latte',
    category: 'coffee',
    name: 'Spanish Latte',
    shortDescription: 'Condensed milk, double espresso',
    description:
      'Sweet and creamy: condensed milk and steamed milk layered with a double shot of espresso.',
    ingredients: ['Espresso', 'Condensed milk', 'Steamed milk'],
    price: 259,
    image: IMG.coffeeSpanish,
    isVeg: true,
    rating: 4.6,
    ratingCount: 654,
    prepTimeMinutes: 5,
    calories: 240,
    customizations: coffeeOptions,
  },

  // ─── Drinks ───────────────────────────────────────────────────────────────
  {
    slug: 'virgin-mojito',
    category: 'drinks',
    name: 'Virgin Mojito',
    shortDescription: 'Mint, lime, soda',
    description: 'Muddled garden mint and fresh lime, topped with soda over crushed ice.',
    ingredients: ['Mint', 'Lime', 'Cane sugar', 'Soda'],
    price: 199,
    image: IMG.drinkMojito,
    isVeg: true,
    rating: 4.5,
    ratingCount: 720,
    prepTimeMinutes: 5,
    calories: 90,
    customizations: drinkOptions,
  },
  {
    slug: 'peach-iced-tea',
    category: 'drinks',
    name: 'Peach Iced Tea',
    shortDescription: 'Cold-brewed black tea, white peach',
    description: 'Twelve-hour cold-brewed Assam with white peach purée and a twist of lemon.',
    ingredients: ['Assam tea', 'White peach', 'Lemon'],
    price: 179,
    image: IMG.drinkIcedTea,
    isVeg: true,
    rating: 4.4,
    ratingCount: 410,
    prepTimeMinutes: 5,
    calories: 80,
    customizations: drinkOptions,
  },
  {
    slug: 'berry-smoothie',
    category: 'drinks',
    name: 'Mixed Berry Smoothie',
    shortDescription: 'Berries, banana, greek yoghurt',
    description: 'Blueberries, raspberries, banana and thick Greek yoghurt blended until velvety.',
    ingredients: ['Blueberries', 'Raspberries', 'Banana', 'Greek yoghurt', 'Honey'],
    price: 249,
    image: IMG.drinkSmoothie,
    isVeg: true,
    rating: 4.6,
    ratingCount: 366,
    prepTimeMinutes: 6,
    calories: 260,
    customizations: drinkOptions,
  },
  {
    slug: 'strawberry-lemonade',
    category: 'drinks',
    name: 'Strawberry Lemonade',
    shortDescription: 'Fresh-squeezed, strawberry purée',
    description: 'Fresh-squeezed lemons with strawberry purée and a touch of basil, served long.',
    ingredients: ['Lemon', 'Strawberry', 'Basil', 'Cane sugar'],
    price: 189,
    image: IMG.drinkLemonade,
    isVeg: true,
    isBestseller: true,
    rating: 4.7,
    ratingCount: 845,
    prepTimeMinutes: 5,
    calories: 120,
    customizations: drinkOptions,
  },
  {
    slug: 'citrus-sparkler',
    category: 'drinks',
    name: 'Citrus Sparkler',
    shortDescription: 'Grapefruit, orange, tonic (zero-proof)',
    description: 'A zero-proof spritz of pink grapefruit, blood orange and Indian tonic with a salted rim.',
    ingredients: ['Grapefruit', 'Blood orange', 'Tonic', 'Sea salt'],
    price: 229,
    image: IMG.drinkSparkler,
    isVeg: true,
    rating: 4.5,
    ratingCount: 233,
    prepTimeMinutes: 5,
    calories: 95,
    customizations: drinkOptions,
  },
];
