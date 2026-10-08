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
4. **Diseño Móvil y Gestos**:
   - Totalmente adaptable a móviles con navegación por pestañas con scroll horizontal suave sin barras molestas.
   - La ficha modal de detalle se presenta en formato tarjeta adaptable (o bottom-sheet) con indicador de posición contextual (`1 / 33`, etc.).
   - **Gestos Táctiles (Swipe)**: Deslizamiento horizontal natural en la pantalla de detalle para cambiar de coche sin pulsar flechas, con animación fluida.
5. **Modo Feria & Antirrepeticiones**:
   - Pestaña especializada ultra-rápida pensada para mercadillos, tiendas y ferias.
   - Comprobador instantáneo sobre los 1.533 vehículos (colección principal + temáticas) que indica al coleccionista en tiempo real si un coche ya lo tiene o si no lo tiene (para comprarlo sin riesgo de repetir).
   - Incluye selector de ámbito, vista compacta de alta densidad y exportación/impresión de checklist.
6. **Modos de Vista**:
   - Alternador de visualización en catálogo principal: vista de cuadrícula fotográfica clásica o lista compacta optimizada.
7. **Filtros Rápidos por Décadas y Botón Flotante**:
   - Barra de chips horizontal con filtrado por épocas (`Clásicos <60s`, `60s`, `70s`, `80s`, `90s`, `2000s`, `2010s`, `Modernos 2020+`).
   - Botón flotante circular permanente `floating-back-to-top` que aparece suavemente con scroll para regresar al inicio.
8. **Zona de Pruebas: Vitrina de Exposición (Demo)**:
   - Pestaña `#vitrina-demo` para comparar efectos visuales de vitrina (peana 3D con sombra elíptica bajo las ruedas, iluminación LED, suelo pulido de showroom con reflejo especular) y modo comparativo "Normal vs Vitrina".
9. **Flujo de Actualización**:
   - El usuario actualiza datos en su Excel (`F:\Mis Cochecitos\1 64\1 64.xlsx` o en Escritorio) o renombra/añade fotos en su carpeta (`F:\Mis Cochecitos\1 64\SinFondo`).
   - Para aplicar los cambios a la web, ejecuta con doble clic el script: `actualizar_coleccion.bat`.
   - Luego abre **GitHub Desktop**, escribe un resumen de los cambios, y pulsa `Commit to main` y `Push origin`.

## Estructura del Repositorio
- `index.html`: Estructura principal con catálogo general, pestañas temáticas (Fast & Furious, Cultura Pop, Motos), Modo Feria & Antirrepeticiones, buscador instantáneo, modal y estadísticas.
- `css/style.css`: Estilos visuales en tema oscuro automovilístico (dark theme), tarjetas, cabeceras temáticas, estilos de impresión y animaciones táctiles.
- `js/app.js`: Lógica de filtrado dinámico, enrutamiento por hash (`#ff-1`, `#pop-1`, `#moto-1`, `#feria`), modal navegable con swipe táctil, checklist y estadísticas.
- `data/cars.json` y `data/cars.js`: Base de datos estática de la colección principal (~1.452 modelos) con soporte dual online/offline.
- `data/special_collections.json` y `data/special_collections.js`: Base de datos de Fast & Furious, Cultura Pop y Motos.
- `images/`: Fotos transparentes de los modelos (`.png`) e icono general `logo.png`.
- `tools/excel_to_json.py`: Script extractor dinámico de Excel a JSON con sincronización inteligente de fotos.
- `tools/test_catalog.py`: Suite de 14 pruebas automatizadas para verificar integridad de datos, rutas, imágenes, modo feria, gestos móviles y safe-area.
- `actualizar_coleccion.bat`: Lanzador de actualización en 1 clic para Windows con detección inteligente de Python.
