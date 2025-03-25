-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 25, 2025 at 04:38 PM
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
-- Table structure for table `tblcampus`
--

CREATE TABLE `tblcampus` (
  `campus_id` int(11) NOT NULL,
  `campus_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tblcampus`
--

INSERT INTO `tblcampus` (`campus_id`, `campus_name`) VALUES
(1, 'Carmen'),
(2, 'Puerto'),
(3, 'Iligan');

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
(1, 'Bachelor of Science in Accountancy', 5),
(2, 'Bachelor of Science in Hospitality Management', 5),
(3, 'Bachelor of Science in Tourism Management', 5),
(4, 'Bachelor of Science in Business Administration', 5),
(5, 'Bachelor of Science in Management Accounting', 5),
(6, 'Bachelor of Elementary Education', 6),
(7, 'Bachelor of Secondary Education', 6),
(8, 'Bachelor of Science in Early Childhood Education', 6),
(9, 'Bachelor of Science in Criminology', 7),
(10, 'Bachelor of Science in Architecture', 3),
(11, 'Bachelor of Science in Computer Engineering', 3),
(12, 'Bachelor of Science in Civil Engineering', 3),
(13, 'Bachelor of Science in Electrical Engineering', 3),
(14, 'Bachelor of Science in Mechanical Engineering', 3),
(15, 'Bachelor of Science in Nursing', 1),
(16, 'Bachelor of Science in Pharmacy', 1),
(17, 'Bachelor of Science in Medical Technology', 1),
(18, 'Bachelor of Science in Psychology', 1),
(19, 'Bachelor of Science in Information Technology in Business Informatics, Computer Security, Digital Arts and Systems Development', 4);

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
  `user_campusId` int(11) DEFAULT 1,
  `user_typeId` int(11) NOT NULL,
  `user_status` tinyint(1) NOT NULL DEFAULT 1,
  `user_level` int(11) NOT NULL,
  `privacy_policy_check` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tblusers`
--

INSERT INTO `tblusers` (`user_id`, `user_schoolId`, `user_lastname`, `user_firstname`, `user_middlename`, `user_suffix`, `phinmaed_email`, `user_email`, `user_contact`, `user_password`, `user_courseId`, `user_departmentId`, `user_schoolyearId`, `user_campusId`, `user_typeId`, `user_status`, `user_level`, `privacy_policy_check`) VALUES
(1, '02-2526-00001', 'Dela Cruz', 'Johnny', 'Michael', '', 'jomi.delacruz@phinmaed.com', '', '', 'Lowkeywastaken7', 15, 1, 1, 1, 2, 1, 10, 0),
(2, '02-2526-00002', 'Reyes', 'Anna', '', '', '', '', '', '21Kinzari', 2, 1, 2, 1, 2, 1, 10, 0),
(3, '02-2526-00003', 'Santos', 'Jake', 'Matthew', 'Jr.', '', '', '', 'Matthew7', 6, 2, 3, 1, 2, 1, 10, 0),
(4, '02-2526-00004', 'Garcia', 'Emily', 'Rose', '', '', '', '', 'PitokKulas7', 7, 2, 4, 1, 2, 1, 10, 0),
(5, '02-2526-00005', 'Tan', 'Chris', '', '', '', '', '', 'phinma-coc', 3, 3, 5, 1, 2, 1, 10, 0),
(6, '02-2526-00006', 'Mendoza', 'Sophia', 'Marie', '', '', '', '', 'phinma-coc', 2, 3, 1, 1, 2, 1, 10, 0),
(7, '02-2526-00007', 'Castro', 'Michael', '', '', '', '', '', 'phinma-coc', 7, 4, 1, 1, 2, 1, 10, 0),
(8, '02-2526-00008', 'Flores', 'Chloe', 'Ann', '', '', '', '', 'phinma-coc', 8, 4, 2, 1, 2, 1, 10, 0),
(9, '02-2526-00009', 'De Leon', 'Ethan', '', '', '', '', '', 'phinma-coc', 10, 5, 2, 1, 2, 1, 10, 0),
(10, '02-2526-00010', 'Villanueva', 'Ella', 'Grace', '', '', '', '', 'phinma-coc', 9, 5, 3, 1, 2, 1, 10, 0),
(13, '01-2526-00001', 'Luna', 'James', '', '', '', '', '', 'phinma-coc', NULL, 1, NULL, 1, 3, 1, 10, 0),
(14, '01-2526-00002', 'Fernandez', 'Laura', 'Marie', '', '', '', '', 'phinma-coc', NULL, 2, NULL, 1, 3, 1, 10, 0),
(15, '01-2526-00003', 'Torres', 'Mark', '', '', '', '', '', 'phinma-coc', NULL, 3, NULL, 1, 3, 1, 10, 0),
(16, '01-2526-00004', 'Ramos', 'Samantha', 'Jade', '', '', '', '', 'phinma-coc', NULL, 4, NULL, 1, 3, 1, 10, 0),
(17, '01-2526-00005', 'Alvarez', 'Andrew', '', '', '', '', '', 'phinma-coc', NULL, 5, NULL, 1, 3, 1, 10, 0),
(18, '01-2526-00006', 'Lim', 'Isabella', 'Grace', '', '', '', '', 'phinma-coc', NULL, 6, NULL, 1, 3, 1, 10, 0),
(19, '25-002-A', 'Cruz', 'Jasmine', '', '', 'jas.coc@phinmaed.com', '', '', 'phinma-coc', NULL, 1, NULL, 1, 5, 1, 50, 0),
(20, '25-003-A', 'Rivera', 'Nathan', 'Paul', '', 'na.ri.coc@phinmaed.com', '', '', 'phinma-coc', NULL, 2, NULL, 1, 5, 1, 50, 0),
(21, '25-005-A', 'Perez', 'Liam', '', '', 'li.pe.coc@phinmaed.com', '', '', 'phinma-coc', NULL, 7, NULL, 1, 5, 1, 50, 0),
(22, '25-004-A', 'Gonzales', 'Sophia', 'Elaine', '', 'so.go.coc@phinmaed.com', '', '', 'phinma-coc', NULL, 3, NULL, 1, 5, 1, 50, 0),
(23, '25-007-A', 'Morales', 'Jacob', '', '', 'ja.mo.coc@phinmaed.com', '', '', 'phinma-coc', NULL, 5, NULL, 1, 5, 1, 50, 0),
(24, '25-006-A', 'Diaz', 'Leah', '', '', 'le.di.coc@phinmaed.com', '', '', 'phinma-coc', NULL, 6, NULL, 1, 5, 1, 50, 0),
(25, '17-037-F', 'Casiano', 'Sidney', '', '', '', '', '', 'phinma-coc', NULL, NULL, NULL, 1, 6, 1, 100, 0),
(26, '22-018-A', 'Nob', 'Airene', '', '', '', '', '', 'phinma-coc', NULL, NULL, NULL, 1, 6, 1, 100, 0),
(27, '02-2223-05976', 'Espartero', 'Jerimiah Exequiel', 'Kinzari', '', 'jeex.espartero.coc@phinmaed.com', '', '09157079861', 'Kinzari7', 19, 4, 3, 1, 2, 1, 10, 1),
(28, '03-2526-00001', 'Aclan', 'Jacqueline', 'Espartero', '', '', 'jacknjer08@gmail.com', '09532609342', 'phinma-coc', NULL, NULL, NULL, 1, 1, 1, 10, 0),
(29, '03-2526-00002', 'Honrado', 'Josephos Rey', 'Bahala', '', '', 'josephosrey@gmail.com', '09094249501', 'josephosrey', NULL, NULL, NULL, 1, 1, 1, 10, 0),
(30, '03-2526-00003', 'Opura', 'Michaela Jane', '', '', '', 'mikay@gmail.com', '09535394143', 'mikay123', NULL, NULL, NULL, 1, 1, 1, 10, 1),
(31, '03-2526-00004', 'Cailing', 'Camille', 'Ontejo', '', '', 'camcamz@gmail.com', '09175849022', 'Camcamz7', NULL, NULL, NULL, 1, 1, 1, 10, 0),
(34, '03-2526-00005', 'Paye', 'Jescel May', '', '', '', 'jescelmay@gmail.com', '09567778921', 'Jescelmay1999', NULL, NULL, NULL, 1, 1, 1, 10, 0),
(35, '03-2526-00006', 'Aclan', 'Jeriah Grace', 'Espartero', '', '', 'jeraii@gmail.com', '09537788991', 'Kurapika08', NULL, NULL, NULL, 1, 1, 1, 10, 0),
(36, 'vs-2526-00007', 'Espartero', 'Xena', '', '', '', 'xena.victoria@gmail.com', '09759983211', 'Jenna2013', NULL, NULL, NULL, 1, 1, 1, 10, 0),
(38, 'vs-2526-00008', 'Aclan', 'Jewel Faith', 'Espartero', '', '', 'jewelfaith@gmail.com', '09752581073', 'Jewelfaith7', NULL, NULL, NULL, 1, 1, 1, 10, 0),
(40, 'vs-2526-00009', 'Belono-ac', 'Shaun', 'Terceno', '', '', 'belonoacshaun1@gmail.com', '09361470082', '#Shaunu45888', NULL, NULL, NULL, 1, 1, 1, 10, 1),
(43, '25-001-A', 'Galudo ', 'Darwin ', NULL, NULL, 'dmgaludo.coc@phinmaed.com', '', '09177728346', 'phinma-coc', NULL, 4, NULL, 1, 5, 1, 50, 0),
(44, '02-1718-03273', 'Zata', 'Boss', 'Ascunsion', NULL, 'bovi.zata.coc@phinmaed.com', '', '', 'phinma-coc', 19, 4, 3, 1, 2, 1, 10, 0),
(45, 'vs-2526-00010', 'kinzari', 'kinzari', 'kinzari', '', '', 'kinzari@gmail.com', '09123456789', 'Kinzari7', NULL, NULL, NULL, 1, 1, 1, 10, 1);

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
  `department_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_giya_inquiry_types`
--

INSERT INTO `tbl_giya_inquiry_types` (`inquiry_id`, `inquiry_type`, `description`, `department_id`) VALUES
(1, 'ENROLLMENT', 'Enrollment Process, ORF, SIS, ID, Email, Down Payment, Module', 12),
(2, 'ACADEMICS', 'Grades, Teachers, Dean', 14),
(3, 'REGISTRAR', 'TOR, Diploma, Credentials, School Related Documents', 12),
(4, 'FINANCE', 'Balance, Assessment, Scholarships', 15),
(5, 'BUSINESS_CENTER', 'Books, Uniforms', 16),
(6, 'CSDL', 'Guidance Counseling, Student Loan, Financial Aid, Scholarship Renewal', 14),
(7, 'MARKETING', 'New Students, Promotion', 13),
(8, 'IT_SERVICES', 'SIS Account, Gmail Account, GCR', 18),
(9, 'LIBRARY', 'Books, E-Library', 17),
(10, 'CLINIC', 'School Physician, School Nurse', 20),
(11, 'GSD', 'Facilities, Classrooms, Laboratories, Canteen, Comfort Rooms', 19),
(12, 'GRADUATE_SCHOOL', 'Courses available, Virtual Classroom', 10),
(14, 'HR', 'Hiring, Contract', 23),
(15, 'ACE', 'Alumni, Job Placement, Career Talks, Graduation Pictures', 1),
(16, 'OTHERS', 'Other inquiries', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_giya_posts`
--

CREATE TABLE `tbl_giya_posts` (
  `post_id` int(11) NOT NULL,
  `post_userId` int(11) NOT NULL,
  `post_departmentId` int(11) NOT NULL,
  `post_campusId` int(11) DEFAULT 1,
  `postType_id` int(11) NOT NULL,
  `post_date` date DEFAULT NULL,
  `post_time` time DEFAULT NULL,
  `post_title` varchar(255) NOT NULL,
  `post_message` text NOT NULL,
  `post_stars` int(11) DEFAULT 0,
  `post_status` int(11) NOT NULL DEFAULT 0,
  `inquiry_typeId` int(11) DEFAULT NULL,
  `is_forwarded` tinyint(1) NOT NULL DEFAULT 0,
  `forwarded_by` int(11) DEFAULT NULL,
  `forwarded_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_giya_posts`
--

INSERT INTO `tbl_giya_posts` (`post_id`, `post_userId`, `post_departmentId`, `post_campusId`, `postType_id`, `post_date`, `post_time`, `post_title`, `post_message`, `post_stars`, `post_status`, `inquiry_typeId`, `is_forwarded`, `forwarded_by`, `forwarded_at`) VALUES
(1, 27, 1, 1, 2, '2025-02-25', '20:02:16', 'ENROLMENT PROCESS', 'How to Enroll?', 0, 2, 1, 0, NULL, NULL),
(2, 27, 1, 1, 1, '2025-02-25', '20:07:01', 'dsa', '321', 0, 2, 15, 0, NULL, NULL),
(4, 40, 1, 1, 1, '2025-02-26', '11:15:37', 'hk', 'Hk details', 0, 2, 6, 0, NULL, NULL),
(5, 27, 1, 1, 1, '2025-02-26', '14:55:49', 'FORM 137 CREDENTIALS', 'Can i have an info about th requirements for graduating student?', 0, 2, 3, 0, NULL, NULL),
(6, 30, 1, 1, 1, '2025-02-27', '12:57:49', 'asd', 'dsa', 0, 2, 2, 0, NULL, NULL),
(7, 27, 1, 1, 1, '2025-02-27', '14:55:20', 'aasd', 'asdasd', 0, 2, 6, 0, NULL, NULL),
(8, 27, 4, 1, 1, '2025-02-27', '15:11:40', 'THIS IS THE TITLE', 'THIS IS A MESSAGE', 0, 1, 1, 1, 26, '2025-03-25 18:25:27'),
(9, 27, 1, 1, 1, '2025-02-27', '16:45:48', 'test', 'test123123', 0, 1, 5, 0, NULL, NULL),
(10, 30, 4, 1, 1, '2025-02-28', '01:22:40', 'dsa', 'dsa', 0, 1, 15, 1, 26, '2025-03-25 18:14:53'),
(11, 27, 1, 1, 1, '2025-03-01', '16:22:25', 'test', 'test', 0, 2, 2, 0, NULL, NULL),
(12, 27, 1, 1, 1, '2025-03-01', '17:56:40', 'dsa', 'dsa', 0, 2, 2, 0, NULL, NULL),
(13, 30, 1, 1, 3, '2025-03-01', '19:46:58', 'suggest', 'suggest text', 0, 2, 2, 0, NULL, NULL),
(14, 30, 14, 1, 2, '2025-03-04', '20:39:32', 'feedback', 'feedback', 0, 2, 6, 0, NULL, NULL),
(15, 30, 4, 1, 1, '2025-03-04', '22:11:13', 'csdl', 'csdl', 0, 1, 6, 1, 26, '2025-03-25 18:21:59'),
(16, 45, 1, 1, 1, '2025-03-05', '00:40:36', 'academic', 'academic', 0, 2, 2, 0, NULL, NULL),
(17, 45, 14, 1, 1, '2025-03-05', '09:32:11', 'csdl', 'csdl', 0, 2, 6, 0, NULL, NULL),
(18, 27, 1, 1, 3, '2025-03-05', '14:22:38', 'suggest', 'suggest', 0, 1, 2, 0, NULL, NULL),
(19, 27, 9, 3, 1, '2025-03-17', '13:26:17', 'iligan', 'iligan', 0, 1, 5, 1, 26, '2025-03-19 00:49:49');

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
  `reply_message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `attachment_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_giya_reply`
--

INSERT INTO `tbl_giya_reply` (`reply_id`, `reply_userId`, `reply_postId`, `reply_date`, `reply_time`, `reply_title`, `reply_message`, `is_read`, `attachment_path`) VALUES
(10, 25, 5, '2025-02-26', '23:40:36', NULL, 'yes', 1, NULL),
(11, 27, 5, '2025-02-26', '23:40:47', NULL, 'thanks', 0, NULL),
(12, 25, 5, '2025-02-26', '23:58:06', NULL, 'asd', 1, NULL),
(13, 25, 4, '2025-02-27', '00:09:41', NULL, 'test', 0, NULL),
(15, 25, 1, '2025-02-27', '00:14:21', NULL, 'idk', 1, NULL),
(16, 25, 4, '2025-02-27', '11:44:46', NULL, 'HK', 0, NULL),
(17, 25, 7, '2025-02-27', '14:55:55', NULL, 'test', 1, NULL),
(18, 27, 7, '2025-02-27', '14:56:09', NULL, 'ok', 0, NULL),
(19, 25, 8, '2025-02-27', '15:12:54', NULL, 'REPLY ', 1, NULL),
(20, 27, 8, '2025-02-27', '15:14:40', NULL, 'HRY', 0, NULL),
(21, 25, 6, '2025-02-28', '00:35:58', NULL, 'asd', 1, NULL),
(22, 30, 6, '2025-02-28', '00:36:53', NULL, 'dsa', 0, NULL),
(31, 25, 4, '2025-02-28', '01:21:56', NULL, 'dsa', 0, NULL),
(56, 25, 10, '2025-02-28', '03:45:22', NULL, 'test?', 1, NULL),
(57, 30, 10, '2025-02-28', '03:47:17', NULL, 'hello', 0, NULL),
(58, 27, 9, '2025-02-28', '18:01:31', NULL, 'dsa', 0, NULL),
(59, 27, 9, '2025-02-28', '20:21:34', NULL, 'asd', 0, NULL),
(60, 27, 9, '2025-02-28', '20:22:51', NULL, '3', 0, NULL),
(61, 27, 2, '2025-02-28', '20:27:15', NULL, 'asd', 0, NULL),
(62, 27, 9, '2025-02-28', '20:27:27', NULL, 'dsa', 0, NULL),
(63, 27, 2, '2025-02-28', '20:28:39', NULL, 'asd', 0, NULL),
(64, 25, 11, '2025-03-01', '16:23:46', NULL, '3-1-2025', 1, NULL),
(65, 25, 11, '2025-03-01', '16:34:17', NULL, 'test', 1, NULL),
(66, 25, 11, '2025-03-01', '16:41:32', NULL, 'notif test', 1, NULL),
(67, 25, 9, '2025-03-01', '16:56:11', NULL, 'yes', 1, NULL),
(68, 25, 9, '2025-03-01', '16:56:15', NULL, 'yes', 1, NULL),
(69, 27, 9, '2025-03-01', '17:10:32', NULL, 'dsa', 1, NULL),
(70, 27, 9, '2025-03-01', '17:21:12', NULL, 'test message', 1, NULL),
(71, 25, 12, '2025-03-01', '18:24:14', NULL, '123', 1, NULL),
(72, 25, 12, '2025-03-01', '18:45:14', NULL, 'asd', 1, NULL),
(73, 25, 13, '2025-03-01', '22:49:52', NULL, 'hi', 1, NULL),
(74, 30, 13, '2025-03-01', '22:57:46', NULL, 'hi', 1, NULL),
(75, 25, 13, '2025-03-04', '02:03:55', NULL, 'dsa', 1, NULL),
(76, 25, 12, '2025-03-04', '03:13:39', NULL, 'test', 1, NULL),
(77, 25, 13, '2025-03-04', '11:20:30', NULL, 'dsa', 1, NULL),
(78, 30, 13, '2025-03-04', '11:44:26', NULL, 'dsa', 1, NULL),
(79, 25, 13, '2025-03-04', '11:44:40', NULL, 'test', 1, NULL),
(80, 25, 13, '2025-03-04', '11:55:31', NULL, 'test', 1, NULL),
(81, 25, 13, '2025-03-04', '11:55:37', NULL, '14', 1, NULL),
(82, 25, 13, '2025-03-04', '11:55:51', NULL, 't', 1, NULL),
(83, 25, 13, '2025-03-04', '11:55:56', NULL, '1', 1, NULL),
(84, 25, 13, '2025-03-04', '12:42:40', NULL, 'test', 1, NULL),
(85, 25, 13, '2025-03-04', '13:04:56', NULL, 'test', 1, NULL),
(86, 25, 12, '2025-03-04', '15:00:06', NULL, '3pm test', 1, NULL),
(87, 25, 13, '2025-03-04', '19:44:11', NULL, 'test', 1, NULL),
(88, 25, 14, '2025-03-04', '20:39:43', NULL, 'feedback test', 1, NULL),
(89, 30, 14, '2025-03-04', '20:39:57', NULL, 'feedback thanks', 1, NULL),
(90, 43, 12, '2025-03-04', '22:10:35', NULL, 'test', 1, NULL),
(91, 43, 10, '2025-03-04', '22:10:43', NULL, 'test', 1, NULL),
(92, 25, 16, '2025-03-05', '00:41:39', NULL, 'test', 1, NULL),
(93, 45, 16, '2025-03-05', '09:14:15', NULL, 'test', 1, NULL),
(94, 25, 17, '2025-03-05', '09:32:25', NULL, 'test', 1, NULL),
(95, 25, 12, '2025-03-05', '12:40:28', NULL, 'test', 1, NULL),
(96, 27, 12, '2025-03-05', '12:52:50', NULL, 'test reply', 1, NULL),
(97, 43, 8, '2025-03-05', '14:21:28', NULL, 'test', 1, NULL),
(98, 26, 18, '2025-03-05', '14:48:30', NULL, 'test', 1, NULL),
(99, 27, 18, '2025-03-05', '14:49:25', NULL, 'reply', 1, NULL),
(100, 26, 15, '2025-03-05', '15:28:42', NULL, 'test', 1, NULL),
(101, 43, 8, '2025-03-10', '13:25:37', NULL, 'test', 0, NULL),
(102, 25, 8, '2025-03-16', '18:59:04', NULL, 'Post forwarded to CITE department at Carmen campus with note: test', 1, NULL),
(103, 26, 15, '2025-03-17', '14:11:10', NULL, 'test', 0, NULL),
(104, 26, 15, '2025-03-17', '14:11:10', NULL, 'test', 0, NULL),
(105, 25, 19, '2025-03-19', '00:49:49', NULL, 'Post forwarded to BASIC ED department at Iligan campus', 1, NULL),
(106, 43, 8, '2025-03-25', '18:01:06', NULL, 'test', 0, NULL),
(107, 43, 8, '2025-03-25', '18:01:06', NULL, 'test', 0, NULL),
(108, 25, 10, '2025-03-25', '18:14:53', NULL, 'Post forwarded to CITE department at Carmen campus', 1, NULL),
(109, 25, 15, '2025-03-25', '18:21:59', NULL, 'Post forwarded to CITE department at Carmen campus', 1, NULL),
(110, 25, 8, '2025-03-25', '18:25:27', NULL, 'Post forwarded to CITE department at Carmen campus with note: ttest', 1, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tblcampus`
--
ALTER TABLE `tblcampus`
  ADD PRIMARY KEY (`campus_id`);

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
  ADD KEY `fk_user_schoolyear` (`user_schoolyearId`),
  ADD KEY `fk_user_campus` (`user_campusId`);

--
-- Indexes for table `tblusertype`
--
ALTER TABLE `tblusertype`
  ADD PRIMARY KEY (`user_typeId`);

--
-- Indexes for table `tbl_giya_inquiry_types`
--
ALTER TABLE `tbl_giya_inquiry_types`
  ADD PRIMARY KEY (`inquiry_id`),
  ADD KEY `fk_inquiry_department` (`department_id`);

--
-- Indexes for table `tbl_giya_posts`
--
ALTER TABLE `tbl_giya_posts`
  ADD PRIMARY KEY (`post_id`),
  ADD KEY `post_userId` (`post_userId`),
  ADD KEY `postType_id` (`postType_id`),
  ADD KEY `inquiry_type_id` (`inquiry_typeId`),
  ADD KEY `fk_posts_department` (`post_departmentId`),
  ADD KEY `fk_post_campus` (`post_campusId`),
  ADD KEY `fk_forwarded_by` (`forwarded_by`);

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
-- AUTO_INCREMENT for table `tblcampus`
--
ALTER TABLE `tblcampus`
  MODIFY `campus_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `tbl_giya_inquiry_types`
--
ALTER TABLE `tbl_giya_inquiry_types`
  MODIFY `inquiry_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `tbl_giya_posts`
--
ALTER TABLE `tbl_giya_posts`
  MODIFY `post_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `tbl_giya_posttype`
--
ALTER TABLE `tbl_giya_posttype`
  MODIFY `postType_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_giya_reply`
--
ALTER TABLE `tbl_giya_reply`
  MODIFY `reply_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=111;

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
  ADD CONSTRAINT `fk_user_campus` FOREIGN KEY (`user_campusId`) REFERENCES `tblcampus` (`campus_id`),
  ADD CONSTRAINT `fk_user_course` FOREIGN KEY (`user_courseId`) REFERENCES `tblcourses` (`course_id`),
  ADD CONSTRAINT `fk_user_department` FOREIGN KEY (`user_departmentId`) REFERENCES `tbldepartments` (`department_id`),
  ADD CONSTRAINT `fk_user_schoolyear` FOREIGN KEY (`user_schoolyearId`) REFERENCES `tblschoolyear` (`schoolyear_id`),
  ADD CONSTRAINT `fk_user_type` FOREIGN KEY (`user_typeId`) REFERENCES `tblusertype` (`user_typeId`),
  ADD CONSTRAINT `tblusers_ibfk_1` FOREIGN KEY (`user_courseId`) REFERENCES `tblcourses` (`course_id`),
  ADD CONSTRAINT `tblusers_ibfk_2` FOREIGN KEY (`user_departmentId`) REFERENCES `tbldepartments` (`department_id`),
  ADD CONSTRAINT `tblusers_ibfk_3` FOREIGN KEY (`user_typeId`) REFERENCES `tblusertype` (`user_typeId`);

--
-- Constraints for table `tbl_giya_inquiry_types`
--
ALTER TABLE `tbl_giya_inquiry_types`
  ADD CONSTRAINT `fk_inquiry_department` FOREIGN KEY (`department_id`) REFERENCES `tbldepartments` (`department_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_giya_posts`
--
ALTER TABLE `tbl_giya_posts`
  ADD CONSTRAINT `fk_forwarded_by` FOREIGN KEY (`forwarded_by`) REFERENCES `tblusers` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_post_campus` FOREIGN KEY (`post_campusId`) REFERENCES `tblcampus` (`campus_id`),
  ADD CONSTRAINT `fk_posts_department` FOREIGN KEY (`post_departmentId`) REFERENCES `tbldepartments` (`department_id`),
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
