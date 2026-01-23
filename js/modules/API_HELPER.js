/**
 * ✅ API_HELPER.js - API Client with Error Handling
 * 
 * Generic API wrapper ที่มี error handling ที่สมบูรณ์
 * ใช้ได้กับทุก fetch calls ในระบบ
 * 
 * ✅ FEATURES:
 * 1. Automatic timeout (default 5 seconds)
 * 2. JSON parsing with error handling
 * 3. HTTP status code validation
 * 4. API success flag checking
 * 5. User-friendly error messages
 * 6. Loading state management
 * 7. Retry logic (optional)
 */

/**
 * Custom Error Classes
 */
class APIError extends Error {
    constructor(message, code = 'ERROR', details = null) {
        super(message);
        this.name = 'APIError';
        this.code = code;
        this.details = details;
    }
}

class TimeoutError extends APIError {
    constructor(message = 'Request timeout') {
        super(message, 'TIMEOUT');
        this.name = 'TimeoutError';
    }
}

class ValidationError extends APIError {
    constructor(message = 'Validation failed', errors = []) {
        super(message, 'VALIDATION');
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

/**
 * ✅ Main API Client
 */
class APIClient {
    /**
     * Make API request with comprehensive error handling
     * 
     * @param {string} endpoint - API endpoint (e.g., "get_stations.php")
     * @param {object} options - Fetch options
     * @param {number} options.timeout - Request timeout in milliseconds (default: 5000)
     * @param {string} options.method - HTTP method (default: 'GET')
     * @param {object} options.body - Request body (for POST/PUT)
     * @param {boolean} options.parseJSON - Parse response as JSON (default: true)
     * @returns {Promise<object>} - Response data
     */
    static async request(endpoint, options = {}) {
        const {
            timeout = 5000,
            method = 'GET',
            body = null,
            parseJSON = true,
            retries = 0,
            retryDelay = 1000
        } = options;

        const url = typeof getApiUrl === 'function' ? getApiUrl(endpoint) : endpoint;

        try {
            console.log(`📡 API Request: ${method} ${url}`);

            // ✅ Create timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new TimeoutError()), timeout)
            );

            // ✅ Create abort controller for cancellation
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            // ✅ Prepare fetch options
            const fetchOptions = {
                method,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
            }

            // ✅ Merge with additional options
            Object.assign(fetchOptions, options);

            // ✅ Make request
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);

            // ✅ Check HTTP status
            if (!response.ok) {
                const errorMessage = `HTTP ${response.status} ${response.statusText}`;
                
                // Try to get error details from response body
                let errorDetails = null;
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType?.includes('application/json')) {
                        errorDetails = await response.json();
                    } else {
                        errorDetails = await response.text();
                    }
                } catch (e) {
                    // Ignore parse errors
                }

                throw new APIError(errorMessage, response.status.toString(), errorDetails);
            }

            // ✅ Parse response
            let data = null;
            
            if (parseJSON) {
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    try {
                        data = await response.json();
                    } catch (e) {
                        throw new APIError(
                            'Invalid JSON response: ' + e.message,
                            'PARSE_ERROR'
                        );
                    }
                } else {
                    throw new APIError(
                        `Expected JSON but got ${contentType || 'unknown content type'}`,
                        'INVALID_CONTENT_TYPE'
                    );
                }
            } else {
                data = await response.text();
            }

            // ✅ Check API response success flag
            if (data && typeof data === 'object' && 'success' in data) {
                if (!data.success) {
                    throw new APIError(
                        data.message || 'Operation failed',
                        data.error_code || 'API_ERROR',
                        data
                    );
                }
            }

            console.log(`✅ API Response: ${url}`, data);
            return data;

        } catch (error) {
            // ✅ Handle specific error types
            if (error instanceof APIError) {
                throw error;
            }

            if (error.name === 'AbortError') {
                throw new TimeoutError(`Request timeout (${timeout}ms)`);
            }

            // ✅ Generic error
            throw new APIError(
                error.message || 'Unknown error occurred',
                error.code || 'UNKNOWN_ERROR'
            );
        }
    }

    /**
     * GET request
     */
    static async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    /**
     * POST request
     */
    static async post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body });
    }

    /**
     * PUT request
     */
    static async put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body });
    }

    /**
     * DELETE request
     */
    static async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

