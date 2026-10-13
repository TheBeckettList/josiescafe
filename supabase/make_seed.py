"""Builds 002_seed_menu.sql: a SAMPLE menu (edit it in the POS) with names in every site language."""
import json, pathlib

L = ["en", "es", "fr", "de", "nl", "it", "pt", "nb", "he"]

def n(*vals):
    return dict(zip(L, vals))

cats = [
    # key, station, togo, color, names
    ("coffee", "bar", 10, "#C99A8E", n("Coffee", "Café", "Café", "Kaffee", "Koffie", "Caffè", "Café", "Kaffe", "קפה")),
    ("iced", "bar", 10, "#F5B5C8", n("Iced drinks", "Bebidas heladas", "Boissons glacées", "Eisgetränke", "IJsdranken", "Bevande fredde", "Gelados", "Iskalde drikker", "משקאות קרים")),
    ("smoothies", "bar", 10, "#E2B4D0", n("Smoothies", "Batidos", "Smoothies", "Smoothies", "Smoothies", "Frullati", "Vitaminas", "Smoothies", "שייקים")),
    ("breakfast", "kitchen", 20, "#F7BFA8", n("Breakfast", "Desayuno", "Petit-déjeuner", "Frühstück", "Ontbijt", "Colazione", "Café da manhã", "Frokost", "ארוחת בוקר")),
    ("lunch", "kitchen", 25, "#EC98AE", n("Lunch", "Almuerzo", "Déjeuner", "Mittagessen", "Lunch", "Pranzo", "Almoço", "Lunsj", "ארוחת צהריים")),
    ("drinks", "bar", 0, "#C77F98", n("Drinks", "Bebidas", "Boissons", "Getränke", "Dranken", "Bevande", "Bebidas", "Drikke", "משקאות")),
]

