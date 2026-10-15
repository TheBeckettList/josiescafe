-- 008 · DRAFT ingredient list, built only from the live menu descriptions (items.description).
-- Josie corrects it in the admin gear (Inventory setup, dish cards). Nothing here is a final decision:
--   * kind: base = the dish is made from it (no it, no dish). Everything else is an element (dish stays, "no bacon").
--   * Nothing is marked vegan/gluten-free/kosher-style except what the diet notes already said is a "no".
--     No swaps are set: Josie picks default swaps and options herself.
--   * Only the twelve ingredients on the Inventory design start on the list (inventoried = true).
-- Safe to re-run: ingredients are matched by English name, links and marks use on conflict do nothing.

insert into public.ingredients (name, kind, icon, location, inventoried, required_check, meat, dairy)
select jsonb_build_object('en', v.en, 'es', v.es), v.kind, v.icon, v.loc, v.inv, v.req, v.meat, v.dairy
from (values
  -- en, es, kind, icon, location, inventoried, required_check, meat, dairy
  ('Coffee beans',       'Granos de café',       'base',    'beans',   'grinder', true,  true,  false, false),
  ('Chai',               'Chai',                 'base',    null,      'other',   false, false, false, false),
  ('Flavor syrup',       'Jarabe de sabor',      'base',    null,      'other',   false, false, false, false),
  ('Pancake mix',        'Mezcla para panqueques','base',   'mix',     'dry',     false, false, false, false),
  ('Bagels',             'Bagels',               'base',    'bagel',   'other',   true,  false, false, false),
  ('Coconut bread',      'Pan de coco',          'base',    'bread',   'other',   true,  false, false, false),
  ('Fritters',           'Buñuelos',             'base',    null,      'other',   false, false, false, false),
  ('Chicken',            'Pollo',                'base',    'chicken', 'fridge',  false, false, true,  false),
  ('Bacon',              'Tocino',               'element', 'bacon',   'fridge',  true,  false, true,  false),
  ('Egg',                'Huevo',                'element', 'egg',     'other',   true,  false, false, false),
  ('Avocado',            'Aguacate',             'element', 'avocado', 'other',   true,  false, false, false),
  ('Cheese',             'Queso',                'element', 'cheese',  'fridge',  true,  false, false, true),
  ('Cream cheese',       'Queso crema',          'element', 'cream',   'fridge',  true,  false, false, true),
  ('Milk',               'Leche',                'element', 'milk',    'fridge',  true,  false, false, true),
  ('Yogurt',             'Yogur',                'element', 'yogurt',  'fridge',  true,  false, false, true),
  ('Tomato',             'Tomate',               'element', 'tomato',  'other',   true,  false, false, false),
  ('Lettuce',            'Lechuga',              'element', 'lettuce', 'other',   true,  false, false, false),
  ('Banana',             'Banano',               'element', 'banana',  'other',   false, false, false, false),
  ('Honey',              'Miel',                 'element', 'honey',   'dry',     false, false, false, false),
  ('Mayo',               'Mayonesa',             'element', 'mayo',    'fridge',  false, false, false, false),
  ('Ice',                'Hielo',                'element', null,      'other',   false, false, false, false),
  ('Cinnamon',           'Canela',               'element', null,      'dry',     false, false, false, false),
  ('Peanut butter',      'Mantequilla de maní',  'element', null,      'dry',     false, false, false, false),
  ('Orange juice',       'Jugo de naranja',      'element', null,      'other',   false, false, false, false),
  ('Pineapple',          'Piña',                 'element', null,      'other',   false, false, false, false),
  ('Strawberry',         'Fresa',                'element', null,      'other',   false, false, false, false),
  ('Lemonade',           'Limonada',             'element', null,      'other',   false, false, false, false),
  ('Watermelon',         'Sandía',               'element', null,      'other',   false, false, false, false),
  ('Mint',               'Menta',                'element', null,      'other',   false, false, false, false),
  ('Fruit',              'Fruta',                'element', null,      'other',   false, false, false, false),
  ('Granola',            'Granola',              'element', null,      'dry',     false, false, false, false),
  ('Beans',              'Frijoles',             'element', null,      'other',   false, false, false, false),
  ('Chocolate chips',    'Chispas de chocolate', 'element', null,      'dry',     false, false, false, false),
  ('Red apple',          'Manzana roja',         'element', null,      'other',   false, false, false, false),
  ('Arugula',            'Arúgula',              'element', null,      'other',   false, false, false, false),
  ('Caramelized onions', 'Cebolla caramelizada', 'element', null,      'other',   false, false, false, false),
  ('Red onion',          'Cebolla morada',       'element', null,      'other',   false, false, false, false),
  ('Cheddar',            'Cheddar',              'element', null,      'fridge',  false, false, false, true),
  ('Parmesan',           'Parmesano',            'element', null,      'fridge',  false, false, false, true),
  ('Pepper jack',        'Pepper jack',          'element', null,      'fridge',  false, false, false, true),
  ('Caesar dressing',    'Aderezo César',        'element', null,      'fridge',  false, false, false, false),
  ('Croutons',           'Crutones',             'element', null,      'dry',     false, false, false, false),
  ('Greens and veg',     'Verduras frescas',     'element', null,      'other',   false, false, false, false),
  ('Buffalo sauce',      'Salsa buffalo',        'element', null,      'other',   false, false, false, false),
  ('Coleslaw',           'Ensalada de col',      'element', null,      'fridge',  false, false, false, false),
  ('Fries',              'Papas fritas',         'element', null,      'other',   false, false, false, false)
) as v(en, es, kind, icon, loc, inv, req, meat, dairy)
where not exists (select 1 from public.ingredients i where i.name ->> 'en' = v.en);

