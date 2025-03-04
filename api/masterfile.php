<?php
require 'db_connection.php';
header('Content-Type: application/json');

// Check admin access
function checkAdminAccess()
{
    if (isset($_SERVER['HTTP_X_USER_TYPE'])) {
        $userType = $_SERVER['HTTP_X_USER_TYPE'];
        if ($userType != '6' && $userType != '5') { // Allow admin (6) and POC (5)
            echo json_encode([
                'success' => false,
                'message' => 'Access denied. You do not have permission to access this resource.',
                'code' => 403
            ]);
            exit;
        }

        // POC can only read data, not modify
        if ($userType == '5' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
            echo json_encode([
                'success' => false,
                'message' => 'Access denied. You do not have permission to modify data.',
                'code' => 403
            ]);
            exit;
        }
    } else {
        // If user type header isn't present, deny access
        echo json_encode([
            'success' => false,
            'message' => 'Authentication required',
            'code' => 401
        ]);
        exit;
    }
}

// Only check admin access for non-OPTIONS requests (handles CORS preflight)
if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    checkAdminAccess();
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
                SELECT u.*, c.course_name, d.department_name, sy.schoolyear
                FROM tblusers u
                LEFT JOIN tblcourses c ON u.user_courseId = c.course_id
                LEFT JOIN tbldepartments d ON u.user_departmentId = d.department_id
                LEFT JOIN tblschoolyear sy ON u.user_schoolyearId = sy.schoolyear_id
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
                SELECT u.*, c.course_name, d.department_name, sy.schoolyear
                FROM tblusers u
                LEFT JOIN tblcourses c ON u.user_courseId = c.course_id
                LEFT JOIN tbldepartments d ON u.user_departmentId = d.department_id
                LEFT JOIN tblschoolyear sy ON u.user_schoolyearId = sy.schoolyear_id
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
                    user_departmentId, user_courseId, user_schoolyearId, phinmaed_email,
                    user_status, user_typeId, user_level, user_password)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 2, 10, 'phinma-coc')
                ");
                $result = $stmt->execute([
                    $data['schoolId'],
                    $data['firstName'],
                    $data['middleName'],
                    $data['lastName'],
                    $data['departmentId'],
                    $data['courseId'],
                    $data['yearLevel'],
                    $data['email'],
                    $data['active']
                ]);

                return ['success' => $result, 'message' => $result ? 'Student added successfully' : 'Failed to add student'];
            } else {
                // Update existing student
                $stmt = $this->pdo->prepare("
                    UPDATE tblusers
                    SET user_schoolId = ?, user_firstname = ?, user_middlename = ?, user_lastname = ?,
                    user_departmentId = ?, user_courseId = ?, user_schoolyearId = ?, phinmaed_email = ?,
                    user_status = ?
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
            // Log incoming data for debugging
            error_log("Inquiry Type Form Data: " . print_r($data, true));

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
            // Log the error details
            error_log("PDO Error in submitInquiryType: " . $e->getMessage());
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        } catch (Exception $e) {
            // Log general exceptions
            error_log("General Error in submitInquiryType: " . $e->getMessage());
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
}

// Create handler instance
$handler = new MasterFileHandler($pdo);

// Handle API requests
if (isset($_GET['action'])) {
    $action = $_GET['action'];
    $response = ['success' => false, 'message' => 'Invalid action'];

    try {
        switch ($action) {
            // GET requests
            case 'students':
                $response = $handler->getStudents();
                break;

            case 'get_student':
                if (isset($_GET['id'])) {
                    $response = $handler->getStudent($_GET['id']);
                } else {
                    $response = ['success' => false, 'message' => 'Student ID required'];
                }
                break;

            case 'poc':
                $response = $handler->getPOC();
                break;

            case 'get_poc':
                if (isset($_GET['id'])) {
                    $response = $handler->getPOCDetails($_GET['id']);
                } else {
                    $response = ['success' => false, 'message' => 'POC ID required'];
                }
                break;

            case 'departments':
                $response = $handler->getDepartments();
                break;

            case 'get_department':
                if (isset($_GET['id'])) {
                    $response = $handler->getDepartmentDetails($_GET['id']);
                } else {
                    $response = ['success' => false, 'message' => 'Department ID required'];
                }
                break;

            case 'courses':
                $response = $handler->getCourses();
                break;

            case 'courses_by_department':
                if (isset($_GET['department_id'])) {
                    $response = $handler->getCoursesByDepartment($_GET['department_id']);
                } else {
                    $response = ['success' => false, 'message' => 'Department ID required'];
                }
                break;

            case 'get_course':
                if (isset($_GET['id'])) {
                    $response = $handler->getCourseDetails($_GET['id']);
                } else {
                    $response = ['success' => false, 'message' => 'Course ID required'];
                }
                break;

            case 'inquiry_types':
                $response = $handler->getInquiryTypes();
                break;

            case 'get_inquiry_type':
                if (isset($_GET['id'])) {
                    $response = $handler->getInquiryTypeDetails($_GET['id']);
                } else {
                    $response = ['success' => false, 'message' => 'Inquiry type ID required'];
                }
                break;

            // POST requests
            case 'save_student':
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    $response = $handler->saveStudent($_POST);
                }
                break;

            case 'student_delete':
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id'])) {
                    $response = $handler->deleteStudent($_POST['id']);
                } else {
                    $response = ['success' => false, 'message' => 'Student ID required'];
                }
                break;

            case 'toggle_student_status':
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id']) && isset($_POST['status'])) {
                    $response = $handler->toggleStudentStatus($_POST['id'], $_POST['status']);
                } else {
                    $response = ['success' => false, 'message' => 'Student ID and status required'];
                }
                break;

            case 'submit_poc':
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    $response = $handler->submitPOC($_POST);
                }
                break;

            case 'poc_delete':
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id'])) {
                    $response = $handler->deletePOC($_POST['id']);
                } else {
                    $response = ['success' => false, 'message' => 'POC ID required'];
                }
                break;

            case 'submit_department':
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    $response = $handler->submitDepartment($_POST);
                }
                break;

            case 'department_delete':
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id'])) {
                    $response = $handler->deleteDepartment($_POST['id']);
                } else {
                    $response = ['success' => false, 'message' => 'Department ID required'];
                }
                break;

            case 'submit_course':
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    $response = $handler->submitCourse($_POST);
                }
                break;

            case 'course_delete':
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id'])) {
                    $response = $handler->deleteCourse($_POST['id']);
                } else {
                    $response = ['success' => false, 'message' => 'Course ID required'];
                }
                break;

            case 'submit_inquiry_type':
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    // Log the incoming data for debugging
                    error_log("submit_inquiry_type POST data: " . print_r($_POST, true));

                    // Validate required fields
                    if (empty($_POST['inquiryType']) || empty($_POST['description']) || empty($_POST['departmentId'])) {
                        echo json_encode([
                            'success' => false,
                            'message' => 'Missing required fields'
                        ]);
                        exit;
                    }

                    $response = $handler->submitInquiryType($_POST);
                    echo json_encode($response);
                    exit; // Add exit to prevent double output
                } else {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid request method'
                    ]);
                    exit; // Always exit after sending JSON
                }
                break;

            case 'inquiry_type_delete':
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id'])) {
                    $response = $handler->deleteInquiryType($_POST['id']);
                } else {
                    $response = ['success' => false, 'message' => 'Inquiry type ID required'];
                }
                break;
        }
    } catch (Exception $e) {
        $response = ['success' => false, 'message' => $e->getMessage()];
    }

    echo json_encode($response);
}
