<?php
// Simple ping endpoint to test API connectivity
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Get request headers for debugging
$headers = getallheaders();
$userType = isset($headers['X-User-Type']) ? $headers['X-User-Type'] : 'not provided';

echo json_encode([
    'success' => true,
    'message' => 'API is online and functioning',
    'timestamp' => date('Y-m-d H:i:s'),
    'auth' => [
        'userType' => $userType
    ]
]);
?>
