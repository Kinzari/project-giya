<?php
require 'db_connection.php';

class PostsHandler
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    // Get posts for "Latest Posts" (both students and visitors, limit 10)
    public function handleGetAllPosts()
    {
        try {
            // Get total records count first
            $countStmt = $this->pdo->query("SELECT COUNT(*) FROM tbl_giya_posts");
            $totalRecords = (int)$countStmt->fetchColumn();

            // Then get the actual data
            $stmt = $this->pdo->prepare("
                SELECT
                    p.post_id,
                    p.post_title,
                    p.post_message,
                    DATE_FORMAT(p.post_date, '%m-%d-%Y') as post_date,
                    p.post_time,
                    p.post_status,
                    pt.postType_name,
                    u.user_id,
                    u.user_status,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) AS user_fullname,
                    u.user_schoolId
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                ORDER BY p.post_date DESC, p.post_time DESC
            ");
            $stmt->execute();
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Clean response format
            $response = [
                "draw" => isset($_GET['draw']) ? (int)$_GET['draw'] : 1,
                "recordsTotal" => $totalRecords,
                "recordsFiltered" => $totalRecords,
                "data" => array_values($posts) // Ensure sequential array
            ];

            return $response;
        } catch (\PDOException $e) {
            return [
                "draw" => 1,
                "recordsTotal" => 0,
                "recordsFiltered" => 0,
                "data" => [],
                "error" => $e->getMessage()
            ];
        }
    }

    // Mark a post as read => set post_status = 1 (Pending)
    public function handleMarkPostRead($postId)
    {
        if (!$postId) {
            return ["success" => false, "message" => "No post ID."];
        }
        try {
            $stmt = $this->pdo->prepare("UPDATE tbl_giya_posts SET post_status = 1 WHERE post_id = ? AND post_status = 0");
            $stmt->execute([$postId]);
            return ["success" => true, "message" => "Post marked as read"];
        } catch (\PDOException $e) {
            return ["success" => false, "message" => $e->getMessage()];
        }
    }

    // Retrieve a single post’s details (if you still need it)
    public function handleGetPostDetails($postId)
    {
        if (!$postId) {
            return ["success" => false, "message" => "No post ID."];
        }
        try {
            // Get post details with the actual user name
            $stmt = $this->pdo->prepare("
                SELECT
                    p.*,
                    pt.postType_name,
                    u.user_id,
                    u.user_status,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) AS user_fullname,
                    u.user_schoolId,
                    i.inquiry_type,
                    i.description as inquiry_description
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tbl_giya_inquiry_types i ON p.inquiry_typeId = i.inquiry_id
                WHERE p.post_id = ?
            ");

            $stmt->execute([$postId]);
            $post = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$post) {
                return ["success" => false, "message" => "Post not found"];
            }

            // Get replies - Show GIYA Representative only for admin/POC replies
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
                    END as display_name,
                    DATE_FORMAT(r.reply_date, '%m-%d-%Y') as formatted_date
                FROM tbl_giya_reply r
                JOIN tblusers u ON r.reply_userId = u.user_id
                WHERE r.reply_postId = ?
                ORDER BY r.reply_date ASC, r.reply_time ASC
            ");
            $repliesStmt->execute([$postId]);
            $post['replies'] = $repliesStmt->fetchAll(PDO::FETCH_ASSOC);

            // Format the dates in replies
            foreach ($post['replies'] as &$reply) {
                $reply['reply_date'] = date('m-d-Y', strtotime($reply['reply_date']));
            }

            return ["success" => true, "post" => $post];
        } catch (\PDOException $e) {
            return ["success" => false, "message" => $e->getMessage()];
        }
    }

    // ============ NEW: get_student_posts / get_visitor_posts ===========

    public function handleGetStudentPosts()
    {
        try {
            // user_typeId = 2 => student
            $stmt = $this->pdo->prepare("
                SELECT
                    p.post_id,
                    p.post_title,
                    p.post_message,
                    DATE_FORMAT(p.post_date, '%m-%d-%Y') as post_date,
                    p.post_time,
                    p.post_status,
                    pt.postType_name,
                    -- user info
                    u.user_id,
                    u.user_status,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) AS user_fullname,
                    u.user_schoolId
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                WHERE u.user_typeId = 2
                ORDER BY p.post_date DESC, p.post_time DESC
            ");
            $stmt->execute();
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "draw" => isset($_GET['draw']) ? intval($_GET['draw']) : 1,
                "recordsTotal" => count($posts),
                "recordsFiltered" => count($posts),
                "data" => $posts
            ];
        } catch (\PDOException $e) {
            return ["success" => false, "message" => $e->getMessage()];
        }
    }

    public function handleGetVisitorPosts()
    {
        try {
            // user_typeId = 1 => visitor
            $stmt = $this->pdo->prepare("
                SELECT
                    p.post_id,
                    p.post_title,
                    p.post_message,
                    DATE_FORMAT(p.post_date, '%m-%d-%Y') as post_date,
                    p.post_time,
                    p.post_status,
                    pt.postType_name,
                    -- user info
                    u.user_id,
                    u.user_status,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) AS user_fullname,
                    u.user_schoolId
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                WHERE u.user_typeId = 1
                ORDER BY p.post_date DESC, p.post_time DESC
            ");
            $stmt->execute();
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "draw" => isset($_GET['draw']) ? intval($_GET['draw']) : 1,
                "recordsTotal" => count($posts),
                "recordsFiltered" => count($posts),
                "data" => $posts
            ];
        } catch (\PDOException $e) {
            return ["success" => false, "message" => $e->getMessage()];
        }
    }

    private function getStatusText($statusCode) {
        switch ($statusCode) {
            case 0: return 'Unread';
            case 1: return 'Read';
            case 2: return 'Pending';
            case 3: return 'Resolved';
            default: return 'Unknown';
        }
    }

    public function handleSubmitReply($data)
    {
        if (!isset($data['post_id']) || !isset($data['reply_message']) || !isset($data['admin_id'])) {
            return ["success" => false, "message" => "Missing required fields"];
        }

        try {
            $this->pdo->beginTransaction();

            // Check if post is resolved
            $checkStmt = $this->pdo->prepare("SELECT post_status FROM tbl_giya_posts WHERE post_id = ?");
            $checkStmt->execute([$data['post_id']]);
            $status = $checkStmt->fetchColumn();

            if ($status == 3) {
                return ["success" => false, "message" => "Cannot reply to resolved posts"];
            }

            // Insert reply
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
                $data['admin_id'],
                $data['post_id'],
                $data['reply_message']
            ]);

            // Update post status to Pending (2) when admin/POC replies
            $updateStmt = $this->pdo->prepare("
                UPDATE tbl_giya_posts
                SET post_status = 2
                WHERE post_id = ?
            ");
            $updateStmt->execute([$data['post_id']]);

            $this->pdo->commit();

            // Return updated post details for real-time update
            return [
                "success" => true,
                "message" => "Reply submitted successfully",
                "data" => $this->handleGetPostDetails($data['post_id'])
            ];
        } catch (\PDOException $e) {
            $this->pdo->rollBack();
            return ["success" => false, "message" => $e->getMessage()];
        }
    }
}

// ============== Main Switch ==============
if (isset($_GET['action'])) {
    $handler = new PostsHandler($pdo);

    // Ensure clean output buffer
    ob_clean();

    switch ($_GET['action']) {
        case 'get_posts':
            header('Content-Type: application/json');
            echo json_encode($handler->handleGetAllPosts(), JSON_UNESCAPED_UNICODE);
            break;

        case 'mark_post_read':
            $data = json_decode(file_get_contents("php://input"), true);
            echo json_encode($handler->handleMarkPostRead($data['post_id'] ?? null));
            break;

        case 'get_post_details':
            echo json_encode($handler->handleGetPostDetails($_GET['post_id'] ?? null));
            break;

        case 'get_student_posts':
            echo json_encode($handler->handleGetStudentPosts());
            break;

        case 'get_visitor_posts':
            echo json_encode($handler->handleGetVisitorPosts());
            break;

        case 'submit_reply':
            $data = $_POST;  // Use $_POST since we're sending FormData
            echo json_encode($handler->handleSubmitReply($data));
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
