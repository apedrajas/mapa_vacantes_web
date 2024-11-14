<?php
session_start();
if (!isset($_SESSION['user'])) {
    header('Location: login.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel Admin - Mapa de Centros Educativos</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/leaflet.css" />
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="admin.css">
</head>
<body>
    <div id="adminPanel">
        <div id="controls">
            <div class="admin-controls">
                <input type="file" id="fileInput" accept=".xlsx,.xls">
                <button onclick="guardarCambios()">Guardar Cambios</button>
                <button id="btnLogout" onclick="logout()">Cerrar Sesión</button>
            </div>
            <div class="filter-section">
                <label for="enseñanza">Enseñanza:</label>
                <select id="enseñanza">
                    <option value="">Todas</option>
                </select>
                <label for="ciclo">Ciclo:</label>
                <select id="ciclo">
                    <option value="">Todos</option>
                </select>
            </div>
        </div>
        <div id="map"></div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/leaflet.js"></script>
    <script src="../js/config.js"></script>
    <script src="../js/mapUtils.js"></script>
    <script src="admin.js"></script>
</body>
</html>
