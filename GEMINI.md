# PROYECTO: MIS COCHECITOS (Colección de Coches a Escala 1:64)

## Descripción General
Catálogo web moderno, 100% estático, responsive y de alto rendimiento para coleccionistas de coches a escala (~1.452 modelos). Está desplegado y alojado en **GitHub Pages** sin backend, bases de datos ni frameworks externos (HTML5 semántico, CSS3 moderno y Vanilla JavaScript ES6+).

## Reglas y Decisiones Clave de Diseño
1. **Arquitectura Estática y Privacidad**:
   - Todo se carga desde archivos locales relativos (`./data/cars.json`, `./images/...`).
   - El archivo Excel maestro (`1 64.xlsx`) se mantiene en el Escritorio del usuario y NUNCA se sube a Git (está en `.gitignore`).
2. **Insignias de Tipo de Vehículo**:
   - **Competición / Carreras**: Insignia con la bandera a cuadros (`🏁`) y recuadro/borde en color rojo (`#e63946`).
   - **Calle / Carretera**: Insignia con el icono vectorial de una carretera (`badge-road-icon`) y recuadro/borde en color azul (`#3b82f6` / `#60a5fa`).
3. **Diseño Móvil**:
   - Totalmente adaptable a móviles sin scroll horizontal (`overflow-x: hidden`).
   - El encabezado superior se reorganiza verticalmente en pantallas estrechas.
   - La ficha modal de detalle se presenta en formato tarjeta adaptable (o bottom-sheet) con indicador de posición compacto (`1 / 1.452`).
4. **Flujo de Actualización**:
   - El usuario actualiza datos en su Excel (`C:\Users\dani\Desktop\1 64\1 64.xlsx`) o renombra/añade fotos en su carpeta de Escritorio (`C:\Users\dani\Desktop\1 64\SinFondo`).
   - Para aplicar los cambios a la web, ejecuta con doble clic el script: `actualizar_coleccion.bat`.
   - Luego abre **GitHub Desktop**, escribe un resumen de los cambios, y pulsa `Commit to main` y `Push origin`.

## Estructura del Repositorio
- `index.html`: Estructura principal con buscador, filtros dinámicos, paginación (50/100/200), ficha modal y estadísticas.
- `css/style.css`: Estilos visuales en tema oscuro automovilístico (dark theme).
- `js/app.js`: Lógica de búsqueda normalizada, filtrado instantáneo, renderizado de tarjetas, modal con soporte para teclado y navegación.
- `data/cars.json`: Base de datos estática generada a partir del Excel.
- `images/`: Fotos transparentes de los modelos (`.png`) e icono general `logo.png`.
- `tools/excel_to_json.py`: Script conversor de Excel a JSON y sincronizador de fotos.
- `tools/test_catalog.py`: Suite de 10 pruebas automatizadas para verificar integridad de datos e imágenes.
- `actualizar_coleccion.bat`: Lanzador de actualización en 1 clic para Windows con detección inteligente de Python.
