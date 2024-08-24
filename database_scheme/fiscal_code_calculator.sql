-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Creation: Aug 12, 2024 at 08:11 PM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 8.1.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fiscal_code_calculator`
--

-- --------------------------------------------------------

--
-- `fiscal_codes` table0s structure
--

CREATE DATABASE fiscal_code_calculator;
USE fiscal_code_calculator;

CREATE TABLE `fiscal_codes` (
  `fiscal_code_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `surname` varchar(50) NOT NULL,
  `date_of_birth` date NOT NULL,
  `place_of_birth` varchar(50) NOT NULL,
  `gender` varchar(10) NOT NULL,
  `fiscal_code_calculated` varchar(50) NOT NULL,
  `user` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- `users` table's structure
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `surname` varchar(50) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `place_of_birth` varchar(50) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Downloaded tables' indexes 
--

--
-- Indexes for `fiscal_codes` tables
--
ALTER TABLE `fiscal_codes`
  ADD PRIMARY KEY (`fiscal_code_id`),
  ADD KEY `foreign_key_user` (`user`);

--
-- Indexes for `users` tables
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for the downloaded tables
--

--
-- AUTO_INCREMENT for the `fiscal_codes` table
--
ALTER TABLE `fiscal_codes`
  MODIFY `fiscal_code_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for the `users` table
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Limits for the downloaded tables
--

--
-- Limits for the table `fiscal_codes`
--
ALTER TABLE `fiscal_codes`
  ADD CONSTRAINT `foreign_key_user` FOREIGN KEY (`user`) REFERENCES `users` (`user_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
