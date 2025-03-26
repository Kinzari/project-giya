<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, X-Retry, X-User-Type, X-User-Id");
header('Content-Type: application/json');

require 'db_connection.php';

function checkAccess() {
    if ($_GET['action'] === 'get_stats') {
        return true;
    }

    if (isset($_SERVER['HTTP_X_USER_TYPE'])) {
        $userType = $_SERVER['HTTP_X_USER_TYPE'];
        if ($userType != '6' && $userType != '5') {
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Access denied. You do not have permission to access this resource.',
                'code' => 403
            ]);
            exit;
        }
    } else {
        header('Content-Type: application/json');
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
    checkAccess();
}

class DashboardHandler {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Get dashboard statistics based on filters
     * @param array $filters Parameters for filtering data
     * @return array Statistics data
     */
    public function getStats($filters) {
        try {
            // Build WHERE clause based on filters
            $whereConditions = [];
            $params = [];

            // Date range filtering
            if (isset($filters['start_date'], $filters['end_date']) && $filters['start_date'] !== '' && $filters['end_date'] !== '') {
                $whereConditions[] = "p.post_date BETWEEN STR_TO_DATE(:start_date, '%Y-%m-%d') AND STR_TO_DATE(:end_date, '%Y-%m-%d')";
                $params[':start_date'] = $filters['start_date'];
                $params[':end_date'] = $filters['end_date'];
            }

            // Department filtering
            if (isset($filters['department_id']) && $filters['department_id'] !== '') {
                $whereConditions[] = "p.post_departmentId = :department_id";
                $params[':department_id'] = $filters['department_id'];
            }

            // Campus filtering - changed from course to campus
            if (isset($filters['campus_id']) && $filters['campus_id'] !== '') {
                $whereConditions[] = "p.post_campusId = :campus_id";
                $params[':campus_id'] = $filters['campus_id'];
            }

            // Post type filtering
            if (isset($filters['post_type']) && $filters['post_type'] !== '') {
                $whereConditions[] = "p.postType_id = :post_type";
                $params[':post_type'] = $filters['post_type'];
            }

            // Status filtering
            if (isset($filters['status']) && $filters['status'] !== '') {
                $whereConditions[] = "p.post_status = :status";
                $params[':status'] = $filters['status'];
            }

            // Combine WHERE conditions
            $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

            // Get total post count - Updated join for campus filtering
            $totalQuery = "SELECT COUNT(*) FROM tbl_giya_posts p
                          LEFT JOIN tblusers u ON p.post_userId = u.user_id
                          LEFT JOIN tblcampus c ON p.post_campusId = c.campus_id
                          $whereClause";
            $stmt = $this->pdo->prepare($totalQuery);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            $totalPosts = $stmt->fetchColumn();

            // Get post counts by type - Updated join for campus filtering
            $postTypeQuery = "
                SELECT
                    pt.postType_name,
                    COUNT(*) as count
                FROM tbl_giya_posts p
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tblusers u ON p.post_userId = u.user_id
                LEFT JOIN tblcampus c ON p.post_campusId = c.campus_id
                $whereClause
                GROUP BY pt.postType_name
            ";
            $stmt = $this->pdo->prepare($postTypeQuery);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            $postTypeData = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Transform post type data into key-value pairs
            $postTypes = [];
            foreach ($postTypeData as $row) {
                $postTypes[strtolower($row['postType_name'])] = (int)$row['count'];
            }

            // Get post counts by status - Updated join for campus filtering
            $statusQuery = "
                SELECT
                    p.post_status,
                    COUNT(*) as count
                FROM tbl_giya_posts p
                LEFT JOIN tblusers u ON p.post_userId = u.user_id
                LEFT JOIN tblcampus c ON p.post_campusId = c.campus_id
                $whereClause
                GROUP BY p.post_status
            ";
            $stmt = $this->pdo->prepare($statusQuery);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            $statusData = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Transform status data into key-value pairs
            $statusCounts = [
                'pending' => 0,
                'ongoing' => 0,
                'resolved' => 0
            ];

            foreach ($statusData as $row) {
                switch ((int)$row['post_status']) {
                    case 0:
                        $statusCounts['pending'] = (int)$row['count'];
                        break;
                    case 1:
                        $statusCounts['ongoing'] = (int)$row['count'];
                        break;
                    case 2:
                    case 3:
                        $statusCounts['resolved'] = (isset($statusCounts['resolved']) ? $statusCounts['resolved'] : 0) + (int)$row['count'];
                        break;
                }
            }

            // Get detailed breakdown of status by post type
            $detailedStatusQuery = "
                SELECT
                    p.post_status,
                    pt.postType_name,
                    COUNT(*) as count
                FROM tbl_giya_posts p
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tblusers u ON p.post_userId = u.user_id
                LEFT JOIN tblcampus c ON p.post_campusId = c.campus_id
                $whereClause
                GROUP BY p.post_status, pt.postType_name
                ORDER BY p.post_status, pt.postType_name
            ";

            $stmt = $this->pdo->prepare($detailedStatusQuery);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            $detailedData = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Transform detailed status data into a structured object
            $detailedStatus = [
                'pending' => [
                    'inquiry' => 0,
                    'feedback' => 0,
                    'suggestion' => 0
                ],
                'ongoing' => [
                    'inquiry' => 0,
                    'feedback' => 0,
                    'suggestion' => 0
                ],
                'resolved' => [
                    'inquiry' => 0,
                    'feedback' => 0,
                    'suggestion' => 0
                ]
            ];

            foreach ($detailedData as $row) {
                $statusKey = '';
                switch ((int)$row['post_status']) {
                    case 0:
                        $statusKey = 'pending';
                        break;
                    case 1:
                        $statusKey = 'ongoing';
                        break;
                    case 2:
                    case 3:
                        $statusKey = 'resolved';
                        break;
                    default:
                        continue 2; // Skip this row if status is unknown
                }

                $typeKey = strtolower($row['postType_name']);
                if (isset($detailedStatus[$statusKey][$typeKey])) {
                    $detailedStatus[$statusKey][$typeKey] = (int)$row['count'];
                }
            }

            // Get department information if department_id is provided
            $departmentName = null;
            if (!empty($filters['department_id'])) {
                $deptQuery = "SELECT department_name FROM tbldepartments WHERE department_id = :id";
                $stmt = $this->pdo->prepare($deptQuery);
                $stmt->bindValue(':id', $filters['department_id']);
                $stmt->execute();
                $departmentName = $stmt->fetchColumn();
            }

            // Get campus information if campus_id is provided
            $campusName = null;
            if (!empty($filters['campus_id'])) {
                $campusQuery = "SELECT campus_name FROM tblcampus WHERE campus_id = :id";
                $stmt = $this->pdo->prepare($campusQuery);
                $stmt->bindValue(':id', $filters['campus_id']);
                $stmt->execute();
                $campusName = $stmt->fetchColumn();
            }

            // Prepare response data
            return [
                'success' => true,
                'total' => $totalPosts,
                'post_types' => $postTypes,
                'status' => $statusCounts,
                'detailed_status' => $detailedStatus,  // Added detailed status breakdown
                'department' => $departmentName,
                'campus' => $campusName,
                'filter_period' => [
                    'start_date' => $filters['start_date'] ?? null,
                    'end_date' => $filters['end_date'] ?? null
                ]
            ];
        } catch (\PDOException $e) {
            return [
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get trending data for different metrics
     * @param array $filters Parameters for filtering data
     * @return array Trend data
     */
    public function getTrendData($filters) {
        try {
            $period = $filters['period'] ?? 'week';
            $departmentId = $filters['department_id'] ?? null;
            $campusId = $filters['campus_id'] ?? null;  // Changed from courseId to campusId

            // Format period specific SQL
            $groupBy = "DATE(p.post_date)"; // Default - daily
            $dateFormat = "%Y-%m-%d";

            if ($period === 'month') {
                $groupBy = "YEAR(p.post_date), MONTH(p.post_date)";
                $dateFormat = "%Y-%m";
            } elseif ($period === 'year') {
                $groupBy = "YEAR(p.post_date)";
                $dateFormat = "%Y";
            }

            // Build WHERE clause based on filters
            $whereConditions = [];
            $params = [];

            // Date range filtering
            if (isset($filters['start_date'], $filters['end_date']) && $filters['start_date'] !== '' && $filters['end_date'] !== '') {
                $whereConditions[] = "p.post_date BETWEEN STR_TO_DATE(:start_date, '%Y-%m-%d') AND STR_TO_DATE(:end_date, '%Y-%m-%d')";
                $params[':start_date'] = $filters['start_date'];
                $params[':end_date'] = $filters['end_date'];
            }

            // Department filtering
            if ($departmentId) {
                $whereConditions[] = "p.post_departmentId = :department_id";
                $params[':department_id'] = $departmentId;
            }

            // Campus filtering - changed from course to campus
            if ($campusId) {
                $whereConditions[] = "p.post_campusId = :campus_id";
                $params[':campus_id'] = $campusId;
            }

            $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

            // Get trend data for different metrics - Updated join for campus filtering
            $query = "
                SELECT
                    DATE_FORMAT(p.post_date, '$dateFormat') as date_period,
                    COUNT(*) as total_posts,
                    SUM(CASE WHEN pt.postType_id = 1 THEN 1 ELSE 0 END) as inquiries,
                    SUM(CASE WHEN pt.postType_id = 2 THEN 1 ELSE 0 END) as feedback,
                    SUM(CASE WHEN pt.postType_id = 3 THEN 1 ELSE 0 END) as suggestions,
                    SUM(CASE WHEN p.post_status = 0 THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN p.post_status = 1 THEN 1 ELSE 0 END) as ongoing,
                    SUM(CASE WHEN p.post_status = 2 OR p.post_status = 3 THEN 1 ELSE 0 END) as resolved
                FROM tbl_giya_posts p
                JOIN tbl_giya_posttype pt ON p.postType_id = pt.postType_id
                LEFT JOIN tblcampus c ON p.post_campusId = c.campus_id
                $whereClause
                GROUP BY $groupBy
                ORDER BY p.post_date ASC
            ";

            $stmt = $this->pdo->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            $trendData = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                'success' => true,
                'period' => $period,
                'data' => $trendData,
                'filter_period' => [
                    'start_date' => $filters['start_date'] ?? null,
                    'end_date' => $filters['end_date'] ?? null
                ]
            ];
        } catch (\PDOException $e) {
            return [
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get top departments with most posts
     * @param array $filters Parameters for filtering data
     * @return array Top departments
     */
    public function getTopDepartments($filters) {
        try {
            // Build WHERE clause based on filters
            $whereConditions = [];
            $params = [];

            // Date range filtering
            if (isset($filters['start_date'], $filters['end_date']) && $filters['start_date'] !== '' && $filters['end_date'] !== '') {
                $whereConditions[] = "p.post_date BETWEEN STR_TO_DATE(:start_date, '%Y-%m-%d') AND STR_TO_DATE(:end_date, '%Y-%m-%d')";
                $params[':start_date'] = $filters['start_date'];
                $params[':end_date'] = $filters['end_date'];
            }

            // Post type filtering
            if (isset($filters['post_type']) && $filters['post_type'] !== '') {
                $whereConditions[] = "p.postType_id = :post_type";
                $params[':post_type'] = $filters['post_type'];
            }

            // Campus filtering - changed from course to campus
            if (isset($filters['campus_id']) && $filters['campus_id'] !== '') {
                $whereConditions[] = "p.post_campusId = :campus_id";
                $params[':campus_id'] = $filters['campus_id'];
            }

            $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

            $query = "
                SELECT
                    d.department_name,
                    COUNT(*) as post_count
                FROM tbl_giya_posts p
                JOIN tbldepartments d ON p.post_departmentId = d.department_id
                LEFT JOIN tblcampus c ON p.post_campusId = c.campus_id
                $whereClause
                GROUP BY d.department_name
                ORDER BY post_count DESC
                LIMIT 10
            ";

            $stmt = $this->pdo->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            $topDepartments = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                'success' => true,
                'departments' => $topDepartments
            ];
        } catch (\PDOException $e) {
            return [
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get top campuses with most posts
     * @param array $filters Parameters for filtering data
     * @return array Top campuses
     */
    public function getTopCampuses($filters) {
        try {
            // Build WHERE clause based on filters
            $whereConditions = [];
            $params = [];

            // Date range filtering
            if (isset($filters['start_date'], $filters['end_date']) && $filters['start_date'] !== '' && $filters['end_date'] !== '') {
                $whereConditions[] = "p.post_date BETWEEN STR_TO_DATE(:start_date, '%Y-%m-%d') AND STR_TO_DATE(:end_date, '%Y-%m-%d')";
                $params[':start_date'] = $filters['start_date'];
                $params[':end_date'] = $filters['end_date'];
            }

            // Department filtering
            if (isset($filters['department_id']) && $filters['department_id'] !== '') {
                $whereConditions[] = "p.post_departmentId = :department_id";
                $params[':department_id'] = $filters['department_id'];
            }

            // Post type filtering
            if (isset($filters['post_type']) && $filters['post_type'] !== '') {
                $whereConditions[] = "p.postType_id = :post_type";
                $params[':post_type'] = $filters['post_type'];
            }

            $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

            $query = "
                SELECT
                    c.campus_name,
                    COUNT(*) as post_count
                FROM tbl_giya_posts p
                JOIN tblcampus c ON p.post_campusId = c.campus_id
                $whereClause
                GROUP BY c.campus_name
                ORDER BY post_count DESC
                LIMIT 10
            ";

            $stmt = $this->pdo->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            $topCampuses = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                'success' => true,
                'campuses' => $topCampuses
            ];
        } catch (\PDOException $e) {
            return [
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }
}

// Handle API requests
if (isset($_GET['action'])) {
    header('Content-Type: application/json');
    $handler = new DashboardHandler($pdo);

    // Get filter parameters
    $filters = [
        'start_date' => $_GET['start_date'] ?? null,
        'end_date' => $_GET['end_date'] ?? null,
        'department_id' => $_GET['department_id'] ?? null,
        'campus_id' => $_GET['campus_id'] ?? null,  // Changed from course_id to campus_id
        'post_type' => $_GET['post_type'] ?? null,
        'status' => isset($_GET['status']) ? $_GET['status'] : null,
        'period' => $_GET['period'] ?? 'week'
    ];

    switch ($_GET['action']) {
        case 'get_stats':
            echo json_encode($handler->getStats($filters));
            break;
        case 'get_trend_data':
            echo json_encode($handler->getTrendData($filters));
            break;
        case 'get_top_departments':
            echo json_encode($handler->getTopDepartments($filters));
            break;
        case 'get_top_campuses':  // Changed from get_top_courses to get_top_campuses
            echo json_encode($handler->getTopCampuses($filters));
            break;
        default:
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action'
            ]);
    }
    exit;
}

// If accessed directly without an action parameter
header('Content-Type: application/json');
echo json_encode([
    'success' => false,
    'message' => 'No action specified'
]);
exit;
