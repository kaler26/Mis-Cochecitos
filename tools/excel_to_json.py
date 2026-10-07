#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Conversor de Excel a JSON para la Colección de Coches a Escala.
Lee 'Hoja1' de '1 64.xlsx', extrae las columnas A:G y los hipervínculos
de las fotografías, y genera 'data/cars.json'.
"""

import sys
import os
import argparse
import urllib.parse
import json
import shutil
import unicodedata

# Asegurar codificación UTF-8 en salida de consola en Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

try:
    import openpyxl
except ImportError:
    print("[ERROR] Falta la librería 'openpyxl'. Instálala ejecutando: pip install openpyxl")
    sys.exit(1)


def normalize_text(text):
    if not text:
        return ""
    return "".join(
        c for c in unicodedata.normalize("NFD", str(text))
        if unicodedata.category(c) != "Mn"
    ).lower().strip()


def parse_arguments():
    # Rutas por defecto relativas al script y a la máquina del usuario
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    
    # Buscar posible ubicación del Excel
    default_excel_candidates = [
        os.path.join(project_dir, "1 64.xlsx"),
        os.path.join(r"C:\Users\dani\Desktop\1 64", "1 64.xlsx"),
        os.path.join(os.path.expanduser("~"), "Desktop", "1 64", "1 64.xlsx"),
    ]
    default_excel = next((p for p in default_excel_candidates if os.path.exists(p)), default_excel_candidates[1])
    
    default_output = os.path.join(project_dir, "data", "cars.json")
    default_output_special = os.path.join(project_dir, "data", "special_collections.json")
    
    # Buscar posible carpeta de fotos de origen (priorizando SinFondo con fotos transparentes)
    default_photos_candidates = [
        os.path.join(project_dir, "SinFondo"),
        os.path.join(os.path.dirname(default_excel), "SinFondo"),
        os.path.join(r"C:\Users\dani\Desktop\1 64", "SinFondo"),
        os.path.join(os.path.expanduser("~"), "Desktop", "1 64", "SinFondo"),
        os.path.join(project_dir, "Fotos"),
        os.path.join(os.path.dirname(default_excel), "Fotos"),
        os.path.join(r"C:\Users\dani\Desktop\1 64", "Fotos"),
        os.path.join(os.path.expanduser("~"), "Desktop", "1 64", "Fotos"),
    ]
    default_photos = next((p for p in default_photos_candidates if os.path.exists(p)), default_photos_candidates[2])

    default_fallback_photos_candidates = [
        os.path.join(project_dir, "Fotos"),
        os.path.join(os.path.dirname(default_excel), "Fotos"),
        os.path.join(r"C:\Users\dani\Desktop\1 64", "Fotos"),
        os.path.join(os.path.expanduser("~"), "Desktop", "1 64", "Fotos"),
    ]
    default_fallback_photos = next((p for p in default_fallback_photos_candidates if os.path.exists(p)), default_fallback_photos_candidates[1])

    default_dest_images = os.path.join(project_dir, "images")

    parser = argparse.ArgumentParser(description="Convierte el catálogo Excel a cars.json y special_collections.json")
    parser.add_argument("--excel", "-e", default=default_excel, help="Ruta al archivo Excel (.xlsx)")
    parser.add_argument("--output", "-o", default=default_output, help="Ruta del archivo JSON del catálogo principal")
    parser.add_argument("--output-special", "-s", default=default_output_special, help="Ruta del archivo JSON de colecciones especiales")
    parser.add_argument("--photos-dir", "-p", default=default_photos, help="Carpeta de fotos original (SinFondo)")
    parser.add_argument("--fallback-photos-dir", "-f", default=default_fallback_photos, help="Carpeta secundaria de fotos (Fotos)")
    parser.add_argument("--copy-images", "-c", action="store_true", help="Copiar automáticamente las fotos a la carpeta images/")
    parser.add_argument("--dest-images", "-d", default=default_dest_images, help="Carpeta destino de imágenes del proyecto")
    return parser.parse_args()


def main():
    args = parse_arguments()

    print("==================================================")
    print(" CONVERSOR EXCEL -> JSON (MI COLECCIÓN DE COCHES)")
    print("==================================================")
    print(f"Archivo Excel:   {args.excel}")
    print(f"Salida JSON:     {args.output}")
    print(f"Carpeta Fotos:   {args.photos_dir}")
    print(f"Copiar imágenes: {'SÍ' if args.copy_images else 'NO'}")
    print("--------------------------------------------------")

    if not os.path.exists(args.excel):
        print(f"[ERROR] No se encontró el archivo Excel en: {args.excel}")
        sys.exit(1)

    # Crear directorios de salida si no existen
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    if args.copy_images:
        os.makedirs(args.dest_images, exist_ok=True)

    # Indizar fotos disponibles si existe el directorio
    available_photos = {}
    if os.path.exists(args.photos_dir):
        for fname in os.listdir(args.photos_dir):
            if fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                available_photos[fname.lower()] = fname
                # Indizar también por prefijo numérico "0001" -> "0001 - Toyota AE86..."
                prefix = fname[:4]
                if prefix.isdigit():
                    available_photos[f"id_{int(prefix)}"] = fname
        print(f"[INFO] Se detectaron {len(available_photos)} archivos en la carpeta de fotos.")
    else:
        print(f"[ADVERTENCIA] No se encontró la carpeta de fotos en '{args.photos_dir}'. No se verificará existencia física.")

    print(f"[INFO] Leyendo libro Excel...")
    wb = openpyxl.load_workbook(args.excel, data_only=True)
    
    # Detectar hoja: 'Principal', 'Hoja1' o la hoja activa del libro
    sheet_name = None
    for candidate in ["Principal", "Hoja1"]:
        if candidate in wb.sheetnames:
            sheet_name = candidate
            break
    if not sheet_name:
        sheet_name = wb.sheetnames[0]

    ws = wb[sheet_name]
    print(f"[INFO] Procesando hoja '{sheet_name}'...")

    cars = []
    warnings = []
    copied_count = 0
    missing_photos_count = 0

    max_row = ws.max_row

    for row_idx in range(4, max_row + 1):
        cell_a = ws.cell(row=row_idx, column=1)
        val_id = cell_a.value

        # 4. Ignorar las filas sin Nº
        if val_id is None or str(val_id).strip() == "":
            continue

        try:
            car_id = int(float(val_id))
        except (ValueError, TypeError):
            # Si no es un número entero válido, ignorar o advertir
            warnings.append(f"Fila {row_idx}: Nº '{val_id}' no es un entero válido. Se omite fila.")
            continue

        # Leer columnas B:G
        val_brand = ws.cell(row=row_idx, column=2).value
        val_model = ws.cell(row=row_idx, column=3).value
        val_manufacturer = ws.cell(row=row_idx, column=4).value
        val_year = ws.cell(row=row_idx, column=5).value
        val_color = ws.cell(row=row_idx, column=6).value
        val_competition = ws.cell(row=row_idx, column=7).value

        # Limpiar cadenas vacías o con solo espacios -> null
        def clean_str(v):
            if v is None:
                return None
            s = str(v).strip()
            return s if s else None

        brand = clean_str(val_brand)
        model = clean_str(val_model)
        manufacturer = clean_str(val_manufacturer)
        color = clean_str(val_color)

        # Año: convertir a int si es posible, o null
        year = None
        if val_year is not None and str(val_year).strip() != "":
            try:
                year = int(float(val_year))
            except (ValueError, TypeError):
                year = str(val_year).strip()
                warnings.append(f"Coche #{car_id}: Año '{val_year}' no es numérico.")

        # Competicion: "Si" -> true, "No" -> false, vacío -> null
        competition = None
        if val_competition is not None:
            comp_str = str(val_competition).strip().lower()
            if comp_str in ["si", "sí", "yes", "true", "1"]:
                competition = True
            elif comp_str in ["no", "false", "0"]:
                competition = False
            else:
                competition = None
                warnings.append(f"Coche #{car_id}: Valor de competición no reconocido ('{val_competition}').")

        # 6. Obtener nombre de la fotografía desde el hipervínculo de la columna A
        image_filename = None
        if cell_a.hyperlink and cell_a.hyperlink.target:
            target = cell_a.hyperlink.target
            # Ignorar si es about:blank
            if not target.startswith("about:"):
                # 7. Convertir rutas relativas Windows y decodificar caracteres como %20
                decoded = urllib.parse.unquote(target)
                raw_filename = os.path.basename(decoded.replace("\\", "/"))
                # Si no es una URL genérica sin nombre de imagen
                if "." in raw_filename:
                    image_filename = raw_filename

        # Comprobar si existe la fotografía y resolver posibles discrepancias de nombre
        resolved_filename = image_filename
        if available_photos:
            # 1. Si existe un archivo físico con el prefijo exacto de este coche (ej. "0325 - ..."):
            #    Comprobamos si el hipervínculo apuntaba a otro ID (típico error de copia en Excel)
            if f"id_{car_id}" in available_photos:
                disk_file = available_photos[f"id_{car_id}"]
                hl_id_match = False
                if image_filename and len(image_filename) >= 4 and image_filename[:4].isdigit():
                    hl_id_match = (int(image_filename[:4]) == car_id)

                if not image_filename or image_filename.lower() != disk_file.lower():
                    resolved_filename = disk_file
                    if image_filename and not hl_id_match:
                        warnings.append(f"Coche #{car_id}: Hipervínculo apuntaba a '{image_filename}', pero se resolvió al archivo correcto por ID '{resolved_filename}'.")
                else:
                    resolved_filename = disk_file
            # 2. Búsqueda exacta del nombre del hipervínculo si no había por prefijo
            elif image_filename and image_filename.lower() in available_photos:
                resolved_filename = available_photos[image_filename.lower()]
            else:
                missing_photos_count += 1
                warnings.append(f"Coche #{car_id} ({brand} {model}): No se encontró la fotografía '{image_filename}'.")
        elif not image_filename:
            # Si no hay hipervínculo ni fotos
            resolved_filename = f"{car_id:04d} - {brand or ''} {model or ''}.jpg".strip()
            warnings.append(f"Coche #{car_id}: Sin hipervínculo de fotografía en celda A. Se asignó '{resolved_filename}'.")

        # Ruta relativa final para la web estática: "images/<nombre_archivo>"
        final_image_path = f"images/{resolved_filename}" if resolved_filename else None

        # Copiar imagen si se solicitó
        if args.copy_images and resolved_filename and os.path.exists(args.photos_dir):
            src_img = os.path.join(args.photos_dir, resolved_filename)
            dst_img = os.path.join(args.dest_images, resolved_filename)
            if os.path.exists(src_img):
                if not os.path.exists(dst_img) or os.path.getsize(src_img) != os.path.getsize(dst_img):
                    shutil.copy2(src_img, dst_img)
                    copied_count += 1

        # Comprobación de campos críticos
        if not brand:
            warnings.append(f"Coche #{car_id}: Marca vacía.")
        if not model:
            warnings.append(f"Coche #{car_id}: Modelo vacío.")

        # Añadir al catálogo en el modelo de datos exacto requerido
        car_record = {
            "id": car_id,
            "brand": brand,
            "model": model,
            "manufacturer": manufacturer,
            "year": year,
            "color": color,
            "competition": competition,
            "image": final_image_path
        }
        cars.append(car_record)

    # 10. Generar data/cars.json con UTF-8 e indentación legible
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(cars, f, ensure_ascii=False, indent=2)

    # 11. Extraer dinámicamente las colecciones temáticas (Fast & Furious, Cultura Pop, Motos...)
    special_collections, special_copied = extract_special_collections(ws, args, warnings)

    print("--------------------------------------------------")
    print(f" PROCESO COMPLETADO")
    print(f" Catálogo principal (coches): {len(cars)}")
    for sec_k, sec_items in special_collections.items():
        print(f" • {sec_k}: {len(sec_items)} modelos")
    if args.copy_images:
        print(f" Total imágenes copiadas a 'images/': {copied_count + special_copied}")
    if missing_photos_count > 0:
        print(f" [AVISO] Fotografías no encontradas en catálogo principal: {missing_photos_count}")
    print(f" Total advertencias/avisos: {len(warnings)}")
    print(f" Archivo principal: {args.output}")
    print(f" Archivo colecciones: {args.output_special}")
    print("--------------------------------------------------")

    if warnings:
        print("\nDetalle de advertencias:")
        for w in warnings[:20]:
            print(f"  • {w}")
        if len(warnings) > 20:
            print(f"  ... y {len(warnings) - 20} advertencias adicionales.")

    print("\n¡cars.json y special_collections.json generados correctamente!")


def extract_special_collections(ws, args, warnings):
    """
    Busca dinámicamente las secciones de colecciones especiales por nombre
    en la hoja de cálculo (Fast & Furious, Cultura Pop, Motos...)
    para que el script funcione de forma robusta sin importar en qué fila o columna se ubiquen.
    """
    special_sections_def = [
        {
            "key": "fast_and_furious",
            "search_names": ["fast and furious", "fast & furious", "a todo gas", "fast and furious:"],
            "title": "Fast & Furious",
            "prefix_tags": ["fast and furious", "fast & furious", "fast"]
        },
        {
            "key": "cultura_pop",
            "search_names": ["cultura pop", "culturapop", "cultura pop:", "pop"],
            "title": "Cultura Pop",
            "prefix_tags": ["cultura pop", "cultura"]
        },
        {
            "key": "motos",
            "search_names": ["motos", "moto", "motocicletas", "motos:"],
            "title": "Motos",
            "prefix_tags": ["motos", "moto"]
        }
    ]

    # Indexar fotos disponibles en SinFondo (primaria) y Fotos (secundaria)
    sinfondo_files = {}
    if os.path.exists(args.photos_dir):
        for f in os.listdir(args.photos_dir):
            if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                sinfondo_files[normalize_text(f)] = f

    fotos_files = {}
    if os.path.exists(args.fallback_photos_dir):
        for f in os.listdir(args.fallback_photos_dir):
            if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                fotos_files[normalize_text(f)] = f

    def resolve_special_image(prefix_tags, item_id, hl_target, brand, model):
        # 1. Por hipervínculo
        if hl_target:
            decoded = urllib.parse.unquote(hl_target)
            raw_fname = os.path.basename(decoded.replace("\\\\", "/").replace("\\", "/"))
            base, _ = os.path.splitext(raw_fname)
            for ext in [".png", ".jpg", ".jpeg", ".webp"]:
                cand = normalize_text(base + ext)
                if cand in sinfondo_files:
                    return sinfondo_files[cand], os.path.join(args.photos_dir, sinfondo_files[cand])
                if cand in fotos_files:
                    return fotos_files[cand], os.path.join(args.fallback_photos_dir, fotos_files[cand])
            raw_norm = normalize_text(raw_fname)
            if raw_norm in sinfondo_files:
                return sinfondo_files[raw_norm], os.path.join(args.photos_dir, sinfondo_files[raw_norm])
            if raw_norm in fotos_files:
                return fotos_files[raw_norm], os.path.join(args.fallback_photos_dir, fotos_files[raw_norm])

        # 2. Por prefijo y número de ID (ej. "fast and furious 01", "cultura pop 01", "motos 01")
        for p in prefix_tags:
            for fmt in [f"{p} {item_id:02d}", f"{p} {item_id}", f"{p}{item_id:02d}", f"{p}{item_id}"]:
                norm_p = normalize_text(fmt)
                for cand_norm, orig_name in sinfondo_files.items():
                    if cand_norm.startswith(norm_p):
                        return orig_name, os.path.join(args.photos_dir, orig_name)
                for cand_norm, orig_name in fotos_files.items():
                    if cand_norm.startswith(norm_p):
                        return orig_name, os.path.join(args.fallback_photos_dir, orig_name)

        # 3. Por modelo si coincide con el prefijo
        if model:
            norm_model = normalize_text(model)
            for p in prefix_tags:
                for cand_norm, orig_name in sinfondo_files.items():
                    if normalize_text(p) in cand_norm and norm_model in cand_norm:
                        return orig_name, os.path.join(args.photos_dir, orig_name)
                for cand_norm, orig_name in fotos_files.items():
                    if normalize_text(p) in cand_norm and norm_model in cand_norm:
                        return orig_name, os.path.join(args.fallback_photos_dir, orig_name)

        return None, None

    special_collections = {}
    copied_count = 0

    print("\n==================================================")
    print(" PROCESANDO COLECCIONES ESPECIALES (BÚSQUEDA DINÁMICA)")
    print("==================================================")

    for sdef in special_sections_def:
        sec_key = sdef["key"]
        sec_title = sdef["title"]

        # 1. Búsqueda dinámica en cualquier fila/columna por coincidencia de nombre
        found_r, found_c = None, None
        for r in range(1, ws.max_row + 1):
            for c in range(1, ws.max_column + 1):
                cell_v = ws.cell(row=r, column=c).value
                if cell_v and isinstance(cell_v, str):
                    v_clean = normalize_text(cell_v).rstrip(":").strip()
                    if any(v_clean == normalize_text(sn).rstrip(":").strip() for sn in sdef["search_names"]):
                        found_r, found_c = r, c
                        break
            if found_r:
                break

        if not found_r:
            warnings.append(f"Colección especial '{sec_title}' no encontrada dinámicamente en el Excel.")
            continue

        print(f"[INFO] Sección '{sec_title}' encontrada en Fila {found_r}, Columna {found_c}.")

        # 2. Mapeo dinámico de cabeceras en la misma fila
        header_map = {}
        header_row = found_r
        for offset in range(1, 10):
            h_val = ws.cell(row=header_row, column=found_c + offset).value
            if h_val:
                h_norm = normalize_text(h_val)
                if "marca" in h_norm: header_map["brand"] = offset
                elif "modelo" in h_norm: header_map["model"] = offset
                elif "fabricante" in h_norm: header_map["manufacturer"] = offset
                elif "ano" in h_norm or "año" in h_norm: header_map["year"] = offset
                elif "color" in h_norm: header_map["color"] = offset
                elif "pelicula" in h_norm: header_map["movie"] = offset
                elif "universo" in h_norm: header_map["universe"] = offset

        # 3. Iteración de filas hasta fin de bloque
        items = []
        curr_r = header_row + 1
        consecutive_empty = 0

        while curr_r <= ws.max_row:
            cell_id = ws.cell(row=curr_r, column=found_c)
            v = cell_id.value
            if v is None or str(v).strip() == "":
                consecutive_empty += 1
                if consecutive_empty >= 3:
                    break
                curr_r += 1
                continue
            consecutive_empty = 0

            try:
                it_id = int(float(v))
            except (ValueError, TypeError):
                # Si es un texto reconocible como otra sección o cabecera
                v_norm = normalize_text(v)
                if any(k in v_norm for k in ["fast", "cultura", "motos", "gastos", "tops", "trabajo", "total"]):
                    break
                curr_r += 1
                continue

            def get_val(field_key):
                if field_key in header_map:
                    val = ws.cell(row=curr_r, column=found_c + header_map[field_key]).value
                    if val is not None:
                        s = str(val).strip()
                        return s if s else None
                return None

            brand = get_val("brand")
            model = get_val("model")
            manufacturer = get_val("manufacturer")
            color = get_val("color")
            movie = get_val("movie")
            universe = get_val("universe")
            year_raw = get_val("year")
            year = None
            if year_raw:
                try:
                    year = int(float(year_raw))
                except (ValueError, TypeError):
                    year = year_raw

            hl = cell_id.hyperlink.target if cell_id.hyperlink else None
            img_name, img_path = resolve_special_image(sdef["prefix_tags"], it_id, hl, brand, model)

            if not img_name:
                warnings.append(f"{sec_title} #{it_id} ({brand} {model}): No se encontró fotografía en SinFondo ni Fotos.")

            # Copiar imagen si se solicitó
            if args.copy_images and img_name and img_path and os.path.exists(img_path):
                dst_img = os.path.join(args.dest_images, img_name)
                if not os.path.exists(dst_img) or os.path.getsize(img_path) != os.path.getsize(dst_img):
                    shutil.copy2(img_path, dst_img)
                    copied_count += 1

            item_obj = {
                "id": it_id,
                "brand": brand,
                "model": model,
                "manufacturer": manufacturer,
                "year": year,
                "color": color,
                "movie": movie,
                "universe": universe,
                "image": f"images/{img_name}" if img_name else None
            }
            # Limpiar campos nulos
            item_obj = {k: v for k, v in item_obj.items() if v is not None}
            items.append(item_obj)
            curr_r += 1

        special_collections[sec_key] = items
        print(f"  ✔ {sec_title}: {len(items)} items procesados (imágenes encontradas: {sum(1 for i in items if 'image' in i)}/{len(items)})")

    # Guardar special_collections.json
    os.makedirs(os.path.dirname(os.path.abspath(args.output_special)), exist_ok=True)
    with open(args.output_special, "w", encoding="utf-8") as f:
        json.dump(special_collections, f, ensure_ascii=False, indent=2)

    print(f"[INFO] Colecciones especiales guardadas en: {args.output_special}")
    return special_collections, copied_count


if __name__ == "__main__":
    main()
