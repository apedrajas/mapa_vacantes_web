<?php
header('Content-Type: application/json');
$data_file = '../data/vacantes.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($data_file)) {
        echo file_get_contents($data_file);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Datos no encontrados']);
    }
}
?>
