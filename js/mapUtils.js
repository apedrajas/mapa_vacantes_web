function initMap(mapId) {
    const map = L.map(mapId).setView(MAP_CONFIG.initialView, MAP_CONFIG.initialZoom);
    L.tileLayer(MAP_CONFIG.tileLayer, {
        maxZoom: MAP_CONFIG.maxZoom,
    }).addTo(map);
    return map;
}

function getIcon(ciclo) {
    const iconBase = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img';
    let iconUrl;
    switch (ciclo) {
        case 'CFGB':
            iconUrl = `${iconBase}/marker-icon-blue.png`;
            break;
        case 'CFGM':
            iconUrl = `${iconBase}/marker-icon-green.png`;
            break;
        case 'CFGS':
            iconUrl = `${iconBase}/marker-icon-red.png`;
            break;
        default:
            iconUrl = `${iconBase}/marker-icon-blue.png`;
    }
    return L.icon({
        iconUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: `${iconBase}/marker-shadow.png`,
        shadowSize: [41, 41]
    });
}

function generarIdSeguro(texto) {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
}

function filtrarDatos(data, enseñanza, ciclo, curso) {
    return data.filter(item => {
        const matchEnseñanza = !enseñanza || item.ENSEÑANZA === enseñanza;
        const matchCiclo = !ciclo || item.CICLO === ciclo;
        const matchCurso = curso === '0' || parseInt(item[curso + 'º']) > 0;
        return matchEnseñanza && matchCiclo && matchCurso;
    });
}

function generarContenidoPopup(centro, items, mostrarBotones = false, centroId = '') {
    return `
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
}
