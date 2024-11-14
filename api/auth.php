<?php
session_start();
header('Content-Type: application/json');

$allowed_domains = ['@aragon.es'];
$users_file = '../data/users.json';

function validateEmail($email) {
    global $allowed_domains;
    foreach ($allowed_domains as $domain) {
        if (str_ends_with($email, $domain)) return true;
    }
    return false;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
    $password = $data['password'];

    if (!validateEmail($email)) {
        http_response_code(403);
        echo json_encode(['error' => 'Dominio de correo no autorizado']);
        exit;
    }

    // Verificar credenciales contra users.json
    $users = json_decode(file_get_contents($users_file), true);
    
    if (isset($users[$email]) && password_verify($password, $users[$email]['hash'])) {
        $_SESSION['user'] = $email;
        echo json_encode(['success' => true]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales inválidas']);
    }
}
?>
