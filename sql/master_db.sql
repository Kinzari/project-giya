-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 26, 2025 at 06:16 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `master_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `tblcourses`
--

CREATE TABLE `tblcourses` (
  `course_id` int(11) NOT NULL,
  `course_name` varchar(255) NOT NULL,
  `course_departmentId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tblcourses`
--

INSERT INTO `tblcourses` (`course_id`, `course_name`, `course_departmentId`) VALUES
(1, 'Bachelor of Science in Accountancy', 1),
(2, 'Bachelor of Science in Hospitality Management', 1),
(3, 'Bachelor of Science in Tourism Management', 1),
(4, 'Bachelor of Science in Business Administration', 1),
(5, 'Bachelor of Science in Management Accounting', 1),
(6, 'Bachelor of Elementary Education', 2),
(7, 'Bachelor of Secondary Education', 2),
(8, 'Bachelor of Science in Early Childhood Education', 2),
(9, 'Bachelor of Science in Criminology', 3),
(10, 'Bachelor of Science in Architecture', 4),
(11, 'Bachelor of Science in Computer Engineering', 4),
(12, 'Bachelor of Science in Civil Engineering', 4),
(13, 'Bachelor of Science in Electrical Engineering', 4),
(14, 'Bachelor of Science in Mechanical Engineering', 4),
(15, 'Bachelor of Science in Nursing', 5),
(16, 'Bachelor of Science in Pharmacy', 5),
(17, 'Bachelor of Science in Medical Technology', 5),
(18, 'Bachelor of Science in Psychology', 5),
(19, 'Bachelor of Science in Information Technology in Business Informatics, Computer Security, Digital Arts and Systems Development', 6);

-- --------------------------------------------------------

--
-- Table structure for table `tbldepartments`
--

CREATE TABLE `tbldepartments` (
  `department_id` int(11) NOT NULL,
  `department_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbldepartments`
--

INSERT INTO `tbldepartments` (`department_id`, `department_name`) VALUES
(1, 'CAHS'),
(2, 'CAS'),
(3, 'CEA'),
(4, 'CITE'),
(5, 'CMA'),
(6, 'COE'),
(7, 'SCCJ'),
(8, 'SHS'),
(9, 'BASIC ED'),
(10, 'GRADUATE SCHOOL'),
(12, 'Registrar'),
(13, 'Marketing'),
(14, 'CSDL'),
(15, 'Finance'),
(16, 'Business Center'),
(17, 'Library'),
(18, 'ITS'),
(19, 'GSD'),
(20, 'Clinic (College)'),
(21, 'Clinic (Basic Ed & SHS)'),
(22, 'Flex Remote & RAD 2.0'),
(23, 'VocTech'),
(24, 'SIS'),
(25, 'SSG');

-- --------------------------------------------------------

--
-- Table structure for table `tblschoolyear`
--

CREATE TABLE `tblschoolyear` (
  `schoolyear_id` int(11) NOT NULL,
  `schoolyear` varchar(20) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tblschoolyear`
--

