async function cargarDatos() {
    try {
        const response = await fetch(CONFIG.api.data);
        if (!response.ok) throw new Error('Error al cargar datos');
        data = await response.json();
        poblarSelectores();
        mostrarTodosCentros();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los datos');
    }
} 