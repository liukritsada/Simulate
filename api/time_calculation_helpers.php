<?php
/**
 * Time Calculation Helper Functions
 * Version: 1.0
 * Created: 2026-01-26
 *
 * Purpose: Provide consistent time calculation utilities across all APIs
 */

class TimeCalculator
{
    /**
     * Calculate waiting time in minutes
     *
     * @param string $arrival_time เวลาที่มาถึง (HH:MM:SS)
     * @param string|null $start_time เวลาที่เริ่มทำ (HH:MM:SS) หรือ null = ใช้เวลาปัจจุบัน
     * @return int เวลารอ (นาที)
     */
    public static function calculateWaitingTime($arrival_time, $start_time = null)
    {
        if (!$arrival_time) {
            return 0;
        }

        // ใช้ start_time หรือเวลาปัจจุบัน
        $reference = $start_time ?? date('H:i:s');

        $arrival = strtotime($arrival_time);
        $current = strtotime($reference);

        // คำนวณความต่างเป็นนาที
        $diffSeconds = $current - $arrival;
        return (int) ($diffSeconds / 60);
    }

    /**
     * Calculate target completion time
     *
     * @param string $start_time เวลาเริ่มต้น (HH:MM:SS)
     * @param int $procedure_duration ระยะเวลาหัตถการ (นาที)
     * @return string เวลาเป้าหมาย (HH:MM:SS)
     */
    public static function calculateTargetTime($start_time, $procedure_duration)
    {
        if (!$start_time) {
            return null;
        }

        $start = strtotime($start_time);
        $target = $start + ($procedure_duration * 60);

        return date('H:i:s', $target);
    }

    /**
     * Format time difference as readable string
     *
     * @param int $minutes จำนวนนาที
     * @return string เวลาในรูปแบบอ่านง่าย (เช่น "1 ชั่วโมง 30 นาที")
     */
    public static function formatDuration($minutes)
    {
        if ($minutes < 0) {
            return '0 นาที';
        }

        $hours = floor($minutes / 60);
        $mins = $minutes % 60;

        if ($hours > 0) {
            return $mins > 0
                ? "$hours ชั่วโมง $mins นาที"
                : "$hours ชั่วโมง";
        }

        return "$mins นาที";
    }

    /**
     * Convert TIME format to minutes
     *
     * @param string $time_string เวลาในรูปแบบ TIME (HH:MM:SS)
     * @return int จำนวนนาที
     */
    public static function timeToMinutes($time_string)
    {
        if (!$time_string) {
            return 0;
        }

        $parts = explode(':', $time_string);
        $hours = (int)($parts[0] ?? 0);
        $minutes = (int)($parts[1] ?? 0);

        return ($hours * 60) + $minutes;
    }

    /**
     * Convert minutes to TIME format
     *
     * @param int $minutes จำนวนนาที
     * @return string เวลาในรูปแบบ TIME (HH:MM:SS)
     */
    public static function minutesToTime($minutes)
    {
        if ($minutes < 0) {
            $minutes = 0;
        }

        $hours = floor($minutes / 60);
        $mins = $minutes % 60;

        return sprintf('%02d:%02d:00', $hours, $mins);
    }

    /**
     * Get waiting time status with emoji and color
     *
     * @param int $wait_minutes เวลารอ (นาที)
     * @return array ['emoji', 'color', 'text', 'level']
     */
    public static function getWaitingStatus($wait_minutes)
    {
        if ($wait_minutes < 0) {
            return [
                'emoji' => '📅',
                'color' => '#9b59b6',
                'text' => 'ยังไม่ถึงเวลานัด',
                'level' => 'future'
            ];
        }

        if ($wait_minutes <= 15) {
            return [
                'emoji' => '😊',
                'color' => '#27ae60',
                'text' => "รอ $wait_minutes นาที",
                'level' => 'good'
            ];
        }

        if ($wait_minutes <= 30) {
            return [
                'emoji' => '😐',
                'color' => '#f39c12',
                'text' => "รอ $wait_minutes นาที",
                'level' => 'normal'
            ];
        }

        if ($wait_minutes <= 60) {
            return [
                'emoji' => '😕',
                'color' => '#e67e22',
                'text' => "รอ $wait_minutes นาที",
                'level' => 'warning'
            ];
        }

        return [
            'emoji' => '😠',
            'color' => '#e74c3c',
            'text' => "รอ $wait_minutes นาที",
            'level' => 'critical'
        ];
    }

    /**
     * Calculate time difference between two TIME values
     *
     * @param string $time1 เวลาเริ่มต้น (HH:MM:SS)
     * @param string $time2 เวลาสิ้นสุด (HH:MM:SS)
     * @return int ความต่าง (นาที)
     */
    public static function timeDiff($time1, $time2)
    {
        if (!$time1 || !$time2) {
            return 0;
        }

        $timestamp1 = strtotime($time1);
        $timestamp2 = strtotime($time2);

        $diffSeconds = $timestamp2 - $timestamp1;
        return (int) ($diffSeconds / 60);
    }

    /**
     * Check if current time is within work hours
     *
     * @param string $work_start เวลาเริ่มงาน (HH:MM:SS)
     * @param string $work_end เวลาเลิกงาน (HH:MM:SS)
     * @param string|null $current_time เวลาปัจจุบัน (null = ใช้เวลาจริง)
     * @return bool
     */
    public static function isWithinWorkHours($work_start, $work_end, $current_time = null)
    {
        $current = $current_time ?? date('H:i:s');

        $currentStamp = strtotime($current);
        $startStamp = strtotime($work_start);
        $endStamp = strtotime($work_end);

        return ($currentStamp >= $startStamp && $currentStamp <= $endStamp);
    }

    /**
     * Check if time is in break period
     *
     * @param string $break_start เวลาเริ่มพัก (HH:MM:SS)
     * @param string $break_end เวลาสิ้นสุดพัก (HH:MM:SS)
     * @param string|null $current_time เวลาปัจจุบัน (null = ใช้เวลาจริง)
     * @return bool
     */
    public static function isBreakTime($break_start, $break_end, $current_time = null)
    {
        if (!$break_start || !$break_end) {
            return false;
        }

        return self::isWithinWorkHours($break_start, $break_end, $current_time);
    }

    /**
     * Get time ago in Thai language
     *
     * @param string $datetime DATETIME string (Y-m-d H:i:s)
     * @return string เวลาที่ผ่านมา (เช่น "5 นาทีที่แล้ว")
     */
    public static function timeAgo($datetime)
    {
        if (!$datetime) {
            return '-';
        }

        $timestamp = strtotime($datetime);
        $now = time();
        $diff = $now - $timestamp;

        if ($diff < 60) {
            return 'เมื่อสักครู่';
        }

        if ($diff < 3600) {
            $mins = floor($diff / 60);
            return "$mins นาทีที่แล้ว";
        }

        if ($diff < 86400) {
            $hours = floor($diff / 3600);
            return "$hours ชั่วโมงที่แล้ว";
        }

        $days = floor($diff / 86400);
        return "$days วันที่แล้ว";
    }
}

/**
 * Helper function for backward compatibility
 */
function calculateWaitingTime($arrival_time, $start_time = null)
{
    return TimeCalculator::calculateWaitingTime($arrival_time, $start_time);
}

/**
 * Helper function for backward compatibility
 */
function calculateTargetTime($start_time, $procedure_duration)
{
    return TimeCalculator::calculateTargetTime($start_time, $procedure_duration);
}
