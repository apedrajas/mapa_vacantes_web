let map;
let markers = [];
let data = [];
let dataCopia = []; // Añadimos esta línea para guardar una copia de los datos originales

let nombreArchivoOriginal = '';
let ultimoNumeroOrden = -1;

document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        nombreArchivoOriginal = file.name;
        // Extraer el número de orden del archivo cargado, si existe
        const match = nombreArchivoOriginal.match(/_(\d{3})\.xlsx$/);
        if (match) {
            ultimoNumeroOrden = parseInt(match[1]);
        } else {
            ultimoNumeroOrden = -1; // Si no tiene número, empezamos desde 000
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            dataCopia = JSON.parse(JSON.stringify(data)); // Hacemos una copia profunda de los datos originales
            poblarSelectores();
            mostrarTodosCentros();
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('Por favor, selecciona un archivo Excel.');
    }
});

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

    enseñanzaSelect.addEventListener('change', actualizarCicloSelector);
    cicloSelect.addEventListener('change', actualizarMapaConFiltros);

    // Añadir event listeners para los botones de radio de curso
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

    // Guardar el estado de los popups abiertos antes de actualizar
    const popupsAbiertos = markers.filter(marker => marker.isPopupOpen()).map(marker => {
        return {
            centro: marker.centro,
            latlng: marker.getLatLng()
        };
    });

    const filteredData = data.filter(item => {
        const cumpleEnseñanzaCiclo = (enseñanzaSeleccionada === '' || item.ENSEÑANZA === enseñanzaSeleccionada) &&
                                     (cicloSeleccionado === '' || item.CICLO === cicloSeleccionado);
        
        const tieneVacantesEnAlgunCurso = parseInt(item['1º']) > 0 || parseInt(item['2º']) > 0 || parseInt(item['3º']) > 0;
        
        let cumpleFiltroVacantes = tieneVacantesEnAlgunCurso;
        if (cursoSeleccionado !== '0') {
            cumpleFiltroVacantes = parseInt(item[cursoSeleccionado + 'º']) > 0;
        }

        return cumpleEnseñanzaCiclo && cumpleFiltroVacantes;
    });

    actualizarMapa(filteredData, popupsAbiertos);
}

function mostrarTodosCentros() {
    actualizarMapaConFiltros();
}

function initMap() {
    map = L.map('map').setView([41.648823, -0.889085], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);
}

function generarIdSeguro(texto) {
    const idOriginal = texto
        .normalize('NFD')                 // Normalizar caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
        .replace(/[^a-zA-Z0-9]/g, '_')   // Reemplazar caracteres especiales con guiones bajos
        .replace(/_{2,}/g, '_')          // Reemplazar múltiples guiones bajos consecutivos
        .replace(/^_|_$/g, '');          // Eliminar guiones bajos al inicio y final
    
    console.log('ID generado:', {
        original: texto,
        procesado: idOriginal
    });
    
    return idOriginal;
}