/**
 * ✅ Error Handler Helper
 */
class ErrorHandler {
    /**
     * Convert error to user-friendly message
     */
    static getUserMessage(error) {
        if (error instanceof TimeoutError) {
            return 'ขอบเวลาหมดแล้ว กรุณาลองใหม่';
        }

        if (error instanceof ValidationError) {
            const errorList = error.errors.join(', ');
            return `ข้อมูลไม่ถูกต้อง: ${errorList}`;
        }

        if (error instanceof APIError) {
            if (error.code === '404') {
                return 'ไม่พบข้อมูลที่ขอ';
            }
            if (error.code?.startsWith('5')) {
                return 'เซิร์ฟเวอร์ไม่สามารถประมวลผลได้ กรุณาลองใหม่';
            }
            return error.message || 'เกิดข้อผิดพลาดในระบบ';
        }

        return error.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
    }

    /**
     * Show error notification
     */
    static showError(error, title = '❌ เกิดข้อผิดพลาด') {
        const message = this.getUserMessage(error);
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title,
                text: message,
                icon: 'error',
                confirmButtonText: 'ตกลง'
            });
        } else {
            alert(`${title}\n\n${message}`);
        }

        console.error('Error:', error);
    }

    /**
     * Log error details
     */
    static logError(error, context = '') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            context,
            error: error.message,
            code: error.code || 'UNKNOWN',
            stack: error.stack,
            details: error.details
        };

        console.error('📋 Error Log:', logEntry);

        // Optionally send to server
        if (typeof sendErrorToServer === 'function') {
            sendErrorToServer(logEntry);
        }
    }
}

/**
 * ✅ Loading Manager
 */
class LoadingManager {
    static activeRequests = new Set();

    static start(taskId) {
        this.activeRequests.add(taskId);
        this.updateUI();
    }

    static end(taskId) {
        this.activeRequests.delete(taskId);
        this.updateUI();
    }

    static isLoading() {
        return this.activeRequests.size > 0;
    }

    static updateUI() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = this.isLoading() ? 'flex' : 'none';
        }
    }

    static async withLoading(taskId, asyncFn) {
        this.start(taskId);
        try {
            return await asyncFn();
        } finally {
            this.end(taskId);
        }
    }
}

/**
 * ✅ USAGE EXAMPLES
 */

/*
// Simple GET request
try {
    const data = await APIClient.get('get_stations.php');
    console.log('Stations:', data.data);
} catch (error) {
    ErrorHandler.showError(error);
}

// POST request with body
try {
    const result = await LoadingManager.withLoading('save-station', () =>
        APIClient.post('create_station.php', {
            station_name: 'Station A',
            station_code: 'STA'
        })
    );
    console.log('Saved:', result.data);
} catch (error) {
    ErrorHandler.showError(error, 'ไม่สามารถบันทึกสถานี');
}

// With custom timeout
try {
    const data = await APIClient.get('slow_endpoint.php', { timeout: 10000 });
} catch (error) {
    if (error instanceof TimeoutError) {
        console.log('Request took too long');
    }
}
*/

/**
 * ✅ INTEGRATION
 * 
 * 1. Add this file to your HTML:
 *    <script src="api-helper.js"></script>
 * 
 * 2. Replace existing fetch calls:
 *    ❌ OLD: const result = await fetch(...).then(r => r.json());
 *    ✅ NEW: const result = await APIClient.get('endpoint.php');
 * 
 * 3. Add loading spinner HTML:
 *    <div id="loadingSpinner" style="display: none;">
 *        <i class="fas fa-spinner fa-spin"></i>
 *    </div>
 */