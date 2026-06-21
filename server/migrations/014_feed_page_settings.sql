-- 浏览页：页面标题 + 列表展示数量（并入 feed_discover 配置块）
UPDATE `app_config`
SET `title` = '浏览页-配图与设置',
    `remark` = '浏览页 NavBar 标题、每主题展示花型数量、顶部背景与记录卡模特/袜子；主题 Banner 在「标签管理·主题」'
WHERE `config_key` = 'feed_discover';

-- 为已有配置追加 nav_title / list_size（若不存在）
UPDATE `app_config`
SET `value` = JSON_ARRAY_APPEND(`value`, '$', JSON_OBJECT('id', 'nav_title', 'title', '发现'))
WHERE `config_key` = 'feed_discover'
  AND JSON_SEARCH(`value`, 'one', 'nav_title', NULL, '$[*].id') IS NULL;

UPDATE `app_config`
SET `value` = JSON_ARRAY_APPEND(`value`, '$', JSON_OBJECT('id', 'list_size', 'title', '展示数量', 'en', '10'))
WHERE `config_key` = 'feed_discover'
  AND JSON_SEARCH(`value`, 'one', 'list_size', NULL, '$[*].id') IS NULL;

UPDATE `app_config`
SET `remark` = '商品详情默认文案与配图（浏览页点「查看详情」进入）；花型 ID 仅用于立即购买，不覆盖本页展示'
WHERE `config_key` = 'product_detail';
