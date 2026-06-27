-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: tvu_itam
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `disposals`
--

LOCK TABLES `disposals` WRITE;
/*!40000 ALTER TABLE `disposals` DISABLE KEYS */;
INSERT INTO `disposals` (`id`, `device_id`, `disposal_type`, `disposal_date`, `reason`, `notes`, `disposal_price`, `status`, `approved_by`, `created_by`, `created_at`, `updated_at`) VALUES (3,2,'lost','2026-05-26','ok',NULL,NULL,'approved',2,1,'2026-05-26 07:03:47','2026-05-26 07:04:14'),(4,69,'liquidation','2026-05-26','duyeb',NULL,NULL,'rejected',1,1,'2026-05-26 07:10:24','2026-05-27 15:58:54'),(6,9,'liquidation','2026-05-26','duy??n',NULL,NULL,'approved',1,1,'2026-05-26 07:38:04','2026-05-26 07:38:09'),(7,68,'liquidation','2026-05-27','test',NULL,NULL,'rejected',1,1,'2026-05-27 16:06:25','2026-05-27 16:06:35'),(8,68,'liquidation','2026-05-27','123',NULL,NULL,'rejected',1,1,'2026-05-27 16:09:42','2026-05-27 16:09:48');
/*!40000 ALTER TABLE `disposals` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-25 22:29:26
