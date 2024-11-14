let map;
let markers = [];
let data = [];
let dataCopia = [];
let nombreArchivoOriginal = '';
let ultimoNumeroOrden = -1;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
});

// Verificación de sesión
async function checkSession() {
    try {
        const response = await fetch(CONFIG.api.checkSession);
        const data = await response.json();
        
        if (data.authenticated) {
            document.getElementById('loginPanel').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            initializeAdminPanel();
        } else {
            window.location.href = 'login.php';
        }
    } catch (error) {
        console.error('Error:', error);
        window.location.href = 'login.php';
    }
}

async function initializeAdminPanel() {
    map = initMap('map');
    setupFileInput();
    setupEventListeners();
    await cargarDatosIniciales();
}

async function cargarDatosIniciales() {
    try {
        const response = await fetch(CONFIG.api.data);
        if (!response.ok) throw new Error('Error al cargar datos');
        data = await response.json();
        dataCopia = JSON.parse(JSON.stringify(data));
        poblarSelectores();
        mostrarTodosCentros();
    } catch (error) {
        console.error('Error al cargar datos:', error);
        alert('Error al cargar los datos');
    }
}

// Función para cerrar sesión
async function logout() {
    try {
        await fetch(CONFIG.api.logout);
        window.location.href = 'login.php';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Actualizar la función guardarCambios
async function guardarCambios() {
    try {
        const hayModificaciones = document.querySelectorAll('.modified').length > 0;
        
        if (!hayModificaciones) {
            alert('No hay cambios pendientes para guardar');
            return;
        }

        if (confirm('¿Estás seguro de que deseas guardar los cambios?')) {
            const response = await fetch(CONFIG.api.update, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Error al guardar los cambios');

            dataCopia = JSON.parse(JSON.stringify(data));
            document.querySelectorAll('.modified').forEach(element => {
                element.classList.remove('modified');
            });
            
            alert('Cambios guardados correctamente');
        }
    } catch (error) {
        console.error('Error al guardar cambios:', error);
        alert('Error al guardar los cambios');
    }
}

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
                    const processedData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                    if (!validarEstructuraExcel(processedData)) {
                        alert('El formato del archivo Excel no es válido');
                        return;
                    }

                    data = processedData.map(item => ({
                        ...item,
                        LATITUD: parseFloat(item.LATITUD) || 0,
                        LONGITUD: parseFloat(item.LONGITUD) || 0,
                        "1º": parseInt(item["1º"]) || 0,
                        "2º": parseInt(item["2º"]) || 0,
                        "3º": parseInt(item["3º"]) || 0
                    }));

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

function setupEventListeners() {
    document.getElementById('enseñanza').addEventListener('change', actualizarCicloSelector);
    document.getElementById('ciclo').addEventListener('change', actualizarMapaConFiltros);
    document.querySelectorAll('input[name="curso"]').forEach(radio => {
        radio.addEventListener('change', actualizarMapaConFiltros);
    });
    document.getElementById('btnGuardar').addEventListener('click', guardarCambios);
}

function poblarSelectores() {
    const enseñanzaSelect = document.getElementById('enseñanza');
    const cicloSelect = document.getElementById('ciclo');

    const enseñanzas = [...new Set(data.map(item => item.ENSEÑANZA))].sort();

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
    ciclos.sort().forEach(ciclo => {
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

    const filteredData = filtrarDatos(data, enseñanzaSeleccionada, cicloSeleccionado, cursoSeleccionado);
    actualizarMapa(filteredData, popupsAbiertos);
}

function filtrarDatos(data, enseñanza, ciclo, curso) {
    return data.filter(item => {
        const matchEnseñanza = !enseñanza || item.ENSEÑANZA === enseñanza;
        const matchCiclo = !ciclo || item.CICLO === ciclo;
        return matchEnseñanza && matchCiclo;
    });
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
    }
}

function mostrarTodosCentros() {
    actualizarMapaConFiltros();
}

function generarIdSeguro(texto) {
    return texto.replace(/[^a-zA-Z0-9]/g, '_');
}

function validarEstructuraExcel(data) {
    if (!Array.isArray(data) || data.length === 0) return false;
    
    const camposRequeridos = ['CENTRO', 'ENSEÑANZA', 'CICLO', 'TURNO', 'LATITUD', 'LONGITUD', '1º', '2º', '3º'];
    
    return data.every(item => 
        camposRequeridos.every(campo => 
            Object.prototype.hasOwnProperty.call(item, campo)
        )
    );
}

async function updateGitHubData(data) {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/dispatches`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event_type: 'update-data',
                    client_payload: {
                        data: JSON.stringify(data, null, 2)
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Error al actualizar datos en GitHub: ${response.status}`);
        }
        
        alert('Datos actualizados correctamente');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar los cambios: ' + error.message);
    }
}

async function login(email, password) {
    try {
        const response = await fetch(CONFIG.api.auth, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) throw new Error('Error de autenticación');
        
        const data = await response.json();
        if (data.success) {
            initializeAdminPanel();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de autenticación');
    }
}