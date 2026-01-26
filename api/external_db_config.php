<?php
/**
 * External Database Configuration
 * For PDP Database Connection (172.25.41.30)
 * PHP 7.3 Compatible
 */

class ExternalDBConfig
{
    private static $pdpPdo = null;

    // PDP Database Configuration
    private static $pdp_host = '172.25.41.30';
    private static $pdp_port = 3306;
    private static $pdp_dbname = 'pdp';
    private static $pdp_username = 'root';
    private static $pdp_password = ''; // Will be loaded from environment variable

    /**
     * Get PDO connection to PDP database
     *
     * @return PDO
     * @throws RuntimeException
     */
    public static function getPDPConnection()
    {
        if (self::$pdpPdo === null) {
            // Try to get password from environment variable first
            $password = getenv('PDP_PASSWORD');
            if ($password === false) {
                // Fallback to default (for backward compatibility)
                $password = self::$pdp_password;
                error_log('Warning: PDP_PASSWORD environment variable not set, using default');
            }

            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
                self::$pdp_host,
                self::$pdp_port,
                self::$pdp_dbname
            );

            try {
                self::$pdpPdo = new PDO(
                    $dsn,
                    self::$pdp_username,
                    $password,
                    [
                        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES   => false,
                        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                    ]
                );

                // Set timezone
                self::$pdpPdo->query("SET time_zone = '+07:00'");

            } catch (PDOException $e) {
                error_log('PDP PDO connection failed: ' . $e->getMessage());
                throw new RuntimeException('External database connection error');
            }
        }

        return self::$pdpPdo;
    }

    /**
     * Test connection to PDP database
     *
     * @return array
     */
    public static function testConnection()
    {
        try {
            $pdo = self::getPDPConnection();
            $stmt = $pdo->query("SELECT 1 as test");
            $result = $stmt->fetch();

            return [
                'success' => true,
                'message' => 'PDP database connection successful',
                'host' => self::$pdp_host,
                'database' => self::$pdp_dbname
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'PDP database connection failed: ' . $e->getMessage(),
                'host' => self::$pdp_host,
                'database' => self::$pdp_dbname
            ];
        }
    }

    /**
     * Close PDP connection
     */
    public static function closeConnection()
    {
        self::$pdpPdo = null;
    }
}
