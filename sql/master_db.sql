-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 17, 2025 at 06:59 PM
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
(1, 'College of Management and Accountancy'),
(2, 'College of Education'),
(3, 'School of Criminology and Criminal Justice'),
(4, 'College of Engineering and Architecture'),
(5, 'College of Allied Health Sciences'),
(6, 'College of Information Technology');

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
  `user_level` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tblusers`
--

INSERT INTO `tblusers` (`user_id`, `user_schoolId`, `user_lastname`, `user_firstname`, `user_middlename`, `user_suffix`, `phinmaed_email`, `user_email`, `user_contact`, `user_password`, `user_courseId`, `user_departmentId`, `user_schoolyearId`, `user_typeId`, `user_status`, `user_level`) VALUES
(1, '02-2526-00001', 'Dela Cruz', 'John', 'Michael', '', '', '', '', 'phinma-coc', 1, 1, 1, 2, 1, 10),
(2, '02-2526-00002', 'Reyes', 'Anna', '', '', '', '', '', 'phinma-coc', 2, 1, 2, 2, 1, 10),
(3, '02-2526-00003', 'Santos', 'Jake', 'Matthew', 'Jr.', '', '', '', 'phinma-coc', 6, 2, 3, 2, 1, 10),
(4, '02-2526-00004', 'Garcia', 'Emily', 'Rose', '', '', '', '', 'phinma-coc', 7, 2, 4, 2, 1, 10),
(5, '02-2526-00005', 'Tan', 'Chris', '', '', '', '', '', 'phinma-coc', 3, 3, 5, 2, 1, 10),
(6, '02-2526-00006', 'Mendoza', 'Sophia', 'Marie', '', '', '', '', 'phinma-coc', 2, 3, 1, 2, 1, 10),
(7, '02-2526-00007', 'Castro', 'Michael', '', '', '', '', '', 'phinma-coc', 7, 4, 1, 2, 1, 10),
(8, '02-2526-00008', 'Flores', 'Chloe', 'Ann', '', '', '', '', 'phinma-coc', 8, 4, 2, 2, 1, 10),
(9, '02-2526-00009', 'De Leon', 'Ethan', '', '', '', '', '', 'phinma-coc', 10, 5, 2, 2, 1, 10),
(10, '02-2526-00010', 'Villanueva', 'Ella', 'Grace', '', '', '', '', 'phinma-coc', 9, 5, 3, 2, 1, 10),
(11, '02-2526-00011', 'Bautista', 'Lucas', '', '', '', '', '', 'phinma-coc', 11, 6, 3, 2, 1, 10),
(12, '02-2526-00012', 'Navarro', 'Mia', 'Claire', '', '', '', '', 'phinma-coc', 12, 6, 4, 2, 1, 10),
(13, '01-2526-00001', 'Luna', 'James', '', '', '', '', '', 'phinma-coc', NULL, 1, NULL, 3, 1, 10),
(14, '01-2526-00002', 'Fernandez', 'Laura', 'Marie', '', '', '', '', 'phinma-coc', NULL, 2, NULL, 3, 1, 10),
(15, '01-2526-00003', 'Torres', 'Mark', '', '', '', '', '', 'phinma-coc', NULL, 3, NULL, 3, 1, 10),
(16, '01-2526-00004', 'Ramos', 'Samantha', 'Jade', '', '', '', '', 'phinma-coc', NULL, 4, NULL, 3, 1, 10),
(17, '01-2526-00005', 'Alvarez', 'Andrew', '', '', '', '', '', 'phinma-coc', NULL, 5, NULL, 3, 1, 10),
(18, '01-2526-00006', 'Lim', 'Isabella', 'Grace', '', '', '', '', 'phinma-coc', NULL, 6, NULL, 3, 1, 10),
(19, '00-2526-00001', 'Cruz', 'Jasmine', '', '', '', '', '', 'phinma-coc', NULL, 1, NULL, 5, 1, 50),
(20, '00-2526-00002', 'Rivera', 'Nathan', 'Paul', '', '', '', '', 'phinma-coc', NULL, 2, NULL, 5, 1, 50),
(21, '00-2526-00003', 'Perez', 'Liam', '', '', '', '', '', 'phinma-coc', NULL, 3, NULL, 5, 1, 50),
(22, '00-2526-00004', 'Gonzales', 'Sophia', 'Elaine', '', '', '', '', 'phinma-coc', NULL, 4, NULL, 5, 1, 50),
(23, '00-2526-00005', 'Morales', 'Jacob', '', '', '', '', '', 'phinma-coc', NULL, 5, NULL, 5, 1, 50),
(24, '00-2526-00006', 'Diaz', 'Leah', '', '', '', '', '', 'phinma-coc', NULL, 6, NULL, 5, 1, 50),
(25, '00-0000-00001', 'ADMIN', 'Kinzari', '', '', '', '', '', 'phinma-coc', NULL, NULL, NULL, 6, 1, 100),
(26, '00-0000-00002', 'ADMIN', 'Lowkey', '', '', '', '', '', 'phinma-coc', NULL, NULL, NULL, 6, 1, 100),
(27, '02-2223-05976', 'Espartero', 'Jerimiah Exequiel', '', '', 'jeex.espartero.coc@phinmaed.com', '', '09157079861', 'Kinzari7', NULL, NULL, NULL, 2, 1, 10),
(28, '03-2526-00001', 'Aclan', 'Jacqueline', 'Espartero', '', '', 'jacknjer08@gmail.com', '09532609342', 'phinma-coc', NULL, NULL, NULL, 1, 1, 10),
(29, '03-2526-00002', 'Honrado', 'Josephos Rey', 'Bahala', '', '', 'josephosrey@gmail.com', '09094249501', 'josephosrey', NULL, NULL, NULL, 1, 1, 10),
(30, '03-2526-00003', 'Opura', 'Michaela Jane', '', '', '', 'mikay@gmail.com', '09535394143', 'mikay123', NULL, NULL, NULL, 1, 1, 10),
(31, '03-2526-00004', 'Cailing', 'Camille', 'Ontejo', '', '', 'camcamz@gmail.com', '09175849022', 'Camcamz7', NULL, NULL, NULL, 1, 1, 10),
(34, '03-2526-00005', 'Paye', 'Jescel May', '', '', '', 'jescelmay@gmail.com', '09567778921', 'Jescelmay1999', NULL, NULL, NULL, 1, 1, 10),
(35, '03-2526-00006', 'Aclan', 'Jeriah Grace', 'Espartero', '', '', 'jeraii@gmail.com', '09537788991', 'Kurapika08', NULL, NULL, NULL, 1, 1, 10);

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
-- Table structure for table `tbl_giya_posts`
--

CREATE TABLE `tbl_giya_posts` (
  `post_id` int(11) NOT NULL,
  `post_userId` int(11) NOT NULL,
  `post_departmentId` int(11) NOT NULL,
  `postType_id` int(11) NOT NULL,
  `post_date` date NOT NULL,
  `post_time` time NOT NULL,
  `post_title` varchar(255) NOT NULL,
  `post_message` text NOT NULL,
  `post_stars` int(11) DEFAULT 0,
  `post_status` varchar(20) DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_giya_posts`
