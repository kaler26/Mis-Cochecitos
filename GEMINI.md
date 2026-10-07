# PROYECTO: MIS COCHECITOS (Colección de Coches a Escala 1:64)

## Descripción General
Catálogo web moderno, 100% estático, responsive y de alto rendimiento para coleccionistas de coches a escala (~1.452 modelos principales más colecciones temáticas de Fast & Furious, Cultura Pop y Motos). Está desplegado y alojado en **GitHub Pages** sin backend, bases de datos ni frameworks externos (HTML5 semántico, CSS3 moderno y Vanilla JavaScript ES6+).

## Reglas y Decisiones Clave de Diseño
1. **Arquitectura Estática y Privacidad**:
   - Todo se carga desde archivos locales relativos (`./data/cars.json`, `./data/special_collections.json`, `./images/...`).
   - El archivo Excel maestro (`1 64.xlsx`) se mantiene en el Escritorio del usuario y NUNCA se sube a Git (está en `.gitignore`).
2. **Detección Dinámica de Colecciones en Excel**:
   - Las colecciones secundarias (**Fast & Furious**, **Cultura Pop**, **Motos**) se extraen dinámicamente buscando el nombre de cada sección en cualquier fila o celda de la hoja, adaptándose automáticamente si el usuario mueve filas o añade más coches en el futuro.
3. **Insignias de Tipo de Vehículo**:
   - **Competición / Carreras**: Insignia con la bandera a cuadros (`🏁`) y recuadro/borde en color rojo (`#e63946`).
   - **Calle / Carretera**: Insignia con el icono vectorial de una carretera (`badge-road-icon`) y recuadro/borde en color azul (`#3b82f6` / `#60a5fa`).
   - **Temáticas**: Etiquetas visuales para Película (`🎬`), Universo Pop (`🍿`) y Tipo Motocicleta (`🏍️`).
4. **Diseño Móvil**:
   - Totalmente adaptable a móviles con navegación por pestañas con scroll horizontal suave sin barras molestas.
   - La ficha modal de detalle se presenta en formato tarjeta adaptable (o bottom-sheet) con indicador de posición contextual (`1 / 33`, etc.).
5. **Flujo de Actualización**:
   - El usuario actualiza datos en su Excel (`C:\Users\dani\Desktop\1 64\1 64.xlsx`) o renombra/añade fotos en su carpeta de Escritorio (`C:\Users\dani\Desktop\1 64\SinFondo`).
   - Para aplicar los cambios a la web, ejecuta con doble clic el script: `actualizar_coleccion.bat`.
   - Luego abre **GitHub Desktop**, escribe un resumen de los cambios, y pulsa `Commit to main` y `Push origin`.

## Estructura del Repositorio
- `index.html`: Estructura principal con catálogo general, pestañas dedicadas (Fast & Furious, Cultura Pop, Motos), buscador instantáneo, modal y estadísticas.
- `css/style.css`: Estilos visuales en tema oscuro automovilístico (dark theme) con tarjetas y cabeceras temáticas.
- `js/app.js`: Lógica de filtrado dinámico, enrutamiento por hash (`#ff-1`, `#pop-1`, `#moto-1`), modal navegable y estadísticas.
- `data/cars.json`: Base de datos estática de la colección principal (~1.452 modelos).
- `data/special_collections.json`: Base de datos de Fast & Furious, Cultura Pop y Motos.
- `images/`: Fotos transparentes de los modelos (`.png`) e icono general `logo.png`.
- `tools/excel_to_json.py`: Script extractor dinámico de Excel a JSON con sincronización inteligente de fotos.
- `tools/test_catalog.py`: Suite de 11 pruebas automatizadas para verificar integridad de datos, rutas e imágenes.
- `actualizar_coleccion.bat`: Lanzador de actualización en 1 clic para Windows con detección inteligente de Python.
