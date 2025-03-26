<?php
require_once 'db_connection.php';

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
    $publicActions = ['get_published_faqs'];
    checkAdminAccess($publicActions);
}

// Process API requests
if (isset($_GET['action'])) {
    $action = $_GET['action'];

    try {
        switch ($action) {
            case 'get_all_admin':
                // Get all FAQs for admin
                try {
                    $query = "SELECT * FROM tbl_giya_faq ORDER BY display_order ASC";
                    $stmt = $pdo->prepare($query);
                    $stmt->execute();
                    $faqs = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    returnSuccess($faqs);
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            case 'get_published_faqs':
                // Get only published FAQs for public
                try {
                    $query = "SELECT * FROM tbl_giya_faq WHERE is_active = 1 ORDER BY display_order ASC";
                    $stmt = $pdo->prepare($query);
                    $stmt->execute();
                    $faqs = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    returnSuccess($faqs);
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            case 'get_faq':
                // Get a specific FAQ by ID
                if (!isset($_GET['id'])) {
                    returnError('FAQ ID is required');
                }

                $faqId = $_GET['id'];

                try {
                    $query = "SELECT * FROM tbl_giya_faq WHERE faq_id = :id";
                    $stmt = $pdo->prepare($query);
                    $stmt->bindParam(':id', $faqId);
                    $stmt->execute();
                    $faq = $stmt->fetch(PDO::FETCH_ASSOC);

                    if (!$faq) {
                        returnError('FAQ not found');
                    }

                    returnSuccess($faq);
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            case 'submit_faq':
                // Add or update a FAQ
                if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                    returnError('Invalid request method');
                }

                if (!isset($_POST['question']) || empty($_POST['question'])) {
                    returnError('Question is required');
                }

                if (!isset($_POST['answer']) || empty($_POST['answer'])) {
                    returnError('Answer is required');
                }

                $mode = $_POST['mode'] ?? 'add';
                $id = $_POST['id'] ?? null;
                $question = $_POST['question'];
                $answer = $_POST['answer'];
                $displayOrder = $_POST['displayOrder'] ?? 1;
                $isActive = isset($_POST['isActive']) ? $_POST['isActive'] : 1;

                try {
                    if ($mode === 'add') {
                        $query = "INSERT INTO tbl_giya_faq (question, answer, display_order, is_active)
                                 VALUES (:question, :answer, :displayOrder, :isActive)";

                        $stmt = $pdo->prepare($query);
                        $stmt->bindParam(':question', $question);
                        $stmt->bindParam(':answer', $answer);
                        $stmt->bindParam(':displayOrder', $displayOrder);
                        $stmt->bindParam(':isActive', $isActive);

                        if ($stmt->execute()) {
                            returnSuccess(['message' => 'FAQ added successfully']);
                        } else {
                            returnError('Failed to add FAQ');
                        }
                    } else {
                        // Update existing FAQ
                        if (empty($id)) {
                            returnError('FAQ ID is required for update');
                        }

                        $query = "UPDATE tbl_giya_faq SET
                                 question = :question,
                                 answer = :answer,
                                 display_order = :displayOrder,
                                 is_active = :isActive
                                 WHERE faq_id = :id";

                        $stmt = $pdo->prepare($query);
                        $stmt->bindParam(':question', $question);
                        $stmt->bindParam(':answer', $answer);
                        $stmt->bindParam(':displayOrder', $displayOrder);
                        $stmt->bindParam(':isActive', $isActive);
                        $stmt->bindParam(':id', $id);

                        if ($stmt->execute()) {
                            returnSuccess(['message' => 'FAQ updated successfully']);
                        } else {
                            returnError('Failed to update FAQ');
                        }
                    }
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            case 'delete_faq':
                // Delete a FAQ
                if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                    returnError('Invalid request method');
                }

                if (!isset($_POST['id'])) {
                    returnError('FAQ ID is required');
                }

                $faqId = $_POST['id'];

                try {
                    $query = "DELETE FROM tbl_giya_faq WHERE faq_id = :id";
                    $stmt = $pdo->prepare($query);
                    $stmt->bindParam(':id', $faqId);

                    if ($stmt->execute()) {
                        returnSuccess(['message' => 'FAQ deleted successfully']);
                    } else {
                        returnError('Failed to delete FAQ');
                    }
                } catch (PDOException $e) {
                    returnError('Database error: ' . $e->getMessage());
                }
                break;

            default:
                returnError('Invalid action');
                break;
        }
    } catch (Exception $e) {
        returnError('Server error: ' . $e->getMessage());
    }
} else {
    returnError('Action is required');
}
?>