function actualizarMapa(filteredData, popupsAbiertos = []) {
    // Eliminar marcadores existentes
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    const enseñanzaSeleccionada = document.getElementById('enseñanza').value;
    const cicloSeleccionado = document.getElementById('ciclo').value;
    const mostrarBotones = enseñanzaSeleccionada !== '' && cicloSeleccionado !== '';

    // Agrupar datos por centro
    const centrosAgrupados = {};
    filteredData.forEach(item => {
        if (!centrosAgrupados[item.CENTRO]) {
            centrosAgrupados[item.CENTRO] = [];
        }
        centrosAgrupados[item.CENTRO].push(item);
    });

    Object.entries(centrosAgrupados).forEach(([centro, items]) => {
        const primerItem = items[0]; // Usamos el primer item para la ubicación
        
        if (primerItem.LATITUD && primerItem.LONGITUD) {
            const centroId = generarIdSeguro(centro);
            
            console.log('Creando marker para centro:', {
                centro: centro,
                ciclos: items.map(item => item.CICLO),
                centroId: centroId
            });

            const marker = L.marker([primerItem.LATITUD, primerItem.LONGITUD], { icon: getIcon(primerItem.CICLO) });
            marker.centro = centro;
            
            marker.addTo(map)
                .bindPopup(() => {
                    const popupContent = `
                        <div style="font-family: Arial, sans-serif;">
                            <div style="font-weight: bold;">${centro}</div>
                            ${items.map(item => `
                                <div style="margin-top: 10px;">
                                    <div>${item.ENSEÑANZA}</div>
                                    <div>${item.CICLO}</div>
                                    <div>Turno: ${item.TURNO}</div>
                                    <div style="margin-top: 10px; font-weight: bold; background-color: #ffe404; padding: 5px;">
                                        VACANTES
                                        ${['1º', '2º', '3º'].map(curso => `
                                            <div style="display: flex; align-items: center; justify-content: space-between; margin: 5px 0;">
                                                <span style="flex: 1; padding-left: 30px;">Curso ${curso}:</span>
                                                <span id="vacantes-${centroId}-${item.CICLO}-${item.TURNO}-${curso}" 
                                                      class="vacantes" 
                                                      data-centro="${centro}"
                                                      data-ciclo="${item.CICLO}"
                                                      data-turno="${item.TURNO}"
                                                      style="flex: 0 0 30px; text-align: right;">
                                                    ${item[curso]}
                                                </span>
                                                ${mostrarBotones ? `
                                                    <button onclick="modificarVacantes('${centro}', '${item.CICLO}', '${item.TURNO}', '${curso}', -1, '${centroId}', event)" 
                                                            style="margin-left: 5px; margin-right: 4px;">-</button>
                                                    <button onclick="modificarVacantes('${centro}', '${item.CICLO}', '${item.TURNO}', '${curso}', 1, '${centroId}', event)" 
                                                            style="margin-right: 30px;">+</button>
                                                ` : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(centro + ', Aragón')}" 
                               target="_blank" 
                               style="display: block; margin-top: 10px; color: blue; text-decoration: underline;">
                                Ver en Google Maps
                            </a>
                        </div>
                    `;
                    
                    console.log('Generando popup:', {
                        centro: centro,
                        ciclos: items.map(item => item.CICLO),
                        elementosGenerados: items.map(item => 
                            ['1º', '2º', '3º'].map(curso => 
                                `vacantes-${centroId}-${item.CICLO}-${item.TURNO}-${curso}`
                            )
                        ).flat()
                    });
                    
                    return popupContent;
                });
            
            markers.push(marker);

            const popupAbierto = popupsAbiertos.find(p => p.centro === centro);
            if (popupAbierto) {
                marker.openPopup();
            }
        }
    });
}

function getIcon(ciclo) {
    let iconUrl;
    switch (ciclo) {
        case 'CFGB':
            iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
            break;
        case 'CFGM':
            iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
            break;
        case 'CFGS':
            iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x-red.png';
            break;
        default:
            iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
    }
    return L.icon({
        iconUrl: iconUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        shadowSize: [41, 41]
    });
}

function modificarVacantes(centro, ciclo, turno, curso, cambio, centroId, event) {
    event.stopPropagation();
    
    console.log('Modificando vacantes:', {
        centro,
        ciclo,
        turno,
        curso,
        cambio,
        centroId
    });

    const item = data.find(item => 
        item.CENTRO === centro && 
        item.CICLO === ciclo && 
        item.TURNO === turno
    );
    
    if (!item) {
        console.error('No se encontró el item:', { centro, ciclo, turno });
        return;
    }

    const itemOriginal = dataCopia.find(item => 
        item.CENTRO === centro && 
        item.CICLO === ciclo && 
        item.TURNO === turno
    );
    
    if (!itemOriginal) {
        console.error('No se encontró el item original:', { centro, ciclo, turno });
        return;
    }

    const elementId = `vacantes-${centroId}-${ciclo}-${turno}-${curso}`;
    const vacantesElement = document.getElementById(elementId);
    
    if (!vacantesElement) {
        console.error('No se encontró el elemento:', { elementId });
        return;
    }

    const valorActual = parseInt(vacantesElement.textContent) || 0;
    const nuevoValor = valorActual + cambio;
    
    if (nuevoValor >= 0) {
        vacantesElement.textContent = nuevoValor;
        if (nuevoValor === parseInt(itemOriginal[curso])) {
            vacantesElement.style.color = 'black';
        } else {
            vacantesElement.style.color = 'red';
        }
        item[curso] = nuevoValor;
        console.log('Actualización exitosa:', { centro, ciclo, turno, curso, nuevoValor });
    }
}

function guardarCambios() {
    let nombreBase = nombreArchivoOriginal.replace(/\.xlsx$/, '');
    
    // Verificar si el nombre base ya tiene un número de orden
    const match = nombreBase.match(/_(\d{3})$/);
    if (match) {
        nombreBase = nombreBase.slice(0, -4); // Remover el número de orden existente
    }
    
    // Incrementar el número de orden
    ultimoNumeroOrden = (ultimoNumeroOrden + 1) % 1000;
    
    const nuevoNombre = `${nombreBase}_${String(ultimoNumeroOrden).padStart(3, '0')}.xlsx`;
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    XLSX.writeFile(workbook, nuevoNombre, { bookType: 'xlsx' });
    
    console.log(`Archivo guardado como: ${nuevoNombre}`);
}

function agregarBotonGuardar() {
    const controlsDiv = document.getElementById('controls');
    const botonGuardar = document.createElement('input');
    botonGuardar.type = 'button';
    botonGuardar.value = 'Guardar Cambios';
    botonGuardar.onclick = guardarCambios;
    
    // Añadir un poco de margen para separarlo del otro botón
    botonGuardar.style.marginLeft = '10px';
    
    controlsDiv.appendChild(botonGuardar);
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    agregarBotonGuardar();
});
