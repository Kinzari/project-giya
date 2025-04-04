<?php
require 'db_connection.php';

try {
    $stmt = $pdo->prepare("
        UPDATE tbl_giya_reply
        SET is_read = 1
        WHERE reply_date < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND is_read = 0
    ");
    $stmt->execute();

    $affectedRows = $stmt->rowCount();

    echo json_encode([
        "status" => "success",
        "message" => "Maintenance completed successfully. Cleaned up $affectedRows old notifications."
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
