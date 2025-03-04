<?php
require 'db_connection.php';

// Add this function to check admin access for sensitive operations
function requireAdminAccess() {
    $headers = getallheaders();
    $userType = isset($headers['X-User-Type']) ? $headers['X-User-Type'] : null;

    if ($userType != 6) {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Access denied. Administrator privileges required.',
        ]);
        exit;
    }
}

if (!isset($_GET['action'])) {
    echo json_encode(["success" => false, "message" => "No action specified"]);
    exit;
}

$action = $_GET['action'];

// Add a list of actions that require admin access
$adminOnlyActions = [
    'reset_password',
    'update_user_status',
    // Add any other admin-only actions here
];

// Check if current action requires admin access
if (in_array($action, $adminOnlyActions)) {
    requireAdminAccess();
}

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
                    d.department_id as user_departmentId,
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
                   OR u.user_email = :loginInput
            ");
            $query->bindParam(':loginInput', $loginInput, PDO::PARAM_STR);
            $query->execute();

            if ($query->rowCount() === 0) {
                echo json_encode(["success" => false, "message" => "Invalid login credentials."]);
                exit;
            }

            $user = $query->fetch(PDO::FETCH_ASSOC);


            if ($user['user_status'] == 0) {
                echo json_encode(["success" => false, "message" => "Your account has been deactivated. Please contact the administrator."]);
                exit;
            }

            if ($user['user_password'] !== $password) {
                echo json_encode(["success" => false, "message" => "Invalid password."]);
                exit;
            }

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
                "user_departmentId" => $user['user_departmentId'] ?? null, // Make sure to include department ID
                "course_name" => $user['course_name'],
                "user_schoolyearId" => $user['user_schoolyearId'],
                "phinmaed_email" => $user['phinmaed_email'] ?? '',
                "user_contact" => $user['user_contact'] ?? '',
                "user_email" => $user['user_email'] ?? ''
            ];

            error_log("Login Response: " . json_encode($response));
            echo json_encode($response);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => "An error occurred: " . $e->getMessage()]);
        }
        break;

    case 'register':
        $data = json_decode(file_get_contents("php://input"), true);
        try {

            $stmt = $pdo->query("SELECT COUNT(*) as count FROM tblusers WHERE user_typeId = 1");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $visitorCount = $result['count'] + 1;

            $schoolId = sprintf("vs-2526-%05d", $visitorCount);

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

            if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $password)) {
                echo json_encode(["status" => "error", "message" => "Password does not meet requirements"]);
                exit;
            }


            $checkStmt = $pdo->prepare("SELECT * FROM tblusers WHERE user_email = ?");
            $checkStmt->execute([$email]);
            if ($checkStmt->rowCount() > 0) {
                echo json_encode(["status" => "error", "message" => "Email is already registered."]);
                exit;
            }


            $stmt = $pdo->prepare("
                INSERT INTO tblusers (
                    user_schoolId, user_firstname, user_middlename, user_lastname,
                    user_suffix, user_email, user_contact, user_password,
                    user_typeId, user_level
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $userTypeId = 1;
            $userLevel = 10;
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
            // ✅ Update user status in database
            $stmt = $pdo->prepare("UPDATE tblusers SET user_status = :user_status WHERE user_id = :user_id");
            $stmt->execute([':user_status' => $user_status, ':user_id' => $user_id]);

            // ✅ Fetch the **updated** user status to return in response
            $stmt = $pdo->prepare("SELECT user_status FROM tblusers WHERE user_id = :user_id");
            $stmt->execute([':user_id' => $user_id]);
            $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                "success" => true,
                "message" => "User status updated successfully.",
                "user_status" => (int) $updatedUser['user_status'], // Ensure we send the latest status
                "user_id" => (int) $user_id
            ]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
        exit;


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

    case 'reset_password':
        // Debug the incoming data to check why user_id might be missing
        file_put_contents(
            'debug_reset_password.log',
            date('Y-m-d H:i:s') . ' - REQUEST: ' . print_r($_REQUEST, true) .
            ' POST: ' . print_r($_POST, true) .
            ' GET: ' . print_r($_GET, true) .
            ' RAW: ' . file_get_contents('php://input') . PHP_EOL,
            FILE_APPEND
        );

        // Try to get user_id from different sources
        $user_id = null;

        // Check POST directly
        if (isset($_POST['user_id'])) {
            $user_id = $_POST['user_id'];
        }
        // Check if payload is JSON
        else {
            $jsonInput = json_decode(file_get_contents('php://input'), true);
            if ($jsonInput && isset($jsonInput['user_id'])) {
                $user_id = $jsonInput['user_id'];
            }
        }

        if (!$user_id) {
            echo json_encode([
                "success" => false,
                "message" => "User ID is required. Debug: POST=" . json_encode($_POST) .
                            ", GET=" . json_encode($_GET) .
                            ", REQUEST=" . json_encode($_REQUEST)
            ]);
            exit;
        }

        try {
            $query = $pdo->prepare("UPDATE tblusers SET user_password = :password WHERE user_id = :user_id");
            $defaultPassword = "phinma-coc";
            $query->execute([
                ':password' => $defaultPassword,
                ':user_id' => $user_id
            ]);

            if ($query->rowCount() > 0) {
                echo json_encode([
                    "success" => true,
                    "message" => "Password has been reset to default (phinma-coc)"
                ]);
            } else {
                echo json_encode([
                    "success" => false,
                    "message" => "User not found or password already set to default"
                ]);
            }
        } catch (Exception $e) {
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
        echo json_encode([
            "success" => false,
            "message" => "Invalid action specified"
        ]);
        break;
}
