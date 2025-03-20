<?php
require 'db_connection.php';

class InquiryHandler {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function submitInquiry($data) {
        // 1. Validate required fields
        if (empty($data['user_id'])) {
            return ["success" => false, "message" => "User ID is required"];
        }
        if (empty($data['post_type'])) {
            return ["success" => false, "message" => "Post type is required"];
        }
        if (empty($data['post_message'])) {
            return ["success" => false, "message" => "Post message is required"];
        }
        if (empty($data['post_title'])) {
            return ["success" => false, "message" => "Post title is required"];
        }

        try {
            // 2. Look up the numeric IDs from tbl_giya_inquiry_types based on the post_type string
            $lookupSql = "
                SELECT inquiry_id, department_id
                FROM tbl_giya_inquiry_types
                WHERE inquiry_type = :postType
                LIMIT 1
            ";
            $lookupStmt = $this->pdo->prepare($lookupSql);
            $lookupStmt->execute([':postType' => $data['post_type']]);
            $row = $lookupStmt->fetch(\PDO::FETCH_ASSOC);

            // If not found, user typed an invalid post_type string
            if (!$row) {
                return ["success" => false, "message" => "Invalid post type"];
            }

            // 3. Insert the post with proper IDs from the database
            $insertSql = "
                INSERT INTO tbl_giya_posts (
                    post_userId,
                    post_departmentId,
                    post_campusId,
                    postType_id,
                    post_date,
                    post_time,
                    post_title,
                    post_message,
                    post_status,
                    inquiry_typeId
                ) VALUES (
                    :userId,
                    :deptId,
                    :campusId,
                    :pTypeId,
                    CURDATE(),
                    CURTIME(),
                    :title,
                    :message,
                    0,
                    :inquiryId
                )
            ";
            $insertStmt = $this->pdo->prepare($insertSql);
            $insertStmt->execute([
                ':userId'   => $data['user_id'],
                ':deptId'   => $row['department_id'] ?? 1,   // fallback if null
                ':campusId' => $data['campus_id'] ?? 1,      // Default to Carmen campus if not specified
                ':pTypeId'  => $data['post_type_id'] ?? 1,   // Now getting from input data
                ':title'    => $data['post_title'],
                ':message'  => $data['post_message'],
                ':inquiryId' => $row['inquiry_id']          // numeric PK from the lookup
            ]);

            return [
                "success" => true,
                "message" => "Inquiry submitted successfully",
                "post_id" => $this->pdo->lastInsertId()
            ];
        } catch (PDOException $e) {
            return [
                "success" => false,
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }

    public function checkPrivacyPolicy($userId) {
        try {
            // Check if the user exists and get their privacy policy status
            $stmt = $this->pdo->prepare("
                SELECT privacy_policy_check
                FROM tblusers
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$result) {
                return [
                    "success" => false,
                    "message" => "User not found",
                    "privacy_policy_check" => 0
                ];
            }

            return [
                "success" => true,
                "message" => "Privacy policy status retrieved",
                "privacy_policy_check" => (int)$result['privacy_policy_check']
            ];
        } catch (PDOException $e) {
            return [
                "success" => false,
                "message" => "Database error: " . $e->getMessage(),
                "privacy_policy_check" => 0
            ];
        }
    }

    public function updatePrivacyPolicy($userId, $status) {
        try {
            // Update the user's privacy policy check status
            $stmt = $this->pdo->prepare("
                UPDATE tblusers
                SET privacy_policy_check = ?
                WHERE user_id = ?
            ");
            $stmt->execute([$status ? 1 : 0, $userId]);

            return [
                "success" => true,
                "message" => "Privacy policy status updated",
                "affected_rows" => $stmt->rowCount()
            ];
        } catch (PDOException $e) {
            return [
                "success" => false,
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }

    public function getInquiryTypes() {
        try {
            // Use DISTINCT to avoid duplicates
            $stmt = $this->pdo->prepare("
                SELECT DISTINCT inquiry_id, inquiry_type, description, department_id
                FROM tbl_giya_inquiry_types
                ORDER BY inquiry_type ASC
            ");
            $stmt->execute();
            $types = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "success" => true,
                "types" => $types
            ];
        } catch (PDOException $e) {
            return [
                "success" => false,
                "message" => "Database error: " . $e->getMessage(),
                "types" => []
            ];
        }
    }

    public function ping() {
        return [
            "success" => true,
            "message" => "API is working",
            "timestamp" => date('Y-m-d H:i:s')
        ];
    }
}

// Route handling section
if (isset($_GET['action'])) {
    $handler = new InquiryHandler($pdo);

    switch ($_GET['action']) {
        case 'submit_inquiry':
            $data = json_decode(file_get_contents("php://input"), true);
            echo json_encode($handler->submitInquiry($data));
            break;

        case 'check_privacy_policy':
            $userId = $_GET['user_id'] ?? null;
            if ($userId) {
                echo json_encode($handler->checkPrivacyPolicy($userId));
            } else {
                echo json_encode(["success" => false, "message" => "User ID is required", "privacy_policy_check" => 0]);
            }
            break;

        case 'update_privacy_policy':
            $data = json_decode(file_get_contents("php://input"), true);
            $userId = $data['user_id'] ?? null;
            $status = $data['privacy_policy_check'] ?? 0;

            if ($userId) {
                echo json_encode($handler->updatePrivacyPolicy($userId, $status));
            } else {
                echo json_encode(["success" => false, "message" => "User ID is required"]);
            }
            break;

        case 'get_inquiry_types':
            echo json_encode($handler->getInquiryTypes());
            break;

        case 'ping':
            echo json_encode($handler->ping());
            break;

        default:
            echo json_encode(["success" => false, "message" => "Invalid action"]);
            break;
    }
    exit;
} else {
    header('Content-Type: application/json');
    echo json_encode(["success" => false, "message" => "No action specified"]);
    exit;
}
