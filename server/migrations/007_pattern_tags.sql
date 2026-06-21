-- 007: 花型标签系统（礼赠场景 / 风格 等可扩展维度）
-- 目的：用「花型 ↔ 标签 多对多」表达真实对应关系，替代前端写死的场景/风格数组 + 名字模糊匹配。
-- 设计：通用 tag 表 + kind 维度区分（scene/style，可扩展 season/festival…），pattern_tag 关联。
-- 幂等：CREATE TABLE IF NOT EXISTS + INSERT IGNORE（uk_kind_code 去重），可重复执行。
SET NAMES utf8mb4;

-- ──────────────────────────────────────────────
-- 标签（礼赠场景 / 风格 等维度）
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tag` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kind`        VARCHAR(16)  NOT NULL COMMENT '维度：scene=礼赠场景 / style=风格，可扩展',
  `code`        VARCHAR(32)  NOT NULL COMMENT '稳定业务码（前端图标/渐变兜底用），如 lover/floral',
  `name`        VARCHAR(32)  NOT NULL COMMENT '展示名，如 送爱人/恋人',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '副标题/说明',
  `icon_url`    VARCHAR(512) DEFAULT NULL COMMENT '图标图（可空，前端按 code 兜底）',
  `sort`        INT          NOT NULL DEFAULT 0,
  `status`      TINYINT      NOT NULL DEFAULT 1 COMMENT '1=启用 0=隐藏',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_kind_code` (`kind`,`code`),
  KEY `idx_kind_status_sort` (`kind`,`status`,`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='花型标签（场景/风格等维度）';

-- ──────────────────────────────────────────────
-- 花型 ↔ 标签 多对多
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `pattern_tag` (
  `pattern_id`  BIGINT UNSIGNED NOT NULL,
  `tag_id`      BIGINT UNSIGNED NOT NULL,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`pattern_id`,`tag_id`),
  KEY `idx_tag` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='花型-标签 多对多';

-- ──────────────────────────────────────────────
-- 参考标签：礼赠场景（code 与小程序内置一致，前端按 code 套图标/渐变）
-- ──────────────────────────────────────────────
INSERT IGNORE INTO `tag` (`kind`,`code`,`name`,`description`,`sort`) VALUES
  ('scene','lover','送爱人/恋人','甜蜜心意，温暖相伴',0),
  ('scene','bff','送闺蜜/朋友','一起出行，默契加倍',1),
  ('scene','elder','送长辈/家人','贴心守护，舒服相伴',2),
  ('scene','self','送给自己','取悦自己，从脚开始',3);

-- ──────────────────────────────────────────────
-- 参考标签：风格（「更多」是前端 UI 入口，不入库）
-- ──────────────────────────────────────────────
INSERT IGNORE INTO `tag` (`kind`,`code`,`name`,`sort`) VALUES
  ('style','floral','浪漫花卉',0),
  ('style','couple','爱心情侣',1),
  ('style','sport','运动活力',2),
  ('style','retro','复古格纹',3),
  ('style','solid','简约纯色',4),
  ('style','cartoon','萌趣卡通',5),
  ('style','illust','艺术插画',6),
  ('style','guochao','国潮纹样',7);

-- ──────────────────────────────────────────────
-- 参考标签：主题（发现页顶部 Tab，名称与小程序内置 5 个保持一致；后台可改名/增减，前端跟随）
-- ──────────────────────────────────────────────
INSERT IGNORE INTO `tag` (`kind`,`code`,`name`,`sort`) VALUES
  ('theme','yequ','野趣精灵',0),
  ('theme','pasidier','帕斯蒂尔',1),
  ('theme','tonghe','痛核少女',2),
  ('theme','songchi','松弛田园',3),
  ('theme','meishi','美式学院',4);
