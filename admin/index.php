<?php
session_start();
if (!isset($_SESSION['user'])) {
    header('Location: /admin/login.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="es">
<!-- Resto del HTML del admin.html actual -->
</html>
