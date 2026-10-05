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

    default_dest_images = os.path.join(project_dir, "images")

    parser = argparse.ArgumentParser(description="Convierte el catálogo Excel a cars.json")
    parser.add_argument("--excel", "-e", default=default_excel, help="Ruta al archivo Excel (.xlsx)")
    parser.add_argument("--output", "-o", default=default_output, help="Ruta del archivo JSON de salida")
    parser.add_argument("--photos-dir", "-p", default=default_photos, help="Carpeta de fotos original")
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

    print("--------------------------------------------------")
    print(f" PROCESO COMPLETADO")
    print(f" Coches procesados con éxito: {len(cars)}")
    if args.copy_images:
        print(f" Imágenes copiadas a 'images/': {copied_count}")
    if missing_photos_count > 0:
        print(f" [AVISO] Fotografías no encontradas: {missing_photos_count}")
    print(f" Total advertencias/avisos: {len(warnings)}")
    print(f" Archivo guardado en: {args.output}")
    print("--------------------------------------------------")

    if warnings:
        print("\nDetalle de advertencias:")
        for w in warnings[:20]:
            print(f"  • {w}")
        if len(warnings) > 20:
            print(f"  ... y {len(warnings) - 20} advertencias adicionales.")

    print("\n¡cars.json generado correctamente!")


if __name__ == "__main__":
    main()
