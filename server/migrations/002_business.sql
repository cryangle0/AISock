-- 业务补齐：附件、文章、物流、支付流水、邀请关系
SET NAMES utf8mb4;

-- ──────────────────────────────────────────────
-- 上传附件（订单附件 / 个人素材 / banner 等共用）
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `upload` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED DEFAULT NULL COMMENT 'NULL=匿名/系统',
  `name`        VARCHAR(255)    NOT NULL,
  `mime`        VARCHAR(64)     DEFAULT NULL,
  `size`        INT             DEFAULT 0,
  `path`        VARCHAR(512)    NOT NULL COMMENT '本地相对路径或 OSS Key',
  `url`         VARCHAR(512)    NOT NULL COMMENT '可访问 URL',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='上传文件';

-- ──────────────────────────────────────────────
-- 推荐流文章 / 资讯
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `article` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kind`        VARCHAR(16)     NOT NULL DEFAULT 'feed' COMMENT 'feed/news/faq',
  `title`       VARCHAR(128)    NOT NULL,
  `cover_url`   VARCHAR(512)    DEFAULT NULL,
  `summary`     VARCHAR(255)    DEFAULT NULL,
  `content`     MEDIUMTEXT      DEFAULT NULL,
  `tag`         VARCHAR(32)     DEFAULT NULL,
  `link`        VARCHAR(255)    DEFAULT NULL,
  `sort`        INT             NOT NULL DEFAULT 0,
  `status`      TINYINT         NOT NULL DEFAULT 1,
  `published_at` DATETIME       DEFAULT NULL,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kind` (`kind`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='推荐流/资讯';

-- ──────────────────────────────────────────────
-- 订单物流
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `order_shipment` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`    BIGINT UNSIGNED NOT NULL,
  `carrier`     VARCHAR(32)     DEFAULT NULL COMMENT '顺丰/京东/中通/圆通',
  `tracking_no` VARCHAR(64)     DEFAULT NULL,
  `status`      VARCHAR(16)     NOT NULL DEFAULT 'pending' COMMENT 'pending/in-transit/delivered',
  `traces`      JSON            DEFAULT NULL COMMENT '物流轨迹 [{time,desc}]',
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单物流';

-- ──────────────────────────────────────────────
-- 支付流水
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `payment` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`    BIGINT UNSIGNED NOT NULL,
  `out_trade_no` VARCHAR(64)    NOT NULL COMMENT '商户订单号（与微信对接）',
  `transaction_id` VARCHAR(64)  DEFAULT NULL COMMENT '微信支付单号',
  `method`      VARCHAR(16)     NOT NULL,
  `amount_fen`  INT             NOT NULL DEFAULT 0 COMMENT '金额（分）',
  `status`      VARCHAR(16)     NOT NULL DEFAULT 'pending' COMMENT 'pending/success/failed/refunded',
  `prepay_id`   VARCHAR(128)    DEFAULT NULL,
  `paid_at`     DATETIME        DEFAULT NULL,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_out_trade_no` (`out_trade_no`),
  KEY `idx_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付流水';

-- ──────────────────────────────────────────────
-- 邀请关系（拉新得生图次数）
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `invitation` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `inviter_id`  BIGINT UNSIGNED NOT NULL,
  `invitee_id`  BIGINT UNSIGNED NOT NULL,
  `bonus`       INT             NOT NULL DEFAULT 3,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_invitee` (`invitee_id`),
  KEY `idx_inviter` (`inviter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邀请关系';
