# MI COLECCIÓN · COCHES A ESCALA 🏁

Aplicación web estática, moderna, elegante y de alto rendimiento diseñada para exhibir un catálogo personal de más de 1.165 coches a escala (1:64) y sus fotografías en alta calidad.

Optimizada para su despliegue inmediato en **GitHub Pages**, sin necesidad de servidor, base de datos ni dependencias externas.

---

## 📸 Características Principales

- **Arquitectura 100% Estática:** Desarrollada con HTML5 semántico, CSS3 nativo y JavaScript Vanilla moderno (ES6+).
- **Diseño Automovilístico Premium:** Tema oscuro (*Dark Mode*) inspirado en catálogos de marcas de lujo y superdeportivos, con acento personalizable mediante variables CSS.
- **Rendimiento Excepcional:** Carga diferida de imágenes (`loading="lazy"`), procesamiento en memoria de los 1.165 registros y paginación eficiente (100 coches por página por defecto, o 50 y 200).
- **Buscador en Tiempo Real:** Búsqueda instantánea con *debounce* simultánea en Marca, Modelo, Fabricante y Color, insensible a mayúsculas y acentos (p. ej., `Ẽfini`, `Citroën`).
- **Filtros Dinámicos:** Desplegables de Marca (107 marcas), Fabricante (25 fabricantes), Color (14 colores), Rango de Años (Desde/Hasta) y Competición (Sí/No).
- **Ordenación Completa:** Por Nº (ascendente/descendente), Marca (A-Z/Z-A), Modelo (A-Z/Z-A), Año (antiguo/moderno) y Fabricante (A-Z/Z-A).
- **Ficha Detallada del Coche (Modal):** Vista completa con fotografía en alta resolución, especificaciones y navegación **Anterior / Siguiente que respeta estrictamente los filtros activos**.
- **Enlace Directo Compartible:** Soporte de URLs con *hash* (p. ej., `#coche-1`) para compartir o guardar fichas individuales directamente.
- **Lightbox / Galería:** Visor a pantalla completa con modo de zoom interactivo (tecla `Z` o clic).
- **Estadísticas Dinámicas:** Pestaña con métricas clave, gráficos de barras del Top 15 marcas, fabricantes, épocas históricas, cuadrícula de los 14 colores y ratio competición vs calle.
- **Accesibilidad y Atajos de Teclado:** Cierre de modales con `Escape`, navegación entre coches con las flechas `←` y `→`, y soporte para lectores de pantalla.
- **100% Responsive:** Diseñado y probado para pantallas de 320px, 375px, 390px, 430px, 768px, 1024px y 1440px sin scroll horizontal accidental.

---

## 📁 Estructura del Proyecto

```text
mi-coleccion/
├── index.html              # Estructura principal, vistas y modales
├── css/
│   └── style.css           # Estilos tema oscuro, responsive y variables
├── js/
│   └── app.js              # Lógica de filtrado, paginación, modal y estadísticas
├── data/
│   └── cars.json           # Base de datos JSON (1.165 registros de coches)
├── images/
│   ├── logo.png            # Icono e identidad visual
│   ├── 0001 - Toyota AE86 Sprinter Trueno.jpg
│   ├── 0002 - Nissan Skyline GT-R R34 V-SPEC Nur.jpg
│   └── ...                 # Fotografías JPG de los 1.165 coches
├── tools/
│   └── excel_to_json.py    # Script Python para convertir el Excel a cars.json
├── .gitignore              # Protege el Excel maestro de subirse a repositorios públicos
└── README.md               # Esta documentación
```

---

## 🚀 Cómo Probar la Web en Local

Al ser un sitio web estático que realiza una petición `fetch` al archivo local `data/cars.json`, se recomienda abrirlo a través de un servidor HTTP local básico:

### Opción 1: Con Python (Recomendado)
Abre una terminal o PowerShell en la carpeta del proyecto y ejecuta:

```bash
python -m http.server 8000
```

Luego abre tu navegador en:
👉 `http://localhost:8000`

### Opción 2: Con la extensión Live Server de VS Code
1. Abre la carpeta del proyecto en Visual Studio Code.
2. Haz clic derecho sobre `index.html` y selecciona **"Open with Live Server"**.

---

## 🛠️ Conversión Excel -> JSON (`tools/excel_to_json.py`)

El archivo Excel maestro (`1 64.xlsx`) contiene todos tus datos originales en la hoja `Hoja1` (filas 4 a 1168, columnas A:G) y los hipervínculos a las fotos en la columna A.

Para generar o actualizar el catálogo web:

### Requisitos:
Tener instalado Python 3 y la librería `openpyxl`:
```bash
pip install openpyxl
```

### Ejecución básica:
```bash
python tools/excel_to_json.py
```

### Opciones avanzadas del script:
```bash
# Copiar automáticamente las imágenes transparentes de SinFondo a images/:
python tools/excel_to_json.py --copy-images

# Indicar rutas personalizadas si el Excel o las fotos están en otra ubicación:
python tools/excel_to_json.py --excel "C:\Ruta\Al\1 64.xlsx" --photos-dir "C:\Ruta\A\SinFondo" --copy-images
```

