-- 011: AI 礼赠/风格标签配图 + 袜版定制灵感参考 → 可访问 URL（nginx /var/www/aisock/...）
-- 前提：配图已部署到 https://onnsa.cn/aisock/static/images/ 与 pkg/static/images/
SET NAMES utf8mb4;

SET @base = 'https://onnsa.cn/aisock';

-- 礼赠场景卡片图
UPDATE `tag` SET `icon_url` = CONCAT(@base, '/static/images/gift-lover.jpg') WHERE `kind` = 'scene' AND `code` = 'lover';
UPDATE `tag` SET `icon_url` = CONCAT(@base, '/static/images/gift-bff.jpg') WHERE `kind` = 'scene' AND `code` = 'bff';
UPDATE `tag` SET `icon_url` = CONCAT(@base, '/static/images/gift-elder.jpg') WHERE `kind` = 'scene' AND `code` = 'elder';
UPDATE `tag` SET `icon_url` = CONCAT(@base, '/static/images/gift-self.jpg') WHERE `kind` = 'scene' AND `code` = 'self';

-- 风格卡片图（「更多」为前端 UI 入口，不入库）
UPDATE `tag` SET `icon_url` = CONCAT(@base, '/static/images/style-floral.jpg') WHERE `kind` = 'style' AND `code` = 'floral';
UPDATE `tag` SET `icon_url` = CONCAT(@base, '/static/images/style-couple.jpg') WHERE `kind` = 'style' AND `code` = 'couple';
UPDATE `tag` SET `icon_url` = CONCAT(@base, '/static/images/style-sport.jpg') WHERE `kind` = 'style' AND `code` = 'sport';
UPDATE `tag` SET `icon_url` = CONCAT(@base, '/static/images/style-retro.jpg') WHERE `kind` = 'style' AND `code` = 'retro';
UPDATE `tag` SET `icon_url` = CONCAT(@base, '/static/images/style-solid.jpg') WHERE `kind` = 'style' AND `code` = 'solid';
UPDATE `tag` SET `icon_url` = CONCAT(@base, '/static/images/style-cartoon.jpg') WHERE `kind` = 'style' AND `code` = 'cartoon';
UPDATE `tag` SET `icon_url` = CONCAT(@base, '/static/images/style-illust.jpg') WHERE `kind` = 'style' AND `code` = 'illust';
UPDATE `tag` SET `icon_url` = CONCAT(@base, '/static/images/style-guochao.jpg') WHERE `kind` = 'style' AND `code` = 'guochao';

-- 袜版定制灵感参考
UPDATE `app_config`
SET `value` = JSON_ARRAY(
  JSON_OBJECT('id','r1','title','灵感1','cover',CONCAT(@base,'/pkg/static/images/ref-1.png'),'bg','linear-gradient(135deg,#E9D5C2,#C9A98A)'),
  JSON_OBJECT('id','r2','title','灵感2','cover',CONCAT(@base,'/pkg/static/images/ref-2.png'),'bg','linear-gradient(135deg,#CFE0D6,#8FB3A0)'),
  JSON_OBJECT('id','r3','title','灵感3','cover',CONCAT(@base,'/pkg/static/images/ref-3.png'),'bg','linear-gradient(135deg,#E7D2D8,#C293A6)'),
  JSON_OBJECT('id','r4','title','灵感4','cover',CONCAT(@base,'/pkg/static/images/ref-4.png'),'bg','linear-gradient(135deg,#D8D2E4,#9C8FC4)'),
  JSON_OBJECT('id','r5','title','灵感5','cover',CONCAT(@base,'/pkg/static/images/ref-5.png'),'bg','linear-gradient(135deg,#E6D7B8,#C6A857)')
)
WHERE `config_key` = 'upload_refs';
