<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

$data_file = '../data/vacantes.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos JSON inválidos']);
        exit;
    }

    // Crear backup
    if (file_exists($data_file)) {
        copy($data_file, $data_file . '.bak');
    }

    // Guardar nuevos datos
    if (file_put_contents($data_file, json_encode($input, JSON_PRETTY_PRINT))) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error al guardar los datos']);
    }
}
?>
