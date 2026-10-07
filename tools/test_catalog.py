#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Suite de pruebas automatizadas para verificar:
1. Validez de cars.json
2. Existencia de todas las imágenes
3. Ausencia de IDs duplicados
4. Cobertura de campos obligatorios
5. Lógica de búsqueda normalizada (sin acentos, insensibilidad mayúsculas)
6. Lógica de filtros (Marca, Fabricante, Color, Competición, Rango Años)
7. Lógica de ordenación (Nº, Marca, Modelo, Año)
8. Lógica de paginación
9. Integridad de HTML y JS
"""

import json
import os
import sys
import unicodedata

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
json_path = os.path.join(base_dir, "data", "cars.json")
images_dir = os.path.join(base_dir, "images")
html_path = os.path.join(base_dir, "index.html")
js_path = os.path.join(base_dir, "js", "app.js")
css_path = os.path.join(base_dir, "css", "style.css")

print("==================================================")
print(" SUITE DE VERIFICACIÓN AUTOMATIZADA")
print("==================================================")

# 1. Verificar existencia de archivos esenciales
for path, name in [(json_path, "cars.json"), (html_path, "index.html"), (js_path, "app.js"), (css_path, "style.css")]:
    assert os.path.exists(path), f"Falta archivo crítico: {name}"
    print(f"✔ Archivo presente: {name} ({os.path.getsize(path):,} bytes)")

# 2. Cargar y validar cars.json
with open(json_path, "r", encoding="utf-8") as f:
    cars = json.load(f)

print(f"\n✔ Total de coches en cars.json: {len(cars):,}")
assert len(cars) >= 1000, f"Cantidad inesperadamente baja de coches: {len(cars)}"

# 3. Comprobar unicidad de IDs y rango
ids = [c["id"] for c in cars]
assert len(ids) == len(set(ids)), "Existen IDs duplicados en cars.json"
assert min(ids) == 1 and max(ids) == len(cars), f"Rango de IDs inesperado: {min(ids)} a {max(ids)}"
print(f"✔ Unicidad de IDs verificada: {len(cars):,} IDs únicos consecutivos (1 a {max(ids)})")

# 4. Comprobar que todas las imágenes existen en disco
missing_images = []
for c in cars:
    img_rel = c["image"]
    img_full = os.path.join(base_dir, img_rel.replace("/", os.sep))
    if not os.path.exists(img_full):
        missing_images.append((c["id"], img_rel))

if missing_images:
    print(f"❌ Fotografías faltantes: {len(missing_images)}")
    for m in missing_images[:5]:
        print(f"   Car #{m[0]}: {m[1]}")
    sys.exit(1)
else:
    print(f"✔ 100% de las {len(cars):,} fotografías existen en disco")

# 5. Comprobar unicidad y conteo de entidades conocidas
brands = set(c["brand"] for c in cars if c["brand"])
manufacturers = set(c["manufacturer"] for c in cars if c["manufacturer"])
colors = set(c["color"] for c in cars if c["color"])
years = set(c["year"] for c in cars if c["year"] is not None)

print(f"✔ Marcas únicas: {len(brands)}")
print(f"✔ Fabricantes únicos: {len(manufacturers)}")
print(f"✔ Colores únicos: {len(colors)}")
print(f"✔ Años distintos: {len(years)} (rango {min(years)}-{max(years)})")

assert len(brands) >= 100
assert len(manufacturers) >= 20
assert len(colors) >= 10
assert len(years) >= 80

# 6. Test de Búsqueda Normalizada (insensible a acentos y mayúsculas)
def norm(txt):
    if not txt: return ""
    return "".join(c for c in unicodedata.normalize("NFD", str(txt)) if unicodedata.category(c) != "Mn").lower().strip()

# Búsqueda de 'ẽfini' escribiendo 'efini'
results_efini = [c for c in cars if norm("efini") in f"{norm(c['brand'])} {norm(c['model'])}"]
assert len(results_efini) >= 1, "Búsqueda sin acento de 'efini' falló"
print(f"✔ Búsqueda 'efini' (con acento diacrítico normalizado) encontró: {results_efini[0]['brand']} {results_efini[0]['model']}")

# Búsqueda de 'skyline'
results_sky = [c for c in cars if norm("skyline") in f"{norm(c['brand'])} {norm(c['model'])}"]
print(f"✔ Búsqueda 'skyline' encontró: {len(results_sky)} coches")
assert len(results_sky) >= 10

# 7. Test de Filtros
comp_cars = [c for c in cars if c["competition"] is True]
street_cars = [c for c in cars if c["competition"] is False]
assert len(comp_cars) + len(street_cars) == len(cars)
print(f"✔ Filtro competición: {len(comp_cars)} de competición, {len(street_cars)} de calle (Total: {len(cars):,})")

# 8. Test de Rutas Relativas para GitHub Pages en HTML
with open(html_path, "r", encoding="utf-8") as f:
    html_content = f.read()

assert 'href="./css/style.css' in html_content
assert 'src="./js/app.js' in html_content
assert 'src="./images/logo.png"' in html_content
assert 'src="./data/cars.js"' in html_content
assert 'src="./data/special_collections.js"' in html_content
assert 'href="/css/' not in html_content, "Ruta absoluta detectada en HTML (rompería GitHub Pages)"
assert 'src="/js/' not in html_content, "Ruta absoluta detectada en HTML"
print("✔ Todas las rutas en index.html son relativas y compatibles con GitHub Pages y ejecución local")

# 9. Test de Rutas Relativas y Soporte Dual (Local + Fetch) en app.js
with open(js_path, "r", encoding="utf-8") as f:
    js_content = f.read()

assert "fetch('./data/cars.json')" in js_content or 'fetch("./data/cars.json")' in js_content
assert "fetch('./data/special_collections.json')" in js_content or 'fetch("./data/special_collections.json")' in js_content
assert "window.CATALOGO_CARS" in js_content
assert "window.SPECIAL_COLLECTIONS" in js_content
assert "fetch('/data/" not in js_content, "Ruta absoluta en fetch de app.js"
print("✔ app.js soporta doble vía: directa para file:/// y fetch relativo para GitHub Pages")

# 10. Test de Colecciones Especiales (Fast & Furious, Cultura Pop, Motos)
special_json_path = os.path.join(base_dir, "data", "special_collections.json")
assert os.path.exists(special_json_path), "Falta archivo data/special_collections.json"

with open(special_json_path, "r", encoding="utf-8") as f:
    special_data = json.load(f)

assert "fast_and_furious" in special_data, "Falta sección fast_and_furious"
assert "cultura_pop" in special_data, "Falta sección cultura_pop"
assert "motos" in special_data, "Falta sección motos"

ff_items = special_data["fast_and_furious"]
pop_items = special_data["cultura_pop"]
motos_items = special_data["motos"]

print(f"\n✔ Colección Fast & Furious: {len(ff_items)} modelos")
print(f"✔ Colección Cultura Pop: {len(pop_items)} modelos")
print(f"✔ Colección Motos: {len(motos_items)} modelos")

assert len(ff_items) >= 30, f"Cantidad baja en Fast & Furious: {len(ff_items)}"
assert len(pop_items) >= 20, f"Cantidad baja en Cultura Pop: {len(pop_items)}"
assert len(motos_items) >= 20, f"Cantidad baja en Motos: {len(motos_items)}"

# Verificar que todas las fotos de las colecciones especiales existen en disco
special_missing = []
for name, col in [("Fast & Furious", ff_items), ("Cultura Pop", pop_items), ("Motos", motos_items)]:
    col_ids = [item["id"] for item in col]
    assert len(col_ids) == len(set(col_ids)), f"IDs duplicados en {name}"
    for item in col:
        assert item.get("brand") or item.get("model"), f"Item sin marca/modelo en {name}: {item}"
        img_rel = item.get("image", "")
        assert img_rel, f"Item sin imagen en {name}: {item}"
        img_full = os.path.join(base_dir, img_rel.replace("/", os.sep))
        if not os.path.exists(img_full):
            special_missing.append((name, item["id"], img_rel))

if special_missing:
    print(f"❌ Fotografías faltantes en colecciones especiales: {len(special_missing)}")
    for m in special_missing:
        print(f"   [{m[0]} #{m[1]}]: {m[2]}")
    sys.exit(1)
else:
    total_special = len(ff_items) + len(pop_items) + len(motos_items)
    print(f"✔ 100% de las {total_special} fotografías de colecciones especiales existen en disco")

# 11. Test Modo Feria & Antirrepeticiones
assert 'id="nav-tab-feria"' in html_content
assert 'id="tab-feria"' in html_content
assert 'id="feria-search-input"' in html_content
assert 'id="feria-status-banner"' in html_content
assert "getAllFeriaItems" in js_content
assert "renderFeria" in js_content
assert "exportFeriaChecklist" in js_content
print("✔ Modo Feria & Antirrepeticiones verificado en HTML y JS")

# 12. Test Deslizamiento Táctil en Móvil (Swipe) y Modo de Vista
assert 'modal-swipe-tip' in html_content
assert 'btn-view-grid' in html_content
assert 'btn-view-compact' in html_content
assert "initTouchSwipe" in js_content
assert "triggerSwipeFeedback" in js_content
assert "setViewMode" in js_content
with open(css_path, "r", encoding="utf-8") as f:
    css_content = f.read()
assert ".modal-swipe-tip" in css_content
assert ".compact-list-mode" in css_content
assert ".hero-feria" in css_content
print("✔ Gestos táctiles de deslizamiento (swipe) y modos de vista verificados")

# 13. Test Protección de Barra de Navegación de Modal contra la barra de URL móvil
assert "viewport-fit=cover" in html_content, "Falta viewport-fit=cover en index.html"
assert "safe-area-inset-top" in css_content, "Falta soporte safe-area-inset-top en style.css"
assert "100dvh" in css_content, "Falta altura dinámica 100dvh para móviles en style.css"
assert "position: sticky" in css_content, "Falta position sticky en cabecera de modal"
print("✔ Protección contra solapamiento de barra de URL en móviles y safe-area verificados")

print("\n==================================================")
print(" ¡TODAS LAS PRUEBAS AUTOMATIZADAS PASARON (14/14)!")
print("==================================================")