El script se encarga de:
1. Leer filas 4 a 1168 de `Hoja1`.
2. Extraer hipervínculos de la columna A y decodificar caracteres como `%20`.
3. Resolver y asociar inteligentemente la foto física correcta correspondiente al Nº de cada coche.
4. Convertir `Si` a `true` y `No` a `false`.
5. Mantener campos vacíos como `null`.
6. Preservar caracteres Unicode (acentos, eñes, diacríticos como `Ẽ`).
7. Informar por consola del recuento de coches procesados y emitir advertencias si detecta anomalías.

---

## 🌐 Publicación en GitHub Pages (Paso a Paso)

Tu web está 100% preparada con rutas relativas para funcionar tanto en la raíz de un dominio como en un subdirectorio de GitHub Pages (p. ej. `https://usuario.github.io/mi-coleccion/`).

### Paso 1: Crear el repositorio en GitHub
1. Inicia sesión en [GitHub](https://github.com).
2. Haz clic en el botón verde **"New"** para crear un nuevo repositorio.
3. Asígnale un nombre (por ejemplo: `mi-coleccion` o `coches-escala`).
4. Selecciona **Public** (Público).
5. **NO** marques "Add a README file" ni "Add .gitignore" (ya los tenemos creados).
6. Haz clic en **"Create repository"**.

### Paso 2: Subir el proyecto desde tu ordenador
Abre una terminal o PowerShell en la carpeta de tu proyecto (`mi-coleccion`) y ejecuta los siguientes comandos:

```bash
# Inicializar repositorio local
git init

# Vincular todos los archivos del proyecto (el .gitignore protegerá automáticamente tu archivo Excel)
git add .

# Crear el primer commit
git commit -m "Catálogo completo de mi colección de coches a escala"

# Establecer la rama principal
git branch -M main

# Conectar con tu repositorio en GitHub (sustituye TU_USUARIO y TU_REPOSITORIO)
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# Subir los archivos a GitHub
git push -u origin main
```

> ⚠️ **Nota de privacidad:** El archivo `.gitignore` incluido en el proyecto garantiza que tu archivo maestro `1 64.xlsx` y archivos temporales **nunca** se suban al repositorio público.

### Paso 3: Activar GitHub Pages
1. En la página de tu repositorio en GitHub, entra en la pestaña **Settings** (Configuración).
2. En el menú lateral izquierdo, haz clic en **Pages**.
3. En la sección **Build and deployment**:
   - **Source:** Selecciona `Deploy from a branch`.
   - **Branch:** Selecciona `main` y en la carpeta selecciona `/ (root)`.
4. Haz clic en el botón **Save**.

### Paso 4: Obtener tu URL pública
En unos 1 o 2 minutos, GitHub completará el despliegue y mostrará un mensaje arriba en la sección Pages con tu enlace:

👉 **`https://TU_USUARIO.github.io/TU_REPOSITORIO/`**

¡Tu catálogo ya estará en línea, accesible desde cualquier móvil, tablet o PC del mundo!

---

## 🔄 Cómo Actualizar la Colección Posteriormente

Cuando añadas nuevos coches o modifiques registros en tu Excel (`1 64.xlsx`):

### Método Rápido (1 solo clic en Windows):
Haz **doble clic** sobre el archivo:
👉 **`actualizar_coleccion.bat`**

Este archivo se encarga automáticamente de:
1. Detectar los cambios en el Excel (hoja `Principal` u `Hoja1`).
2. Copiar las nuevas fotos transparentes de la carpeta `SinFondo` a `images/`.
3. Actualizar `data/cars.json`.
4. Ejecutar las comprobaciones automáticas de integridad.

### Método por Terminal:
```bash
python tools/excel_to_json.py --copy-images
```

### Subir los cambios a GitHub Pages:
Para que los cambios se reflejen en la web pública:
```bash
git add data/ images/
git commit -m "Actualizar colección: nuevos coches añadidos"
git push
```
GitHub Pages actualizará automáticamente la web en 1 o 2 minutos.

---

## 🏷️ Configuración de Dominio Personalizado (Opcional)

Si en el futuro deseas que la web se visualice bajo un dominio propio (por ejemplo, `www.micolecciondecoches.com`):

1. En el panel de control de tu proveedor de dominio (Namecheap, GoDaddy, Cloudflare, etc.), añade un registro **CNAME**:
   - **Tipo:** CNAME
   - **Nombre / Host:** `www`
   - **Valor / Destino:** `TU_USUARIO.github.io`
2. En GitHub, dentro de **Settings** > **Pages** > **Custom domain**, escribe tu dominio (ej. `www.micolecciondecoches.com`) y pulsa **Save**.
3. Marca la casilla **"Enforce HTTPS"** para activar el certificado SSL gratuito que proporciona GitHub.

---

## 🎨 Personalización del Tema

Puedes cambiar el color de acento principal editando la variable `--accent` en la cabecera de `css/style.css`:

```css
:root {
  /* Rojo Deportivo (Actual): */
  --accent: #ff3344;

  /* Otras sugerencias automovilísticas: */
  /* --accent: #ff6b00; */ /* Naranja McLaren / GT */
  /* --accent: #0088ff; */ /* Azul Eléctrico Alpina */
  /* --accent: #10b981; */ /* Verde British Racing */
  /* --accent: #eab308; */ /* Amarillo Giallo Módena */
}
```

---

## 📄 Licencia

Colección particular. Código y diseño liberados para uso personal y exhibición sin fines comerciales.