--

INSERT INTO `tbl_giya_posts` (`post_id`, `post_userId`, `post_departmentId`, `postType_id`, `post_date`, `post_time`, `post_title`, `post_message`, `post_stars`, `post_status`) VALUES
(1, 1, 2, 1, '2025-02-17', '20:54:30', 'CSDL (Guidance Counseling, Student Loan, Financial Aid, Scholarship Renewal, Duty Assignment)', 'test', 0, 'Resolved'),
(2, 30, 1, 1, '2025-02-17', '20:55:00', 'HUMAN RESOURCE (Hiring, Contract)', 'test', 0, 'Resolved'),
(3, 29, 1, 1, '2025-02-17', '20:59:37', 'BUSINESS CENTER (Books, Uniforms)', 'test', 0, 'Pending'),
(4, 29, 1, 1, '2025-02-17', '21:06:29', 'FINANCE (Balance, Assessment, Scholarships)', 'How to pay tuition?', 0, 'Pending'),
(5, 34, 1, 1, '2025-02-18', '01:07:55', 'ENROLLMENT (Enrollment Process, ORF, SIS, ID, Email, Down Payment, Module)', 'How to Enroll?', 0, 'Pending');

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
(3, 25, 1, '2025-02-17', '20:55:11', NULL, 'test'),
(4, 25, 2, '2025-02-17', '20:57:44', NULL, 'asd'),
(5, 25, 2, '2025-02-17', '22:45:05', NULL, 'asd');

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
-- Indexes for table `tbl_giya_posts`
--
ALTER TABLE `tbl_giya_posts`
  ADD PRIMARY KEY (`post_id`),
  ADD KEY `post_userId` (`post_userId`),
  ADD KEY `post_departmentId` (`post_departmentId`),
  ADD KEY `postType_id` (`postType_id`);

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
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

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
  MODIFY `reply_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
  ADD CONSTRAINT `tbl_giya_posts_ibfk_3` FOREIGN KEY (`postType_id`) REFERENCES `tbl_giya_posttype` (`postType_id`) ON DELETE CASCADE;

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
