<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Update CORS headers to allow specific origin
if (isset($_SERVER['HTTP_ORIGIN'])) {
    // You can add more origins to this array if needed
    $allowed_origins = [
        'http://127.0.0.1:5500',
        'http://localhost:5500'
    ];

    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    }
} else {
    header('Access-Control-Allow-Origin: http://127.0.0.1:5500');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');    // cache for 1 day
header('Content-Type: application/json');

// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    }

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }
    exit(0);
}

// Database Connection
$host = '127.0.0.1';
$db = 'master_db';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

try {
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $e->getMessage()
    ]));
}
