-- 爱花型 · AI 袜版设计系统 —— 初始化数据库结构
-- 字符集 utf8mb4，引擎 InnoDB

SET NAMES utf8mb4;

-- ──────────────────────────────────────────────
-- 用户（小程序 / web 端）
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `user` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `phone`       VARCHAR(20)     DEFAULT NULL COMMENT '手机号',
  `openid`      VARCHAR(64)     DEFAULT NULL COMMENT '微信 openid',
  `unionid`     VARCHAR(64)     DEFAULT NULL COMMENT '微信 unionid',
  `nickname`    VARCHAR(64)     DEFAULT NULL COMMENT '昵称',
  `avatar`      VARCHAR(512)    DEFAULT NULL COMMENT '头像 URL',
  `status`      TINYINT         NOT NULL DEFAULT 1 COMMENT '1正常 0禁用',
  `ai_quota_daily` INT          NOT NULL DEFAULT 5 COMMENT '每日免费生图次数',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_phone` (`phone`),
  UNIQUE KEY `uk_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户';

-- ──────────────────────────────────────────────
-- 后台账号
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `admin_account` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`    VARCHAR(64)     NOT NULL,
  `password`    VARCHAR(128)    NOT NULL COMMENT 'bcrypt 哈希',
  `nickname`    VARCHAR(64)     DEFAULT NULL,
  `role`        VARCHAR(32)     NOT NULL DEFAULT 'admin' COMMENT 'admin/operator',
  `status`      TINYINT         NOT NULL DEFAULT 1,
  `last_login_at` DATETIME      DEFAULT NULL,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台账号';

-- ──────────────────────────────────────────────
-- 袜型（SKU 模板）
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `sock_model` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`        VARCHAR(32)     NOT NULL COMMENT '袜型编码 如 mid-tube',
  `name`        VARCHAR(64)     NOT NULL COMMENT '名称 如 中筒袜',
  `svg_url`     VARCHAR(512)    DEFAULT NULL COMMENT '底图 SVG',
  `mask_url`    VARCHAR(512)    DEFAULT NULL COMMENT '可印区域蒙版 PNG',
  `lineart_url` VARCHAR(512)    DEFAULT NULL COMMENT '线稿 PNG',
  `print_area_px` BIGINT        DEFAULT NULL COMMENT '可印面积(px^2)',
  `phys_width_mm`  INT          DEFAULT NULL COMMENT '物理宽 mm',
  `phys_height_mm` INT          DEFAULT NULL COMMENT '物理高 mm',
  `recommend_dpi`  INT          DEFAULT 150,
  `craft`       VARCHAR(32)     DEFAULT NULL COMMENT '工艺 UV/针织/染色',
  `min_order`   INT             NOT NULL DEFAULT 1 COMMENT '起订量',
  `unit_price`  DECIMAL(10,2)   NOT NULL DEFAULT 0 COMMENT '单价(元)',
  `sort`        INT             NOT NULL DEFAULT 0,
  `status`      TINYINT         NOT NULL DEFAULT 1,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='袜型模板';

-- ──────────────────────────────────────────────
-- 花型分类
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `pattern_category` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(32)     NOT NULL,
  `sort`        INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='花型分类';

-- ──────────────────────────────────────────────
-- 花型素材
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `pattern` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT UNSIGNED DEFAULT NULL,
  `owner_id`    BIGINT UNSIGNED DEFAULT NULL COMMENT 'NULL=公共库；否则个人',
  `name`        VARCHAR(64)     NOT NULL,
  `image_url`   VARCHAR(512)    NOT NULL,
  `thumb_url`   VARCHAR(512)    DEFAULT NULL,
  `tileable`    TINYINT         NOT NULL DEFAULT 1 COMMENT '是否可平铺',
  `source`      VARCHAR(32)     NOT NULL DEFAULT 'public' COMMENT 'public/personal/ai',
  `status`      TINYINT         NOT NULL DEFAULT 1,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_owner` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='花型素材';

-- ──────────────────────────────────────────────
-- 设计稿
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `design` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED NOT NULL,
  `sock_model_id` BIGINT UNSIGNED DEFAULT NULL,
  `name`        VARCHAR(64)     NOT NULL,
  `regions`     JSON            DEFAULT NULL COMMENT '四区域花型/底色配置',
  `cover_url`   VARCHAR(512)    DEFAULT NULL,
  `from_preset` TINYINT         NOT NULL DEFAULT 0,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设计稿';

-- ──────────────────────────────────────────────
-- 订单
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `order` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_no`    VARCHAR(32)     NOT NULL,
  `user_id`     BIGINT UNSIGNED NOT NULL,
  `design_id`   BIGINT UNSIGNED DEFAULT NULL,
  `design_name` VARCHAR(64)     DEFAULT NULL,
  `sock_model_id` BIGINT UNSIGNED DEFAULT NULL,
  `sizes`       JSON            DEFAULT NULL COMMENT '尺码分布 {S:30,M:50}',
  `quantity`    INT             NOT NULL DEFAULT 0,
  `unit_price`  DECIMAL(10,2)   NOT NULL DEFAULT 0,
  `total_amount` DECIMAL(10,2)  NOT NULL DEFAULT 0,
  `material`    VARCHAR(32)     DEFAULT NULL,
  `craft`       VARCHAR(32)     DEFAULT NULL,
  `address`     VARCHAR(255)    DEFAULT NULL,
  `remark`      VARCHAR(255)    DEFAULT NULL,
  `status`      VARCHAR(16)     NOT NULL DEFAULT 'pending' COMMENT 'pending/paid/producing/shipped/done/cancelled',
  `pay_method`  VARCHAR(16)     DEFAULT NULL,
  `paid_at`     DATETIME        DEFAULT NULL,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单';

-- ──────────────────────────────────────────────
-- AI 生成任务
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `ai_task` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED NOT NULL,
  `type`        VARCHAR(16)     NOT NULL COMMENT 'text2img/img2img/remix/style',
  `prompt`      TEXT            DEFAULT NULL,
  `ref_image`   VARCHAR(512)    DEFAULT NULL,
  `result_urls` JSON            DEFAULT NULL,
  `status`      VARCHAR(16)     NOT NULL DEFAULT 'pending' COMMENT 'pending/running/success/failed',
  `error`       VARCHAR(255)    DEFAULT NULL,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `finished_at` DATETIME        DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI 生成任务';

-- ──────────────────────────────────────────────
-- 首页 banner / 主题
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `banner` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`       VARCHAR(64)     NOT NULL,
  `subtitle`    VARCHAR(128)    DEFAULT NULL,
  `image_url`   VARCHAR(512)    DEFAULT NULL,
  `link`        VARCHAR(255)    DEFAULT NULL,
  `sort`        INT             NOT NULL DEFAULT 0,
  `status`      TINYINT         NOT NULL DEFAULT 1,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='首页 Banner';
