let map;
let markers = [];
let data = [];
let dataCopia = [];
let nombreArchivoOriginal = '';
let ultimoNumeroOrden = -1;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    setupAuthListeners();
});

// Autenticación
function setupAuthListeners() {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            alert('Error de autenticación: ' + error.message);
        }
    });

    auth.onAuthStateChanged((user) => {
        if (user) {
            document.getElementById('loginPanel').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            initializeAdminPanel();
        } else {
            document.getElementById('loginPanel').style.display = 'block';
            document.getElementById('adminPanel').style.display = 'none';
        }
    });

    document.getElementById('btnLogout').addEventListener('click', () => {
        auth.signOut();
    });
}

// Inicialización del panel admin
async function initializeAdminPanel() {
    map = initMap('map');
    setupFileInput();
    setupEventListeners();
    await cargarDatosIniciales();
}

// Carga de datos
async function cargarDatosIniciales() {
    try {
        const snapshot = await db.collection('centros').get();
        data = snapshot.docs.map(doc => doc.data());
        dataCopia = JSON.parse(JSON.stringify(data));
        poblarSelectores();
        mostrarTodosCentros();
    } catch (error) {
        console.error('Error al cargar datos:', error);
        alert('Error al cargar los datos');
    }
}

// Configuración de entrada de archivo
function setupFileInput() {
    document.getElementById('fileInput').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                const reader = new FileReader();
                reader.onload = async function(e) {
                    const arrayBuffer = e.target.result;
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                    // Convertir datos numéricos
                    const processedData = data.map(item => ({
                        ...item,
                        LATITUD: parseFloat(item.LATITUD) || 0,
                        LONGITUD: parseFloat(item.LONGITUD) || 0,
                        "1º": parseInt(item["1º"]) || 0,
                        "2º": parseInt(item["2º"]) || 0,
                        "3º": parseInt(item["3º"]) || 0
                    }));

                    // Aquí irá el código para actualizar GitHub
                    await updateGitHubData(processedData);
                    
                    // Actualizar la vista
                    mostrarTodosCentros();
                };
                reader.readAsArrayBuffer(file);
            } catch (error) {
                console.error('Error al procesar el archivo:', error);
                alert('Error al procesar el archivo');
            }
        }
    });
}

async function updateGitHubData(data) {
    // Aquí implementaremos la actualización a GitHub
    // Usando GitHub API o Actions
}

// Event listeners y funciones auxiliares
function setupEventListeners() {
    document.getElementById('enseñanza').addEventListener('change', actualizarCicloSelector);
    document.getElementById('ciclo').addEventListener('change', actualizarMapaConFiltros);
    document.querySelectorAll('input[name="curso"]').forEach(radio => {
        radio.addEventListener('change', actualizarMapaConFiltros);
    });
    document.getElementById('btnGuardar').addEventListener('click', guardarCambios);
}

// ... Resto de funciones (poblarSelectores, actualizarCicloSelector, etc.) 
// similares a las del archivo original pero adaptadas para trabajar con Firebase

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

    const popupsAbiertos = markers.filter(marker => marker.isPopupOpen())
        .map(marker => ({
            centro: marker.centro,
            latlng: marker.getLatLng()
        }));

    const filteredData = data.filter(item => {
        const matchEnseñanza = !enseñanzaSeleccionada || item.ENSEÑANZA === enseñanzaSeleccionada;
        const matchCiclo = !cicloSeleccionado || item.CICLO === cicloSeleccionado;
        return matchEnseñanza && matchCiclo;
    });

    actualizarMapa(filteredData, popupsAbiertos);
}

function actualizarMapa(filteredData, popupsAbiertos = []) {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    const centrosAgrupados = {};
    filteredData.forEach(item => {
        if (!centrosAgrupados[item.CENTRO]) {
            centrosAgrupados[item.CENTRO] = [];
        }
        centrosAgrupados[item.CENTRO].push(item);
    });

    Object.entries(centrosAgrupados).forEach(([centro, items]) => {
        const primerItem = items[0];
        
        if (primerItem.LATITUD && primerItem.LONGITUD) {
            const centroId = generarIdSeguro(centro);
            const marker = L.marker(
                [primerItem.LATITUD, primerItem.LONGITUD], 
                { icon: getIcon(primerItem.CICLO) }
            );
            
            marker.centro = centro;
            marker.bindPopup(() => generarContenidoPopup(centro, items, true, centroId));
            marker.addTo(map);
            markers.push(marker);

            const popupAbierto = popupsAbiertos.find(p => p.centro === centro);
            if (popupAbierto) {
                marker.openPopup();
            }
        }
    });
}

function modificarVacantes(centro, ciclo, turno, curso, cambio, centroId, event) {
    event.stopPropagation();
    
    const item = data.find(item => 
        item.CENTRO === centro && 
        item.CICLO === ciclo && 
        item.TURNO === turno
    );
    
    if (!item) return;

    const elementId = `vacantes-${centroId}-${ciclo}-${turno}-${curso}`;
    const vacantesElement = document.getElementById(elementId);
    if (!vacantesElement) return;

    const valorActual = parseInt(vacantesElement.textContent) || 0;
    const nuevoValor = valorActual + cambio;
    
    if (nuevoValor >= 0) {
        vacantesElement.textContent = nuevoValor;
        item[curso] = nuevoValor;
        
        // Marcar como modificado
        const itemOriginal = dataCopia.find(i => 
            i.CENTRO === centro && 
            i.CICLO === ciclo && 
            i.TURNO === turno
        );
        
        if (nuevoValor === parseInt(itemOriginal[curso])) {
            vacantesElement.classList.remove('modified');
        } else {
            vacantesElement.classList.add('modified');
        }

        // Aquí llamaremos a la función de actualización en GitHub
        updateGitHubData(data);
    }
}

function mostrarTodosCentros() {
    actualizarMapaConFiltros();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('enseñanza').addEventListener('change', actualizarCicloSelector);
    document.getElementById('ciclo').addEventListener('change', actualizarMapaConFiltros);
    document.querySelectorAll('input[name="curso"]').forEach(radio => {
        radio.addEventListener('change', actualizarMapaConFiltros);
    });
}

function generarIdSeguro(texto) {
    return texto.replace(/[^a-zA-Z0-9]/g, '_');
}
