-- 014 · A bank of pastries, staged HIDDEN in the Pastries category (counted, no station). Applied live.
-- They are inactive with price 0 and stock 0 until Josie says which ones to carry and at what price; nothing shows on the register or the site.
-- Each has its own icon (art/dishart.js, found by name).
insert into public.items (category_id, sort, name, price, show_online, available, active, stock, starred)
select (select id from public.categories where name->>'en' = 'Pastries'), 100 + v.n, jsonb_build_object('en', v.en, 'es', v.es), 0, false, true, false, 0, false
from (values
 (1,'Key lime pie','Pay de limón'),(2,'Cinnamon streusel muffin','Muffin de canela con streusel'),(3,'Protein balls','Bolitas de proteína'),
 (4,'Chocolate chip banana bread','Pan de banano con chispas de chocolate'),(5,'Pumpkin pie','Pay de calabaza'),(6,'Chocolate chip cookies','Galletas con chispas de chocolate'),
 (7,'Carrot cake','Pastel de zanahoria'),(8,'Croissant','Croissant'),(9,'Cinnamon roll','Rollo de canela'),(10,'Banana bread','Pan de banano'),
 (11,'Coconut bread','Pan de coco'),(12,'Brownie','Brownie'),(13,'Lemon bar','Barra de limón'),(14,'Blueberry muffin','Muffin de arándanos'),
 (15,'Tres leches cake','Pastel de tres leches'),(16,'Cheesecake','Cheesecake'),(17,'Oatmeal raisin cookie','Galleta de avena y pasas')) as v(n,en,es)
where not exists (select 1 from public.items i where i.category_id = (select id from public.categories where name->>'en' = 'Pastries') and i.name->>'en' = v.en);
