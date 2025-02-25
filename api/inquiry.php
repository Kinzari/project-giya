class InquiryHandler {
    // ...existing code...

    public function submitInquiry($data) {
        if (empty($data['user_id']) || empty($data['inquiry_type_id']) || empty($data['concern_type']) || empty($data['post_title']) || empty($data['post_message'])) {
            return ["success" => false, "message" => "Missing required fields"];
        }

        try {
            // Get department ID from inquiry types table
            $deptStmt = $this->pdo->prepare("
                SELECT department_id
                FROM tbl_giya_inquiry_types
                WHERE inquiry_id = ?
            ");
            $deptStmt->execute([$data['inquiry_type_id']]);
            $departmentId = $deptStmt->fetchColumn() ?: 1; // Default to 1 if not found

            $stmt = $this->pdo->prepare("
                INSERT INTO tbl_giya_posts (
                    post_userId,
                    post_departmentId,
                    postType_id,
                    inquiry_type_id,
                    post_date,
                    post_time,
                    post_title,
                    post_message,
                    post_status,
                    is_read
                ) VALUES (
                    :userId,
                    :deptId,
                    :postTypeId,
                    :inquiryTypeId,
                    CURDATE(),
                    CURTIME(),
                    :title,
                    :message,
                    'Pending',
                    0
                )
            ");
            $stmt->execute([
                ':userId' => $data['user_id'],
                ':deptId' => $departmentId,
                ':postTypeId' => $data['concern_type'],
                ':inquiryTypeId' => $data['inquiry_type_id'],
                ':title' => $data['post_title'],
                ':message' => $data['post_message']
            ]);
            return [
                "success" => true,
                "message" => "Inquiry submitted successfully",
                "post_id" => $this->pdo->lastInsertId()
            ];
        } catch (PDOException $e) {
            return ["success" => false, "message" => "Database error: " . $e->getMessage()];
        }
    }

    public function getInquiryTypes() {
        try {
            $stmt = $this->pdo->query("
                SELECT inquiry_id, inquiry_type, description
                FROM tbl_giya_inquiry_types
                WHERE is_active = 1
                ORDER BY inquiry_type
            ");
            return [
                "success" => true,
                "types" => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ];
        } catch (PDOException $e) {
            return ["success" => false, "message" => "Database error: " . $e->getMessage()];
        }
    }

    public function getPostTypes() {
        try {
            $stmt = $this->pdo->query("
                SELECT postType_id, postType_name
                FROM tbl_giya_posttype
                ORDER BY postType_id
            ");
            return [
                "success" => true,
                "types" => $stmt->fetchAll(PDO::FETCH_ASSOC)


























}    }            echo json_encode(["success" => false, "message" => "Invalid action"]);        default:            break;            echo json_encode($handler->submitInquiry($data));            $data = json_decode(file_get_contents("php://input"), true);        case 'submit_inquiry':            break;            echo json_encode($handler->getPostTypes());        case 'get_post_types':            break;            echo json_encode($handler->getInquiryTypes());        case 'get_inquiry_types':    switch ($_GET['action']) {    $handler = new InquiryHandler($pdo);if (isset($_GET['action'])) {// Update action handler}    }        }            return ["success" => false, "message" => "Database error: " . $e->getMessage()];        } catch (PDOException $e) {            ];