-- What each dish is made of, read off the descriptions. A trailing * marks the core ingredient
-- (the dish IS that thing, so a diet can't adapt it).
insert into public.dish_ingredients (item_id, ingredient_id, is_core)
select it.id, ing.id, d.core
from (
  select dish, trim(trailing '*' from x) as ingr, right(x, 1) = '*' as core
  from (values
    ('Espresso',                         'Coffee beans*'),
    ('Americano',                        'Coffee beans*'),
    ('Cappuccino',                       'Coffee beans*,Milk'),
    ('Latte',                            'Coffee beans*,Milk'),
    ('Chai latte',                       'Chai*,Milk'),
    ('Dirty chai latte',                 'Chai*,Milk,Coffee beans'),
    ('Honey cinnamon latte',             'Coffee beans*,Milk,Honey,Cinnamon'),
    ('Drip coffee',                      'Coffee beans*'),
    ('Flavor shot',                      'Flavor syrup*'),
    ('Iced latte',                       'Coffee beans*,Milk,Ice'),
    ('Iced Americano',                   'Coffee beans*,Ice'),
    ('Iced chai latte',                  'Chai*,Milk,Ice'),
    ('Iced dirty chai latte',            'Chai*,Milk,Coffee beans,Ice'),
    ('Iced honey cinnamon latte',        'Coffee beans*,Milk,Honey,Cinnamon,Ice'),
    ('Frappuccino',                      'Milk,Ice,Coffee beans'),
    ('Coffee smoothie',                  'Milk,Peanut butter,Banana,Coffee beans'),
    ('Sunrise',                          'Orange juice,Banana,Pineapple'),
    ('Sunset',                           'Orange juice,Banana,Strawberry'),
    ('Tropical limeade',                 'Lemonade,Pineapple,Orange juice'),
    ('Watermelon slush',                 'Lemonade,Watermelon,Mint'),
    ('Full plate',                       'Fritters*,Egg,Bacon,Beans,Avocado,Cheese'),
    ('Avocado toast',                    'Avocado*,Egg,Coconut bread,Fruit'),
    ('Breakfast BLT',                    'Bacon*,Lettuce,Tomato,Egg,Mayo,Coconut bread,Fruit'),
    ('Fruit bowl',                       'Fruit*,Yogurt,Granola,Honey'),
    ('Bagel with cream cheese',          'Bagels*,Cream cheese,Fruit'),
    ('Original pancakes',                'Pancake mix*,Fruit,Bacon'),
    ('Banana cinnamon pancakes',         'Pancake mix*,Banana,Cinnamon,Fruit,Bacon'),
    ('Chocolate chip pancakes',          'Pancake mix*,Chocolate chips,Fruit,Bacon'),
    ('Classic',                          'Bagels*,Bacon,Egg,Cheese'),
    ('Josie bagel',                      'Bagels*,Bacon,Egg,Avocado,Cream cheese'),
    ('Oh so good',                       'Bagels*,Bacon,Egg,Tomato,Caramelized onions,Cream cheese'),
    ('High roller',                      'Bagels*,Egg,Red apple,Arugula,Caramelized onions,Cheddar'),
    ('Garden bagel',                     'Bagels*,Egg,Lettuce,Tomato,Avocado,Caramelized onions,Cream cheese'),
    ('Chicken Caesar salad',             'Chicken*,Croutons,Parmesan,Caesar dressing,Greens and veg'),
    ('Grace''s chicken Caesar',          'Chicken*,Croutons,Parmesan,Caesar dressing,Greens and veg,Avocado,Bacon'),
    ('House veggie salad',               'Greens and veg*'),
    ('House veggie salad with chicken',  'Greens and veg*,Chicken'),
    ('Lunch BLT',                        'Bacon*,Lettuce,Tomato,Red onion,Mayo,Coconut bread,Fries'),
    ('Chicken burger',                   'Chicken*,Lettuce,Tomato,Coleslaw,Fries'),
    ('Buffalo chicken burger',           'Chicken*,Buffalo sauce,Lettuce,Tomato,Red onion,Pepper jack,Fries')
  ) as m(dish, list), unnest(string_to_array(m.list, ',')) as x
) d
join public.items it on it.active and it.name ->> 'en' = d.dish
join public.ingredients ing on ing.name ->> 'en' = d.ingr
on conflict (item_id, ingredient_id) do nothing;

-- Diet marks: only the "no" answers the diet notes already gave, plus the plainly obvious ones.
-- Everything else stays unconfirmed (treated as fine, listed for Josie to confirm).
insert into public.diet_marks (diet_id, ingredient_id, mark)
select dt.id, ing.id, 'no'
from (values
  ('vegan', 'Bacon'), ('vegan', 'Egg'), ('vegan', 'Milk'), ('vegan', 'Cheese'), ('vegan', 'Cream cheese'),
  ('vegan', 'Yogurt'), ('vegan', 'Honey'), ('vegan', 'Mayo'), ('vegan', 'Chicken'), ('vegan', 'Cheddar'),
  ('vegan', 'Parmesan'), ('vegan', 'Pepper jack'),
  ('kosher_style', 'Bacon'),
  ('gluten_free', 'Coconut bread'), ('gluten_free', 'Bagels'), ('gluten_free', 'Croutons'), ('gluten_free', 'Pancake mix')
) as m(diet, ingr)
join public.diets dt on dt.key = m.diet
join public.ingredients ing on ing.name ->> 'en' = m.ingr
on conflict (diet_id, ingredient_id) do nothing;
