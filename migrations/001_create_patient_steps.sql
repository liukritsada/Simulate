-- ============================================================================
-- Migration: Create patient_steps table
-- Date: 2026-01-26
-- Purpose: เก็บขั้นตอนการรักษาของผู้ป่วย (treatment workflow)
-- ============================================================================

-- Drop table if exists (for clean migration)
DROP TABLE IF EXISTS `patient_steps`;

-- Create patient_steps table
CREATE TABLE `patient_steps` (
  `step_id` INT(11) NOT NULL AUTO_INCREMENT,
  `patient_id` INT(11) NOT NULL COMMENT 'FK to patients.patient_id',
  `step_order` INT(11) NOT NULL COMMENT 'ลำดับขั้นตอน (1, 2, 3, ...)',
  `step_type` VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ประเภท: registration/procedure/payment/pharmacy/discharge',
  `step_name` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อขั้นตอน',
  `station_id` INT(11) DEFAULT NULL COMMENT 'FK to stations.station_id',
  `room_id` INT(11) DEFAULT NULL COMMENT 'FK to station_rooms.room_id',
  `procedure_id` INT(11) DEFAULT NULL COMMENT 'FK to station_procedures.procedure_id',
  `doctor_name` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ชื่อแพทย์ผู้รักษา',
  `estimated_duration` INT(11) DEFAULT 15 COMMENT 'เวลาโดยประมาณ (นาที)',
  `actual_start_time` DATETIME DEFAULT NULL COMMENT 'เวลาเริ่มต้นจริง',
  `actual_end_time` DATETIME DEFAULT NULL COMMENT 'เวลาสิ้นสุดจริง',
  `status` VARCHAR(20) COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT 'สถานะ: pending/in_progress/completed/skipped',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาสร้าง record',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'เวลาอัปเดตล่าสุด',

  PRIMARY KEY (`step_id`),

  -- Indexes for performance
  KEY `idx_patient_id` (`patient_id`),
  KEY `idx_step_order` (`step_order`),
  KEY `idx_status` (`status`),
  KEY `idx_patient_order` (`patient_id`, `step_order`),
  KEY `idx_station_id` (`station_id`),
  KEY `idx_room_id` (`room_id`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ขั้นตอนการรักษาของผู้ป่วย - Patient treatment workflow steps';

-- ============================================================================
-- Example data (optional - for testing)
-- ============================================================================
-- INSERT INTO patient_steps (patient_id, step_order, step_type, step_name, station_id, estimated_duration, status)
-- VALUES
--   (1, 1, 'registration', 'ลงทะเบียน', 1, 5, 'completed'),
--   (1, 2, 'procedure', 'ตรวจเลือด', 5, 15, 'in_progress'),
--   (1, 3, 'pharmacy', 'รับยา', 10, 10, 'pending');

-- ============================================================================
-- Migration complete
-- ============================================================================
SELECT 'Migration 001: patient_steps table created successfully' AS status;