items = {
    "coffee": [
        (50, n("Espresso", "Espresso", "Espresso", "Espresso", "Espresso", "Espresso", "Espresso", "Espresso", "אספרסו")),
        (60, n("Americano", "Americano", "Americano", "Americano", "Americano", "Americano", "Americano", "Americano", "אמריקנו")),
        (80, n("Cappuccino", "Capuchino", "Cappuccino", "Cappuccino", "Cappuccino", "Cappuccino", "Cappuccino", "Cappuccino", "קפוצ'ינו")),
        (85, n("Latte", "Latte", "Latte", "Latte", "Latte", "Caffè latte", "Latte", "Latte", "לאטה")),
        (95, n("Mocha", "Moca", "Moka", "Mokka", "Mokka", "Mocaccino", "Mocha", "Mokka", "מוקה")),
    ],
    "iced": [
        (95, n("Iced Latte", "Latte helado", "Latte glacé", "Eis-Latte", "IJslatte", "Latte freddo", "Latte gelado", "Iskald latte", "לאטה קר")),
        (105, n("Iced Mocha", "Moca helado", "Moka glacé", "Eis-Mokka", "IJsmokka", "Mocaccino freddo", "Mocha gelado", "Iskald mokka", "מוקה קר")),
        (90, n("Cold Brew", "Cold brew", "Cold brew", "Cold Brew", "Cold brew", "Cold brew", "Cold brew", "Cold brew", "קולד ברו")),
        (60, n("Iced Tea", "Té helado", "Thé glacé", "Eistee", "IJsthee", "Tè freddo", "Chá gelado", "Iste", "תה קר")),
    ],
    "smoothies": [
        (110, n("Tropical Smoothie", "Batido tropical", "Smoothie tropical", "Tropischer Smoothie", "Tropische smoothie", "Frullato tropicale", "Vitamina tropical", "Tropisk smoothie", "שייק טרופי")),
        (100, n("Mango Smoothie", "Batido de mango", "Smoothie à la mangue", "Mango-Smoothie", "Mangosmoothie", "Frullato al mango", "Vitamina de manga", "Mangosmoothie", "שייק מנגו")),
        (110, n("Banana Peanut Butter Smoothie", "Batido de banano y maní", "Smoothie banane-cacahuète", "Bananen-Erdnuss-Smoothie", "Banaan-pindakaassmoothie", "Frullato banana e burro d'arachidi", "Vitamina de banana com pasta de amendoim", "Banan- og peanøttsmoothie", "שייק בננה וחמאת בוטנים")),
    ],
    "breakfast": [
        (45, n("Baleada", "Baleada", "Baleada", "Baleada", "Baleada", "Baleada", "Baleada", "Baleada", "בלאדה")),
        (65, n("Baleada with Egg", "Baleada con huevo", "Baleada aux œufs", "Baleada mit Ei", "Baleada met ei", "Baleada con uovo", "Baleada com ovo", "Baleada med egg", "בלאדה עם ביצה")),
        (140, n("Pancakes", "Panqueques", "Pancakes", "Pfannkuchen", "Pannenkoeken", "Pancake", "Panquecas", "Pannekaker", "פנקייק")),
        (160, n("Breakfast Burrito", "Burrito de desayuno", "Burrito petit-déjeuner", "Frühstücks-Burrito", "Ontbijtburrito", "Burrito per colazione", "Burrito de café da manhã", "Frokostburrito", "בוריטו בוקר")),
        (110, n("Fruit Bowl", "Plato de frutas", "Bol de fruits", "Obstschale", "Fruitkom", "Coppa di frutta", "Tigela de frutas", "Fruktskål", "קערת פירות")),
    ],
    "lunch": [
        (220, n("Fish Tacos", "Tacos de pescado", "Tacos au poisson", "Fisch-Tacos", "Vistaco's", "Tacos di pesce", "Tacos de peixe", "Fisketaco", "טאקו דג")),
        (190, n("Club Sandwich", "Sándwich club", "Club sandwich", "Club-Sandwich", "Clubsandwich", "Club sandwich", "Sanduíche club", "Clubsandwich", "סנדוויץ' קלאב")),
        (180, n("Chicken Wrap", "Wrap de pollo", "Wrap au poulet", "Hähnchen-Wrap", "Kipwrap", "Wrap di pollo", "Wrap de frango", "Kyllingwrap", "ראפ עוף")),
        (150, n("Garden Salad", "Ensalada verde", "Salade verte", "Gemischter Salat", "Gemengde salade", "Insalata mista", "Salada verde", "Grønn salat", "סלט ירקות")),
        (70, n("Fries", "Papas fritas", "Frites", "Pommes frites", "Friet", "Patatine fritte", "Batata frita", "Pommes frites", "צ'יפס")),
    ],
    "drinks": [
        (30, n("Bottled Water", "Agua embotellada", "Eau en bouteille", "Wasser (Flasche)", "Flessenwater", "Acqua in bottiglia", "Água mineral", "Flaskevann", "מים בבקבוק")),
        (70, n("Fresh Juice", "Jugo natural", "Jus frais", "Frischer Saft", "Vers sap", "Succo fresco", "Suco natural", "Fersk juice", "מיץ טבעי")),
        (40, n("Soda", "Refresco", "Soda", "Limonade", "Frisdrank", "Bibita", "Refrigerante", "Brus", "משקה מוגז")),
    ],
}

def q(s):
    return "'" + s.replace("'", "''") + "'"

out = ["-- SAMPLE menu so the site and POS aren't empty. Edit or delete it in POS › Menu.", "begin;"]
for i, (key, station, togo, color, names) in enumerate(cats):
    out.append(
        "insert into public.categories (sort, name, station, togo_charge, color) values "
        f"({i + 1}, {q(json.dumps(names, ensure_ascii=False))}::jsonb, {q(station)}, {togo}, {q(color)});"
    )
    for j, (price, inames) in enumerate(items[key]):
        out.append(
            "insert into public.items (category_id, sort, name, price) "
            f"select id, {j + 1}, {q(json.dumps(inames, ensure_ascii=False))}::jsonb, {price} "
            f"from public.categories where name->>'en' = {q(names['en'])};"
        )
out.append("commit;")
pathlib.Path(__file__).with_name("002_seed_menu.sql").write_text("\n".join(out) + "\n", encoding="utf-8")
print("ok", sum(len(v) for v in items.values()), "items")
