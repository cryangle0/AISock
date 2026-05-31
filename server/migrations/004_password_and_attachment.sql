-- 第四期补齐：C 端密码登录 + 订单附件
-- 1) user 增加密码哈希列（bcrypt，可空：仅设置过密码的用户才有）
-- 2) order_attachment 订单附件表（设计稿 / 图片 / 文件，下单后可补传）
SET NAMES utf8mb4;

-- ── 用户密码（bcrypt 哈希；NULL 表示未设置密码，只能验证码/微信登录）──
ALTER TABLE `user`
  ADD COLUMN `password` VARCHAR(128) DEFAULT NULL COMMENT 'bcrypt 哈希，NULL=未设密码' AFTER `unionid`;

-- ── 订单附件（一单多附件；用户补传 / 设计稿留档）──
CREATE TABLE IF NOT EXISTS `order_attachment` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`    BIGINT UNSIGNED NOT NULL,
  `user_id`     BIGINT UNSIGNED NOT NULL COMMENT '上传者（订单归属用户）',
  `name`        VARCHAR(255)    NOT NULL COMMENT '文件名',
  `url`         VARCHAR(512)    NOT NULL COMMENT '可访问 URL',
  `mime`        VARCHAR(64)     DEFAULT NULL,
  `size`        INT             DEFAULT 0,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单附件';
