-- 008: 袜型模板支持矢量几何渲染（导入 docs/袜板 的 22 个真实袜版）
-- 新增列：family(直板/弯板) / geometry_json(分区矢量路径) / thumb_url(选择器缩略图)
-- 幂等：列已存在时跳过；可重复执行。

-- family --------------------------------------------------------------
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sock_model' AND COLUMN_NAME = 'family');
SET @sql := IF(@col = 0,
  'ALTER TABLE `sock_model` ADD COLUMN `family` VARCHAR(8) NULL COMMENT ''板型 直板/弯板'' AFTER `name`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- geometry_json -------------------------------------------------------
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sock_model' AND COLUMN_NAME = 'geometry_json');
SET @sql := IF(@col = 0,
  'ALTER TABLE `sock_model` ADD COLUMN `geometry_json` LONGTEXT NULL COMMENT ''分区矢量路径(归一化 viewBox 内 body/welt/heel/toe/outline)'' AFTER `lineart_url`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- thumb_url -----------------------------------------------------------
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sock_model' AND COLUMN_NAME = 'thumb_url');
SET @sql := IF(@col = 0,
  'ALTER TABLE `sock_model` ADD COLUMN `thumb_url` VARCHAR(512) NULL COMMENT ''选择器缩略图 PNG'' AFTER `svg_url`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 退役旧 demo 袜型（保留数据，仅停用；真实袜版由导入脚本写入）-----------
UPDATE `sock_model` SET `status` = 0 WHERE `code` LIKE 'demo-%';
