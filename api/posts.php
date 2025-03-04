<?php
require 'db_connection.php';

class PostsHandler
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
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
                    pt.postType_name,
                    u.user_id,
                    u.user_status,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) AS user_fullname,
                    u.user_schoolId,
                    COALESCE(d2.department_name, d1.department_name, 'Not Assigned') as department_name
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tblcourses c ON u.user_courseId = c.course_id
                LEFT JOIN tbldepartments d1 ON c.course_departmentId = d1.department_id
                LEFT JOIN tbldepartments d2 ON p.post_departmentId = d2.department_id
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
                    u.user_schoolId,
                    COALESCE(d2.department_name, d1.department_name, 'Not Assigned') as department_name
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tblcourses c ON u.user_courseId = c.course_id
                LEFT JOIN tbldepartments d1 ON c.course_departmentId = d1.department_id
                LEFT JOIN tbldepartments d2 ON p.post_departmentId = d2.department_id
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
                    u.user_schoolId,
                    COALESCE(d.department_name, 'Not Assigned') as department_name
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tbldepartments d ON p.post_departmentId = d.department_id
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

            // Check if post is already resolved
            $checkStmt = $this->pdo->prepare("SELECT post_status FROM tbl_giya_posts WHERE post_id = ?");
            $checkStmt->execute([$data['post_id']]);
            $status = $checkStmt->fetchColumn();

            if ($status == 3) {
                return ["success" => false, "message" => "Cannot reply to resolved posts"];
            }

            // Check if the user replying is an admin/POC
            $userTypeStmt = $this->pdo->prepare("SELECT user_typeId FROM tblusers WHERE user_id = ?");
            $userTypeStmt->execute([$data['admin_id']]);
            $userType = $userTypeStmt->fetchColumn();

            // UPDATED: Include user_typeId 5 (POC) in the list of admin users
            $isAdminUser = in_array($userType, ['3', '4', '5', '6']);

            // Just insert the reply without changing post status
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

            // If admin is replying and post is not ongoing yet, set it to ongoing
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

    public function addReply($data) {
        if (!isset($data['post_id']) || !isset($data['user_id']) || !isset($data['content'])) {
            return ["status" => "error", "message" => "Missing required fields"];
        }

        try {
            // First check if post is resolved
            $statusStmt = $this->pdo->prepare("SELECT post_status FROM tbl_giya_posts WHERE post_id = ?");
            $statusStmt->execute([$data['post_id']]);
            $currentStatus = $statusStmt->fetchColumn();

            if ($currentStatus == '2') { // 2 = resolved
                return ["status" => "error", "message" => "Cannot reply to a resolved concern"];
            }

            // Check if the user is admin/staff
            $userTypeStmt = $this->pdo->prepare("SELECT user_typeId FROM tblusers WHERE user_id = ?");
            $userTypeStmt->execute([$data['user_id']]);
            $userType = $userTypeStmt->fetchColumn();

            // UPDATED: Include user_typeId 5 (POC) in the list of admin users
            $isAdminUser = in_array($userType, ['3', '4', '5', '6']);

            // Add reply with appropriate is_read flag (0=unread, 1=read)
            // If admin adds a reply, it's automatically considered "read" by admin
            // If student adds a reply, it should be marked as "unread" for admin to see
            $isRead = $isAdminUser ? 0 : 1; // If admin user, set is_read=0 (unread for student)

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

            // Update post status based on who is replying
            if ($isAdminUser && $currentStatus == '0') {
                // If admin is replying to a pending post, automatically set to ongoing
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
            return [
                "status" => "error",
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }

    public function updatePostStatus($data) {
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

    public function getUserSubmissions($userId) {
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

    public function getSubmissionDetail($submissionId) {
        try {
            // Explicitly query for the latest post status
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

            // Make sure we're using the latest status
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

    public function checkNewReplies($userId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as unread_count
                FROM tbl_giya_posts p
                JOIN tbl_giya_reply r ON p.post_id = r.reply_postId
                JOIN tblusers u ON r.reply_userId = u.user_id
                WHERE p.post_userId = ?
                AND u.user_typeId IN (3, 4, 5, 6) -- Only count admin/staff replies
                AND r.is_read = 0 -- Only count unread replies
                AND p.post_status != 2 -- Exclude resolved posts
            ");
            $stmt->execute([$userId]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "unreadCount" => (int)$result['unread_count']
            ];
        } catch (\PDOException $e) {
            return [
                "status" => "error",
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }

    public function markRepliesRead($userId) {
        try {
            // Mark all replies to this user's posts as read
            $stmt = $this->pdo->prepare("
                UPDATE tbl_giya_reply r
                JOIN tbl_giya_posts p ON r.reply_postId = p.post_id
                JOIN tblusers u ON r.reply_userId = u.user_id
                SET r.is_read = 1
                WHERE p.post_userId = ?
                AND u.user_typeId IN (3, 4, 5, 6) -- Only mark admin/staff replies
                AND r.is_read = 0 -- Only update unread replies for efficiency
            ");
            $stmt->execute([$userId]);

            return [
                "status" => "success",
                "message" => "All notifications marked as read"
            ];
        } catch (\PDOException $e) {
            return [
                "status" => "error",
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }

    public function handleQuickView($identifier) {
        try {
            if (empty($identifier)) {
                return ["status" => "error", "message" => "Identifier is required"];
            }

            // Sanitize the input
            $identifier = trim($identifier);

            // First try to find by email, then by ID
            $stmt = $this->pdo->prepare("
                SELECT
                    p.post_id,
                    p.post_title,
                    p.post_message,
                    DATE_FORMAT(p.post_date, '%m-%d-%Y') as post_date,
                    p.post_time,
                    p.post_status,
                    pt.postType_name as type,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) AS user_fullname
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                WHERE u.user_email = ? OR u.user_schoolId = ?
                ORDER BY p.post_date DESC, p.post_time DESC
            ");
            $stmt->execute([$identifier, $identifier]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($results)) {
                return ["status" => "error", "message" => "No inquiries found for the provided ID or email"];
            }

            return [
                "status" => "success",
                "data" => $results
            ];
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Database error: " . $e->getMessage()
            ];
        }
    }

    public function handleGetPostsByDepartment($departmentId)
    {
        try {
            // Validate department ID
            if (!is_numeric($departmentId)) {
                return [
                    "draw" => 1,
                    "recordsTotal" => 0,
                    "recordsFiltered" => 0,
                    "data" => [],
                    "error" => "Invalid department ID"
                ];
            }

            // First check if department exists
            $deptStmt = $this->pdo->prepare("SELECT department_name FROM tbldepartments WHERE department_id = ?");
            $deptStmt->execute([$departmentId]);
            $departmentName = $deptStmt->fetchColumn();

            if (!$departmentName) {
                return [
                    "draw" => 1,
                    "recordsTotal" => 0,
                    "recordsFiltered" => 0,
                    "data" => [],
                    "error" => "Department not found"
                ];
            }

            // STRICT DEPARTMENT FILTERING: Only show posts where post_departmentId matches the POC department
            // This is the main change - we're ONLY filtering by p.post_departmentId now
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
                    u.user_schoolId,
                    d.department_name
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                JOIN tbldepartments d ON p.post_departmentId = d.department_id
                WHERE p.post_departmentId = ?
                ORDER BY p.post_date DESC, p.post_time DESC
            ");
            $stmt->execute([$departmentId]);
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Count total records for this department (strict matching)
            $countStmt = $this->pdo->prepare("
                SELECT COUNT(*)
                FROM tbl_giya_posts
                WHERE post_departmentId = ?
            ");
            $countStmt->execute([$departmentId]);
            $totalRecords = (int)$countStmt->fetchColumn();

            // Clean response format
            $response = [
                "draw" => isset($_GET['draw']) ? (int)$_GET['draw'] : 1,
                "recordsTotal" => $totalRecords,
                "recordsFiltered" => $totalRecords,
                "data" => array_values($posts)  // Fixed: changed array.values() to array_values()
            ];

            return $response;
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

    public function handleGetStudentPostsByDepartment($departmentId)
    {
        try {
            // Validate department ID
            if (!is_numeric($departmentId)) {
                return [
                    "draw" => 1,
                    "recordsTotal" => 0,
                    "recordsFiltered" => 0,
                    "data" => [],
                    "error" => "Invalid department ID"
                ];
            }

            // Get department name for reference
            $deptStmt = $this->pdo->prepare("SELECT department_name FROM tbldepartments WHERE department_id = ?");
            $deptStmt->execute([$departmentId]);
            $departmentName = $deptStmt->fetchColumn();

            // STRICT DEPARTMENT FILTERING: Only show student posts for this department
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
                    u.user_schoolId,
                    d.department_name
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                JOIN tbldepartments d ON p.post_departmentId = d.department_id
                WHERE u.user_typeId = 2
                AND p.post_departmentId = ?
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
                "draw" => 1,
                "recordsTotal" => 0,
                "recordsFiltered" => 0,
                "data" => [],
                "error" => $e->getMessage()
            ];
        }
    }

    public function handleGetVisitorPostsByDepartment($departmentId)
    {
        try {
            // Validate department ID
            if (!is_numeric($departmentId)) {
                return [
                    "draw" => 1,
                    "recordsTotal" => 0,
                    "recordsFiltered" => 0,
                    "data" => [],
                    "error" => "Invalid department ID"
                ];
            }

            // Get department name for reference
            $deptStmt = $this->pdo->prepare("SELECT department_name FROM tbldepartments WHERE department_id = ?");
            $deptStmt->execute([$departmentId]);
            $departmentName = $deptStmt->fetchColumn();

            // STRICT DEPARTMENT FILTERING: Only show visitor posts for this department
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
                    u.user_schoolId,
                    d.department_name
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                JOIN tbldepartments d ON p.post_departmentId = d.department_id
                WHERE u.user_typeId = 1
                AND p.post_departmentId = ?
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
}

// Route handling section
if (isset($_GET['action'])) {
    ob_clean();
    header('Content-Type: application/json');
    $handler = new PostsHandler($pdo);

    switch ($_GET['action']) {
        case 'get_posts':
            echo json_encode($handler->handleGetAllPosts(), JSON_UNESCAPED_UNICODE);
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
        case 'update_post_status':
            $data = json_decode(file_get_contents("php://input"), true);
            echo json_encode($handler->updatePostStatus($data));
            break;
        case 'mark_post_read':
            $data = json_decode(file_get_contents("php://input"), true);
            echo json_encode($handler->handleMarkPostRead($data['post_id'] ?? null));
            break;
        case 'get_posts_by_department':
            $departmentId = $_GET['department_id'] ?? null;
            if ($departmentId) {
                echo json_encode($handler->handleGetPostsByDepartment($departmentId), JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode($handler->handleGetAllPosts(), JSON_UNESCAPED_UNICODE);
            }
            break;
        case 'get_student_posts_by_department':
            $departmentId = $_GET['department_id'] ?? null;
            if ($departmentId) {
                echo json_encode($handler->handleGetStudentPostsByDepartment($departmentId), JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode($handler->handleGetStudentPosts(), JSON_UNESCAPED_UNICODE);
            }
            break;
        case 'get_visitor_posts_by_department':
            $departmentId = $_GET['department_id'] ?? null;
            if ($departmentId) {
                echo json_encode($handler->handleGetVisitorPostsByDepartment($departmentId), JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode($handler->handleGetVisitorPosts(), JSON_UNESCAPED_UNICODE);
            }
            break;
        default:
            echo json_encode(["success" => false, "message" => "Invalid action"]);
            break;
    }
} else {
    header('Content-Type: application/json');
    echo json_encode(["success" => false, "message" => "No action specified"]);



}    exit;
