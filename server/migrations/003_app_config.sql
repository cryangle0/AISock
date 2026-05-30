-- ──────────────────────────────────────────────
-- 小程序运营配置（key→JSON）：首页主题/功能区/案例展示等可后台配置项
-- 用单表 key-value(JSON) 存，新增配置块无需改表结构，易扩展。
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `app_config` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `config_key`  VARCHAR(64)     NOT NULL COMMENT '配置键，如 home_themes / home_zones / home_cases',
  `title`       VARCHAR(64)     DEFAULT NULL COMMENT '配置项中文名（后台展示用）',
  `value`       JSON            DEFAULT NULL COMMENT '配置内容（数组/对象）',
  `status`      TINYINT         NOT NULL DEFAULT 1 COMMENT '1=启用 0=停用',
  `remark`      VARCHAR(255)    DEFAULT NULL,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='小程序运营配置';

-- 预置首页配置（主题随心订 / 功能区 / 案例展示）
INSERT INTO `app_config` (`config_key`, `title`, `value`, `status`, `remark`) VALUES
('home_themes', '首页-主题随心订',
 JSON_ARRAY(
   JSON_OBJECT('id','jieqi','title','二十四节气','en','JIE QI','bg','linear-gradient(135deg,#E8D5B8,#D4C09A)','link','/pages/feed/index'),
   JSON_OBJECT('id','dunhuang','title','敦煌入梦','en','DUN HUANG','bg','linear-gradient(135deg,#C9B89A,#B5A085)','link','/pages/feed/index'),
   JSON_OBJECT('id','wenchuang','title','文创物语','en','WEN CHUANG','bg','linear-gradient(135deg,#DEC38A,#C7A66E)','link','/pages/feed/index')
 ), 1, '首页顶部三个主题卡片'),
('home_zones', '首页-功能区',
 JSON_ARRAY(
   JSON_OBJECT('id','editor','icon','✏️','title','开始设计','link','/pages/editor/index'),
   JSON_OBJECT('id','cart','icon','🛒','title','购物车','link','/pages/cart/index'),
   JSON_OBJECT('id','designs','icon','📁','title','我的设计','link','/pages/designs/index')
 ), 1, '首页底部快捷功能入口'),
('home_cases', '首页-案例展示',
 JSON_ARRAY(
   JSON_OBJECT('id','c1','title','敦煌九色鹿','bg','linear-gradient(180deg,#C8B89A,#d4b796)','link','/pages/feed/index'),
   JSON_OBJECT('id','c2','title','飞天乐舞','bg','linear-gradient(180deg,#A8C4B0,#d4b796)','link','/pages/feed/index'),
   JSON_OBJECT('id','c3','title','千手观音','bg','linear-gradient(180deg,#D6A87A,#d4b796)','link','/pages/feed/index')
 ), 1, '首页袜版设计预设/案例横滑卡片')
ON DUPLICATE KEY UPDATE `config_key` = `config_key`;
