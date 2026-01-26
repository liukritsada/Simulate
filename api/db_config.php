<?php
/**
 * Database Configuration - SAFE FOR JSON API
 * PHP 7.3 Compatible
 */

class DBConfig
{
    private static $pdo = null;
    private static $mysqli = null;

    private static $host = '127.0.0.1';
    private static $port = 3306;
    private static $dbname = 'hospitalstation';
    private static $username = 'root';  // Fixed: Changed from 'sa' to 'root' for XAMPP
    private static $password = '';

    /* ===================== PDO ===================== */
    public static function getPDO()
    {
        if (self::$pdo === null) {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
                self::$host,
                self::$port,
                self::$dbname
            );

            try {
                self::$pdo = new PDO(
                    $dsn,
                    self::$username,
                    self::$password,
                    [
                        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES   => false,
                    ]
                );
            } catch (PDOException $e) {
                error_log('PDO connection failed: ' . $e->getMessage());
                throw new RuntimeException('Database connection error');
            }
        }

        return self::$pdo;
    }

    /* ===================== MYSQLI ===================== */
    public static function getMySQLi()
    {
        if (self::$mysqli === null) {
            self::$mysqli = new mysqli(
                self::$host,
                self::$username,
                self::$password,
                self::$dbname,
                self::$port
            );

            if (self::$mysqli->connect_error) {
                error_log('MySQLi connection failed: ' . self::$mysqli->connect_error);
                throw new RuntimeException('Database connection error');
            }

            self::$mysqli->set_charset('utf8mb4');
            self::$mysqli->query("SET time_zone = '+07:00'");
        }

        return self::$mysqli;
    }
}

/* ===== Legacy compatibility ===== */
if (!isset($pdo)) {
    try {
        $pdo = DBConfig::getPDO();
    } catch (Throwable $e) {
        $pdo = null;
    }
}

if (!isset($conn)) {
    try {
        $conn = DBConfig::getMySQLi();
    } catch (Throwable $e) {
        $conn = null;
    }
}
