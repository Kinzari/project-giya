<?php
// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS Headers - Update with your specific origin
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
} else {
    header('Access-Control-Allow-Origin: *');
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

// Main API Handler
if (!isset($_GET['action'])) {
    echo json_encode(["success" => false, "message" => "No action specified"]);
    exit;
}

$action = $_GET['action'];

switch ($action) {
    case 'login':
        $data = json_decode(file_get_contents("php://input"), true);
        $loginInput = isset($data['loginInput']) ? $data['loginInput'] : null;
        $password = isset($data['password']) ? $data['password'] : null;

        if (empty($loginInput) || empty($password)) {
            echo json_encode(["success" => false, "message" => "All fields are required."]);
            exit;
        }

        try {
            $query = $pdo->prepare("
                SELECT
                    u.*,
                    t.user_type,
                    COALESCE(d.department_name, 'Not Assigned') as department_name,
                    COALESCE(c.course_name, 'Not Assigned') as course_name,
                    COALESCE(u.user_schoolyearId, '1') as user_schoolyearId,
                    u.phinmaed_email,
                    u.user_email
                FROM tblusers u
                JOIN tblusertype t ON u.user_typeId = t.user_typeId
                LEFT JOIN tbldepartments d ON u.user_departmentId = d.department_id
                LEFT JOIN tblcourses c ON u.user_courseId = c.course_id
                WHERE u.user_schoolId = :loginInput
                   OR u.phinmaed_email = :loginInput
                   OR u.user_email = :loginInput
            ");

            $query->bindParam(':loginInput', $loginInput, PDO::PARAM_STR);
            $query->execute();

            if ($query->rowCount() === 0) {
                echo json_encode(["success" => false, "message" => "Invalid login credentials."]);
                exit;
            }

            $user = $query->fetch(PDO::FETCH_ASSOC);

            // Check if the user is deactivated
            if ($user['user_status'] == 0) {
                echo json_encode(["success" => false, "message" => "Your account has been deactivated. Please contact the administrator."]);
                exit;
            }

            // Verify the password
            if ($user['user_password'] !== $password) {
                echo json_encode(["success" => false, "message" => "Invalid password."]);
                exit;
            }

            // Update response format to match working example
            $response = [
                "success" => true,
                "user_id" => $user['user_id'],
                "user_schoolId" => $user['user_schoolId'],
                "user_firstname" => $user['user_firstname'],
                "user_middlename" => $user['user_middlename'] ?? '',
                "user_lastname" => $user['user_lastname'],
                "user_suffix" => $user['user_suffix'] ?? '',
                "user_typeId" => (int)$user['user_typeId'],
                "department_name" => $user['department_name'],
                "course_name" => $user['course_name'],
                "user_schoolyearId" => $user['user_schoolyearId'],
                "phinmaed_email" => $user['phinmaed_email'] ?? '',
                "user_contact" => $user['user_contact'] ?? '',
                "user_email" => $user['user_email'] ?? ''
            ];

            // Log the response for debugging
            error_log("Login Response: " . json_encode($response));

            echo json_encode($response);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => "An error occurred: " . $e->getMessage()]);
        }
        break;

    case 'register':
        $data = json_decode(file_get_contents("php://input"), true);

        // Get the latest visitor count for generating school ID
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM tblusers WHERE user_typeId = 1");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $visitorCount = $result['count'] + 1;

            // Generate school ID in format "03-2526-#####"
            $schoolId = sprintf("03-2526-%05d", $visitorCount);

            // Add schoolId to user data
            $first_name = isset($data['first_name']) ? trim($data['first_name']) : null;
            $middle_name = isset($data['middle_name']) ? trim($data['middle_name']) : null;
            $last_name = isset($data['family_name']) ? trim($data['family_name']) : null;
            $suffix = isset($data['suffix']) ? trim($data['suffix']) : null;
            $email = isset($data['user_email']) ? trim($data['user_email']) : null;
            $contact_number = isset($data['user_contact']) ? trim($data['user_contact']) : null;
            $password = isset($data['user_password']) ? trim($data['user_password']) : null;

            if (empty($first_name) || empty($last_name) || empty($email) || empty($contact_number) || empty($password)) {
                echo json_encode(["status" => "error", "message" => "All fields are required."]);
                exit;
            }

            // Validate password
            if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $password)) {
                echo json_encode(["status" => "error", "message" => "Password does not meet requirements"]);
                exit;
            }

            // Check for existing email
            $checkStmt = $pdo->prepare("SELECT * FROM tblusers WHERE user_email = ?");
            $checkStmt->execute([$email]);

            if ($checkStmt->rowCount() > 0) {
                echo json_encode(["status" => "error", "message" => "Email is already registered."]);
                exit;
            }

            // Insert new user with school ID
            $stmt = $pdo->prepare("
                INSERT INTO tblusers (
                    user_schoolId, user_firstname, user_middlename, user_lastname,
                    user_suffix, user_email, user_contact, user_password,
                    user_typeId, user_level
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $userTypeId = 1; // Default User Type (Visitor)
            $userLevel = 10; // Default user level

            $stmt->execute([
                $schoolId,
                $first_name,
                $middle_name,
                $last_name,
                $suffix,
                $email,
                $contact_number,
                $password,
                $userTypeId,
                $userLevel
            ]);

            echo json_encode([
                "status" => "success",
                "message" => "Registration successful!",
                "schoolId" => $schoolId
            ]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
        break;

    case 'get_courses':
        try {
            $stmt = $pdo->query("
                SELECT
                    c.course_id,
                    c.course_name,
                    d.department_name
                FROM tblcourses c
                LEFT JOIN tbldepartments d ON c.course_departmentId = d.department_id
            ");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'get_departments':
        try {
            $stmt = $pdo->query("SELECT department_id, department_name FROM tbldepartments");
            $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode([
                "success" => true,
                "departments" => array_map(function ($dept) {
                    return [
                        "id" => $dept['department_id'],
                        "name" => $dept['department_name']
                    ];
                }, $departments)
            ]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'update_user_status':
        $data = json_decode(file_get_contents("php://input"), true);
        $user_id = $data['user_id'] ?? null;
        $user_status = $data['user_status'] ?? null;

        if (!$user_id || !is_numeric($user_status) || !in_array($user_status, [0, 1], true)) {
            echo json_encode(["success" => false, "message" => "Invalid request parameters."]);
            exit;
        }

        try {
            $query = $pdo->prepare("UPDATE tblusers SET user_status = :user_status WHERE user_id = :user_id");
            $query->execute([':user_status' => $user_status, ':user_id' => $user_id]);

            $stmt = $pdo->prepare("SELECT user_status FROM tblusers WHERE user_id = :user_id");
            $stmt->execute([':user_id' => $user_id]);
            $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                "success" => true,
                "message" => "User status updated successfully.",
                "user_status" => (int) $updatedUser['user_status']
            ]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
        break;

    case 'submit_inquiry':
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['user_id']) || empty($data['post_type']) || empty($data['post_message'])) {
            echo json_encode(["success" => false, "message" => "Missing required fields"]);
            exit;
        }

        try {
            // Get department ID based on the post type
            $deptMap = [
                'ENROLLMENT' => 1,    // Assuming department IDs match your tbldepartments
                'ACADEMICS' => 2,
                'REGISTRAR' => 3,
                'FINANCE' => 1,
                'BUSINESS_CENTER' => 1,
                'CSDL' => 2,
                'MARKETING' => 1,
                'IT_SERVICES' => 6,   // IT Department
                'LIBRARY' => 2,
                'CLINIC' => 5,        // Allied Health
                'GSD' => 1,
                'GRADUATE_SCHOOL' => 2,
                'SSG' => 1,
                'HR' => 1,
                'ACE' => 1,
                'OTHERS' => 1
            ];
            $departmentId = $deptMap[$data['post_type']] ?? 1;  // Default to 1 if not found

            $stmt = $pdo->prepare("
                INSERT INTO tbl_giya_posts (
                    post_userId,
                    post_departmentId,
                    postType_id,
                    post_date,
                    post_time,
                    post_title,
                    post_message
                ) VALUES (?, ?, 1, CURDATE(), CURTIME(), ?, ?)
            ");
            $stmt->execute([
                $data['user_id'],
                $departmentId,
                $data['post_title'], // Use post_title instead of post_type
                $data['post_message']
            ]);

            echo json_encode([
                "success" => true,
                "message" => "Inquiry submitted successfully"
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Database error: " . $e->getMessage()
            ]);
        }
        break;

    case 'users':
        try {
            $stmt = $pdo->query("
                SELECT
                    u.user_id,
                    u.user_schoolId,
                    u.user_firstname,
                    u.user_middlename,
                    u.user_lastname,
                    u.user_suffix,
                    u.phinmaed_email,
                    u.user_email,
                    u.user_contact,
                    u.user_status,
                    u.user_typeId,
                    d.department_name,
                    c.course_name,
                    t.user_type,
                    CONCAT(u.user_lastname, ', ', u.user_firstname) AS full_name
                FROM tblusers u
                LEFT JOIN tbldepartments d ON u.user_departmentId = d.department_id
                LEFT JOIN tblcourses c ON u.user_courseId = c.course_id
                LEFT JOIN tblusertype t ON u.user_typeId = t.user_typeId
                WHERE u.user_typeId != '6'
                ORDER BY u.user_id DESC
            ");
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($users as &$user) {
                $user['user_status'] = (int) $user['user_status'];
            }

            echo json_encode([
                "success" => true,
                "users" => $users
            ]);
        } catch (PDOException $e) {
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
        break;

    case 'get_counts':
        try {
            $visitors = 0;
            $students = 0;
            $faculties = 0;

            $stmt = $pdo->query("SELECT user_typeId, COUNT(*) as count FROM tblusers GROUP BY user_typeId");
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($results as $row) {
                if ($row['user_typeId'] == 1) {
                    $visitors = $row['count'];
                } elseif ($row['user_typeId'] == 2) {
                    $students = $row['count'];
                } elseif ($row['user_typeId'] == 3 || $row['user_typeId'] == 5) {
                    $faculties += $row['count'];
                }
            }

            echo json_encode([
                "success" => true,
                "visitors" => $visitors,
                "students" => $students,
                "faculties" => $faculties
            ]);
        } catch (PDOException $e) {
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
        break;

    case 'reset_password':
        $data = json_decode(file_get_contents("php://input"), true);
        $user_id = $data['user_id'] ?? null;
        $defaultPassword = "phinma-coc";

        if (!$user_id) {
            echo json_encode(["success" => false, "message" => "User ID is required."]);
            exit;
        }

        try {
            $query = $pdo->prepare("UPDATE tblusers SET user_password = :password WHERE user_id = :user_id");
            $query->execute([
                ':password' => $defaultPassword,
                ':user_id' => $user_id
            ]);

            echo json_encode(["success" => true, "message" => "Password has been reset to 'phinma-coc'."]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
        break;

    case 'get_posts':
        try {
            $stmt = $pdo->prepare("
                SELECT
                    p.*,
                    pt.postType_name,
                    u.user_schoolId as school_id,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) as student_name,
                    d.department_name,
                    c.course_name
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tbldepartments d ON p.post_departmentId = d.department_id
                LEFT JOIN tblcourses c ON u.user_courseId = c.course_id
                WHERE u.user_typeId = 2  -- Filter for students only
                ORDER BY p.post_date DESC, p.post_time DESC
            ");

            $stmt->execute();
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get replies for each post
            foreach ($posts as &$post) {
                $replyStmt = $pdo->prepare("
                    SELECT
                        r.*,
                        CONCAT(u.user_firstname, ' ', u.user_lastname) as admin_name
                    FROM tbl_giya_reply r
                    JOIN tblusers u ON r.reply_userId = u.user_id
                    WHERE r.reply_postId = ?
                    ORDER BY r.reply_date ASC, r.reply_time ASC
                ");
                $replyStmt->execute([$post['post_id']]);
                $post['replies'] = $replyStmt->fetchAll(PDO::FETCH_ASSOC);
            }

            echo json_encode([
                "success" => true,
                "posts" => $posts
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Database error: " . $e->getMessage()
            ]);
        }
        break;

    case 'get_visitor_posts':
        try {
            $stmt = $pdo->prepare("
                SELECT
                    p.*,
                    pt.postType_name,
                    u.user_schoolId as visitor_id,
                    CONCAT(u.user_firstname, ' ', u.user_lastname) as visitor_name
                FROM tbl_giya_posts p
                JOIN tblusers u ON p.post_userId = u.user_id
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                WHERE u.user_typeId = 1  -- Filter for visitors only
                ORDER BY p.post_date DESC, p.post_time DESC
            ");

            $stmt->execute();
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get replies for each post
            foreach ($posts as &$post) {
                $replyStmt = $pdo->prepare("
                    SELECT
                        r.*,
                        CONCAT(u.user_firstname, ' ', u.user_lastname) as admin_name
                    FROM tbl_giya_reply r
                    JOIN tblusers u ON r.reply_userId = u.user_id
                    WHERE r.reply_postId = ?
                    ORDER BY r.reply_date ASC, r.reply_time ASC
                ");
                $replyStmt->execute([$post['post_id']]);
                $post['replies'] = $replyStmt->fetchAll(PDO::FETCH_ASSOC);
            }

            echo json_encode([
                "success" => true,
                "posts" => $posts
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Database error: " . $e->getMessage()
            ]);
        }
        break;

    case 'resolve_post':
        $data = json_decode(file_get_contents("php://input"), true);
        $postId = $data['post_id'] ?? null;

        if (!$postId) {
            echo json_encode(["success" => false, "message" => "Post ID is required"]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                UPDATE tbl_giya_posts
                SET post_status = 'Resolved'
                WHERE post_id = ?
            ");
            $stmt->execute([$postId]);

            echo json_encode([
                "success" => true,
                "message" => "Post marked as resolved"
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Database error: " . $e->getMessage()
            ]);
        }
        break;

    case 'submit_reply':
        $data = json_decode(file_get_contents("php://input"), true);
        $postId = $data['post_id'] ?? null;
        $replyMessage = $data['reply_message'] ?? null;
        $adminId = $data['admin_id'] ?? null; // Get from session in production

        if (!$postId || !$replyMessage || !$adminId) {
            echo json_encode(["success" => false, "message" => "Missing required fields"]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO tbl_giya_reply (
                    reply_userId,
                    reply_postId,
                    reply_date,
                    reply_time,
                    reply_message
                ) VALUES (?, ?, CURDATE(), CURTIME(), ?)
            ");
            $stmt->execute([$adminId, $postId, $replyMessage]);

            echo json_encode([
                "success" => true,
                "message" => "Reply submitted successfully"
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Database error: " . $e->getMessage()
            ]);
        }
        break;

    case 'get_user_details':
        $userId = $_GET['user_id'] ?? null;

        if (!$userId) {
            echo json_encode(["success" => false, "message" => "User ID is required"]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                SELECT
                    u.*,
                    d.department_name,
                    c.course_name
                FROM tblusers u
                LEFT JOIN tbldepartments d ON u.user_departmentId = d.department_id
                LEFT JOIN tblcourses c ON u.user_courseId = c.course_id
                WHERE u.user_id = ?
            ");

            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                echo json_encode([
                    "success" => true,
                    "user" => $user
                ]);
            } else {
                echo json_encode([
                    "success" => false,
                    "message" => "User not found"
                ]);
            }
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Database error: " . $e->getMessage()
            ]);
        }
        break;

    case 'get_visitor_details':
        $userId = $_GET['user_id'] ?? null;

        if (!$userId) {
            echo json_encode(["success" => false, "message" => "User ID is required"]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                SELECT
                    user_id,
                    user_schoolId,
                    user_firstname,
                    user_middlename,
                    user_lastname,
                    user_suffix,
                    user_email,
                    user_contact
                FROM tblusers
                WHERE user_id = ? AND user_typeId = 1
            ");

            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                echo json_encode([
                    "success" => true,
                    "user" => $user
                ]);
            } else {
                echo json_encode([
                    "success" => false,
                    "message" => "Visitor not found"
                ]);
            }
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Database error: " . $e->getMessage()
            ]);
        }
        break;

    case 'change_password':
        $data = json_decode(file_get_contents("php://input"), true);
        $userId = $data['user_id'] ?? null;
        $newPassword = $data['new_password'] ?? null;

        if (!$userId || !$newPassword) {
            echo json_encode(["success" => false, "message" => "Missing required fields"]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("UPDATE tblusers SET user_password = ? WHERE user_id = ?");
            $stmt->execute([$newPassword, $userId]);

            echo json_encode([
                "success" => true,
                "message" => "Password updated successfully"
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                "success" => false,
                "message" => "Database error: " . $e->getMessage()
            ]);
        }
        break;

    default:
        echo json_encode(["success" => false, "message" => "Invalid action specified"]);
        break;
}
