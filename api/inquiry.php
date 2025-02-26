<?php
require 'db_connection.php';

class InquiryHandler
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function submitInquiry($data)
    {
        // 1. Validate required fields
        if (empty($data['user_id'])) {
            return ["success" => false, "message" => "User ID is required"];
        }
        if (empty($data['post_type'])) {
            return ["success" => false, "message" => "Post type is required"];
        }
        if (empty($data['post_title'])) {
            return ["success" => false, "message" => "Post title is required"];
        }
        if (empty($data['post_message'])) {
            return ["success" => false, "message" => "Post message is required"];
        }

        // 2. Look up the numeric IDs from tbl_giya_inquiry_types based on the post_type string
        try {
            $lookupSql = "
                SELECT inquiry_id, department_id, postType_id
                FROM tbl_giya_inquiry_types
                WHERE inquiry_type = :postType
                AND is_active = 1
                LIMIT 1
            ";
            $lookupStmt = $this->pdo->prepare($lookupSql);
            $lookupStmt->execute([':postType' => $data['post_type']]);
            $row = $lookupStmt->fetch(\PDO::FETCH_ASSOC);

            // If not found, user typed an invalid post_type string
            if (!$row) {
                return ["success" => false, "message" => "Invalid post type"];
            }

            // 3. Insert the new post using these numeric IDs
            $insertSql = "
                INSERT INTO tbl_giya_posts (
                    post_userId,
                    post_departmentId,
                    postType_id,
                    post_date,
                    post_time,
                    post_title,
                    post_message,
                    post_status,
                    is_read,
                    inquiry_typeId
                ) VALUES (
                    :userId,
                    :deptId,
                    :pTypeId,
                    CURDATE(),
                    CURTIME(),
                    :title,
                    :message,
                    'Pending',
                    0,
                    :inquiryId
                )
            ";
            $insertStmt = $this->pdo->prepare($insertSql);
            $insertStmt->execute([
                ':userId'   => $data['user_id'],
                ':deptId'   => $row['department_id'] ?? 1,   // fallback if null
                ':pTypeId'  => $row['postType_id']    ?? 1,   // fallback if null
                ':title'    => $data['post_title'],
                ':message'  => $data['post_message'],
                ':inquiryId' => $row['inquiry_id']             // numeric PK from the lookup
            ]);

            return [
                "success" => true,
                "message" => "Inquiry submitted successfully",
                "post_id" => $this->pdo->lastInsertId()
            ];
        } catch (\PDOException $e) {
            return [
                "success" => false,
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }

    public function getUserSubmissions($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT
                    p.post_id,
                    p.post_title,
                    p.post_message,
                    p.post_date,
                    p.post_time,
                    p.post_status,
                    pt.postType_name as type,
                    (SELECT COUNT(*) FROM tbl_giya_reply WHERE reply_postId = p.post_id) as reply_count
                FROM tbl_giya_posts p
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                WHERE p.post_userId = ?
                ORDER BY p.post_date DESC, p.post_time DESC
            ");

            $stmt->execute([$userId]);
            $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "data" => $submissions
            ];
        } catch (\PDOException $e) {
            return [
                "status" => "error",
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }

    public function getSubmissionDetail($submissionId) {
        try {
            // Get submission details
            $stmt = $this->pdo->prepare("
                SELECT
                    p.*,
                    pt.postType_name as type,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) as author_name,
                    u.user_typeId as author_type
                FROM tbl_giya_posts p
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                JOIN tblusers u ON p.post_userId = u.user_id
                WHERE p.post_id = ?
            ");

            $stmt->execute([$submissionId]);
            $submission = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$submission) {
                return ["status" => "error", "message" => "Submission not found"];
            }

            // Get replies - Always show GIYA Representative for admin/POC users
            $repliesStmt = $this->pdo->prepare("
                SELECT
                    r.*,
                    u.user_typeId,
                    CASE
                        WHEN u.user_typeId IN (3, 4, 5, 6) THEN 'admin'
                        ELSE 'student'
                    END as user_type,
                    CASE
                        WHEN u.user_typeId IN (3, 4, 5, 6) THEN 'GIYA Representative'
                        ELSE CONCAT(u.user_firstname, ' ', u.user_lastname)
                    END as display_name
                FROM tbl_giya_reply r
                JOIN tblusers u ON r.reply_userId = u.user_id
                WHERE r.reply_postId = ?
                ORDER BY r.reply_date ASC, r.reply_time ASC
            ");

            $repliesStmt->execute([$submissionId]);
            $replies = $repliesStmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "data" => [
                    "submission" => $submission,
                    "replies" => $replies
                ]
            ];
        } catch (\PDOException $e) {
            return [
                "status" => "error",
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }

    public function addReply($data) {
        if (!isset($data['post_id']) || !isset($data['user_id']) || !isset($data['content'])) {
            return ["status" => "error", "message" => "Missing required fields"];
        }

        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO tbl_giya_reply (
                    reply_userId,
                    reply_postId,
                    reply_date,
                    reply_time,
                    reply_message
                ) VALUES (?, ?, CURDATE(), CURTIME(), ?)
            ");

            $stmt->execute([
                $data['user_id'],
                $data['post_id'],
                $data['content']
            ]);

            // Update post status to Pending if it was Unread
            $updateStmt = $this->pdo->prepare("
                UPDATE tbl_giya_posts
                SET post_status = 'Pending'
                WHERE post_id = ? AND post_status = 'Unread'
            ");
            $updateStmt->execute([$data['post_id']]);

            return [
                "status" => "success",
                "message" => "Reply added successfully",
                "reply_id" => $this->pdo->lastInsertId()
            ];
        } catch (\PDOException $e) {
            return [
                "status" => "error",
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }

    public function updateStatus($data) {
        if (!isset($data['post_id']) || !isset($data['status'])) {
            return ["status" => "error", "message" => "Missing required fields"];
        }

        try {
            $stmt = $this->pdo->prepare("
                UPDATE tbl_giya_posts
                SET post_status = ?
                WHERE post_id = ?
            ");

            $stmt->execute([$data['status'], $data['post_id']]);

            return [
                "status" => "success",
                "message" => "Status updated successfully"
            ];
        } catch (\PDOException $e) {
            return [
                "status" => "error",
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }

    public function checkPrivacyPolicy($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT privacy_policy_check
                FROM tblusers
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return [
                "success" => true,
                "privacy_policy_check" => (int)$result['privacy_policy_check']
            ];
        } catch (\PDOException $e) {
            return [
                "success" => false,
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }
}

// Main API handler
if (isset($_GET['action'])) {
    $handler = new InquiryHandler($pdo);

    switch ($_GET['action']) {
        case 'submit_inquiry':
            $data = json_decode(file_get_contents("php://input"), true);
            echo json_encode($handler->submitInquiry($data));
            break;

        case 'get_user_submissions':
            $userId = $_GET['user_id'] ?? null;
            if ($userId) {
                echo json_encode($handler->getUserSubmissions($userId));
            } else {
                echo json_encode(["status" => "error", "message" => "User ID is required"]);
            }
            break;

        case 'get_submission_detail':
            $submissionId = $_GET['id'] ?? null;
            if ($submissionId) {
                echo json_encode($handler->getSubmissionDetail($submissionId));
            } else {
                echo json_encode(["status" => "error", "message" => "Submission ID is required"]);
            }
            break;

        case 'add_reply':
            $data = $_POST; // Using POST for form data
            echo json_encode($handler->addReply($data));
            break;

        case 'update_status':
            $data = json_decode(file_get_contents("php://input"), true);
            echo json_encode($handler->updateStatus($data));
            break;

        case 'update_privacy_policy':
            $data = json_decode(file_get_contents("php://input"), true);
            $user_id = $data['user_id'] ?? null;
            $privacy_policy_check = $data['privacy_policy_check'] ?? 0;
            if ($user_id) {
                $stmt = $pdo->prepare("UPDATE tblusers SET privacy_policy_check = :ppc WHERE user_id = :uid");
                $stmt->execute([':ppc' => $privacy_policy_check, ':uid' => $user_id]);
                echo json_encode(["success" => true, "message" => "Privacy policy updated"]);
            } else {
                echo json_encode(["success" => false, "message" => "User ID is required"]);
            }
            break;

        case 'get_inquiry_types':
            try {
                $stmt = $pdo->query("
                    SELECT inquiry_id, inquiry_type, description
                    FROM tbl_giya_inquiry_types
                    WHERE is_active = 1
                    ORDER BY inquiry_type
                ");
                $types = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(["success" => true, "types" => $types]);
            } catch (\PDOException $e) {
                echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
            }
            break;

        case 'check_privacy_policy':
            $userId = $_GET['user_id'] ?? null;
            if ($userId) {
                echo json_encode($handler->checkPrivacyPolicy($userId));
            } else {
                echo json_encode(["success" => false, "message" => "User ID is required"]);
            }
            break;

        default:
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
            break;
    }
} else {
    echo json_encode(["status" => "error", "message" => "No action specified"]);
}