INSERT INTO `tblschoolyear` (`schoolyear_id`, `schoolyear`, `is_active`) VALUES
(1, '1st Year', 1),
(2, '2nd Year', 1),
(3, '3rd Year', 1),
(4, '4th Year', 1),
(5, '5th Year', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tblusers`
--

CREATE TABLE `tblusers` (
  `user_id` int(11) NOT NULL,
  `user_schoolId` varchar(50) NOT NULL,
  `user_lastname` varchar(255) NOT NULL,
  `user_firstname` varchar(255) NOT NULL,
  `user_middlename` varchar(255) DEFAULT NULL,
  `user_suffix` varchar(50) DEFAULT NULL,
  `phinmaed_email` varchar(255) NOT NULL,
  `user_email` varchar(255) NOT NULL,
  `user_contact` varchar(20) NOT NULL,
  `user_password` varchar(255) NOT NULL DEFAULT 'phinma-coc',
  `user_courseId` int(11) DEFAULT NULL,
  `user_departmentId` int(11) DEFAULT NULL,
  `user_schoolyearId` int(11) DEFAULT NULL,
  `user_typeId` int(11) NOT NULL,
  `user_status` tinyint(1) NOT NULL DEFAULT 1,
  `user_level` int(11) NOT NULL,
  `privacy_policy_check` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tblusers`
--

INSERT INTO `tblusers` (`user_id`, `user_schoolId`, `user_lastname`, `user_firstname`, `user_middlename`, `user_suffix`, `phinmaed_email`, `user_email`, `user_contact`, `user_password`, `user_courseId`, `user_departmentId`, `user_schoolyearId`, `user_typeId`, `user_status`, `user_level`, `privacy_policy_check`) VALUES
(1, '02-2526-00001', 'Dela Cruz', 'John', 'Michael', '', 'jomi.delacruz@phinmaed.com', '', '', 'Lowkeywastaken7', 1, 1, 1, 2, 1, 10, 0),
(2, '02-2526-00002', 'Reyes', 'Anna', '', '', '', '', '', '21Kinzari', 2, 1, 2, 2, 1, 10, 0),
(3, '02-2526-00003', 'Santos', 'Jake', 'Matthew', 'Jr.', '', '', '', 'Matthew7', 6, 2, 3, 2, 1, 10, 0),
(4, '02-2526-00004', 'Garcia', 'Emily', 'Rose', '', '', '', '', 'PitokKulas7', 7, 2, 4, 2, 1, 10, 0),
(5, '02-2526-00005', 'Tan', 'Chris', '', '', '', '', '', 'phinma-coc', 3, 3, 5, 2, 1, 10, 0),
(6, '02-2526-00006', 'Mendoza', 'Sophia', 'Marie', '', '', '', '', 'phinma-coc', 2, 3, 1, 2, 1, 10, 0),
(7, '02-2526-00007', 'Castro', 'Michael', '', '', '', '', '', 'phinma-coc', 7, 4, 1, 2, 1, 10, 0),
(8, '02-2526-00008', 'Flores', 'Chloe', 'Ann', '', '', '', '', 'phinma-coc', 8, 4, 2, 2, 1, 10, 0),
(9, '02-2526-00009', 'De Leon', 'Ethan', '', '', '', '', '', 'phinma-coc', 10, 5, 2, 2, 1, 10, 0),
(10, '02-2526-00010', 'Villanueva', 'Ella', 'Grace', '', '', '', '', 'phinma-coc', 9, 5, 3, 2, 1, 10, 0),
(11, '02-2526-00011', 'Bautista', 'Lucas', '', '', '', '', '', 'phinma-coc', 11, 6, 3, 2, 1, 10, 0),
(12, '02-2526-00012', 'Navarro', 'Mia', 'Claire', '', '', '', '', 'phinma-coc', 12, 6, 4, 2, 1, 10, 0),
(13, '01-2526-00001', 'Luna', 'James', '', '', '', '', '', 'phinma-coc', NULL, 1, NULL, 3, 1, 10, 0),
(14, '01-2526-00002', 'Fernandez', 'Laura', 'Marie', '', '', '', '', 'phinma-coc', NULL, 2, NULL, 3, 1, 10, 0),
(15, '01-2526-00003', 'Torres', 'Mark', '', '', '', '', '', 'phinma-coc', NULL, 3, NULL, 3, 1, 10, 0),
(16, '01-2526-00004', 'Ramos', 'Samantha', 'Jade', '', '', '', '', 'phinma-coc', NULL, 4, NULL, 3, 1, 10, 0),
(17, '01-2526-00005', 'Alvarez', 'Andrew', '', '', '', '', '', 'phinma-coc', NULL, 5, NULL, 3, 1, 10, 0),
(18, '01-2526-00006', 'Lim', 'Isabella', 'Grace', '', '', '', '', 'phinma-coc', NULL, 6, NULL, 3, 1, 10, 0),
(19, '00-2526-00001', 'Cruz', 'Jasmine', '', '', '', '', '', 'phinma-coc', NULL, 1, NULL, 5, 1, 50, 0),
(20, '00-2526-00002', 'Rivera', 'Nathan', 'Paul', '', '', '', '', 'phinma-coc', NULL, 2, NULL, 5, 1, 50, 0),
(21, '00-2526-00003', 'Perez', 'Liam', '', '', '', '', '', 'phinma-coc', NULL, 3, NULL, 5, 1, 50, 0),
(22, '00-2526-00004', 'Gonzales', 'Sophia', 'Elaine', '', '', '', '', 'phinma-coc', NULL, 4, NULL, 5, 1, 50, 0),
(23, '00-2526-00005', 'Morales', 'Jacob', '', '', '', '', '', 'phinma-coc', NULL, 5, NULL, 5, 1, 50, 0),
(24, '00-2526-00006', 'Diaz', 'Leah', '', '', '', '', '', 'phinma-coc', NULL, 6, NULL, 5, 1, 50, 0),
(25, '00-0000-00001', 'ADMIN', 'Kinzari', '', '', '', '', '', 'phinma-coc', NULL, NULL, NULL, 6, 1, 100, 0),
(26, '00-0000-00002', 'ADMIN', 'Lowkey', '', '', '', '', '', 'phinma-coc', NULL, NULL, NULL, 6, 1, 100, 0),
(27, '02-2223-05976', 'Espartero', 'Jerimiah Exequiel', '', '', 'jeex.espartero.coc@phinmaed.com', '', '09157079861', 'Kinzari7', 19, 6, 3, 2, 1, 10, 1),
(28, '03-2526-00001', 'Aclan', 'Jacqueline', 'Espartero', '', '', 'jacknjer08@gmail.com', '09532609342', 'phinma-coc', NULL, NULL, NULL, 1, 1, 10, 0),
(29, '03-2526-00002', 'Honrado', 'Josephos Rey', 'Bahala', '', '', 'josephosrey@gmail.com', '09094249501', 'josephosrey', NULL, NULL, NULL, 1, 1, 10, 0),
(30, '03-2526-00003', 'Opura', 'Michaela Jane', '', '', '', 'mikay@gmail.com', '09535394143', 'mikay123', NULL, NULL, NULL, 1, 1, 10, 1),
(31, '03-2526-00004', 'Cailing', 'Camille', 'Ontejo', '', '', 'camcamz@gmail.com', '09175849022', 'Camcamz7', NULL, NULL, NULL, 1, 1, 10, 0),
(34, '03-2526-00005', 'Paye', 'Jescel May', '', '', '', 'jescelmay@gmail.com', '09567778921', 'Jescelmay1999', NULL, NULL, NULL, 1, 1, 10, 0),
(35, '03-2526-00006', 'Aclan', 'Jeriah Grace', 'Espartero', '', '', 'jeraii@gmail.com', '09537788991', 'Kurapika08', NULL, NULL, NULL, 1, 1, 10, 0),
(36, 'vs-2526-00007', 'Espartero', 'Xena', '', '', '', 'xena.victoria@gmail.com', '09759983211', 'Jenna2013', NULL, NULL, NULL, 1, 1, 10, 0),
(38, 'vs-2526-00008', 'Aclan', 'Jewel Faith', 'Espartero', '', '', 'jewelfaith@gmail.com', '09752581073', 'Jewelfaith7', NULL, NULL, NULL, 1, 1, 10, 0),
(40, 'vs-2526-00009', 'Belono-ac', 'Shaun', 'Terceno', '', '', 'belonoacshaun1@gmail.com', '09361470082', '#Shaunu45888', NULL, NULL, NULL, 1, 1, 10, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tblusertype`
--

CREATE TABLE `tblusertype` (
  `user_typeId` int(11) NOT NULL,
  `user_type` varchar(255) NOT NULL,
  `user_defaultLevel` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tblusertype`
--

INSERT INTO `tblusertype` (`user_typeId`, `user_type`, `user_defaultLevel`) VALUES
(1, 'Visitor', 10),
(2, 'Student', 10),
(3, 'Faculty', 10),
(4, 'Employee', 10),
(5, 'POC', 50),
(6, 'Administrator / SSG', 100);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_giya_inquiry_types`
--

CREATE TABLE `tbl_giya_inquiry_types` (
  `inquiry_id` int(11) NOT NULL,
  `inquiry_type` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  `department_id` int(11) NOT NULL DEFAULT 1,
  `postType_id` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_giya_inquiry_types`
--

INSERT INTO `tbl_giya_inquiry_types` (`inquiry_id`, `inquiry_type`, `description`, `created_at`, `is_active`, `department_id`, `postType_id`) VALUES
(1, 'ENROLLMENT', 'Enrollment Process, ORF, SIS, ID, Email, Down Payment, Module', '2025-02-20 06:14:11', 1, 1, 1),
(2, 'ACADEMICS', 'Grades, Teachers, Dean', '2025-02-20 06:14:11', 1, 1, 1),
(3, 'REGISTRAR', 'TOR, Diploma, Credentials, School Related Documents', '2025-02-20 06:14:11', 1, 1, 1),
(4, 'FINANCE', 'Balance, Assessment, Scholarships', '2025-02-20 06:14:11', 1, 1, 1),
(5, 'BUSINESS_CENTER', 'Books, Uniforms', '2025-02-20 06:14:11', 1, 1, 1),
(6, 'CSDL', 'Guidance Counseling, Student Loan, Financial Aid, Scholarship Renewal', '2025-02-20 06:14:11', 1, 1, 1),
(7, 'MARKETING', 'New Students, Promotion', '2025-02-20 06:14:11', 1, 1, 1),
(8, 'IT_SERVICES', 'SIS Account, Gmail Account, GCR', '2025-02-20 06:14:11', 1, 1, 1),
(9, 'LIBRARY', 'Books, E-Library', '2025-02-20 06:14:11', 1, 1, 1),
(10, 'CLINIC', 'School Physician, School Nurse', '2025-02-20 06:14:11', 1, 1, 1),
(11, 'GSD', 'Facilities, Classrooms, Laboratories, Canteen, Comfort Rooms', '2025-02-20 06:14:11', 1, 1, 1),
(12, 'GRADUATE_SCHOOL', 'Courses available, Virtual Classroom', '2025-02-20 06:14:11', 1, 1, 1),
(13, 'SSG', 'Modules', '2025-02-20 06:14:11', 1, 1, 1),
(14, 'HR', 'Hiring, Contract', '2025-02-20 06:14:11', 1, 1, 1),
(15, 'ACE', 'Alumni, Job Placement, Career Talks, Graduation Pictures', '2025-02-20 06:14:11', 1, 1, 1),
(16, 'OTHERS', 'Other inquiries', '2025-02-20 06:14:11', 1, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_giya_posts`
--

CREATE TABLE `tbl_giya_posts` (
  `post_id` int(11) NOT NULL,
  `post_userId` int(11) NOT NULL,
  `post_departmentId` int(11) NOT NULL,
  `postType_id` int(11) NOT NULL,
  `post_date` date DEFAULT NULL,
  `post_time` time DEFAULT NULL,
  `post_title` varchar(255) NOT NULL,
  `post_message` text NOT NULL,
  `post_stars` int(11) DEFAULT 0,
  `post_status` int(11) NOT NULL DEFAULT 0,
  `inquiry_typeId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_giya_posts`
--

INSERT INTO `tbl_giya_posts` (`post_id`, `post_userId`, `post_departmentId`, `postType_id`, `post_date`, `post_time`, `post_title`, `post_message`, `post_stars`, `post_status`, `inquiry_typeId`) VALUES
(1, 27, 1, 1, '2025-02-25', '20:02:16', 'ENROLMENT PROCESS', 'How to Enroll?', 0, 3, 1),
(2, 27, 1, 1, '2025-02-25', '20:07:01', 'dsa', '321', 0, 1, 15),
(3, 40, 1, 1, '2025-02-26', '11:14:14', 'hk', 'Hk details', 0, 2, 6),
(4, 40, 1, 1, '2025-02-26', '11:15:37', 'hk', 'Hk details', 0, 2, 6),
(5, 27, 1, 1, '2025-02-26', '14:55:49', 'FORM 137 CREDENTIALS', 'Can i have an info about th requirements for graduating student?', 0, 3, 3);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_giya_posttype`
--

CREATE TABLE `tbl_giya_posttype` (
  `postType_id` int(11) NOT NULL,
  `postType_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_giya_posttype`
--

INSERT INTO `tbl_giya_posttype` (`postType_id`, `postType_name`) VALUES
(1, 'Inquiry'),
(2, 'Feedback'),
(3, 'Suggestion');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_giya_reply`
--

CREATE TABLE `tbl_giya_reply` (
  `reply_id` int(11) NOT NULL,
  `reply_userId` int(11) NOT NULL,
  `reply_postId` int(11) NOT NULL,
  `reply_date` date NOT NULL,
  `reply_time` time NOT NULL,
  `reply_title` varchar(255) DEFAULT NULL,
  `reply_message` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_giya_reply`
--

INSERT INTO `tbl_giya_reply` (`reply_id`, `reply_userId`, `reply_postId`, `reply_date`, `reply_time`, `reply_title`, `reply_message`) VALUES
(9, 25, 3, '2025-02-26', '20:10:29', NULL, 'asd'),
(10, 25, 5, '2025-02-26', '23:40:36', NULL, 'yes'),
(11, 27, 5, '2025-02-26', '23:40:47', NULL, 'thanks'),
(12, 25, 5, '2025-02-26', '23:58:06', NULL, 'asd'),
(13, 25, 4, '2025-02-27', '00:09:41', NULL, 'test'),
(14, 25, 3, '2025-02-27', '00:13:44', NULL, 'test'),
(15, 25, 1, '2025-02-27', '00:14:21', NULL, 'idk');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tblcourses`
--
ALTER TABLE `tblcourses`
  ADD PRIMARY KEY (`course_id`),
  ADD KEY `idx_course_departmentId` (`course_departmentId`);

--
-- Indexes for table `tbldepartments`
--
ALTER TABLE `tbldepartments`
  ADD PRIMARY KEY (`department_id`);

--
-- Indexes for table `tblschoolyear`
--
ALTER TABLE `tblschoolyear`
  ADD PRIMARY KEY (`schoolyear_id`);

--
-- Indexes for table `tblusers`
--
ALTER TABLE `tblusers`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `idx_user_courseId` (`user_courseId`),
  ADD KEY `idx_user_departmentId` (`user_departmentId`),
  ADD KEY `idx_user_typeId` (`user_typeId`),
  ADD KEY `fk_user_schoolyear` (`user_schoolyearId`);

--
-- Indexes for table `tblusertype`
--
ALTER TABLE `tblusertype`
  ADD PRIMARY KEY (`user_typeId`);

--
-- Indexes for table `tbl_giya_inquiry_types`
--
ALTER TABLE `tbl_giya_inquiry_types`
  ADD PRIMARY KEY (`inquiry_id`);

--
-- Indexes for table `tbl_giya_posts`
--
ALTER TABLE `tbl_giya_posts`
  ADD PRIMARY KEY (`post_id`),
  ADD KEY `post_userId` (`post_userId`),
  ADD KEY `post_departmentId` (`post_departmentId`),
  ADD KEY `postType_id` (`postType_id`),
  ADD KEY `inquiry_type_id` (`inquiry_typeId`);

--
-- Indexes for table `tbl_giya_posttype`
--
ALTER TABLE `tbl_giya_posttype`
  ADD PRIMARY KEY (`postType_id`);

--
-- Indexes for table `tbl_giya_reply`
--
ALTER TABLE `tbl_giya_reply`
  ADD PRIMARY KEY (`reply_id`),
  ADD KEY `reply_userId` (`reply_userId`),
  ADD KEY `reply_postId` (`reply_postId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tblcourses`
--
ALTER TABLE `tblcourses`
  MODIFY `course_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `tblschoolyear`
--
ALTER TABLE `tblschoolyear`
  MODIFY `schoolyear_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tblusers`
--
ALTER TABLE `tblusers`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `tbl_giya_inquiry_types`
--
ALTER TABLE `tbl_giya_inquiry_types`
  MODIFY `inquiry_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `tbl_giya_posts`
--
ALTER TABLE `tbl_giya_posts`
  MODIFY `post_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tbl_giya_posttype`
--
ALTER TABLE `tbl_giya_posttype`
  MODIFY `postType_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_giya_reply`
--
ALTER TABLE `tbl_giya_reply`
  MODIFY `reply_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tblcourses`
--
ALTER TABLE `tblcourses`
  ADD CONSTRAINT `fk_course_department` FOREIGN KEY (`course_departmentId`) REFERENCES `tbldepartments` (`department_id`),
  ADD CONSTRAINT `tblcourses_ibfk_1` FOREIGN KEY (`course_departmentId`) REFERENCES `tbldepartments` (`department_id`);

--
-- Constraints for table `tblusers`
--
ALTER TABLE `tblusers`
  ADD CONSTRAINT `fk_user_course` FOREIGN KEY (`user_courseId`) REFERENCES `tblcourses` (`course_id`),
  ADD CONSTRAINT `fk_user_department` FOREIGN KEY (`user_departmentId`) REFERENCES `tbldepartments` (`department_id`),
  ADD CONSTRAINT `fk_user_schoolyear` FOREIGN KEY (`user_schoolyearId`) REFERENCES `tblschoolyear` (`schoolyear_id`),
  ADD CONSTRAINT `fk_user_type` FOREIGN KEY (`user_typeId`) REFERENCES `tblusertype` (`user_typeId`),
  ADD CONSTRAINT `tblusers_ibfk_1` FOREIGN KEY (`user_courseId`) REFERENCES `tblcourses` (`course_id`),
  ADD CONSTRAINT `tblusers_ibfk_2` FOREIGN KEY (`user_departmentId`) REFERENCES `tbldepartments` (`department_id`),
  ADD CONSTRAINT `tblusers_ibfk_3` FOREIGN KEY (`user_typeId`) REFERENCES `tblusertype` (`user_typeId`);

--
-- Constraints for table `tbl_giya_posts`
--
ALTER TABLE `tbl_giya_posts`
  ADD CONSTRAINT `tbl_giya_posts_ibfk_1` FOREIGN KEY (`post_userId`) REFERENCES `tblusers` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_giya_posts_ibfk_2` FOREIGN KEY (`post_departmentId`) REFERENCES `tbldepartments` (`department_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_giya_posts_ibfk_3` FOREIGN KEY (`postType_id`) REFERENCES `tbl_giya_posttype` (`postType_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_giya_posts_ibfk_4` FOREIGN KEY (`inquiry_typeId`) REFERENCES `tbl_giya_inquiry_types` (`inquiry_id`);

--
-- Constraints for table `tbl_giya_reply`
--
ALTER TABLE `tbl_giya_reply`
  ADD CONSTRAINT `tbl_giya_reply_ibfk_1` FOREIGN KEY (`reply_userId`) REFERENCES `tblusers` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_giya_reply_ibfk_2` FOREIGN KEY (`reply_postId`) REFERENCES `tbl_giya_posts` (`post_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
