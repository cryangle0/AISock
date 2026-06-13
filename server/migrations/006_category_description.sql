-- 006: 花型分类增加「风格描述」字段（发现页按分类展示一段文字描述）
-- 幂等：列已存在时忽略
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pattern_category' AND COLUMN_NAME = 'description');
SET @sql := IF(@col = 0,
  'ALTER TABLE `pattern_category` ADD COLUMN `description` VARCHAR(255) NULL COMMENT ''分类风格描述（发现页展示）'' AFTER `name`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
