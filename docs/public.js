let map;
let markers = [];
let data = [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Inicializar mapa
    map = initMap('map');
    
    // Cargar datos desde GitHub
    await cargarDatos();
    
    // Configurar event listeners
    setupEventListeners();
}

async function cargarDatos() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Error al cargar datos');
        data = await response.json();
        poblarSelectores();
        mostrarTodosCentros();
    } catch (error) {
        console.error('Error al cargar datos:', error);
        alert('Error al cargar los datos. Por favor, intente más tarde.');
    }
}

function poblarSelectores() {
    const enseñanzaSelect = document.getElementById('enseñanza');
    const cicloSelect = document.getElementById('ciclo');

    const enseñanzas = [...new Set(data.map(item => item.ENSEÑANZA))];

    enseñanzaSelect.innerHTML = '<option value="">Todas</option>';
    cicloSelect.innerHTML = '<option value="">Todos</option>';

    enseñanzas.forEach(enseñanza => {
        const option = document.createElement('option');
        option.value = enseñanza;
        option.textContent = enseñanza;
        enseñanzaSelect.appendChild(option);
    });
}

function setupEventListeners() {
    document.getElementById('enseñanza').addEventListener('change', actualizarCicloSelector);
    document.getElementById('ciclo').addEventListener('change', actualizarMapaConFiltros);
    document.querySelectorAll('input[name="curso"]').forEach(radio => {
        radio.addEventListener('change', actualizarMapaConFiltros);
    });
}

function actualizarCicloSelector() {
    const enseñanzaSeleccionada = document.getElementById('enseñanza').value;
    const cicloSelect = document.getElementById('ciclo');

    const ciclos = enseñanzaSeleccionada === '' 
        ? [...new Set(data.map(item => item.CICLO))]
        : [...new Set(data.filter(item => item.ENSEÑANZA === enseñanzaSeleccionada).map(item => item.CICLO))];

    cicloSelect.innerHTML = '<option value="">Todos</option>';
    ciclos.forEach(ciclo => {
        const option = document.createElement('option');
        option.value = ciclo;
        option.textContent = ciclo;
        cicloSelect.appendChild(option);
    });

    actualizarMapaConFiltros();
}

function actualizarMapaConFiltros() {
    const enseñanzaSeleccionada = document.getElementById('enseñanza').value;
    const cicloSeleccionado = document.getElementById('ciclo').value;
    const cursoSeleccionado = document.querySelector('input[name="curso"]:checked').value;

    const popupsAbiertos = markers.filter(marker => marker.isPopupOpen()).map(marker => ({
        centro: marker.centro,
        latlng: marker.getLatLng()
    }));

    const filteredData = filtrarDatos(data, enseñanzaSeleccionada, cicloSeleccionado, cursoSeleccionado);
    actualizarMapa(filteredData, popupsAbiertos);
}

function actualizarMapa(filteredData, popupsAbiertos = []) {
    // Limpiar marcadores existentes
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Agrupar datos por centro
    const centrosAgrupados = {};
    filteredData.forEach(item => {
        if (!centrosAgrupados[item.CENTRO]) {
            centrosAgrupados[item.CENTRO] = [];
        }
        centrosAgrupados[item.CENTRO].push(item);
    });

    // Crear marcadores
    Object.entries(centrosAgrupados).forEach(([centro, items]) => {
        const primerItem = items[0];
        
        if (primerItem.LATITUD && primerItem.LONGITUD) {
            const centroId = generarIdSeguro(centro);
            const marker = L.marker(
                [primerItem.LATITUD, primerItem.LONGITUD], 
                { icon: getIcon(primerItem.CICLO) }
            );
            
            marker.centro = centro;
            marker.bindPopup(() => generarContenidoPopup(centro, items, false, centroId));
            marker.addTo(map);
            markers.push(marker);

            // Restaurar popups abiertos
            const popupAbierto = popupsAbiertos.find(p => p.centro === centro);
            if (popupAbierto) {
                marker.openPopup();
            }
        }
    });
}

function mostrarTodosCentros() {
    actualizarMapaConFiltros();
}
