-- phpMyAdmin SQL Dump
-- version 5.1.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jan 23, 2026 at 08:45 AM
-- Server version: 10.4.19-MariaDB
-- PHP Version: 7.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hospitalstation`
--

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `patient_id` int(11) NOT NULL,
  `id` int(11) NOT NULL,
  `station_id` int(11) NOT NULL,
  `hn` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `patient_name` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sex` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nationality` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `appointmentno` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `doctor_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialty` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `room_id` int(11) DEFAULT NULL,
  `running_number` int(11) DEFAULT NULL,
  `procedure_id` int(11) DEFAULT NULL,
  `procedure_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `procedures` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `arrival_time` time DEFAULT NULL,
  `time_start` time DEFAULT NULL,
  `time_target` time DEFAULT NULL,
  `time_target_wait` time DEFAULT NULL,
  `expected_wait_time` int(11) DEFAULT NULL,
  `Actual_Time` time DEFAULT NULL,
  `Actual_wait` time DEFAULT NULL,
  `in_process` tinyint(1) DEFAULT 0,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'waiting',
  `flag` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'W',
  `create_date` datetime DEFAULT current_timestamp(),
  `update_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ข้อมูลคนไข้รายวัน - ลบ/รีเซ็ตทุกวัน';



-- --------------------------------------------------------

--
-- Table structure for table `room_equipment`
--

CREATE TABLE `room_equipment` (
  `equipment_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `equipment_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `equipment_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `require_staff` tinyint(1) DEFAULT 0 COMMENT 'ต้องมีพนักงานถึงจะเปิดได้',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'สถานะเปิด/ปิด',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `room_procedures`
--

