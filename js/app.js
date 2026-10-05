/**
 * MI COLECCIÓN · CATÁLOGO DE COCHES A ESCALA
 * Aplicación Web Estática de Alto Rendimiento
 * JavaScript Vanilla (ES6+) - Sin dependencias externas
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. ESTADO DE LA APLICACIÓN (EN MEMORIA)
  // =========================================================================
  const state = {
    allCars: [],            // Catálogo completo (1.165 registros cargados una sola vez)
    filteredCars: [],       // Registros que cumplen los filtros y búsqueda actuales
    activeTab: 'coleccion', // 'coleccion' | 'estadisticas' | 'acerca-de'
    
    // Filtros activos
    filters: {
      search: '',
      brand: '',
      manufacturer: '',
      color: '',
      competition: '',      // '' | 'true' | 'false'
      yearFrom: null,
      yearTo: null
    },

    // Ordenación
    sortBy: 'id_asc',

    // Paginación
    pagination: {
      currentPage: 1,
      pageSize: 100,
      totalPages: 1
    },

    // Modal de ficha de coche
    modal: {
      isOpen: false,
      currentFilteredIndex: -1
    },

    // Lightbox a pantalla completa
    lightbox: {
      isOpen: false,
      isZoomed: false
    }
  };

  // Mapeo visual de los 14 colores de la colección para los indicadores
  const COLOR_PALETTE = {
    'Blanco': '#ffffff',
    'Azul': '#2563eb',
    'Rojo': '#dc2626',
    'Negro': '#111827',
    'Verde': '#16a34a',
    'Plateado': '#94a3b8',
    'Amarillo': '#eab308',
    'Naranja': '#ea580c',
    'Gris': '#64748b',
    'Morado': '#9333ea',
    'Marrón': '#78350f',
    'Rosa': '#ec4899',
    'Dorado': '#d97706',
    'Beige': '#d4b896'
  };

  // =========================================================================
  // 2. REFERENCIAS A ELEMENTOS DEL DOM
  // =========================================================================
  const dom = {
    // Pestañas y Navegación
    navBtns: document.querySelectorAll('.nav-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    // Hero KPIs
    statTotalCars: document.getElementById('stat-total-cars'),
    statTotalBrands: document.getElementById('stat-total-brands'),
    statTotalManufacturers: document.getElementById('stat-total-manufacturers'),

    // Búsqueda y Filtros
    searchInput: document.getElementById('search-input'),
    searchClearBtn: document.getElementById('search-clear-btn'),
    toggleFiltersBtn: document.getElementById('toggle-filters-btn'),
    activeFiltersCount: document.getElementById('active-filters-count'),
    filtersGrid: document.getElementById('filters-grid'),
    filterBrand: document.getElementById('filter-brand'),
    filterManufacturer: document.getElementById('filter-manufacturer'),
    filterColor: document.getElementById('filter-color'),
    filterCompetition: document.getElementById('filter-competition'),
    filterYearFrom: document.getElementById('filter-year-from'),
    filterYearTo: document.getElementById('filter-year-to'),
    resetFiltersBtn: document.getElementById('reset-filters-btn'),
    emptyResetBtn: document.getElementById('empty-reset-btn'),

    // Resultados, chips y ordenación
    resultsCounter: document.getElementById('results-counter'),
    activeFilterChips: document.getElementById('active-filter-chips'),
    sortSelect: document.getElementById('sort-select'),
    pageSizeSelect: document.getElementById('page-size-select'),

    // Catálogo
    carsGrid: document.getElementById('cars-grid'),
    emptyState: document.getElementById('empty-state'),
    pagination: document.getElementById('pagination'),

    // Modal Ficha
    carModal: document.getElementById('car-modal'),
    modalBackdrop: document.getElementById('modal-backdrop'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalPrevBtn: document.getElementById('modal-prev-btn'),
    modalNextBtn: document.getElementById('modal-next-btn'),
    modalCarPosition: document.getElementById('modal-car-position'),
    modalImageTrigger: document.getElementById('modal-image-trigger'),
    modalCarImg: document.getElementById('modal-car-img'),
    modalCarNumber: document.getElementById('modal-car-number'),
    modalCarBrand: document.getElementById('modal-car-brand'),
    modalCarTitle: document.getElementById('modal-car-title'),
    modalSpecID: document.getElementById('modal-spec-id'),
    modalSpecManufacturer: document.getElementById('modal-spec-manufacturer'),
    modalSpecYear: document.getElementById('modal-spec-year'),
    modalSpecColorDot: document.getElementById('modal-spec-color-dot'),
    modalSpecColorText: document.getElementById('modal-spec-color-text'),
    modalSpecCompBadge: document.getElementById('modal-spec-comp-badge'),
    modalShareBtn: document.getElementById('modal-share-btn'),
    modalShareText: document.getElementById('modal-share-text'),
    modalFilterByBrandBtn: document.getElementById('modal-filter-by-brand-btn'),

    // Lightbox
    lightbox: document.getElementById('lightbox'),
    lightboxBackdrop: document.getElementById('lightbox-backdrop'),
    lightboxCloseBtn: document.getElementById('lightbox-close-btn'),
    lightboxZoomBtn: document.getElementById('lightbox-zoom-btn'),
    lightboxTitle: document.getElementById('lightbox-title'),
    lightboxImg: document.getElementById('lightbox-img'),

    // Estadísticas
    kpiTotalCars: document.getElementById('kpi-total-cars'),
    kpiCompetitionRatio: document.getElementById('kpi-competition-ratio'),
    kpiOldestYear: document.getElementById('kpi-oldest-year'),
    kpiNewestYear: document.getElementById('kpi-newest-year'),
    statBrandsTotalCount: document.getElementById('stat-brands-total-count'),
    statManufacturersTotalCount: document.getElementById('stat-manufacturers-total-count'),
    chartCompetition: document.getElementById('chart-competition'),
    chartBrands: document.getElementById('chart-brands'),
    chartManufacturers: document.getElementById('chart-manufacturers'),
    chartColors: document.getElementById('chart-colors'),
    chartDecades: document.getElementById('chart-decades'),

    // Utilidades
    backToTopBtn: document.getElementById('back-to-top-btn')
  };

  // =========================================================================
  // 3. UTILIDADES DE TEXTO Y BÚSQUEDA
  // =========================================================================
  
  // Normalizar cadenas para búsqueda sin acentos ni diacríticos
  function normalizeText(text) {
    if (!text) return '';
    return String(text)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  // Formato de número con punto para millares en español (ej. 1.165)
  function formatNumber(num) {
    return new Intl.NumberFormat('es-ES').format(num);
  }

  // Debounce para optimizar la respuesta mientras el usuario escribe en el buscador
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Color dot background helper
  function getColorHex(colorName) {
    return COLOR_PALETTE[colorName] || '#666d7c';
  }

  // =========================================================================
  // 4. CARGA INICIAL DE DATOS
  // =========================================================================
  async function loadData() {
    try {
      // Ruta relativa para máxima compatibilidad con GitHub Pages
      const response = await fetch('./data/cars.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      state.allCars = data;
      state.filteredCars = [...state.allCars];

      // Inicializar la interfaz y componentes
      initKPIs();
      populateFilterDropdowns();
      renderStats();
      applyFiltersAndSort();
      initRouting();

    } catch (error) {
      console.error('Error cargando cars.json:', error);
      dom.resultsCounter.textContent = 'Error al cargar los datos de la colección.';
      dom.carsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #ff5263;">
          <h3>No se pudo cargar el catálogo de coches</h3>
          <p style="margin-top: 0.5rem; color: #9ea5b3;">Asegúrate de que el archivo <code>data/cars.json</code> existe y es accesible.</p>
        </div>
      `;
    }
  }

  // =========================================================================
  // 5. INICIALIZACIÓN DE RESUMEN Y CONTADORES (KPIs)
  // =========================================================================
  function initKPIs() {
    const total = state.allCars.length;
    const brands = new Set(state.allCars.map(c => c.brand).filter(Boolean)).size;
    const manufacturers = new Set(state.allCars.map(c => c.manufacturer).filter(Boolean)).size;

    dom.statTotalCars.textContent = formatNumber(total);
    dom.statTotalBrands.textContent = formatNumber(brands);
    dom.statTotalManufacturers.textContent = formatNumber(manufacturers);
  }

  // =========================================================================
  // 6. GENERACIÓN DINÁMICA DE FILTROS DESPLEGABLES
  // =========================================================================
  function populateFilterDropdowns() {
    const brandsSet = new Set();
    const manufacturersSet = new Set();
    const colorsSet = new Set();
    const yearsSet = new Set();

    state.allCars.forEach(car => {
      if (car.brand) brandsSet.add(car.brand);
      if (car.manufacturer) manufacturersSet.add(car.manufacturer);
      if (car.color) colorsSet.add(car.color);
      if (car.year) yearsSet.add(car.year);
    });

    // Ordenar con criterio alfabético en español
    const sortedBrands = Array.from(brandsSet).sort((a, b) => a.localeCompare(b, 'es'));
    const sortedManufacturers = Array.from(manufacturersSet).sort((a, b) => a.localeCompare(b, 'es'));
    const sortedColors = Array.from(colorsSet).sort((a, b) => a.localeCompare(b, 'es'));
    const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);

    // 1. Marcas
    sortedBrands.forEach(brand => {
      const opt = document.createElement('option');
      opt.value = brand;
      opt.textContent = brand;
      dom.filterBrand.appendChild(opt);
    });

    // 2. Fabricantes
    sortedManufacturers.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      dom.filterManufacturer.appendChild(opt);
    });

    // 3. Colores
    sortedColors.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      dom.filterColor.appendChild(opt);
    });

    // 4. Años (Desde / Hasta)
    sortedYears.forEach(year => {
      const optFrom = document.createElement('option');
      optFrom.value = year;
      optFrom.textContent = year;
      dom.filterYearFrom.appendChild(optFrom);

      const optTo = document.createElement('option');
      optTo.value = year;
      optTo.textContent = year;
      dom.filterYearTo.appendChild(optTo);
    });
  }

  // =========================================================================
  // 7. MOTOR DE BÚSQUEDA, FILTRADO Y ORDENACIÓN
  // =========================================================================
  function applyFiltersAndSort() {
    const searchTerms = normalizeText(state.filters.search);
    const brandFilter = state.filters.brand;
    const manFilter = state.filters.manufacturer;
    const colorFilter = state.filters.color;
    const compFilter = state.filters.competition;
    const yearFrom = state.filters.yearFrom ? parseInt(state.filters.yearFrom, 10) : null;
    const yearTo = state.filters.yearTo ? parseInt(state.filters.yearTo, 10) : null;

    // Filtrar sobre los 1.165 coches
    state.filteredCars = state.allCars.filter(car => {
      // 1. Buscador simultáneo en: marca, modelo, fabricante, color
      if (searchTerms) {
        const brand = normalizeText(car.brand);
        const model = normalizeText(car.model);
        const manufacturer = normalizeText(car.manufacturer);
        const color = normalizeText(car.color);
        
        const combined = `${brand} ${model} ${manufacturer} ${color}`;
        if (!combined.includes(searchTerms)) {
          return false;
        }
      }

      // 2. Filtro Marca
      if (brandFilter && car.brand !== brandFilter) {
        return false;
      }

      // 3. Filtro Fabricante
      if (manFilter && car.manufacturer !== manFilter) {
        return false;
      }

      // 4. Filtro Color
      if (colorFilter && car.color !== colorFilter) {
        return false;
      }

      // 5. Filtro Competición
      if (compFilter !== '') {
        const isComp = compFilter === 'true';
        if (car.competition !== isComp) {
          return false;
        }
      }

      // 6. Filtro Año
      if (yearFrom !== null && (car.year === null || car.year < yearFrom)) {
        return false;
      }
      if (yearTo !== null && (car.year === null || car.year > yearTo)) {
        return false;
      }

      return true;
    });

    // Ordenar resultados
    sortFilteredCars();

    // Actualizar paginación
    state.pagination.totalPages = Math.max(1, Math.ceil(state.filteredCars.length / state.pagination.pageSize));
    if (state.pagination.currentPage > state.pagination.totalPages) {
      state.pagination.currentPage = 1;
    }

    // Renderizar vistas
    renderResultsBar();
    renderCatalog();
    renderPagination();
    updateFilterBadges();
  }

  function sortFilteredCars() {
    const sortBy = state.sortBy;
    state.filteredCars.sort((a, b) => {
      switch (sortBy) {
        case 'id_desc':
          return (b.id || 0) - (a.id || 0);

        case 'brand_asc': {
          const res = (a.brand || '').localeCompare(b.brand || '', 'es');
          return res !== 0 ? res : (a.id || 0) - (b.id || 0);
        }
        case 'brand_desc': {
          const res = (b.brand || '').localeCompare(a.brand || '', 'es');
          return res !== 0 ? res : (a.id || 0) - (b.id || 0);
        }

        case 'model_asc': {
          const res = (a.model || '').localeCompare(b.model || '', 'es');
          return res !== 0 ? res : (a.id || 0) - (b.id || 0);
        }
        case 'model_desc': {
          const res = (b.model || '').localeCompare(a.model || '', 'es');
          return res !== 0 ? res : (a.id || 0) - (b.id || 0);
        }

        case 'year_asc': {
          const yA = a.year != null ? a.year : 9999;
          const yB = b.year != null ? b.year : 9999;
          if (yA !== yB) return yA - yB;
          return (a.id || 0) - (b.id || 0);
        }
        case 'year_desc': {
          const yA = a.year != null ? a.year : -1;
          const yB = b.year != null ? b.year : -1;
          if (yA !== yB) return yB - yA;
          return (a.id || 0) - (b.id || 0);
        }

        case 'manufacturer_asc': {
          const res = (a.manufacturer || '').localeCompare(b.manufacturer || '', 'es');
          return res !== 0 ? res : (a.id || 0) - (b.id || 0);
        }
        case 'manufacturer_desc': {
          const res = (b.manufacturer || '').localeCompare(a.manufacturer || '', 'es');
          return res !== 0 ? res : (a.id || 0) - (b.id || 0);
        }

        case 'id_asc':
        default:
          return (a.id || 0) - (b.id || 0);
      }
    });
  }

  // =========================================================================
  // 8. RENDERIZADO DEL CATÁLOGO Y TARJETAS
  // =========================================================================
  function renderCatalog() {
    const { currentPage, pageSize } = state.pagination;
    const total = state.filteredCars.length;

    if (total === 0) {
      dom.carsGrid.innerHTML = '';
      dom.emptyState.classList.remove('hidden');
      dom.pagination.classList.add('hidden');
      return;
    }

    dom.emptyState.classList.add('hidden');
    dom.pagination.classList.remove('hidden');

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);
    const pageCars = state.filteredCars.slice(startIndex, endIndex);

    const fragment = document.createDocumentFragment();

    pageCars.forEach((car, indexOnPage) => {
      const globalFilteredIndex = startIndex + indexOnPage;
      const card = createCarCard(car, globalFilteredIndex);
      fragment.appendChild(card);
    });

    dom.carsGrid.innerHTML = '';
    dom.carsGrid.appendChild(fragment);
  }

  function createCarCard(car, globalFilteredIndex) {
    const article = document.createElement('article');
    article.className = 'car-card';
    article.setAttribute('role', 'listitem');
    article.setAttribute('tabindex', '0');
    article.setAttribute('aria-label', `${car.brand || ''} ${car.model || ''}, Nº ${car.id}`);

    const formattedId = String(car.id).padStart(4, '0');
    const colorHex = getColorHex(car.color);
    const photoAlt = `${car.brand || ''} ${car.model || ''}`;

    article.innerHTML = `
      <div class="car-card-media">
        <span class="car-badge-id">#${formattedId}</span>
        ${car.competition ? `<span class="car-badge-competition">🏁 Competición</span>` : ''}
        <img 
          class="car-card-img" 
          src="./${car.image || ''}" 
          alt="${photoAlt}" 
          loading="lazy" 
          decoding="async"
          onerror="this.onerror=null; this.src='./images/logo.png'; this.style.opacity='0.4';"
        >
      </div>
      <div class="car-card-body">
        <div class="car-brand-tag">${escapeHtml(car.brand || '—')}</div>
        <h3 class="car-model-name">${escapeHtml(car.model || '—')}</h3>
        <div class="car-meta-line">
          <span>${escapeHtml(car.manufacturer || '—')}</span>
          <span class="meta-dot">·</span>
          <span>${car.year || '—'}</span>
        </div>
        ${car.color ? `
          <div class="car-color-tag">
            <span class="color-dot" style="background-color: ${colorHex};"></span>
            <span>${escapeHtml(car.color)}</span>
          </div>
        ` : ''}
      </div>
    `;

    // Abrir ficha al hacer clic o con Enter
    article.addEventListener('click', () => openCarModal(globalFilteredIndex));
    article.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openCarModal(globalFilteredIndex);
      }
    });

    return article;
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // 9. CONTADOR DE RESULTADOS Y CHIPS ACTIVOS
  // =========================================================================
  function renderResultsBar() {
    const total = state.allCars.length;
    const count = state.filteredCars.length;
    const { currentPage, pageSize } = state.pagination;

    if (count === 0) {
      dom.resultsCounter.textContent = `0 de ${formatNumber(total)} coches`;
    } else {
      const from = (currentPage - 1) * pageSize + 1;
      const to = Math.min(currentPage * pageSize, count);
      dom.resultsCounter.textContent = `Mostrando ${from}-${to} de ${formatNumber(count)} coches` + 
        (count < total ? ` (filtrados de ${formatNumber(total)})` : '');
    }

    renderActiveChips();
  }

  function renderActiveChips() {
    dom.activeFilterChips.innerHTML = '';
    const f = state.filters;

    const chips = [];
    if (f.search) chips.push({ key: 'search', label: `"${f.search}"` });
    if (f.brand) chips.push({ key: 'brand', label: `Marca: ${f.brand}` });
    if (f.manufacturer) chips.push({ key: 'manufacturer', label: `Fabricante: ${f.manufacturer}` });
    if (f.color) chips.push({ key: 'color', label: `Color: ${f.color}` });
    if (f.competition !== '') chips.push({ key: 'competition', label: f.competition === 'true' ? 'Competición: Sí' : 'Competición: No' });
    if (f.yearFrom || f.yearTo) {
      const yFrom = f.yearFrom || 'Min';
      const yTo = f.yearTo || 'Max';
      chips.push({ key: 'year', label: `Años: ${yFrom} - ${yTo}` });
    }

    chips.forEach(chip => {
      const chipEl = document.createElement('span');
      chipEl.className = 'filter-chip';
      chipEl.innerHTML = `
        <span>${escapeHtml(chip.label)}</span>
        <button type="button" class="chip-remove-btn" aria-label="Eliminar filtro">&times;</button>
      `;
      chipEl.querySelector('.chip-remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        removeFilter(chip.key);
      });
      dom.activeFilterChips.appendChild(chipEl);
    });
  }

  function removeFilter(key) {
    switch (key) {
      case 'search':
        state.filters.search = '';
        dom.searchInput.value = '';
        dom.searchClearBtn.classList.add('hidden');
        break;
      case 'brand':
        state.filters.brand = '';
        dom.filterBrand.value = '';
        break;
      case 'manufacturer':
        state.filters.manufacturer = '';
        dom.filterManufacturer.value = '';
        break;
      case 'color':
        state.filters.color = '';
        dom.filterColor.value = '';
        break;
      case 'competition':
        state.filters.competition = '';
        dom.filterCompetition.value = '';
        break;
      case 'year':
        state.filters.yearFrom = null;
        state.filters.yearTo = null;
        dom.filterYearFrom.value = '';
        dom.filterYearTo.value = '';
        break;
    }
    state.pagination.currentPage = 1;
    applyFiltersAndSort();
  }

  function updateFilterBadges() {
    let activeCount = 0;
    const f = state.filters;
    if (f.search) activeCount++;
    if (f.brand) activeCount++;
    if (f.manufacturer) activeCount++;
    if (f.color) activeCount++;
    if (f.competition !== '') activeCount++;
    if (f.yearFrom || f.yearTo) activeCount++;

    if (activeCount > 0) {
      dom.activeFiltersCount.textContent = activeCount;
      dom.activeFiltersCount.classList.remove('hidden');
    } else {
      dom.activeFiltersCount.classList.add('hidden');
    }
  }

  // =========================================================================
  // 10. PAGINACIÓN
  // =========================================================================
  function renderPagination() {
    const { currentPage, totalPages } = state.pagination;
    if (totalPages <= 1) {
      dom.pagination.innerHTML = '';
      return;
    }

    const fragment = document.createDocumentFragment();

    // Botón Anterior
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '← Anterior';
    prevBtn.disabled = currentPage === 1;
    prevBtn.setAttribute('aria-label', 'Página anterior');
    prevBtn.addEventListener('click', () => {
      if (state.pagination.currentPage > 1) {
        state.pagination.currentPage--;
        renderCatalog();
        renderPagination();
        scrollToCatalogTop();
      }
    });
    fragment.appendChild(prevBtn);

    // Lista inteligente de páginas
    const pages = getPaginationPages(currentPage, totalPages);

    pages.forEach(p => {
      if (p === '...') {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'page-ellipsis';
        ellipsis.textContent = '…';
        fragment.appendChild(ellipsis);
      } else {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${p === currentPage ? 'active' : ''}`;
        pageBtn.textContent = p;
        pageBtn.setAttribute('aria-label', `Página ${p}`);
        if (p === currentPage) {
          pageBtn.setAttribute('aria-current', 'page');
        }
        pageBtn.addEventListener('click', () => {
          if (state.pagination.currentPage !== p) {
            state.pagination.currentPage = p;
            renderCatalog();
            renderPagination();
            scrollToCatalogTop();
          }
        });
        fragment.appendChild(pageBtn);
      }
    });

    // Botón Siguiente
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = 'Siguiente →';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.setAttribute('aria-label', 'Página siguiente');
    nextBtn.addEventListener('click', () => {
      if (state.pagination.currentPage < totalPages) {
        state.pagination.currentPage++;
        renderCatalog();
        renderPagination();
        scrollToCatalogTop();
      }
    });
    fragment.appendChild(nextBtn);

    dom.pagination.innerHTML = '';
    dom.pagination.appendChild(fragment);
  }

  function getPaginationPages(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [];
    pages.push(1);

    if (current > 3) {
      pages.push('...');
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push('...');
    }

    pages.push(total);
    return pages;
  }

  function scrollToCatalogTop() {
    const panel = document.querySelector('.controls-panel');
    if (panel) {
      const offset = panel.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
    }
  }

  // =========================================================================
  // 11. FICHA DETALLADA DEL COCHE (MODAL CON ANTERIOR / SIGUIENTE FILTRADO)
  // =========================================================================
  function openCarModal(filteredIndex) {
    if (filteredIndex < 0 || filteredIndex >= state.filteredCars.length) return;

    state.modal.isOpen = true;
    state.modal.currentFilteredIndex = filteredIndex;

    updateModalContent();

    dom.carModal.classList.add('active');
    dom.carModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Sincronizar hash URL para poder compartir el enlace individual
    const car = state.filteredCars[filteredIndex];
    if (car && car.id) {
      history.replaceState(null, '', `#coche-${car.id}`);
    }
  }

  function updateModalContent() {
    const index = state.modal.currentFilteredIndex;
    const totalFiltered = state.filteredCars.length;
    const car = state.filteredCars[index];
    if (!car) return;

    // Actualizar indicador de posición respetando los filtros activos (formato compacto para móvil y desktop)
    dom.modalCarPosition.textContent = `${formatNumber(index + 1)} / ${formatNumber(totalFiltered)}`;

    // Botones Anterior / Siguiente
    dom.modalPrevBtn.disabled = index === 0;
    dom.modalNextBtn.disabled = index === totalFiltered - 1;

    // Fotografía
    dom.modalCarImg.src = `./${car.image || ''}`;
    dom.modalCarImg.alt = `${car.brand || ''} ${car.model || ''}`;
    dom.modalCarNumber.textContent = `#${String(car.id).padStart(4, '0')}`;

    // Datos principales
    dom.modalCarBrand.textContent = car.brand || '—';
    dom.modalCarTitle.textContent = car.model || '—';
    dom.modalSpecID.textContent = `#${car.id}`;
    dom.modalSpecManufacturer.textContent = car.manufacturer || '—';
    dom.modalSpecYear.textContent = car.year || '—';

    // Color
    const colorHex = getColorHex(car.color);
    dom.modalSpecColorDot.style.backgroundColor = colorHex;
    dom.modalSpecColorText.textContent = car.color || 'No especificado';

    // Competición
    if (car.competition) {
      dom.modalSpecCompBadge.className = 'badge-competition competition-yes';
      dom.modalSpecCompBadge.textContent = '🏁 Competición';
    } else {
      dom.modalSpecCompBadge.className = 'badge-competition competition-no';
      dom.modalSpecCompBadge.textContent = '🚗 Calle / Carretera';
    }

    // Configurar acción "Ver más de esta marca"
    dom.modalFilterByBrandBtn.onclick = () => {
      closeCarModal();
      switchTab('coleccion');
      resetAllFilters(false);
      state.filters.brand = car.brand || '';
      dom.filterBrand.value = car.brand || '';
      applyFiltersAndSort();
      scrollToCatalogTop();
    };

    // Compartir enlace
    dom.modalShareText.textContent = 'Copiar enlace';
    dom.modalShareBtn.onclick = async () => {
      const url = `${window.location.origin}${window.location.pathname}#coche-${car.id}`;
      try {
        await navigator.clipboard.writeText(url);
        dom.modalShareText.textContent = '¡Enlace copiado!';
        setTimeout(() => { dom.modalShareText.textContent = 'Copiar enlace'; }, 2000);
      } catch (err) {
        // Fallback si clipboard API no está disponible
        prompt('Copia el enlace de esta ficha:', url);
      }
    };
  }

  function navigateModal(direction) {
    const newIndex = state.modal.currentFilteredIndex + direction;
    if (newIndex >= 0 && newIndex < state.filteredCars.length) {
      state.modal.currentFilteredIndex = newIndex;
      updateModalContent();
      const car = state.filteredCars[newIndex];
      if (car && car.id) {
        history.replaceState(null, '', `#coche-${car.id}`);
      }
    }
  }

  function closeCarModal() {
    if (!state.modal.isOpen) return;
    state.modal.isOpen = false;
    dom.carModal.classList.remove('active');
    dom.carModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Restaurar URL sin el coche individual
    if (window.location.hash.startsWith('#coche-')) {
      history.replaceState(null, '', `#${state.activeTab}`);
    }
  }

  // =========================================================================
  // 12. LIGHTBOX A PANTALLA COMPLETA
  // =========================================================================
  function openLightbox() {
    const car = state.filteredCars[state.modal.currentFilteredIndex];
    if (!car) return;

    state.lightbox.isOpen = true;
    state.lightbox.isZoomed = false;

    dom.lightboxTitle.textContent = `${car.brand || ''} ${car.model || ''} (#${car.id})`;
    dom.lightboxImg.src = `./${car.image || ''}`;
    dom.lightboxImg.alt = `${car.brand || ''} ${car.model || ''}`;
    dom.lightboxImg.classList.remove('zoomed');

    dom.lightbox.classList.add('active');
    dom.lightbox.setAttribute('aria-hidden', 'false');
  }

  function toggleLightboxZoom() {
    state.lightbox.isZoomed = !state.lightbox.isZoomed;
    dom.lightboxImg.classList.toggle('zoomed', state.lightbox.isZoomed);
  }

  function closeLightbox() {
    if (!state.lightbox.isOpen) return;
    state.lightbox.isOpen = false;
    state.lightbox.isZoomed = false;
    dom.lightboxImg.classList.remove('zoomed');
    dom.lightbox.classList.remove('active');
    dom.lightbox.setAttribute('aria-hidden', 'true');
  }

  // =========================================================================
  // 13. SECCIÓN DE ESTADÍSTICAS (DINÁMICAS Y SIN DEPENDENCIAS)
  // =========================================================================
  function renderStats() {
    const total = state.allCars.length;
    if (total === 0) return;

    // 1. Métricas clave
    const compCars = state.allCars.filter(c => c.competition === true).length;
    const streetCars = total - compCars;
    const compPct = ((compCars / total) * 100).toFixed(1);

    const validYears = state.allCars.map(c => c.year).filter(y => y !== null && y > 1900);
    const oldestYear = validYears.length ? Math.min(...validYears) : '—';
    const newestYear = validYears.length ? Math.max(...validYears) : '—';

    dom.kpiTotalCars.textContent = formatNumber(total);
    dom.kpiCompetitionRatio.textContent = `${compPct}% (${formatNumber(compCars)})`;
    dom.kpiOldestYear.textContent = oldestYear;
    dom.kpiNewestYear.textContent = newestYear;

    // 2. Gráfico Competición vs Calle (Barra dividida interactiva)
    const streetPct = (100 - parseFloat(compPct)).toFixed(1);
    dom.chartCompetition.innerHTML = `
      <div class="competition-split-bar">
        <div class="split-track">
          <div class="split-comp" style="width: ${compPct}%;" title="Competición: ${compCars} coches (${compPct}%)"></div>
          <div class="split-street" style="width: ${streetPct}%;" title="Calle: ${streetCars} coches (${streetPct}%)"></div>
        </div>
        <div class="split-legend">
          <div class="legend-item">
            <span class="legend-dot dot-comp"></span>
            <strong>Competición:</strong> ${formatNumber(compCars)} (${compPct}%)
          </div>
          <div class="legend-item">
            <span class="legend-dot dot-street"></span>
            <strong>Calle / Carretera:</strong> ${formatNumber(streetCars)} (${streetPct}%)
          </div>
        </div>
      </div>
    `;

    // 3. Top 15 Marcas
    const brandCounts = {};
    state.allCars.forEach(c => {
      if (c.brand) brandCounts[c.brand] = (brandCounts[c.brand] || 0) + 1;
    });
    const sortedBrands = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1]);

    dom.statBrandsTotalCount.textContent = `${sortedBrands.length} marcas en total`;

    const top15Brands = sortedBrands.slice(0, 15);
    const maxBrandCount = top15Brands[0] ? top15Brands[0][1] : 1;

    dom.chartBrands.innerHTML = top15Brands.map(([brand, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      const barWidth = ((count / maxBrandCount) * 100).toFixed(1);
      return `
        <div class="chart-bar-item" data-filter-brand="${escapeHtml(brand)}" title="Haz clic para ver todos los ${escapeHtml(brand)}">
          <div class="bar-meta">
            <span class="bar-name">${escapeHtml(brand)}</span>
            <span class="bar-counts">${count} coches (${pct}%)</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${barWidth}%;"></div>
          </div>
        </div>
      `;
    }).join('');

    // Click en marca para filtrar
    dom.chartBrands.querySelectorAll('.chart-bar-item').forEach(item => {
      item.addEventListener('click', () => {
        const brand = item.getAttribute('data-filter-brand');
        filterFromStats('brand', brand);
      });
    });

    // 4. Fabricantes
    const manCounts = {};
    state.allCars.forEach(c => {
      if (c.manufacturer) manCounts[c.manufacturer] = (manCounts[c.manufacturer] || 0) + 1;
    });
    const sortedMans = Object.entries(manCounts).sort((a, b) => b[1] - a[1]);
    dom.statManufacturersTotalCount.textContent = `${sortedMans.length} fabricantes en total`;

    const maxManCount = sortedMans[0] ? sortedMans[0][1] : 1;
    dom.chartManufacturers.innerHTML = sortedMans.map(([man, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      const barWidth = ((count / maxManCount) * 100).toFixed(1);
      return `
        <div class="chart-bar-item" data-filter-man="${escapeHtml(man)}" title="Haz clic para ver los de ${escapeHtml(man)}">
          <div class="bar-meta">
            <span class="bar-name">${escapeHtml(man)}</span>
            <span class="bar-counts">${count} coches (${pct}%)</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${barWidth}%;"></div>
          </div>
        </div>
      `;
    }).join('');

    dom.chartManufacturers.querySelectorAll('.chart-bar-item').forEach(item => {
      item.addEventListener('click', () => {
        const man = item.getAttribute('data-filter-man');
        filterFromStats('manufacturer', man);
      });
    });

    // 5. Distribución por Colores (14 colores)
    const colorCounts = {};
    state.allCars.forEach(c => {
      if (c.color) colorCounts[c.color] = (colorCounts[c.color] || 0) + 1;
    });
    const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);

    dom.chartColors.innerHTML = sortedColors.map(([color, count]) => {
      const swatch = getColorHex(color);
      const pct = ((count / total) * 100).toFixed(1);
      return `
        <div class="color-stat-card" data-filter-color="${escapeHtml(color)}" title="Haz clic para filtrar por color ${escapeHtml(color)}">
          <span class="color-stat-swatch" style="background-color: ${swatch};"></span>
          <div class="color-stat-info">
            <span class="color-stat-name">${escapeHtml(color)}</span>
            <span class="color-stat-count">${count} (${pct}%)</span>
          </div>
        </div>
      `;
    }).join('');

    dom.chartColors.querySelectorAll('.color-stat-card').forEach(item => {
      item.addEventListener('click', () => {
        const color = item.getAttribute('data-filter-color');
        filterFromStats('color', color);
      });
    });

    // 6. Distribución por Décadas
    const decades = {
      'Antes de 1970': 0,
      'Años 70': 0,
      'Años 80': 0,
      'Años 90': 0,
      'Años 2000': 0,
      'Años 2010': 0,
      'Años 2020+': 0
    };

    state.allCars.forEach(c => {
      if (!c.year) return;
      const y = c.year;
      if (y < 1970) decades['Antes de 1970']++;
      else if (y < 1980) decades['Años 70']++;
      else if (y < 1990) decades['Años 80']++;
      else if (y < 2000) decades['Años 90']++;
      else if (y < 2010) decades['Años 2000']++;
      else if (y < 2020) decades['Años 2010']++;
      else decades['Años 2020+']++;
    });

    const maxDecade = Math.max(...Object.values(decades));

    dom.chartDecades.innerHTML = Object.entries(decades).map(([decade, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      const barWidth = ((count / maxDecade) * 100).toFixed(1);
      return `
        <div class="chart-bar-item">
          <div class="bar-meta">
            <span class="bar-name">${decade}</span>
            <span class="bar-counts">${count} coches (${pct}%)</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${barWidth}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function filterFromStats(filterType, value) {
    switchTab('coleccion');
    resetAllFilters(false);
    if (filterType === 'brand') {
      state.filters.brand = value;
      dom.filterBrand.value = value;
    } else if (filterType === 'manufacturer') {
      state.filters.manufacturer = value;
      dom.filterManufacturer.value = value;
    } else if (filterType === 'color') {
      state.filters.color = value;
      dom.filterColor.value = value;
    }
    applyFiltersAndSort();
    scrollToCatalogTop();
  }

  // =========================================================================
  // 14. GESTIÓN DE PESTAÑAS Y ENRUTAMIENTO POR HASH
  // =========================================================================
  function switchTab(tabId) {
    state.activeTab = tabId;

    dom.navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    dom.tabPanes.forEach(pane => {
      const isActive = pane.id === `tab-${tabId}`;
      pane.classList.toggle('active', isActive);
      pane.hidden = !isActive;
    });

    // Actualizar hash sólo si no hay un modal abierto
    if (!state.modal.isOpen) {
      history.replaceState(null, '', `#${tabId}`);
    }
  }

  function initRouting() {
    function handleHash() {
      const hash = window.location.hash;
      if (hash.startsWith('#coche-')) {
        const id = parseInt(hash.replace('#coche-', ''), 10);
        if (!isNaN(id)) {
          // Buscar índice en los coches filtrados
          let idx = state.filteredCars.findIndex(c => c.id === id);
          if (idx === -1) {
            // Si no estaba en el filtrado, resetear filtros para que se vea
            resetAllFilters(false);
            applyFiltersAndSort();
            idx = state.filteredCars.findIndex(c => c.id === id);
          }
          if (idx !== -1) {
            switchTab('coleccion');
            openCarModal(idx);
            return;
          }
        }
      }

      if (hash === '#estadisticas') {
        switchTab('estadisticas');
      } else if (hash === '#acerca-de') {
        switchTab('acerca-de');
      } else {
        switchTab('coleccion');
      }
    }

    window.addEventListener('hashchange', handleHash);
    handleHash();
  }

  // =========================================================================
  // 15. RESTABLECER FILTROS
  // =========================================================================
  function resetAllFilters(reRender = true) {
    state.filters = {
      search: '',
      brand: '',
      manufacturer: '',
      color: '',
      competition: '',
      yearFrom: null,
      yearTo: null
    };

    dom.searchInput.value = '';
    dom.searchClearBtn.classList.add('hidden');
    dom.filterBrand.value = '';
    dom.filterManufacturer.value = '';
    dom.filterColor.value = '';
    dom.filterCompetition.value = '';
    dom.filterYearFrom.value = '';
    dom.filterYearTo.value = '';

    state.pagination.currentPage = 1;

    if (reRender) {
      applyFiltersAndSort();
    }
  }

  // =========================================================================
  // 16. EVENT LISTENERS
  // =========================================================================
  function initEventListeners() {
    // 1. Navegación por pestañas
    dom.navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        switchTab(tab);
      });
    });

    // 2. Buscador en tiempo real con debounce
    const handleSearch = debounce(() => {
      state.filters.search = dom.searchInput.value.trim();
      state.pagination.currentPage = 1;
      applyFiltersAndSort();
    }, 200);

    dom.searchInput.addEventListener('input', () => {
      if (dom.searchInput.value.trim()) {
        dom.searchClearBtn.classList.remove('hidden');
      } else {
        dom.searchClearBtn.classList.add('hidden');
      }
      handleSearch();
    });

    dom.searchClearBtn.addEventListener('click', () => {
      dom.searchInput.value = '';
      dom.searchClearBtn.classList.add('hidden');
      state.filters.search = '';
      state.pagination.currentPage = 1;
      applyFiltersAndSort();
      dom.searchInput.focus();
    });

    // 3. Botón colapsar filtros en móviles
    dom.toggleFiltersBtn.addEventListener('click', () => {
      const isOpen = dom.filtersGrid.classList.toggle('open');
      dom.toggleFiltersBtn.setAttribute('aria-expanded', isOpen);
    });

    // 4. Cambios en selects de filtros
    dom.filterBrand.addEventListener('change', () => {
      state.filters.brand = dom.filterBrand.value;
      state.pagination.currentPage = 1;
      applyFiltersAndSort();
    });

    dom.filterManufacturer.addEventListener('change', () => {
      state.filters.manufacturer = dom.filterManufacturer.value;
      state.pagination.currentPage = 1;
      applyFiltersAndSort();
    });

    dom.filterColor.addEventListener('change', () => {
      state.filters.color = dom.filterColor.value;
      state.pagination.currentPage = 1;
      applyFiltersAndSort();
    });

    dom.filterCompetition.addEventListener('change', () => {
      state.filters.competition = dom.filterCompetition.value;
      state.pagination.currentPage = 1;
      applyFiltersAndSort();
    });

    dom.filterYearFrom.addEventListener('change', () => {
      state.filters.yearFrom = dom.filterYearFrom.value || null;
      state.pagination.currentPage = 1;
      applyFiltersAndSort();
    });

    dom.filterYearTo.addEventListener('change', () => {
      state.filters.yearTo = dom.filterYearTo.value || null;
      state.pagination.currentPage = 1;
      applyFiltersAndSort();
    });

    // 5. Botones de limpiar filtros
    dom.resetFiltersBtn.addEventListener('click', () => resetAllFilters(true));
    dom.emptyResetBtn.addEventListener('click', () => resetAllFilters(true));

    // 6. Ordenación y tamaño de página
    dom.sortSelect.addEventListener('change', () => {
      state.sortBy = dom.sortSelect.value;
      applyFiltersAndSort();
    });

    dom.pageSizeSelect.addEventListener('change', () => {
      state.pagination.pageSize = parseInt(dom.pageSizeSelect.value, 10);
      state.pagination.currentPage = 1;
      applyFiltersAndSort();
    });

    // 7. Navegación y cierre de Modal
    dom.modalPrevBtn.addEventListener('click', () => navigateModal(-1));
    dom.modalNextBtn.addEventListener('click', () => navigateModal(1));
    dom.modalCloseBtn.addEventListener('click', closeCarModal);
    dom.modalBackdrop.addEventListener('click', closeCarModal);

    // 8. Lightbox
    dom.modalImageTrigger.addEventListener('click', openLightbox);
    dom.modalImageTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') openLightbox();
    });
    dom.lightboxCloseBtn.addEventListener('click', closeLightbox);
    dom.lightboxBackdrop.addEventListener('click', closeLightbox);
    dom.lightboxZoomBtn.addEventListener('click', toggleLightboxZoom);
    dom.lightboxImg.addEventListener('click', toggleLightboxZoom);

    // 9. Teclas de acceso rápido (ESC y flechas ← / →)
    window.addEventListener('keydown', (e) => {
      if (state.lightbox.isOpen) {
        if (e.key === 'Escape') {
          closeLightbox();
        } else if (e.key === 'z' || e.key === 'Z') {
          toggleLightboxZoom();
        }
        return;
      }

      if (state.modal.isOpen) {
        if (e.key === 'Escape') {
          closeCarModal();
        } else if (e.key === 'ArrowLeft') {
          navigateModal(-1);
        } else if (e.key === 'ArrowRight') {
          navigateModal(1);
        }
      }
    });

    // 10. Botón volver arriba
    dom.backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // =========================================================================
  // 17. ARRANQUE
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadData();
  });

})();
