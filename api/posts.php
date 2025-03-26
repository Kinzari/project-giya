<?php
require 'db_connection.php';

// Ensure proper JSON encoding with error handling
function outputJSON($data) {
    header('Content-Type: application/json');

    $json = json_encode($data);

    // Check for JSON encoding errors
    if ($json === false) {
        // Log the error
        error_log('JSON encoding error: ' . json_last_error_msg());

        // Return a simple error response that will definitely encode properly
        echo json_encode([
            'success' => false,
            'message' => 'Server error: Failed to encode response',
            'error' => json_last_error_msg()
        ]);
    } else {
        echo $json;
    }
    exit;
}

// Add a wrapper for all API handlers to catch any uncaught exceptions
function safeApiHandler($callback) {
    try {
        return $callback();
    } catch (Exception $e) {
        error_log('Uncaught exception: ' . $e->getMessage());
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Server error: ' . $e->getMessage()
        ]);
        exit;
    }
}

class PostsHandler
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    private function getUserTypeAndDepartment() {
        $headers = getallheaders();
        return [
            'userType' => isset($headers['X-User-Type']) ? $headers['X-User-Type'] : null,
            'userDepartment' => isset($headers['X-User-Department']) ? $headers['X-User-Department'] : null
        ];
    }

    private function debugHeaders() {
        $headers = getallheaders();
        error_log("Request headers: " . print_r($headers, true));

        // Check specifically for user type header
        $userType = isset($headers['X-User-Type']) ? $headers['X-User-Type'] : 'Not set';
        error_log("X-User-Type header: " . $userType);

        return $headers;
    }

    public function handleGetAllPosts()
    {
        try {
            $countStmt = $this->pdo->query("SELECT COUNT(*) FROM tbl_giya_posts");
            $totalRecords = (int)$countStmt->fetchColumn();

            $stmt = $this->pdo->prepare("
                SELECT
                    p.post_id,
                    p.post_title,
                    p.post_message,
                    DATE_FORMAT(p.post_date, '%m-%d-%Y') as post_date,
                    p.post_time,
                    p.post_status,
                    p.post_campusId,
                    pt.postType_name,
                    u.user_id,
                    u.user_status,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) AS user_fullname,
                    u.user_schoolId,
                    cp.campus_name,
                    COALESCE(d2.department_name, d1.department_name, 'Not Assigned') as department_name
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tblcourses c ON u.user_courseId = c.course_id
                LEFT JOIN tbldepartments d1 ON c.course_departmentId = d1.department_id
                LEFT JOIN tbldepartments d2 ON p.post_departmentId = d2.department_id
                LEFT JOIN tblcampus cp ON p.post_campusId = cp.campus_id
                ORDER BY p.post_date DESC, p.post_time DESC
            ");
            $stmt->execute();
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Clean response format
            $response = [
                "draw" => isset($_GET['draw']) ? (int)$_GET['draw'] : 1,
                "recordsTotal" => $totalRecords,
                "recordsFiltered" => $totalRecords,
                "data" => array_values($posts)
            ];

            return $response;
        } catch (\PDOException $e) {
            error_log("Error in handleGetAllPosts: " . $e->getMessage());
            return [
                "draw" => 1,
                "recordsTotal" => 0,
                "recordsFiltered" => 0,
                "data" => [],
                "error" => $e->getMessage()
            ];
        }
    }

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

    public function handleGetPostDetails($postId)
    {
        if (!$postId) {
            return ["success" => false, "message" => "No post ID."];
        }
        try {
            $stmt = $this->pdo->prepare("
                SELECT
                    p.*,
                    pt.postType_name,
                    u.user_id,
                    u.user_status,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) AS user_fullname,
                    u.user_schoolId,
                    i.inquiry_type,
                    i.description as inquiry_description,
                    c.campus_name,
                    CONCAT(fb.user_firstname, ' ', fb.user_lastname) AS forwarded_by_name
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tbl_giya_inquiry_types i ON p.inquiry_typeId = i.inquiry_id
                LEFT JOIN tblcampus c ON p.post_campusId = c.campus_id
                LEFT JOIN tblusers fb ON p.forwarded_by = fb.user_id
                WHERE p.post_id = ?
            ");

            $stmt->execute([$postId]);
            $post = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$post) {
                return ["success" => false, "message" => "Post not found"];
            }

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

            foreach ($post['replies'] as &$reply) {
                $reply['reply_date'] = date('m-d-Y', strtotime($reply['reply_date']));
            }

            return ["success" => true, "post" => $post];
        } catch (\PDOException $e) {
            return ["success" => false, "message" => $e->getMessage()];
        }
    }

    public function handleGetStudentPosts()
    {
        try {
            $userInfo = $this->getUserTypeAndDepartment();
            $userTypeId = $userInfo['userType'];
            $userDepartmentId = $userInfo['userDepartment'];

            $sql = "
                SELECT
                    p.*,
                    u.user_typeId,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) as user_fullname,
                    pt.postType_name,
                    COALESCE(d2.department_name, d1.department_name, 'Not Assigned') as department_name,
                    cp.campus_name,
                    i.inquiry_type,
                    fb.user_firstname as forwarded_by_name
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tblcourses c ON u.user_courseId = c.course_id
                LEFT JOIN tbldepartments d1 ON c.course_departmentId = d1.department_id
                LEFT JOIN tbldepartments d2 ON p.post_departmentId = d2.department_id
                LEFT JOIN tblcampus cp ON p.post_campusId = cp.campus_id
                LEFT JOIN tbl_giya_inquiry_types i ON p.inquiry_typeId = i.inquiry_id
                LEFT JOIN tblusers fb ON p.forwarded_by = fb.user_id
                WHERE u.user_typeId = 2 ";

            if ($userTypeId == 5 && $userDepartmentId) {
                // For POC users, show posts that are either:
                // 1. Forwarded to their department
                // 2. Originally assigned to their department
                $sql .= " AND (p.post_departmentId = ? OR (p.is_forwarded = 1 AND p.post_departmentId = ?))";
                $params = [$userDepartmentId, $userDepartmentId];
            } else {
                $params = [];
            }

            $sql .= " ORDER BY p.post_date DESC, p.post_time DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "draw" => isset($_GET['draw']) ? intval($_GET['draw']) : 1,
                "recordsTotal" => count($posts),
                "recordsFiltered" => count($posts),
                "data" => $posts
            ];
        } catch (\PDOException $e) {
            error_log("Error in handleGetStudentPosts: " . $e->getMessage());
            return [
                "draw" => 1,
                "recordsTotal" => 0,
                "recordsFiltered" => 0,
                "data" => [],
                "error" => $e->getMessage()
            ];
        }
    }

    public function handleGetVisitorPosts()
    {
        try {
            $userInfo = $this->getUserTypeAndDepartment();
            $userTypeId = $userInfo['userType'];
            $userDepartmentId = $userInfo['userDepartment'];

            $sql = "
                SELECT
                    p.*,
                    u.user_typeId,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) as user_fullname,
                    pt.postType_name,
                    d.department_name,
                    cp.campus_name,
                    i.inquiry_type,
                    fb.user_firstname as forwarded_by_name
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tbldepartments d ON p.post_departmentId = d.department_id
                LEFT JOIN tblcampus cp ON p.post_campusId = cp.campus_id
                LEFT JOIN tbl_giya_inquiry_types i ON p.inquiry_typeId = i.inquiry_id
                LEFT JOIN tblusers fb ON p.forwarded_by = fb.user_id
                WHERE u.user_typeId = 1 ";

            if ($userTypeId == 5 && $userDepartmentId) {
                $sql .= " AND (p.post_departmentId = ? OR (p.is_forwarded = 1 AND p.post_departmentId = ?))";
                $params = [$userDepartmentId, $userDepartmentId];
            } else {
                $params = [];
            }

            $sql .= " ORDER BY p.post_date DESC, p.post_time DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "draw" => isset($_GET['draw']) ? intval($_GET['draw']) : 1,
                "recordsTotal" => count($posts),
                "recordsFiltered" => count($posts),
                "data" => $posts
            ];
        } catch (\PDOException $e) {
            error_log("Error in handleGetVisitorPosts: " . $e->getMessage());
            return [
                "draw" => 1,
                "recordsTotal" => 0,
                "recordsFiltered" => 0,
                "data" => [],
                "error" => $e->getMessage()
            ];
        }
    }

    public function handleSubmitReply($data)
    {
        if (!isset($data['post_id']) || !isset($data['reply_message']) || !isset($data['admin_id'])) {
            return ["success" => false, "message" => "Missing required fields"];
        }

        try {
            $this->pdo->beginTransaction();

            $attachmentPath = null;

            // Handle file upload if present
            if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = '../uploads/';
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }

                $fileName = uniqid() . '_' . basename($_FILES['attachment']['name']);
                $targetPath = $uploadDir . $fileName;

                if (move_uploaded_file($_FILES['attachment']['tmp_name'], $targetPath)) {
                    $attachmentPath = $fileName;
                }
            }

            // Check post status
            $checkStmt = $this->pdo->prepare("SELECT post_status FROM tbl_giya_posts WHERE post_id = ?");
            $checkStmt->execute([$data['post_id']]);
            $status = $checkStmt->fetchColumn();

            if ($status == 2) {
                return ["success" => false, "message" => "Cannot reply to resolved posts"];
            }

            // Check if admin
            $userTypeStmt = $this->pdo->prepare("SELECT user_typeId FROM tblusers WHERE user_id = ?");
            $userTypeStmt->execute([$data['admin_id']]);
            $userType = $userTypeStmt->fetchColumn();

            $isAdminUser = in_array($userType, ['3', '4', '5', '6']);

            // FIXED: Remove duplicate insert and only insert reply once
            $stmt = $this->pdo->prepare("
                INSERT INTO tbl_giya_reply (
                    reply_userId,
                    reply_postId,
                    reply_date,
                    reply_time,
                    reply_message,
                    attachment_path
                ) VALUES (?, ?, CURDATE(), CURTIME(), ?, ?)
            ");

            $stmt->execute([
                $data['admin_id'],
                $data['post_id'],
                $data['reply_message'],
                $attachmentPath
            ]);

            // Update post status if admin reply and post is pending
            if ($isAdminUser && $status == 0) {
                $updateStmt = $this->pdo->prepare("
                    UPDATE tbl_giya_posts
                    SET post_status = 1
                    WHERE post_id = ?
                ");
                $updateStmt->execute([$data['post_id']]);
            }

            $this->pdo->commit();

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

    // FIXED: Fix the duplicate reply issue in addReply and handleSubmitReply functions
    public function addReply($data)
    {
        if (!isset($data['post_id']) || !isset($data['user_id']) || !isset($data['content'])) {
            return ["status" => "error", "message" => "Missing required fields"];
        }

        try {
            $statusStmt = $this->pdo->prepare("SELECT post_status FROM tbl_giya_posts WHERE post_id = ?");
            $statusStmt->execute([$data['post_id']]);
            $currentStatus = $statusStmt->fetchColumn();

            if ($currentStatus == '2') {
                return ["status" => "error", "message" => "Cannot reply to a resolved concern"];
            }

            $userTypeStmt = $this->pdo->prepare("SELECT user_typeId FROM tblusers WHERE user_id = ?");
            $userTypeStmt->execute([$data['user_id']]);
            $userType = $userTypeStmt->fetchColumn();

            $isAdminUser = in_array($userType, ['3', '4', '5', '6']);

            // Get post owner ID for notification purposes
            $postOwnerStmt = $this->pdo->prepare("SELECT post_userId FROM tbl_giya_posts WHERE post_id = ?");
            $postOwnerStmt->execute([$data['post_id']]);
            $postOwnerId = $postOwnerStmt->fetchColumn();

            // Determine if this is a self-reply (user replying to their own post)
            $isSelfReply = ($data['user_id'] == $postOwnerId);

            // If admin is replying to user's post, mark as unread for notification
            // If user is replying to their own post, no notification needed
            $isRead = ($isAdminUser && !$isSelfReply) ? 0 : 1;

            $stmt = $this->pdo->prepare("
                INSERT INTO tbl_giya_reply (
                    reply_userId,
                    reply_postId,
                    reply_date,
                    reply_time,
                    reply_message,
                    is_read
                ) VALUES (?, ?, CURDATE(), CURTIME(), ?, ?)
            ");
            $stmt->execute([
                $data['user_id'],
                $data['post_id'],
                $data['content'],
                $isRead
            ]);

            if ($isAdminUser && $currentStatus == '0') {
                $updateStmt = $this->pdo->prepare("
                    UPDATE tbl_giya_posts
                    SET post_status = 1
                    WHERE post_id = ?
                ");
                $updateStmt->execute([$data['post_id']]);
            }

            return [
                "status" => "success",
                "message" => "Reply added successfully",
                "reply_id" => $this->pdo->lastInsertId()
            ];
        } catch (\PDOException $e) {
            error_log("Error in addReply: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }

    public function updatePostStatus($data)
    {
        if (!isset($data['post_id']) || !isset($data['status'])) {
            return ["success" => false, "message" => "Missing required fields"];
        }

        try {
            $stmt = $this->pdo->prepare("
                UPDATE tbl_giya_posts
                SET post_status = ?
                WHERE post_id = ?
            ");
            $stmt->execute([$data['status'], $data['post_id']]);

            return [
                "success" => true,
                "message" => "Post status updated successfully"
            ];
        } catch (\PDOException $e) {
            return [
                "success" => false,
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }

    public function getUserSubmissions($userId)
    {
        try {
            if (!$userId) {
                return array(
                    "status" => "error",
                    "message" => "User ID is missing"
                );
            }

            $stmt = $this->pdo->prepare("
                SELECT
                    p.post_id,
                    p.post_title,
                    p.post_date,
                    p.post_time,
                    p.post_status,
                    pt.postType_name as type,
                    i.inquiry_type,
                    i.description as inquiry_description
                FROM tbl_giya_posts p
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tbl_giya_inquiry_types i ON p.inquiry_typeId = i.inquiry_id
                WHERE p.post_userId = ?
                ORDER BY p.post_date DESC, p.post_time DESC
            ");
            $stmt->execute([$userId]);
            $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($submissions)) {
                return array(
                    "status" => "success",
                    "data" => array(),
                    "message" => "No submissions found"
                );
            }

            return array(
                "status" => "success",
                "data" => $submissions
            );
        } catch (\PDOException $e) {
            error_log("Database error in getUserSubmissions: " . $e->getMessage());
            return array(
                "status" => "error",
                "message" => "Failed to load submissions. Please try again."
            );
        }
    }

    public function getSubmissionDetail($submissionId)
    {
        try {
            $statusCheck = $this->pdo->prepare("SELECT post_status FROM tbl_giya_posts WHERE post_id = ?");
            $statusCheck->execute([$submissionId]);
            $currentStatus = $statusCheck->fetchColumn();

            $stmt = $this->pdo->prepare("
                SELECT
                    p.*,
                    pt.postType_name as type,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) as author_name,
                    u.user_typeId as author_type,
                    u.user_schoolId,
                    it.inquiry_type,
                    it.description as inquiry_description
                FROM tbl_giya_posts p
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                JOIN tblusers u ON p.post_userId = u.user_id
                LEFT JOIN tbl_giya_inquiry_types it ON p.inquiry_typeId = it.inquiry_id
                WHERE p.post_id = ?
            ");
            $stmt->execute([$submissionId]);
            $submission = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$submission) {
                return ["status" => "error", "message" => "Submission not found"];
            }

            $submission['post_status'] = $currentStatus;

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

    // FIXED: Check for the correct response format
    public function checkNewReplies($userId) {
        try {
            if (!$userId) {
                return ["success" => false, "message" => "User ID is required"];
            }

            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as unread_count
                FROM tbl_giya_reply r
                JOIN tbl_giya_posts p ON r.reply_postId = p.post_id
                WHERE p.post_userId = ?
                AND r.is_read = 0
                AND p.post_status != 2
                AND r.reply_userId != p.post_userId  -- Exclude self-replies
            ");
            $stmt->execute([$userId]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);

            $unreadCount = (int)$result['unread_count'];

            return [
                "success" => true,
                "unreadCount" => $unreadCount
            ];
        } catch (\PDOException $e) {
            return [
                "success" => false,
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }

    // FIXED: Ensure consistent response format
    public function markRepliesRead($userId) {
        try {
            if (!$userId) {
                return ["success" => false, "message" => "User ID is required"];
            }

            $stmt = $this->pdo->prepare("
                UPDATE tbl_giya_reply r
                JOIN tbl_giya_posts p ON r.reply_postId = p.post_id
                SET r.is_read = 1
                WHERE p.post_userId = ?
                AND r.is_read = 0
            ");
            $stmt->execute([$userId]);

            $count = $stmt->rowCount();

            return [
                "success" => true,
                "message" => "All notifications marked as read",
                "count" => $count
            ];
        } catch (\PDOException $e) {
            return [
                "success" => false,
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }

    public function handleQuickView($identifier)
    {
        try {
            if (empty($identifier)) {
                return ["status" => "error", "message" => "Identifier is required"];
            }

            $identifier = trim($identifier);

            $stmt = $this->pdo->prepare("
                SELECT
                    p.post_id,
                    p.post_title,
                    DATE_FORMAT(p.post_date, '%m-%d-%Y') as post_date,
                    p.post_time,
                    p.post_status,
                    pt.postType_name,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) AS user_fullname
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                WHERE u.user_email LIKE ? OR u.user_schoolId LIKE ? OR
                      CONCAT(u.user_firstname, ' ', u.user_lastname) LIKE ?
                ORDER BY p.post_date DESC, p.post_time DESC
                LIMIT 20
            ");

            $likePattern = "%$identifier%";
            $stmt->execute([$likePattern, $likePattern, $likePattern]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($results)) {
                return ["status" => "error", "message" => "No inquiries found for the provided ID or email"];
            }

            return [
                "status" => "success",
                "data" => $results,
                "count" => count($results)
            ];
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }

    public function handleGetPostsByDepartment($departmentId) {
        try {
            if (!is_numeric($departmentId)) {
                return [
                    "draw" => 1,
                    "recordsTotal" => 0,
                    "recordsFiltered" => 0,
                    "data" => [],
                    "error" => "Invalid department ID"
                ];
            }

            $stmt = $this->pdo->prepare("
                SELECT
                    p.*,
                    u.user_firstname,
                    u.user_lastname,
                    u.user_typeId,  /* Explicitly include user_typeId */
                    CONCAT(u.user_firstname, ' ', u.user_lastname) as user_fullname,
                    u.user_schoolId,
                    t.postType_name,
                    d.department_name,
                    c.campus_name,
                    i.inquiry_type,
                    fb.user_firstname as forwarded_by_firstname,
                    fb.user_lastname as forwarded_by_lastname,
                    CONCAT(fb.user_firstname, ' ', fb.user_lastname) as forwarded_by_name
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype t ON p.postType_id = t.postType_id
                LEFT JOIN tbldepartments d ON p.post_departmentId = d.department_id
                LEFT JOIN tblcampus c ON p.post_campusId = c.campus_id
                LEFT JOIN tbl_giya_inquiry_types i ON p.inquiry_typeId = i.inquiry_id
                LEFT JOIN tblusers fb ON p.forwarded_by = fb.user_id
                WHERE p.post_departmentId = ?
                AND p.is_forwarded = 1
                ORDER BY p.post_date DESC, p.post_time DESC
            ");
            $stmt->execute([$departmentId]);
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "draw" => isset($_GET['draw']) ? intval($_GET['draw']) : 1,
                "recordsTotal" => count($posts),
                "recordsFiltered" => count($posts),
                "data" => $posts
            ];
        } catch (\PDOException $e) {
            error_log("Database error in handleGetPostsByDepartment: " . $e->getMessage());
            return [
                "draw" => 1,
                "recordsTotal" => 0,
                "recordsFiltered" => 0,
                "data" => [],
                "error" => $e->getMessage()
            ];
        }
    }

    public function handleGetStudentPostsByDepartment($departmentId) {
        try {
            if (!is_numeric($departmentId)) {
                return ["success" => false, "message" => "Invalid department ID"];
            }

            $stmt = $this->pdo->prepare("
                SELECT
                    p.*,
                    u.user_firstname,
                    u.user_lastname,
                    u.user_typeId,  /* Explicitly include user_typeId */
                    CONCAT(u.user_firstname, ' ', u.user_lastname) as user_fullname,
                    u.user_schoolId,
                    t.postType_name,
                    d.department_name,
                    c.campus_name,
                    i.inquiry_type,
                    fb.user_firstname as forwarded_by_firstname,
                    fb.user_lastname as forwarded_by_lastname,
                    CONCAT(fb.user_firstname, ' ', fb.user_lastname) as forwarded_by_name
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype t ON p.postType_id = t.postType_id
                LEFT JOIN tbldepartments d ON p.post_departmentId = d.department_id
                LEFT JOIN tblcampus c ON p.post_campusId = c.campus_id
                LEFT JOIN tbl_giya_inquiry_types i ON p.inquiry_typeId = i.inquiry_id
                LEFT JOIN tblusers fb ON p.forwarded_by = fb.user_id
                WHERE p.post_departmentId = ?
                AND p.is_forwarded = 1
                AND u.user_typeId = 2
                ORDER BY p.post_date DESC, p.post_time DESC
            ");
            $stmt->execute([$departmentId]);
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "draw" => isset($_GET['draw']) ? intval($_GET['draw']) : 1,
                "recordsTotal" => count($posts),
                "recordsFiltered" => count($posts),
                "data" => $posts
            ];
        } catch (\PDOException $e) {
            error_log("Error in handleGetStudentPostsByDepartment: " . $e->getMessage());
            return [
                "success" => false,
                "message" => "Database error"
            ];
        }
    }

    public function handleGetVisitorPostsByDepartment($departmentId) {
        try {
            if (!is_numeric($departmentId)) {
                return [
                    "draw" => 1,
                    "recordsTotal" => 0,
                    "recordsFiltered" => 0,
                    "data" => [],
                    "error" => "Invalid department ID"
                ];
            }

            $stmt = $this->pdo->prepare("
                SELECT
                    p.post_id,
                    p.post_title,
                    p.post_message,
                    DATE_FORMAT(p.post_date, '%m-%d-%Y') as post_date,
                    p.post_time,
                    p.post_status,
                    p.is_forwarded,
                    pt.postType_name,
                    u.user_id,
                    u.user_status,
                    u.user_typeId,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) AS user_fullname,
                    u.user_schoolId,
                    d.department_name,
                    cp.campus_name
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                JOIN tbldepartments d ON p.post_departmentId = d.department_id
                LEFT JOIN tblcampus cp ON p.post_campusId = cp.campus_id
                WHERE u.user_typeId = 1
                AND p.post_departmentId = ?
                AND p.is_forwarded = 1
                ORDER BY p.post_date DESC, p.post_time DESC
            ");
            $stmt->execute([$departmentId]);
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "draw" => isset($_GET['draw']) ? intval($_GET['draw']) : 1,
                "recordsTotal" => count($posts),
                "recordsFiltered" => count($posts),
                "data" => $posts
            ];
        } catch (\PDOException $e) {
            error_log("Error in handleGetVisitorPostsByDepartment: " . $e->getMessage());
            return [
                "draw" => 1,
                "recordsTotal" => 0,
                "recordsFiltered" => 0,
                "data" => [],
                "error" => $e->getMessage()
            ];
        }
    }

    public function handleGetEmployeePosts()
    {
        try {
            $userInfo = $this->getUserTypeAndDepartment();
            $userTypeId = $userInfo['userType'];
            $userDepartmentId = $userInfo['userDepartment'];

            // Initialize $sql variable before using it
            $sql = "
                SELECT
                    p.post_id,
                    p.post_title,
                    p.post_message,
                    DATE_FORMAT(p.post_date, '%m-%d-%Y') as post_date,
                    p.post_time,
                    p.post_status,
                    p.post_campusId,
                    p.is_forwarded,
                    pt.postType_name,
                    u.user_id,
                    u.user_status,
                    u.user_typeId,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) AS user_fullname,
                    u.user_schoolId,
                    cp.campus_name,
                    COALESCE(d.department_name, 'Not Assigned') as department_name
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tbldepartments d ON p.post_departmentId = d.department_id
                LEFT JOIN tblcampus cp ON p.post_campusId = cp.campus_id
                WHERE u.user_typeId IN (3, 4) ";

            if ($userTypeId == 5 && $userDepartmentId) {
                $sql .= " AND (p.is_forwarded = 1 AND p.post_departmentId = ?)";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$userDepartmentId]);
            } else {
                $sql .= " ORDER BY p.post_date DESC, p.post_time DESC";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute();
            }

            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "draw" => isset($_GET['draw']) ? intval($_GET['draw']) : 1,
                "recordsTotal" => count($posts),
                "recordsFiltered" => count($posts),
                "data" => $posts
            ];
        } catch (\PDOException $e) {
            error_log("Error in handleGetEmployeePosts: " . $e->getMessage());
            return [
                "draw" => 1,
                "recordsTotal" => 0,
                "recordsFiltered" => 0,
                "data" => [],
                "error" => $e->getMessage()
            ];
        }
    }

    public function handleGetEmployeePostsByDepartment($departmentId)
    {
        try {
            if (!is_numeric($departmentId)) {
                return [
                    "draw" => 1,
                    "recordsTotal" => 0,
                    "recordsFiltered" => 0,
                    "data" => [],
                    "error" => "Invalid department ID"
                ];
            }

            $stmt = $this->pdo->prepare("
                SELECT
                    p.post_id,
                    p.post_title,
                    p.post_message,
                    DATE_FORMAT(p.post_date, '%m-%d-%Y') as post_date,
                    p.post_time,
                    p.post_status,
                    p.is_forwarded,
                    pt.postType_name,
                    u.user_id,
                    u.user_status,
                    u.user_typeId,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) AS user_fullname,
                    u.user_schoolId,
                    d.department_name,
                    cp.campus_name
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                JOIN tbldepartments d ON p.post_departmentId = d.department_id
                LEFT JOIN tblcampus cp ON p.post_campusId = cp.campus_id
                WHERE u.user_typeId IN (3, 4)
                AND p.post_departmentId = ?
                AND p.is_forwarded = 1
                ORDER BY p.post_date DESC, p.post_time DESC
            ");
            $stmt->execute([$departmentId]);
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "draw" => isset($_GET['draw']) ? intval($_GET['draw']) : 1,
                "recordsTotal" => count($posts),
                "recordsFiltered" => count($posts),
                "data" => $posts
            ];
        } catch (\PDOException $e) {
            error_log("Error in handleGetEmployeePostsByDepartment: " . $e->getMessage());
            return [
                "draw" => 1,
                "recordsTotal" => 0,
                "recordsFiltered" => 0,
                "data" => [],
                "error" => $e->getMessage()
            ];
        }
    }

    public function handleGetResolvedPosts()
    {
        try {
            // Check if user is logged in
            $userTypeAndDepartment = $this->getUserTypeAndDepartment();
            $userTypeId = $userTypeAndDepartment['user_typeId'] ?? null;
            $departmentId = $userTypeAndDepartment['department_id'] ?? null;

            // Set query parameters
            $params = [];
            $query = "
                SELECT p.*, pt.postType_name,
                CONCAT(u.user_firstname, ' ', u.user_lastname) as user_fullname,
                u.user_schoolId, u.user_typeId, ut.user_type,
                d.department_name, c.campus_name,
                i.inquiry_type
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tblusertype ut ON u.user_typeId = ut.user_typeId
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tbldepartments d ON p.post_departmentId = d.department_id
                LEFT JOIN tblcampus c ON p.post_campusId = c.campus_id
                LEFT JOIN tbl_giya_inquiry_types i ON p.inquiry_typeId = i.inquiry_id
                WHERE p.post_status = 2
            ";

            // If POC, restrict to their department
            if ($userTypeId == 5 && $departmentId) {
                $query .= " AND p.post_departmentId = ?";
                $params[] = $departmentId;
            }

            $query .= " ORDER BY p.post_date DESC, p.post_time DESC";

            $stmt = $this->pdo->prepare($query);
            $stmt->execute($params);
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return outputJSON(['success' => true, 'data' => $posts]);
        } catch (Exception $e) {
            return outputJSON(['success' => false, 'message' => 'Error fetching resolved posts: ' . $e->getMessage()]);
        }
    }

    public function handleGetResolvedStudentPosts()
    {
        try {
            // Check if user is logged in
            $userTypeAndDepartment = $this->getUserTypeAndDepartment();
            $userTypeId = $userTypeAndDepartment['user_typeId'] ?? null;
            $departmentId = $userTypeAndDepartment['department_id'] ?? null;

            // Set query parameters
            $params = [2]; // Student user_typeId
            $query = "
                SELECT p.*, pt.postType_name,
                CONCAT(u.user_firstname, ' ', u.user_lastname) as user_fullname,
                u.user_schoolId, u.user_typeId, ut.user_type,
                d.department_name, c.campus_name,
                i.inquiry_type
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tblusertype ut ON u.user_typeId = ut.user_typeId
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tbldepartments d ON p.post_departmentId = d.department_id
                LEFT JOIN tblcampus c ON p.post_campusId = c.campus_id
                LEFT JOIN tbl_giya_inquiry_types i ON p.inquiry_typeId = i.inquiry_id
                WHERE p.post_status = 2 AND u.user_typeId = ?
            ";

            // If POC, restrict to their department
            if ($userTypeId == 5 && $departmentId) {
                $query .= " AND p.post_departmentId = ?";
                $params[] = $departmentId;
            }

            $query .= " ORDER BY p.post_date DESC, p.post_time DESC";

            $stmt = $this->pdo->prepare($query);
            $stmt->execute($params);
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return outputJSON(['success' => true, 'data' => $posts]);
        } catch (Exception $e) {
            return outputJSON(['success' => false, 'message' => 'Error fetching resolved student posts: ' . $e->getMessage()]);
        }
    }

    public function handleGetResolvedVisitorPosts()
    {
        try {
            // Check if user is logged in
            $userTypeAndDepartment = $this->getUserTypeAndDepartment();
            $userTypeId = $userTypeAndDepartment['user_typeId'] ?? null;
            $departmentId = $userTypeAndDepartment['department_id'] ?? null;

            // Set query parameters
            $params = [1]; // Visitor user_typeId
            $query = "
                SELECT p.*, pt.postType_name,
                CONCAT(u.user_firstname, ' ', u.user_lastname) as user_fullname,
                u.user_schoolId, u.user_typeId, ut.user_type,
                d.department_name, c.campus_name,
                i.inquiry_type
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tblusertype ut ON u.user_typeId = ut.user_typeId
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tbldepartments d ON p.post_departmentId = d.department_id
                LEFT JOIN tblcampus c ON p.post_campusId = c.campus_id
                LEFT JOIN tbl_giya_inquiry_types i ON p.inquiry_typeId = i.inquiry_id
                WHERE p.post_status = 2 AND u.user_typeId = ?
            ";

            // If POC, restrict to their department
            if ($userTypeId == 5 && $departmentId) {
                $query .= " AND p.post_departmentId = ?";
                $params[] = $departmentId;
            }

            $query .= " ORDER BY p.post_date DESC, p.post_time DESC";

            $stmt = $this->pdo->prepare($query);
            $stmt->execute($params);
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return outputJSON(['success' => true, 'data' => $posts]);
        } catch (Exception $e) {
            return outputJSON(['success' => false, 'message' => 'Error fetching resolved visitor posts: ' . $e->getMessage()]);
        }
    }

    public function handleGetResolvedEmployeePosts()
    {
        try {
            // Check if user is logged in
            $userTypeAndDepartment = $this->getUserTypeAndDepartment();
            $userTypeId = $userTypeAndDepartment['user_typeId'] ?? null;
            $departmentId = $userTypeAndDepartment['department_id'] ?? null;

            // Set query parameters - Employee (3 = Faculty, 4 = Employee)
            $employeeTypes = [3, 4];
            $placeholders = implode(',', array_fill(0, count($employeeTypes), '?'));
            $params = $employeeTypes;

            $query = "
                SELECT p.*, pt.postType_name,
                CONCAT(u.user_firstname, ' ', u.user_lastname) as user_fullname,
                u.user_schoolId, u.user_typeId, ut.user_type,
                d.department_name, c.campus_name,
                i.inquiry_type
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tblusertype ut ON u.user_typeId = ut.user_typeId
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tbldepartments d ON p.post_departmentId = d.department_id
                LEFT JOIN tblcampus c ON p.post_campusId = c.campus_id
                LEFT JOIN tbl_giya_inquiry_types i ON p.inquiry_typeId = i.inquiry_id
                WHERE p.post_status = 2 AND u.user_typeId IN ({$placeholders})
            ";

            // If POC, restrict to their department
            if ($userTypeId == 5 && $departmentId) {
                $query .= " AND p.post_departmentId = ?";
                $params[] = $departmentId;
            }

            $query .= " ORDER BY p.post_date DESC, p.post_time DESC";

            $stmt = $this->pdo->prepare($query);
            $stmt->execute($params);
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return outputJSON(['success' => true, 'data' => $posts]);
        } catch (Exception $e) {
            return outputJSON(['success' => false, 'message' => 'Error fetching resolved employee posts: ' . $e->getMessage()]);
        }
    }

    public function handleForwardPost($data) {
        if (!isset($data['post_id']) || !isset($data['forwarded_by']) || !isset($data['department_id']) || !isset($data['campus_id'])) {
            return ["success" => false, "message" => "Missing required fields"];
        }

        try {
            $this->pdo->beginTransaction();

            $stmt = $this->pdo->prepare("SELECT post_status FROM tbl_giya_posts WHERE post_id = ?");
            $stmt->execute([$data['post_id']]);
            $currentStatus = $stmt->fetchColumn();

            $stmt = $this->pdo->prepare("
                UPDATE tbl_giya_posts
                SET post_departmentId = ?,
                    post_campusId = ?,
                    is_forwarded = 1,
                    forwarded_by = ?,
                    forwarded_at = NOW(),
                    post_status = CASE WHEN post_status = 0 THEN 1 ELSE post_status END
                WHERE post_id = ?
            ");
            $stmt->execute([
                $data['department_id'],
                $data['campus_id'],
                $data['forwarded_by'],
                $data['post_id']
            ]);

            $this->pdo->commit();

            $deptStmt = $this->pdo->prepare("SELECT department_name FROM tbldepartments WHERE department_id = ?");
            $deptStmt->execute([$data['department_id']]);
            $departmentName = $deptStmt->fetchColumn();

            $campusStmt = $this->pdo->prepare("SELECT campus_name FROM tblcampus WHERE campus_id = ?");
            $campusStmt->execute([$data['campus_id']]);
            $campusName = $campusStmt->fetchColumn();

            $systemMessage = "Post forwarded to $departmentName department at $campusName campus";
            $systemUserId = 25;

            $replyStmt = $this->pdo->prepare("
                INSERT INTO tbl_giya_reply (
                    reply_userId,
                    reply_postId,
                    reply_date,
                    reply_time,
                    reply_message,
                    is_read
                ) VALUES (?, ?, CURDATE(), CURTIME(), ?, 1)
            ");
            $replyStmt->execute([
                $systemUserId,
                $data['post_id'],
                $systemMessage
            ]);

            return [
                "success" => true,
                "message" => "Post successfully forwarded",
                "forwarded_to" => ["department" => $departmentName, "campus" => $campusName]
            ];
        } catch (\PDOException $e) {
            $this->pdo->rollBack();
            return ["success" => false, "message" => "Database error: " . $e->getMessage()];
        }
    }

    public function getPosts($type = null) {
        try {
            // Initialize $sql variable before using it
            $sql = "
                SELECT
                    p.*,
                    u.user_firstname,
                    u.user_lastname,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) as user_fullname,
                    u.user_schoolId,
                    u.user_typeId,
                    t.postType_name,
                    d.department_name,
                    c.campus_name,
                    i.inquiry_type
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype t ON p.postType_id = t.postType_id
                LEFT JOIN tbldepartments d ON p.post_departmentId = d.department_id
                LEFT JOIN tblcampus c ON p.post_campusId = c.campus_id
                LEFT JOIN tbl_giya_inquiry_types i ON p.inquiry_typeId = i.inquiry_id
                WHERE 1=1";

            // Apply filters based on $type if provided
            if ($type === 'student') {
                $sql .= " AND u.user_typeId = 2";
            } else if ($type === 'visitor') {
                $sql .= " AND u.user_typeId = 1";
            } else if ($type === 'employee') {
                $sql .= " AND u.user_typeId IN (3, 4)";
            }

            // Add ORDER BY clause for most recent posts first
            $sql .= " ORDER BY p.post_date DESC, p.post_time DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Database error in getPosts: " . $e->getMessage());
            return [];
        }
    }

    // Modify the handleGetLatestPosts method to add additional filtering for POC users
    public function handleGetLatestPosts() {
        try {
            $userInfo = $this->getUserTypeAndDepartment();
            $userTypeId = $userInfo['userType'];
            $userDepartmentId = $userInfo['userDepartment'];

            $query = "
                SELECT
                    p.post_id,
                    p.post_title,
                    p.post_message,
                    DATE_FORMAT(p.post_date, '%m-%d-%Y') as post_date,
                    p.post_time,
                    p.post_status,
                    p.post_campusId,
                    p.is_forwarded,
                    pt.postType_name,
                    u.user_id,
                    u.user_status,
                    u.user_typeId,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) AS user_fullname,
                    u.user_schoolId,
                    cp.campus_name,
                    COALESCE(d2.department_name, d1.department_name, 'Not Assigned') as department_name
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tblcourses c ON u.user_courseId = c.course_id
                LEFT JOIN tbldepartments d1 ON c.course_departmentId = d1.department_id
                LEFT JOIN tbldepartments d2 ON p.post_departmentId = d2.department_id
                LEFT JOIN tblcampus cp ON p.post_campusId = cp.campus_id
                WHERE p.post_status IN (0, 1)";

            // POC users should only see posts that have been forwarded to their department
            if ($userTypeId == 5 && $userDepartmentId) {
                $query .= " AND (p.is_forwarded = 1 AND p.post_departmentId = ?)";
                $stmt = $this->pdo->prepare($query);
                $stmt->execute([$userDepartmentId]);
            } else {
                $query .= " ORDER BY p.post_date DESC, p.post_time DESC";
                $stmt = $this->pdo->prepare($query);
                $stmt->execute();
            }

            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "draw" => isset($_GET['draw']) ? (int)$_GET['draw'] : 1,
                "recordsTotal" => count($posts),
                "recordsFiltered" => count($posts),
                "data" => $posts
            ];
        } catch (\PDOException $e) {
            error_log("Error in handleGetLatestPosts: " . $e->getMessage());
            return [
                "draw" => 1,
                "recordsTotal" => 0,
                "recordsFiltered" => 0,
                "data" => [],
                "error" => $e->getMessage()
            ];
        }
    }
}

if (isset($_GET['action'])) {
    ob_clean();
    header('Content-Type: application/json');
    $handler = new PostsHandler($pdo);

    switch ($_GET['action']) {
        case 'get_posts':
            outputJSON($handler->handleGetAllPosts());
            break;
        case 'get_post_details':
            outputJSON($handler->handleGetPostDetails($_GET['post_id'] ?? null));
            break;
        case 'get_student_posts':
            outputJSON($handler->handleGetStudentPosts());
            break;
        case 'get_visitor_posts':
            outputJSON($handler->handleGetVisitorPosts());
            break;
        case 'submit_reply':
            outputJSON($handler->handleSubmitReply($_POST));
            break;
        case 'update_post_status':
            $data = json_decode(file_get_contents("php://input"), true);
            outputJSON($handler->updatePostStatus($data));
            break;
        case 'mark_post_read':
            $data = json_decode(file_get_contents("php://input"), true);
            outputJSON($handler->handleMarkPostRead($data['post_id'] ?? null));
            break;
        case 'get_posts_by_department':
            $departmentId = $_GET['department_id'] ?? null;
            $response = $handler->handleGetPostsByDepartment($departmentId);
            outputJSON($response);
            break;
        case 'get_student_posts_by_department':
            $departmentId = $_GET['department_id'] ?? null;
            $response = $handler->handleGetStudentPostsByDepartment($departmentId);
            outputJSON($response);
            break;
        case 'get_visitor_posts_by_department':
            $departmentId = $_GET['department_id'] ?? null;
            $response = $handler->handleGetVisitorPostsByDepartment($departmentId);
            outputJSON($response);
            break;
        case 'get_employee_posts_by_department':
            $departmentId = $_GET['department_id'] ?? null;
            $response = $handler->handleGetEmployeePostsByDepartment($departmentId);
            outputJSON($response);
            break;
        case 'get_resolved_posts':
            safeApiHandler(function () use ($pdo) {
                $handler = new PostsHandler($pdo);
                return $handler->handleGetResolvedPosts();
            });
            break;

        case 'get_resolved_student_posts':
            safeApiHandler(function () use ($pdo) {
                $handler = new PostsHandler($pdo);
                return $handler->handleGetResolvedStudentPosts();
            });
            break;

        case 'get_resolved_visitor_posts':
            safeApiHandler(function () use ($pdo) {
                $handler = new PostsHandler($pdo);
                return $handler->handleGetResolvedVisitorPosts();
            });
            break;

        case 'get_resolved_employee_posts':
            safeApiHandler(function () use ($pdo) {
                $handler = new PostsHandler($pdo);
                return $handler->handleGetResolvedEmployeePosts();
            });
            break;
        case 'forward_post':
            $data = json_decode(file_get_contents("php://input"), true);
            outputJSON($handler->handleForwardPost($data));
            break;
        case 'get_user_posts':
            safeApiHandler(function() use ($pdo) {
                if (!isset($_GET['user_id'])) {
                    outputJSON(['success' => false, 'message' => 'User ID is required']);
                }

                try {
                    $stmt = $pdo->prepare("
                        SELECT
                            p.post_id,
                            p.post_status,
                            pt.postType_name as type,
                            p.post_title,
                            p.post_date,
                            p.post_time,
                            d.department_name,
                            it.inquiry_type
                        FROM tbl_giya_posts p
                        LEFT JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                        LEFT JOIN tbldepartments d ON p.post_departmentId = d.department_id
                        LEFT JOIN tbl_giya_inquiry_types it ON p.inquiry_typeId = it.inquiry_id
                        WHERE p.post_userId = ?
                        ORDER BY p.post_date DESC, p.post_time DESC
                    ");

                    $stmt->execute([$_GET['user_id']]);
                    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    outputJSON(['success' => true, 'data' => $posts]);
                } catch (PDOException $e) {
                    outputJSON(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
                }
            });
            break;
        case 'get_latest_posts':
            safeApiHandler(function() use ($pdo) {
                try {
                    $handler = new PostsHandler($pdo);
                    $response = $handler->handleGetLatestPosts();
                    outputJSON($response);
                } catch (PDOException $e) {
                    error_log('Error in get_latest_posts: ' . $e->getMessage());
                    outputJSON([
                        "draw" => 1,
                        "recordsTotal" => 0,
                        "recordsFiltered" => 0,
                        "data" => [],
                        "error" => $e->getMessage()
                    ]);
                }
            });
            break;
        case 'get_employee_posts':
            outputJSON($handler->handleGetEmployeePosts());
            break;
        case 'check_new_replies':
            if (!isset($_GET['user_id'])) {
                outputJSON(['success' => false, 'message' => 'User ID is required']);
                exit;
            }
            outputJSON($handler->checkNewReplies($_GET['user_id']));
            break;
        case 'add_reply':
            $formData = $_POST;
            if (empty($formData)) {
                $jsonData = json_decode(file_get_contents("php://input"), true);
                if ($jsonData) {
                    $formData = $jsonData;
                }
            }

            outputJSON($handler->addReply($formData));
            break;

        case 'mark_replies_read':
            $data = json_decode(file_get_contents("php://input"), true);
            if (!isset($data['user_id'])) {
                outputJSON(['success' => false, 'message' => 'User ID is required']);
            }
            outputJSON($handler->markRepliesRead($data['user_id']));
            break;

        case 'get_quick_view':
            // Add CORS headers to ensure client can access from any origin
            header("Access-Control-Allow-Origin: *");
            header("Access-Control-Allow-Methods: GET");
            header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");

            $identifier = $_GET['identifier'] ?? '';
            try {
                $result = $handler->handleQuickView($identifier);
                outputJSON($result);
            } catch (Exception $e) {
                outputJSON([
                    "status" => "error",
                    "message" => "Server error: " . $e->getMessage()
                ]);
            }
            break;

        default:
            outputJSON(["success" => false, "message" => "Invalid action"]);
            break;
    }
    exit;
} else {
    header('Content-Type: application/json');
    echo json_encode(["success" => false, "message" => "No action specified"]);
}
?>