CREATE TABLE `room_procedures` (
  `room_procedure_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `procedure_id` int(11) NOT NULL,
  `procedure_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'specific',
  `procedure_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `wait_time` int(11) DEFAULT 15 COMMENT 'เวลารอ (นาที)',
  `procedure_time` int(11) DEFAULT 30 COMMENT 'เวลาทำหัตถการ (นาที)',
  `Time_target` int(11) NOT NULL,
  `staff_required` int(11) DEFAULT 0 COMMENT 'จำนวนพนักงานที่ต้องการ (0 = ไม่ใช้)',
  `equipment_required` tinyint(1) DEFAULT 0 COMMENT 'ต้องใช้เครื่องมือหรือไม่',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stations`
--

CREATE TABLE `stations` (
  `station_id` int(11) NOT NULL,
  `station_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `station_type` enum('with_rooms','simple') COLLATE utf8mb4_unicode_ci DEFAULT 'with_rooms' COMMENT 'ประเภทสเตชั่น: with_rooms = มีห้อง, simple = ไม่มีห้อง',
  `station_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL COMMENT 'แผนก (NULL สำหรับ simple station)',
  `floor` int(11) NOT NULL,
  `room_count` int(11) NOT NULL DEFAULT 1,
  `require_doctor` tinyint(1) DEFAULT 0,
  `default_wait_time` int(11) DEFAULT NULL COMMENT 'เวลารอเริ่มต้น (นาที) - สำหรับ simple type',
  `default_service_time` int(11) DEFAULT NULL COMMENT 'เวลาทำงาน (นาที) - สำหรับ simple type',
  `staff_count` int(11) DEFAULT 0 COMMENT 'จำนวนพนักงาน - สำหรับ simple type',
  `staff_schedules_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'ตารางเวลาทำงานพนักงานรายคน (JSON Array) - สำหรับ simple type',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stations`
--


-- --------------------------------------------------------

--
-- Table structure for table `station_doctors`
--

CREATE TABLE `station_doctors` (
  `station_doctor_id` int(11) NOT NULL,
  `station_id` int(11) NOT NULL,
  `doctor_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `doctor_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `doctor_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Monthly',
  `specialization` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `work_start_time` time DEFAULT '08:00:00',
  `work_end_time` time DEFAULT '16:00:00',
  `break_start_time` time DEFAULT '12:00:00',
  `break_end_time` time DEFAULT '13:00:00',
  `room_id` int(11) DEFAULT NULL,
  `assigned_room_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'available',
  `work_date` date DEFAULT curdate(),
  `create_date` datetime DEFAULT current_timestamp(),
  `update_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `station_patients`
--

CREATE TABLE `station_patients` (
  `patient_id` int(11) NOT NULL,
  `id` int(11) NOT NULL,
  `station_id` int(11) NOT NULL,
  `hn` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `patient_name` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sex` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nationality` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `appointmentno` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `doctor_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialty` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `room_id` int(11) DEFAULT NULL,
  `running_number` int(11) DEFAULT NULL,
  `procedure_id` int(11) DEFAULT NULL,
  `procedure_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `procedures` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `arrival_time` time DEFAULT NULL,
  `time_start` time DEFAULT NULL,
  `time_target` time DEFAULT NULL,
  `time_target_wait` time DEFAULT NULL,
  `expected_wait_time` int(11) DEFAULT NULL,
  `Actual_Time` time DEFAULT NULL,
  `Actual_wait` time DEFAULT NULL,
  `in_process` tinyint(1) DEFAULT 0,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'waiting',
  `flag` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'W',
  `completed_date` datetime DEFAULT NULL,
  `create_date` datetime DEFAULT current_timestamp(),
  `update_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ข้อมูลคนไข้ถาวร - เก็บประวัติทุกวันไม่ลบ';

--
-- Dumping data for table `station_patients`

-- --------------------------------------------------------

--
-- Table structure for table `station_staff`
--

CREATE TABLE `station_staff` (
  `station_staff_id` int(11) NOT NULL,
  `station_id` int(11) NOT NULL,
  `staff_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `staff_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nurse, Technician, etc.',
  `work_start_time` time DEFAULT '08:00:00',
  `work_end_time` time DEFAULT '17:00:00',
  `ot_start_time` time DEFAULT NULL,
  `ot_end_time` time DEFAULT NULL,
  `ot_date` date DEFAULT NULL,
  `break_start_time` time DEFAULT '12:00:00',
  `break_end_time` time DEFAULT '13:00:00',
  `is_active` tinyint(4) DEFAULT 1,
  `status` enum('waiting_to_start','available','working','on_break','overtime','offline') COLLATE utf8mb4_unicode_ci DEFAULT 'waiting_to_start',
  `assigned_room_id` int(11) DEFAULT NULL COMMENT 'ห้องที่พนักงานประจำ (nullable)',
  `is_replacement` tinyint(1) DEFAULT 0 COMMENT '0=ปกติ, 1=แทนพักเบรค',
  `assigned_at` datetime DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `work_date` date NOT NULL DEFAULT curdate()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='พนักงานประจำสเตชั่น - สามารถไม่ประจำห้องหรือประจำห้องได้';

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_staff_auto_assign_stats`
-- (See below for the actual view)
--
CREATE TABLE `v_staff_auto_assign_stats` (
);

-- --------------------------------------------------------

--
-- Structure for view `v_staff_auto_assign_stats`
--
DROP TABLE IF EXISTS `v_staff_auto_assign_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_staff_auto_assign_stats`  AS SELECT cast(`staff_assignment_logs`.`created_at` as date) AS `date`, `staff_assignment_logs`.`action` AS `action`, count(0) AS `count`, count(distinct `staff_assignment_logs`.`station_id`) AS `stations_affected`, count(distinct `staff_assignment_logs`.`staff_id`) AS `staff_affected` FROM `staff_assignment_logs` GROUP BY cast(`staff_assignment_logs`.`created_at` as date), `staff_assignment_logs`.`action` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_station_id` (`station_id`),
  ADD KEY `idx_hn` (`hn`),
  ADD KEY `idx_appointment_date` (`appointment_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_in_process` (`in_process`);

--
-- Indexes for table `room_equipment`
--
ALTER TABLE `room_equipment`
  ADD PRIMARY KEY (`equipment_id`);

--
-- Indexes for table `room_procedures`
--
ALTER TABLE `room_procedures`
  ADD PRIMARY KEY (`room_procedure_id`),
  ADD KEY `fk_room_procedure` (`procedure_id`);

--
-- Indexes for table `stations`
--
ALTER TABLE `stations`
  ADD PRIMARY KEY (`station_id`),
  ADD UNIQUE KEY `unique_department` (`department_id`);

--
-- Indexes for table `station_doctors`
--
ALTER TABLE `station_doctors`
  ADD PRIMARY KEY (`station_doctor_id`),
  ADD KEY `idx_station_id` (`station_id`),
  ADD KEY `idx_doctor_code` (`doctor_code`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `station_patients`
--
ALTER TABLE `station_patients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_station_id` (`station_id`),
  ADD KEY `idx_hn` (`hn`),
  ADD KEY `idx_appointment_date` (`appointment_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_create_date` (`create_date`);

--
-- Indexes for table `station_procedures`
--
ALTER TABLE `station_procedures`
  ADD PRIMARY KEY (`procedure_id`);

--
-- Indexes for table `station_rooms`
--
ALTER TABLE `station_rooms`
  ADD PRIMARY KEY (`room_id`);

--
-- Indexes for table `station_staff`
--
ALTER TABLE `station_staff`
  ADD PRIMARY KEY (`station_staff_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1527;

--
-- AUTO_INCREMENT for table `room_equipment`
--
ALTER TABLE `room_equipment`
  MODIFY `equipment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `room_procedures`
--
ALTER TABLE `room_procedures`
  MODIFY `room_procedure_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=764;

--
-- AUTO_INCREMENT for table `stations`
--
ALTER TABLE `stations`
  MODIFY `station_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=92;

--
-- AUTO_INCREMENT for table `station_doctors`
--
ALTER TABLE `station_doctors`
  MODIFY `station_doctor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `station_patients`
--
ALTER TABLE `station_patients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1527;

--
-- AUTO_INCREMENT for table `station_procedures`
--
ALTER TABLE `station_procedures`
  MODIFY `procedure_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2960;

--
-- AUTO_INCREMENT for table `station_rooms`
--
ALTER TABLE `station_rooms`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT for table `station_staff`
--
ALTER TABLE `station_staff`
  MODIFY `station_staff_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `room_procedures`
--
ALTER TABLE `room_procedures`
  ADD CONSTRAINT `fk_room_procedure` FOREIGN KEY (`procedure_id`) REFERENCES `station_procedures` (`procedure_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
