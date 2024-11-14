<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    require_once 'vendor/autoload.php';
    
    try {
        $inputFileName = $_FILES['file']['tmp_name'];
        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($inputFileName);
        $worksheet = $spreadsheet->getActiveSheet();
        $data = $worksheet->toArray(null, true, true, true);
        
        // Procesar datos y validar estructura
        $processedData = [];
        $headers = array_shift($data);
        
        foreach ($data as $row) {
            if (empty(array_filter($row))) continue;
            
            $processedData[] = [
                'CENTRO' => $row['A'] ?? '',
                'ENSEÑANZA' => $row['B'] ?? '',
                'CICLO' => $row['C'] ?? '',
                'TURNO' => $row['D'] ?? '',
                'LATITUD' => floatval($row['E'] ?? 0),
                'LONGITUD' => floatval($row['F'] ?? 0),
                '1º' => intval($row['G'] ?? 0),
                '2º' => intval($row['H'] ?? 0),
                '3º' => intval($row['I'] ?? 0)
            ];
        }
        
        file_put_contents('../data/vacantes.json', json_encode($processedData, JSON_PRETTY_PRINT));
        echo json_encode(['success' => true]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Solicitud inválida']);
}
?> 