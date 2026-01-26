-- ============================================================================
-- Migration: Add comments to time fields for clarity
-- Date: 2026-01-26
-- Purpose: เพิ่ม comments ให้ time fields เพื่อความชัดเจน
-- ============================================================================

-- Update patients table time field comments
ALTER TABLE `patients`
  MODIFY `arrival_time` TIME DEFAULT NULL
    COMMENT 'เวลาที่ผู้ป่วยมาถึง (check-in) - ใช้คำนวณเวลารอ',
  MODIFY `time_start` TIME DEFAULT NULL
    COMMENT 'เวลาที่เริ่มทำหัตถการจริง',
  MODIFY `time_target` TIME DEFAULT NULL
    COMMENT 'เวลาที่คาดว่าจะเสร็จ (calculated: time_start + procedure_time)',
  MODIFY `expected_wait_time` INT(11) DEFAULT NULL
    COMMENT 'เวลารอโดยประมาณ (นาที)',
  MODIFY `Actual_Time` TIME DEFAULT NULL
    COMMENT 'เวลาที่เสร็จจริง',
  MODIFY `Actual_wait` TIME DEFAULT NULL
    COMMENT 'เวลารอจริง (calculated: time_start - arrival_time)';

-- Update station_patients table time field comments
ALTER TABLE `station_patients`
  MODIFY `arrival_time` TIME DEFAULT NULL
    COMMENT 'เวลาที่ผู้ป่วยมาถึง (check-in) - ใช้คำนวณเวลารอ',
  MODIFY `time_start` TIME DEFAULT NULL
    COMMENT 'เวลาที่เริ่มทำหัตถการจริง',
  MODIFY `time_target` TIME DEFAULT NULL
    COMMENT 'เวลาที่คาดว่าจะเสร็จ (calculated: time_start + procedure_time)',
  MODIFY `expected_wait_time` INT(11) DEFAULT NULL
    COMMENT 'เวลารอโดยประมาณ (นาที)',
  MODIFY `Actual_Time` TIME DEFAULT NULL
    COMMENT 'เวลาที่เสร็จจริง',
  MODIFY `Actual_wait` TIME DEFAULT NULL
    COMMENT 'เวลารอจริง (calculated: time_start - arrival_time)';

-- ============================================================================
-- Migration complete
-- ============================================================================
SELECT 'Migration 002: Time field comments added successfully' AS status;
