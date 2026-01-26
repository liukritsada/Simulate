<?php
/**
 * Standardized API Response Helper
 * Version: 1.0
 * Created: 2026-01-26
 *
 * Purpose: Provide consistent response format across all APIs
 */

class APIResponse
{
    /**
     * Standard success response
     *
     * @param string $message Success message
     * @param mixed $data Response data (array, object, or null)
     * @param array $extras Optional extra fields (errors, warnings, _debug, etc.)
     * @return void (exits with JSON output)
     */
    public static function success($message, $data = null, $extras = [])
    {
        http_response_code(200);

        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ];

        // Merge optional extras (errors, warnings, debug info, etc.)
        if (!empty($extras)) {
            $response = array_merge($response, $extras);
        }

        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * Standard error response
     *
     * @param string $message Error message
     * @param int $httpCode HTTP status code (default: 400)
     * @param array $extras Optional extra fields (error_code, details, etc.)
     * @return void (exits with JSON output)
     */
    public static function error($message, $httpCode = 400, $extras = [])
    {
        http_response_code($httpCode);

        $response = [
            'success' => false,
            'message' => $message,
            'data' => null,
            'timestamp' => date('Y-m-d H:i:s')
        ];

        // Merge optional extras
        if (!empty($extras)) {
            $response = array_merge($response, $extras);
        }

        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * Validation error response (HTTP 422)
     *
     * @param string $message Validation error message
     * @param array $errors Array of validation errors
     * @return void (exits with JSON output)
     */
    public static function validationError($message, $errors = [])
    {
        self::error($message, 422, ['errors' => $errors]);
    }

    /**
     * Not found response (HTTP 404)
     *
     * @param string $message Not found message
     * @return void (exits with JSON output)
     */
    public static function notFound($message = 'Resource not found')
    {
        self::error($message, 404);
    }

    /**
     * Unauthorized response (HTTP 401)
     *
     * @param string $message Unauthorized message
     * @return void (exits with JSON output)
     */
    public static function unauthorized($message = 'Unauthorized access')
    {
        self::error($message, 401);
    }

    /**
     * Forbidden response (HTTP 403)
     *
     * @param string $message Forbidden message
     * @return void (exits with JSON output)
     */
    public static function forbidden($message = 'Access forbidden')
    {
        self::error($message, 403);
    }

    /**
     * Server error response (HTTP 500)
     *
     * @param string $message Server error message
     * @param array $extras Optional debug info
     * @return void (exits with JSON output)
     */
    public static function serverError($message = 'Internal server error', $extras = [])
    {
        self::error($message, 500, $extras);
    }

    /**
     * Database error response with proper logging
     *
     * @param PDOException $e PDO Exception object
     * @param bool $showDetails Whether to show detailed error (default: false for production)
     * @return void (exits with JSON output)
     */
    public static function databaseError(PDOException $e, $showDetails = false)
    {
        // Log the full error
        error_log("Database Error: " . $e->getMessage());
        error_log("SQL State: " . $e->getCode());

        // Show simplified message to client
        $message = $showDetails
            ? 'Database error: ' . $e->getMessage()
            : 'Database connection error. Please try again later.';

        $extras = $showDetails
            ? ['error_code' => $e->getCode(), 'sql_state' => $e->getCode()]
            : [];

        self::serverError($message, $extras);
    }
}

/**
 * Helper function for backward compatibility
 * @deprecated Use APIResponse::success() instead
 */
function sendSuccessResponse($message, $data = null)
{
    APIResponse::success($message, $data);
}

/**
 * Helper function for backward compatibility
 * @deprecated Use APIResponse::error() instead
 */
function sendErrorResponse($message, $httpCode = 400)
{
    APIResponse::error($message, $httpCode);
}
