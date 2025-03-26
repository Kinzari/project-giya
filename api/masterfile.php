<?php
require 'db_connection.php';

function returnSuccess($data) {
    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
    exit;
}

function returnError($message, $code = 400) {
    echo json_encode([
        'success' => false,
        'message' => $message,
        'code' => $code
    ]);
    exit;
}

function checkAdminAccess($exemptActions = [])
{
    $currentAction = $_GET['action'] ?? '';

    if (in_array($currentAction, $exemptActions)) {
        return true;
    }

    if (isset($_SERVER['HTTP_X_USER_TYPE'])) {
        $userType = $_SERVER['HTTP_X_USER_TYPE'];
        if ($userType != '6' && $userType != '5') {
            echo json_encode([
                'success' => false,
                'message' => 'Access denied. You do not have permission to access this resource.',
                'code' => 403
            ]);
            exit;
        }

        if ($userType == '5' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
            echo json_encode([
                'success' => false,
                'message' => 'Access denied. You do not have permission to modify data.',
                'code' => 403
            ]);
            exit;
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Authentication required',
            'code' => 401
        ]);
        exit;
    }

    return true;
}

if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    $publicActions = ['departments', 'campuses', 'campuses_full'];
    checkAdminAccess($publicActions);
}

class MasterFileHandler
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Get all students
     */
    public function getStudents()
    {
        try {
            $stmt = $this->pdo->query("
                SELECT u.*, c.course_name, d.department_name, sy.schoolyear, cp.campus_name
                FROM tblusers u
                LEFT JOIN tblcourses c ON u.user_courseId = c.course_id
                LEFT JOIN tbldepartments d ON u.user_departmentId = d.department_id
                LEFT JOIN tblschoolyear sy ON u.user_schoolyearId = sy.schoolyear_id
                LEFT JOIN tblcampus cp ON u.user_campusId = cp.campus_id
                WHERE u.user_typeId = 2
                ORDER BY u.user_lastname ASC
            ");
            return ['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Get a specific student by ID
     */
    public function getStudent($id)
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT u.*, c.course_name, d.department_name, sy.schoolyear, cp.campus_name
                FROM tblusers u
                LEFT JOIN tblcourses c ON u.user_courseId = c.course_id
                LEFT JOIN tbldepartments d ON u.user_departmentId = d.department_id
                LEFT JOIN tblschoolyear sy ON u.user_schoolyearId = sy.schoolyear_id
                LEFT JOIN tblcampus cp ON u.user_campusId = cp.campus_id
                WHERE u.user_id = ? AND u.user_typeId = 2
            ");
            $stmt->execute([$id]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($student) {
                return ['success' => true, 'data' => $student];
            } else {
                return ['success' => false, 'message' => 'Student not found'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Save student data (insert or update)
     */
    public function saveStudent($data)
    {
        try {
            if (empty($data['id'])) {
                // New student
                $stmt = $this->pdo->prepare("
                    INSERT INTO tblusers
                    (user_schoolId, user_firstname, user_middlename, user_lastname,
                    user_departmentId, user_courseId, user_schoolyearId, user_campusId,
                    phinmaed_email, user_status, user_typeId, user_level, user_password)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 2, 10, 'phinma-coc')
                ");
                $result = $stmt->execute([
                    $data['schoolId'],
                    $data['firstName'],
                    $data['middleName'],
                    $data['lastName'],
                    $data['departmentId'],
                    $data['courseId'],
                    $data['yearLevel'],
                    $data['campusId'] ?? 1, // Default to Carmen campus if not specified
                    $data['email'],
                    $data['active']
                ]);

                return ['success' => $result, 'message' => $result ? 'Student added successfully' : 'Failed to add student'];
            } else {
                // Update existing student
                $stmt = $this->pdo->prepare("
                    UPDATE tblusers
                    SET user_schoolId = ?, user_firstname = ?, user_middlename = ?, user_lastname = ?,
                    user_departmentId = ?, user_courseId = ?, user_schoolyearId = ?, user_campusId = ?,
                    phinmaed_email = ?, user_status = ?
                    WHERE user_id = ? AND user_typeId = 2
                ");
                $result = $stmt->execute([
                    $data['schoolId'],
                    $data['firstName'],
                    $data['middleName'],
                    $data['lastName'],
                    $data['departmentId'],
                    $data['courseId'],
                    $data['yearLevel'],
                    $data['campusId'] ?? 1,
                    $data['email'],
                    $data['active'],
                    $data['id']
                ]);

                return ['success' => $result, 'message' => $result ? 'Student updated successfully' : 'Failed to update student'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Delete a student
     */
    public function deleteStudent($id)
    {
        try {
            // Check if student exists first
            $checkStmt = $this->pdo->prepare("SELECT user_id FROM tblusers WHERE user_id = ? AND user_typeId = 2");
            $checkStmt->execute([$id]);

            if ($checkStmt->rowCount() === 0) {
                return ['success' => false, 'message' => 'Student not found'];
            }

            $stmt = $this->pdo->prepare("DELETE FROM tblusers WHERE user_id = ? AND user_typeId = 2");
            $result = $stmt->execute([$id]);

            return ['success' => $result, 'message' => $result ? 'Student deleted successfully' : 'Failed to delete student'];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Toggle student active status
     */
    public function toggleStudentStatus($id, $status)
    {
        try {
            // Check if student exists
            $checkStmt = $this->pdo->prepare("SELECT user_id FROM tblusers WHERE user_id = ? AND user_typeId = 2");
            $checkStmt->execute([$id]);

            if ($checkStmt->rowCount() === 0) {
                return ['success' => false, 'message' => 'Student not found'];
            }

            // Update status
            $stmt = $this->pdo->prepare("UPDATE tblusers SET user_status = ? WHERE user_id = ? AND user_typeId = 2");
            $result = $stmt->execute([$status, $id]);

            return [
                'success' => $result,
                'message' => $result
                    ? ($status == 1 ? 'Student activated successfully' : 'Student deactivated successfully')
                    : 'Failed to update student status'
            ];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Get all POCs
     */
    public function getPOC()
    {
        try {
            $stmt = $this->pdo->query("
                SELECT u.*, d.department_name
                FROM tblusers u
                LEFT JOIN tbldepartments d ON u.user_departmentId = d.department_id
                WHERE u.user_typeId = 5
                ORDER BY u.user_lastname ASC
            ");
            return ['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Get a specific POC by ID
     */
    public function getPOCDetails($id)
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT u.*, d.department_name
                FROM tblusers u
                LEFT JOIN tbldepartments d ON u.user_departmentId = d.department_id
                WHERE u.user_id = ? AND u.user_typeId = 5
            ");
            $stmt->execute([$id]);
            $poc = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($poc) {
                return ['success' => true, 'data' => $poc];
            } else {
                return ['success' => false, 'message' => 'POC not found'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Submit POC data (insert or update)
     */
    public function submitPOC($data)
    {
        try {
            if ($data['mode'] === 'add') {
                $stmt = $this->pdo->prepare("
                    INSERT INTO tblusers
                    (user_schoolId, user_firstname, user_lastname, user_departmentId, user_contact,
                    phinmaed_email, user_status, user_typeId, user_level, user_password)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 5, 50, 'phinma-coc')
                ");
                $result = $stmt->execute([
                    $data['employeeId'],
                    $data['firstName'],
                    $data['lastName'],
                    $data['departmentId'],
                    $data['contact'],
                    $data['email'],
                    $data['isActive']
                ]);

                return ['success' => $result, 'message' => $result ? 'POC added successfully' : 'Failed to add POC'];
            } else {
                $stmt = $this->pdo->prepare("
                    UPDATE tblusers
                    SET user_schoolId = ?, user_firstname = ?, user_lastname = ?,
                        user_departmentId = ?, user_contact = ?, phinmaed_email = ?,
                        user_status = ?
                    WHERE user_id = ? AND user_typeId = 5
                ");
                $result = $stmt->execute([
                    $data['employeeId'],
                    $data['firstName'],
                    $data['lastName'],
                    $data['departmentId'],
                    $data['contact'],
                    $data['email'],
                    $data['isActive'],
                    $data['id']
                ]);

                return ['success' => $result, 'message' => $result ? 'POC updated successfully' : 'Failed to update POC'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Delete a POC
     */
    public function deletePOC($id)
    {
        try {
            // Check if POC exists first
            $checkStmt = $this->pdo->prepare("SELECT user_id FROM tblusers WHERE user_id = ? AND user_typeId = 5");
            $checkStmt->execute([$id]);

            if ($checkStmt->rowCount() === 0) {
                return ['success' => false, 'message' => 'POC not found'];
            }

            $stmt = $this->pdo->prepare("DELETE FROM tblusers WHERE user_id = ? AND user_typeId = 5");
            $result = $stmt->execute([$id]);

            return ['success' => $result, 'message' => $result ? 'POC deleted successfully' : 'Failed to delete POC'];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Get all departments
     */
    public function getDepartments()
    {
        try {
            // Get departments with course and student counts
            $stmt = $this->pdo->query("
                SELECT d.*,
                       (SELECT COUNT(*) FROM tblcourses c WHERE c.course_departmentId = d.department_id) AS course_count,
                       (SELECT COUNT(*) FROM tblusers u WHERE u.user_departmentId = d.department_id AND u.user_typeId = 2) AS student_count
                FROM tbldepartments d
                ORDER BY d.department_name ASC
            ");
            return ['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Get a specific department by ID
     */
    public function getDepartmentDetails($id)
    {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM tbldepartments WHERE department_id = ?");
            $stmt->execute([$id]);
            $department = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($department) {
                return ['success' => true, 'data' => $department];
            } else {
                return ['success' => false, 'message' => 'Department not found'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Submit department data (insert or update)
     */
    public function submitDepartment($data)
    {
        try {
            if ($data['mode'] === 'add') {
                $stmt = $this->pdo->prepare("INSERT INTO tbldepartments (department_name) VALUES (?)");
                $result = $stmt->execute([$data['departmentName']]);

                return ['success' => $result, 'message' => $result ? 'Department added successfully' : 'Failed to add department'];
            } else {
                $stmt = $this->pdo->prepare("UPDATE tbldepartments SET department_name = ? WHERE department_id = ?");
                $result = $stmt->execute([$data['departmentName'], $data['id']]);

                return ['success' => $result, 'message' => $result ? 'Department updated successfully' : 'Failed to update department'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Delete a department
     */
    public function deleteDepartment($id)
    {
        try {
            // Check if department has associated courses or students
            $checkCourses = $this->pdo->prepare("SELECT COUNT(*) FROM tblcourses WHERE course_departmentId = ?");
            $checkCourses->execute([$id]);

            if ($checkCourses->fetchColumn() > 0) {
                return ['success' => false, 'message' => 'Cannot delete department with associated courses'];
            }

            $checkStudents = $this->pdo->prepare("SELECT COUNT(*) FROM tblusers WHERE user_departmentId = ? AND user_typeId = 2");
            $checkStudents->execute([$id]);

            if ($checkStudents->fetchColumn() > 0) {
                return ['success' => false, 'message' => 'Cannot delete department with associated students'];
            }

            $stmt = $this->pdo->prepare("DELETE FROM tbldepartments WHERE department_id = ?");
            $result = $stmt->execute([$id]);

            return ['success' => $result, 'message' => $result ? 'Department deleted successfully' : 'Failed to delete department'];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Get all courses
     */
    public function getCourses()
    {
        try {
            $stmt = $this->pdo->query("
                SELECT c.*, d.department_name,
                       (SELECT COUNT(*) FROM tblusers u WHERE u.user_courseId = c.course_id AND u.user_typeId = 2) AS student_count
                FROM tblcourses c
                LEFT JOIN tbldepartments d ON c.course_departmentId = d.department_id
                ORDER BY c.course_name ASC
            ");
            return ['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Get courses for a specific department
     */
    public function getCoursesByDepartment($departmentId)
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM tblcourses
                WHERE course_departmentId = ?
                ORDER BY course_name ASC
            ");
            $stmt->execute([$departmentId]);
            return ['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Get a specific course by ID
     */
    public function getCourseDetails($id)
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT c.*, d.department_name
                FROM tblcourses c
                LEFT JOIN tbldepartments d ON c.course_departmentId = d.department_id
                WHERE c.course_id = ?
            ");
            $stmt->execute([$id]);
            $course = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($course) {
                return ['success' => true, 'data' => $course];
            } else {
                return ['success' => false, 'message' => 'Course not found'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Submit course data (insert or update)
     */
    public function submitCourse($data)
    {
        try {
            if ($data['mode'] === 'add') {
                $stmt = $this->pdo->prepare("
                    INSERT INTO tblcourses (course_name, course_departmentId)
                    VALUES (?, ?)
                ");
                $result = $stmt->execute([$data['courseName'], $data['departmentId']]);

                return ['success' => $result, 'message' => $result ? 'Course added successfully' : 'Failed to add course'];
            } else {
                $stmt = $this->pdo->prepare("
                    UPDATE tblcourses
                    SET course_name = ?, course_departmentId = ?
                    WHERE course_id = ?
                ");
                $result = $stmt->execute([$data['courseName'], $data['departmentId'], $data['id']]);

                return ['success' => $result, 'message' => $result ? 'Course updated successfully' : 'Failed to update course'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Delete a course
     */
    public function deleteCourse($id)
    {
        try {
            // Check if course has associated students
            $checkStudents = $this->pdo->prepare("SELECT COUNT(*) FROM tblusers WHERE user_courseId = ? AND user_typeId = 2");
            $checkStudents->execute([$id]);

            if ($checkStudents->fetchColumn() > 0) {
                return ['success' => false, 'message' => 'Cannot delete course with associated students'];
            }

            $stmt = $this->pdo->prepare("DELETE FROM tblcourses WHERE course_id = ?");
            $result = $stmt->execute([$id]);

            return ['success' => $result, 'message' => $result ? 'Course deleted successfully' : 'Failed to delete course'];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Get all inquiry types
     */
    public function getInquiryTypes()
    {
        try {
            $stmt = $this->pdo->query("
                SELECT i.*, d.department_name
                FROM tbl_giya_inquiry_types i
                LEFT JOIN tbldepartments d ON i.department_id = d.department_id
                ORDER BY i.inquiry_type ASC
            ");
            return ['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Get a specific inquiry type by ID
     */
    public function getInquiryTypeDetails($id)
    {
        try {
            $stmt = $this->pdo->prepare("
                SELECT i.*, d.department_name
                FROM tbl_giya_inquiry_types i
                LEFT JOIN tbldepartments d ON i.department_id = d.department_id
                WHERE i.inquiry_id = ?
            ");
            $stmt->execute([$id]);
            $inquiryType = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($inquiryType) {
                return ['success' => true, 'data' => $inquiryType];
            } else {
                return ['success' => false, 'message' => 'Inquiry type not found'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Submit inquiry type data (insert or update)
     */
    public function submitInquiryType($data)
    {
        try {
            // Make sure we have the required fields
            if (!isset($data['inquiryType']) || !isset($data['description']) || !isset($data['departmentId'])) {
                return ['success' => false, 'message' => 'Missing required fields'];
            }

            if ($data['mode'] === 'add') {
                $stmt = $this->pdo->prepare("
                INSERT INTO tbl_giya_inquiry_types
                (inquiry_type, description, department_id)
                VALUES (?, ?, ?)
                ");
                $result = $stmt->execute([
                    $data['inquiryType'],
                    $data['description'],
                    $data['departmentId']
                ]);

                return ['success' => $result, 'message' => $result ? 'Inquiry type added successfully' : 'Failed to add inquiry type'];
            } else {
                $stmt = $this->pdo->prepare("
                UPDATE tbl_giya_inquiry_types
                SET inquiry_type = ?, description = ?, department_id = ?
                WHERE inquiry_id = ?
                ");
                $result = $stmt->execute([
                    $data['inquiryType'],
                    $data['description'],
                    $data['departmentId'],
                    $data['id']
                ]);

                return ['success' => $result, 'message' => $result ? 'Inquiry type updated successfully' : 'Failed to update inquiry type'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }

    /**
     * Delete an inquiry type
     */
    public function deleteInquiryType($id)
    {
        try {
            // Check if inquiry type has associated posts
            $checkPosts = $this->pdo->prepare("SELECT COUNT(*) FROM tbl_giya_posts WHERE inquiry_typeId = ?");
            $checkPosts->execute([$id]);

            if ($checkPosts->fetchColumn() > 0) {
                return ['success' => false, 'message' => 'Cannot delete inquiry type with associated posts'];
            }

            $stmt = $this->pdo->prepare("DELETE FROM tbl_giya_inquiry_types WHERE inquiry_id = ?");
            $result = $stmt->execute([$id]);

            return ['success' => $result, 'message' => $result ? 'Inquiry type deleted successfully' : 'Failed to delete inquiry type'];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Get all campuses
     */
    public function getCampuses()
    {
        try {
            $stmt = $this->pdo->query("SELECT campus_id, campus_name FROM tblcampus ORDER BY campus_id ASC");
            return ['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}

// Create handler instance
$handler = new MasterFileHandler($pdo);

// Handle API requests
if (isset($_GET['action'])) {
    $action = $_GET['action'];
    $response = ['success' => false, 'message' => 'Invalid action'];

    try {
        switch ($action) {
            // VISITORS API ENDPOINTS
            case 'visitors':
                // Fetch all visitors
                try {
                    // Update query to use user_typeId = 1 (Visitor) instead of 4
                    $query = "SELECT u.*, c.campus_name
                             FROM tblusers u
                             LEFT JOIN tblcampus c ON u.user_campusId = c.campus_id
                             WHERE u.user_typeId = 1
                             ORDER BY u.user_lastname ASC";
                    $stmt = $pdo->prepare($query);
                    $stmt->execute();
                    $visitors = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    returnSuccess($visitors);
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            case 'get_visitor':
                // Get a specific visitor by ID
                if (!isset($_GET['id'])) {
                    returnError('Visitor ID is required');
                }

                $visitorId = $_GET['id'];

                try {
                    $query = "SELECT u.*, c.campus_name
                             FROM tblusers u
                             LEFT JOIN tblcampus c ON u.user_campusId = c.campus_id
                             WHERE u.user_id = :id AND u.user_typeId = 1";
                    $stmt = $pdo->prepare($query);
                    $stmt->bindParam(':id', $visitorId);
                    $stmt->execute();
                    $visitor = $stmt->fetch(PDO::FETCH_ASSOC);

                    if (!$visitor) {
                        returnError('Visitor not found');
                    }

                    returnSuccess($visitor);
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            case 'save_visitor':
                // Add or update a visitor
                $requiredFields = ['firstName', 'lastName', 'email', 'contact', 'campusId'];

                foreach ($requiredFields as $field) {
                    if (!isset($_POST[$field]) || empty($_POST[$field])) {
                        returnError("$field is required");
                    }
                }

                $mode = $_POST['mode'] ?? 'add';
                $id = $_POST['id'] ?? null;
                $firstName = $_POST['firstName'];
                $lastName = $_POST['lastName'];
                $middleName = $_POST['middleName'] ?? null;
                $suffix = $_POST['suffix'] ?? null;
                $email = $_POST['email'];
                $contact = $_POST['contact'];
                $campusId = $_POST['campusId'];
                $password = $_POST['password'] ?? '';
                $isActive = isset($_POST['isActive']) ? $_POST['isActive'] : 1;

                try {
                    if ($mode === 'add') {
                        // Check if email already exists
                        $checkQuery = "SELECT COUNT(*) FROM tblusers WHERE user_email = :email";
                        $checkStmt = $pdo->prepare($checkQuery);
                        $checkStmt->bindParam(':email', $email);
                        $checkStmt->execute();

                        if ($checkStmt->fetchColumn() > 0) {
                            returnError('Email already exists');
                        }

                        // Generate a random visitor ID if not provided
                        $visitorId = 'vs' . rand(100000, 999999);

                        // Hash the password (default password if not provided)
                        $hashedPassword = !empty($password) ? password_hash($password, PASSWORD_DEFAULT) : password_hash('phinma-coc', PASSWORD_DEFAULT);

                        // Fix: Change user_typeId from 4 to 1 for visitors
                        $query = "INSERT INTO tblusers (user_schoolId, user_firstname, user_middlename, user_lastname, user_suffix, user_email, user_contact, user_campusId, user_password, user_typeId, user_status, user_level)
                                 VALUES (:schoolId, :firstName, :middleName, :lastName, :suffix, :email, :contact, :campusId, :password, 1, :isActive, 10)";

                        $stmt = $pdo->prepare($query);
                        $stmt->bindParam(':schoolId', $visitorId);
                        $stmt->bindParam(':firstName', $firstName);
                        $stmt->bindParam(':middleName', $middleName);
                        $stmt->bindParam(':lastName', $lastName);
                        $stmt->bindParam(':suffix', $suffix);
                        $stmt->bindParam(':email', $email);
                        $stmt->bindParam(':contact', $contact);
                        $stmt->bindParam(':campusId', $campusId);
                        $stmt->bindParam(':password', $hashedPassword);
                        $stmt->bindParam(':isActive', $isActive);

                        if ($stmt->execute()) {
                            returnSuccess(['message' => 'Visitor added successfully']);
                        } else {
                            returnError('Failed to add visitor');
                        }
                    } else {
                        // Update existing visitor
                        if (empty($id)) {
                            returnError('Visitor ID is required for update');
                        }

                        // Check if email already exists for another user
                        $checkQuery = "SELECT COUNT(*) FROM tblusers WHERE user_email = :email AND user_id != :id";
                        $checkStmt = $pdo->prepare($checkQuery);
                        $checkStmt->bindParam(':email', $email);
                        $checkStmt->bindParam(':id', $id);
                        $checkStmt->execute();

                        if ($checkStmt->fetchColumn() > 0) {
                            returnError('Email already exists for another user');
                        }

                        $query = "UPDATE tblusers SET
                                 user_firstname = :firstName,
                                 user_middlename = :middleName,
                                 user_lastname = :lastName,
                                 user_suffix = :suffix,
                                 user_email = :email,
                                 user_contact = :contact,
                                 user_campusId = :campusId,
                                 user_status = :isActive";

                        // Add password to update only if provided
                        if (!empty($password)) {
                            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                            $query .= ", user_password = :password";
                        }

                        // Fix: Change user_typeId from 4 to 1
                        $query .= " WHERE user_id = :id AND user_typeId = 1";

                        $stmt = $pdo->prepare($query);
                        $stmt->bindParam(':firstName', $firstName);
                        $stmt->bindParam(':middleName', $middleName);
                        $stmt->bindParam(':lastName', $lastName);
                        $stmt->bindParam(':suffix', $suffix);
                        $stmt->bindParam(':email', $email);
                        $stmt->bindParam(':contact', $contact);
                        $stmt->bindParam(':campusId', $campusId);
                        $stmt->bindParam(':isActive', $isActive);
                        $stmt->bindParam(':id', $id);

                        if (!empty($password)) {
                            $stmt->bindParam(':password', $hashedPassword);
                        }

                        if ($stmt->execute()) {
                            returnSuccess(['message' => 'Visitor updated successfully']);
                        } else {
                            returnError('Failed to update visitor');
                        }
                    }
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            case 'visitor_delete':
                // Delete a visitor
                if (!isset($_POST['id'])) {
                    returnError('Visitor ID is required');
                }

                $visitorId = $_POST['id'];

                try {
                    // Check if there are dependent records
                    $checkQuery = "SELECT COUNT(*) FROM tbl_giya_posts WHERE post_userId = :id";
                    $checkStmt = $pdo->prepare($checkQuery);
                    $checkStmt->bindParam(':id', $visitorId);
                    $checkStmt->execute();

                    if ($checkStmt->fetchColumn() > 0) {
                        returnError('Cannot delete visitor with existing inquiries');
                    }

                    // Fix: Change user_typeId from 4 to 1 to match your database
                    $query = "DELETE FROM tblusers WHERE user_id = :id AND user_typeId = 1";
                    $stmt = $pdo->prepare($query);
                    $stmt->bindParam(':id', $visitorId);

                    if ($stmt->execute()) {
                        returnSuccess(['message' => 'Visitor deleted successfully']);
                    } else {
                        returnError('Failed to delete visitor');
                    }
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            case 'toggle_visitor_status':
                // Toggle visitor's active status
                if (!isset($_POST['id']) || !isset($_POST['status'])) {
                    returnError('Visitor ID and status are required');
                }

                $visitorId = $_POST['id'];
                $status = $_POST['status'];

                try {
                    $query = "UPDATE tblusers SET user_status = :status WHERE user_id = :id AND user_typeId = 1";
                    $stmt = $pdo->prepare($query);
                    $stmt->bindParam(':status', $status);
                    $stmt->bindParam(':id', $visitorId);

                    if ($stmt->execute()) {
                        returnSuccess(['message' => 'Visitor status updated successfully']);
                    } else {
                        returnError('Failed to update visitor status');
                    }
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            // EMPLOYEES API ENDPOINTS
            case 'employees':
                // Fetch all employees
                try {
                    // Update query to include both user_typeId = 3 (Faculty) and 4 (Employee)
                    $query = "SELECT u.*, d.department_name, c.campus_name
                             FROM tblusers u
                             LEFT JOIN tbldepartments d ON u.user_departmentId = d.department_id
                             LEFT JOIN tblcampus c ON u.user_campusId = c.campus_id
                             WHERE u.user_typeId IN (3, 4)
                             ORDER BY u.user_lastname ASC";
                    $stmt = $pdo->prepare($query);
                    $stmt->execute();
                    $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    returnSuccess($employees);
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            case 'get_employee':
                // Get a specific employee by ID
                if (!isset($_GET['id'])) {
                    returnError('Employee ID is required');
                }

                $employeeId = $_GET['id'];

                try {
                    // Update to include both user types 3 and 4
                    $query = "SELECT u.*, d.department_name, c.campus_name
                             FROM tblusers u
                             LEFT JOIN tbldepartments d ON u.user_departmentId = d.department_id
                             LEFT JOIN tblcampus c ON u.user_campusId = c.campus_id
                             WHERE u.user_id = :id AND u.user_typeId IN (3, 4)";
                    $stmt = $pdo->prepare($query);
                    $stmt->bindParam(':id', $employeeId);
                    $stmt->execute();
                    $employee = $stmt->fetch(PDO::FETCH_ASSOC);

                    if (!$employee) {
                        returnError('Employee not found');
                    }

                    returnSuccess($employee);
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            case 'save_employee':
                // Add or update an employee
                $requiredFields = ['employeeId', 'firstName', 'lastName', 'email', 'departmentId', 'campusId'];

                foreach ($requiredFields as $field) {
                    if (!isset($_POST[$field]) || empty($_POST[$field])) {
                        returnError("$field is required");
                    }
                }

                $mode = $_POST['mode'] ?? 'add';
                $id = $_POST['id'] ?? null;
                $employeeId = $_POST['employeeId'];
                $firstName = $_POST['firstName'];
                $lastName = $_POST['lastName'];
                $middleName = $_POST['middleName'] ?? null;
                $suffix = $_POST['suffix'] ?? null;
                $email = $_POST['email'];
                $contact = $_POST['contact'] ?? null;
                $departmentId = $_POST['departmentId'];
                $campusId = $_POST['campusId'];
                $password = $_POST['password'] ?? '';
                $isActive = isset($_POST['isActive']) ? $_POST['isActive'] : 1;

                try {
                    if ($mode === 'add') {
                        // Check if email already exists
                        $checkQuery = "SELECT COUNT(*) FROM tblusers WHERE phinmaed_email = :email";
                        $checkStmt = $pdo->prepare($checkQuery);
                        $checkStmt->bindParam(':email', $email);
                        $checkStmt->execute();

                        if ($checkStmt->fetchColumn() > 0) {
                            returnError('Email already exists');
                        }

                        // Check if employee ID already exists
                        $checkIdQuery = "SELECT COUNT(*) FROM tblusers WHERE user_schoolId = :schoolId";
                        $checkIdStmt = $pdo->prepare($checkIdQuery);
                        $checkIdStmt->bindParam(':schoolId', $employeeId);
                        $checkIdStmt->execute();

                        if ($checkIdStmt->fetchColumn() > 0) {
                            returnError('Employee ID already exists');
                        }

                        // Hash the password (default password if not provided)
                        $hashedPassword = !empty($password) ? password_hash($password, PASSWORD_DEFAULT) : password_hash('phinma-coc', PASSWORD_DEFAULT);

                        // Set appropriate user type based on department
                        // For example, if you have a way to determine if Faculty (3) or Employee (4)
                        $userTypeId = 3; // Default to Faculty, adjust as needed

                        $query = "INSERT INTO tblusers (user_schoolId, user_firstname, user_middlename, user_lastname, user_suffix, user_contact, phinmaed_email, user_departmentId, user_campusId, user_password, user_typeId, user_status)
                                 VALUES (:schoolId, :firstName, :middleName, :lastName, :suffix, :contact, :email, :departmentId, :campusId, :password, :userTypeId, :isActive)";

                        $stmt = $pdo->prepare($query);
                        $stmt->bindParam(':schoolId', $employeeId);
                        $stmt->bindParam(':firstName', $firstName);
                        $stmt->bindParam(':middleName', $middleName);
                        $stmt->bindParam(':lastName', $lastName);
                        $stmt->bindParam(':suffix', $suffix);
                        $stmt->bindParam(':contact', $contact);
                        $stmt->bindParam(':email', $email);
                        $stmt->bindParam(':departmentId', $departmentId);
                        $stmt->bindParam(':campusId', $campusId);
                        $stmt->bindParam(':password', $hashedPassword);
                        $stmt->bindParam(':userTypeId', $userTypeId);
                        $stmt->bindParam(':isActive', $isActive);

                        if ($stmt->execute()) {
                            returnSuccess(['message' => 'Employee added successfully']);
                        } else {
                            returnError('Failed to add employee');
                        }
                    } else {
                        // Update existing employee
                        if (empty($id)) {
                            returnError('Employee ID is required for update');
                        }

                        // Check if email already exists for another user
                        $checkQuery = "SELECT COUNT(*) FROM tblusers WHERE phinmaed_email = :email AND user_id != :id";
                        $checkStmt = $pdo->prepare($checkQuery);
                        $checkStmt->bindParam(':email', $email);
                        $checkStmt->bindParam(':id', $id);
                        $checkStmt->execute();

                        if ($checkStmt->fetchColumn() > 0) {
                            returnError('Email already exists for another user');
                        }

                        // Check if employee ID already exists for another user
                        if (!empty($employeeId)) {
                            $checkIdQuery = "SELECT COUNT(*) FROM tblusers WHERE user_schoolId = :schoolId AND user_id != :id";
                            $checkIdStmt = $pdo->prepare($checkIdQuery);
                            $checkIdStmt->bindParam(':schoolId', $employeeId);
                            $checkIdStmt->bindParam(':id', $id);
                            $checkIdStmt->execute();

                            if ($checkIdStmt->fetchColumn() > 0) {
                                returnError('Employee ID already exists for another user');
                            }
                        }

                        $query = "UPDATE tblusers SET
                                 user_schoolId = :schoolId,
                                 user_firstname = :firstName,
                                 user_middlename = :middleName,
                                 user_lastname = :lastName,
                                 user_suffix = :suffix,
                                 user_contact = :contact,
                                 phinmaed_email = :email,
                                 user_departmentId = :departmentId,
                                 user_campusId = :campusId,
                                 user_status = :isActive";

                        // Add password to update only if provided
                        if (!empty($password)) {
                            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                            $query .= ", user_password = :password";
                        }

                        $query .= " WHERE user_id = :id AND user_typeId IN (3, 4)";

                        $stmt = $pdo->prepare($query);
                        $stmt->bindParam(':schoolId', $employeeId);
                        $stmt->bindParam(':firstName', $firstName);
                        $stmt->bindParam(':middleName', $middleName);
                        $stmt->bindParam(':lastName', $lastName);
                        $stmt->bindParam(':suffix', $suffix);
                        $stmt->bindParam(':contact', $contact);
                        $stmt->bindParam(':email', $email);
                        $stmt->bindParam(':departmentId', $departmentId);
                        $stmt->bindParam(':campusId', $campusId);
                        $stmt->bindParam(':isActive', $isActive);
                        $stmt->bindParam(':id', $id);

                        if (!empty($password)) {
                            $stmt->bindParam(':password', $hashedPassword);
                        }

                        if ($stmt->execute()) {
                            returnSuccess(['message' => 'Employee updated successfully']);
                        } else {
                            returnError('Failed to update employee');
                        }
                    }
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            case 'employee_delete':
                // Delete an employee
                if (!isset($_POST['id'])) {
                    returnError('Employee ID is required');
                }

                $employeeId = $_POST['id'];

                try {
                    // Remove dependency check that references non-existent inquiry table
                    // Just delete the employee directly
                    $query = "DELETE FROM tblusers WHERE user_id = :id AND user_typeId IN (3, 4)";
                    $stmt = $pdo->prepare($query);
                    $stmt->bindParam(':id', $employeeId);

                    if ($stmt->execute()) {
                        returnSuccess(['message' => 'Employee deleted successfully']);
                    } else {
                        returnError('Failed to delete employee');
                    }
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            case 'toggle_employee_status':
                // Toggle employee's active status
                if (!isset($_POST['id']) || !isset($_POST['status'])) {
                    returnError('Employee ID and status are required');
                }

                $employeeId = $_POST['id'];
                $status = $_POST['status'];

                try {
                    // Update to include both user types 3 and 4
                    $query = "UPDATE tblusers SET user_status = :status WHERE user_id = :id AND user_typeId IN (3, 4)";
                    $stmt = $pdo->prepare($query);
                    $stmt->bindParam(':status', $status);
                    $stmt->bindParam(':id', $employeeId);

                    if ($stmt->execute()) {
                        returnSuccess(['message' => 'Employee status updated successfully']);
                    } else {
                        returnError('Failed to update employee status');
                    }
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            // CAMPUS API ENDPOINTS
            case 'campuses':
                // Fetch all campuses (basic list)
                try {
                    $query = "SELECT * FROM tblcampus ORDER BY campus_name ASC";
                    $stmt = $pdo->prepare($query);
                    $stmt->execute();
                    $campuses = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    returnSuccess($campuses);
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            case 'campuses_full':
                // Fetch all campuses with counts for table
                try {
                    $query = "SELECT c.*,
                             (SELECT COUNT(*) FROM tblusers WHERE user_campusId = c.campus_id AND user_typeId = 1) as student_count,
                             (SELECT COUNT(*) FROM tblusers WHERE user_campusId = c.campus_id AND user_typeId = 3) as employee_count,
                             (SELECT COUNT(*) FROM tblusers WHERE user_campusId = c.campus_id AND user_typeId = 4) as visitor_count
                             FROM tblcampus c
                             ORDER BY c.campus_name ASC";
                    $stmt = $pdo->prepare($query);
                    $stmt->execute();
                    $campuses = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    returnSuccess($campuses);
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            case 'get_campus':
                // Get a specific campus by ID
                if (!isset($_GET['id'])) {
                    returnError('Campus ID is required');
                }

                $campusId = $_GET['id'];

                try {
                    $query = "SELECT c.*,
                             (SELECT COUNT(*) FROM tblusers WHERE user_campusId = c.campus_id AND user_typeId = 1) as student_count,
                             (SELECT COUNT(*) FROM tblusers WHERE user_campusId = c.campus_id AND user_typeId = 3) as employee_count,
                             (SELECT COUNT(*) FROM tblusers WHERE user_campusId = c.campus_id AND user_typeId = 4) as visitor_count
                             FROM tblcampus c
                             WHERE c.campus_id = :id";
                    $stmt = $pdo->prepare($query);
                    $stmt->bindParam(':id', $campusId);
                    $stmt->execute();
                    $campus = $stmt->fetch(PDO::FETCH_ASSOC);

                    if (!$campus) {
                        returnError('Campus not found');
                    }

                    returnSuccess($campus);
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            case 'save_campus':
                // Add or update a campus
                if (!isset($_POST['campusName']) || empty($_POST['campusName'])) {
                    returnError('Campus name is required');
                }

                $mode = $_POST['mode'] ?? 'add';
                $id = $_POST['id'] ?? null;
                $campusName = $_POST['campusName'];
                $campusAddress = $_POST['campusAddress'] ?? null;
                $campusContact = $_POST['campusContact'] ?? null;

                try {
                    if ($mode === 'add') {
                        // Check if campus name already exists - fix table name
                        $checkQuery = "SELECT COUNT(*) FROM tblcampus WHERE campus_name = :name";
                        $checkStmt = $pdo->prepare($checkQuery);
                        $checkStmt->bindParam(':name', $campusName);
                        $checkStmt->execute();

                        if ($checkStmt->fetchColumn() > 0) {
                            returnError('Campus name already exists');
                        }

                        // Fix table name
                        $query = "INSERT INTO tblcampus (campus_name, campus_address, campus_contact)
                                 VALUES (:name, :address, :contact)";

                        $stmt = $pdo->prepare($query);
                        $stmt->bindParam(':name', $campusName);
                        $stmt->bindParam(':address', $campusAddress);
                        $stmt->bindParam(':contact', $campusContact);

                        if ($stmt->execute()) {
                            returnSuccess(['message' => 'Campus added successfully']);
                        } else {
                            returnError('Failed to add campus');
                        }
                    } else {
                        // Update existing campus
                        if (empty($id)) {
                            returnError('Campus ID is required for update');
                        }

                        // Check if campus name already exists for another campus - fix table name
                        $checkQuery = "SELECT COUNT(*) FROM tblcampus WHERE campus_name = :name AND campus_id != :id";
                        $checkStmt = $pdo->prepare($checkQuery);
                        $checkStmt->bindParam(':name', $campusName);
                        $checkStmt->bindParam(':id', $id);
                        $checkStmt->execute();

                        if ($checkStmt->fetchColumn() > 0) {
                            returnError('Campus name already exists for another campus');
                        }

                        // Fix table name
                        $query = "UPDATE tblcampus SET
                                 campus_name = :name,
                                 campus_address = :address,
                                 campus_contact = :contact
                                 WHERE campus_id = :id";

                        $stmt = $pdo->prepare($query);
                        $stmt->bindParam(':name', $campusName);
                        $stmt->bindParam(':address', $campusAddress);
                        $stmt->bindParam(':contact', $campusContact);
                        $stmt->bindParam(':id', $id);

                        if ($stmt->execute()) {
                            returnSuccess(['message' => 'Campus updated successfully']);
                        } else {
                            returnError('Failed to update campus');
                        }
                    }
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            case 'campus_delete':
                // Delete a campus
                if (!isset($_POST['id'])) {
                    returnError('Campus ID is required');
                }

                $campusId = $_POST['id'];

                try {
                    // Check if there are dependent records - fix table name from users to tblusers
                    $checkQuery = "SELECT COUNT(*) FROM tblusers WHERE user_campusId = :id";
                    $checkStmt = $pdo->prepare($checkQuery);
                    $checkStmt->bindParam(':id', $campusId);
                    $checkStmt->execute();

                    if ($checkStmt->fetchColumn() > 0) {
                        returnError('Cannot delete campus with associated users');
                    }

                    // Fix table name from campus to tblcampus
                    $query = "DELETE FROM tblcampus WHERE campus_id = :id";
                    $stmt = $pdo->prepare($query);
                    $stmt->bindParam(':id', $campusId);

                    if ($stmt->execute()) {
                        returnSuccess(['message' => 'Campus deleted successfully']);
                    } else {
                        returnError('Failed to delete campus');
                    }
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            // Include existing methods from MasterFileHandler
            case 'students':
                $response = $handler->getStudents();
                echo json_encode($response);
                exit;
                break;

            case 'get_student':
                if (isset($_GET['id'])) {
                    $response = $handler->getStudent($_GET['id']);
                } else {
                    $response = ['success' => false, 'message' => 'Student ID required'];
                }
                echo json_encode($response);
                exit;
                break;

            case 'poc':
                $response = $handler->getPOC();
                echo json_encode($response);
                exit;
                break;

            case 'get_poc':
                if (isset($_GET['id'])) {
                    $response = $handler->getPOCDetails($_GET['id']);
                } else {
                    $response = ['success' => false, 'message' => 'POC ID required'];
                }
                echo json_encode($response);
                exit;
                break;

            case 'departments':
                $response = $handler->getDepartments();
                echo json_encode($response);
                exit;
                break;

            case 'get_department':
                if (isset($_GET['id'])) {
                    $response = $handler->getDepartmentDetails($_GET['id']);
                } else {
                    $response = ['success' => false, 'message' => 'Department ID required'];
                }
                echo json_encode($response);
                exit;
                break;

            case 'courses':
                $response = $handler->getCourses();
                echo json_encode($response);
                exit;
                break;

            case 'courses_by_department':
                if (isset($_GET['department_id'])) {
                    $response = $handler->getCoursesByDepartment($_GET['department_id']);
                } else {
                    $response = ['success' => false, 'message' => 'Department ID required'];
                }
                echo json_encode($response);
                exit;
                break;

            case 'get_course':
                if (isset($_GET['id'])) {
                    $response = $handler->getCourseDetails($_GET['id']);
                } else {
                    $response = ['success' => false, 'message' => 'Course ID required'];
                }
                echo json_encode($response);
                exit;
                break;

            case 'inquiry_types':
                $response = $handler->getInquiryTypes();
                echo json_encode($response);
                exit;
                break;

            case 'get_inquiry_type':
                if (isset($_GET['id'])) {
                    $response = $handler->getInquiryTypeDetails($_GET['id']);
                } else {
                    $response = ['success' => false, 'message' => 'Inquiry type ID required'];
                }
                echo json_encode($response);
                exit;
                break;

            // POST requests
            case 'save_student':
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    $response = $handler->saveStudent($_POST);
                }
                echo json_encode($response);
                exit;
                break;

            case 'student_delete':
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id'])) {
                    $response = $handler->deleteStudent($_POST['id']);
                } else {
                    $response = ['success' => false, 'message' => 'Student ID required'];
                }
                echo json_encode($response);
                exit;
                break;

            case 'toggle_student_status':
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id']) && isset($_POST['status'])) {
                    $response = $handler->toggleStudentStatus($_POST['id'], $_POST['status']);
                } else {
                    $response = ['success' => false, 'message' => 'Student ID and status required'];
                }
                echo json_encode($response);
                exit;
                break;

            case 'submit_poc':
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    $response = $handler->submitPOC($_POST);
                }
                echo json_encode($response);
                exit;
                break;

            case 'poc_delete':
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id'])) {
                    $response = $handler->deletePOC($_POST['id']);
                } else {
                    $response = ['success' => false, 'message' => 'POC ID required'];
                }
                echo json_encode($response);
                exit;
                break;

            case 'submit_department':
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    $response = $handler->submitDepartment($_POST);
                }
                echo json_encode($response);
                exit;
                break;

            case 'department_delete':
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id'])) {
                    $response = $handler->deleteDepartment($_POST['id']);
                } else {
                    $response = ['success' => false, 'message' => 'Department ID required'];
                }
                echo json_encode($response);
                exit;
                break;

            case 'submit_course':
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    $response = $handler->submitCourse($_POST);
                }
                echo json_encode($response);
                exit;
                break;

            case 'course_delete':
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id'])) {
                    $response = $handler->deleteCourse($_POST['id']);
                } else {
                    $response = ['success' => false, 'message' => 'Course ID required'];
                }
                echo json_encode($response);
                exit;
                break;

            case 'submit_inquiry_type':
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    if (empty($_POST['inquiryType']) || empty($_POST['description']) || empty($_POST['departmentId'])) {
                        echo json_encode([
                            'success' => false,
                            'message' => 'Missing required fields'
                        ]);
                        exit;
                    }

                    $response = $handler->submitInquiryType($_POST);
                    echo json_encode($response);
                    exit;
                } else {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid request method'
                    ]);
                    exit;
                }
                break;

            case 'inquiry_type_delete':
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id'])) {
                    $response = $handler->deleteInquiryType($_POST['id']);
                } else {
                    $response = ['success' => false, 'message' => 'Inquiry type ID required'];
                }
                echo json_encode($response);
                exit;
                break;

            default:
                echo json_encode(['success' => false, 'message' => 'Invalid action']);
                exit;
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        exit;
    }
}
