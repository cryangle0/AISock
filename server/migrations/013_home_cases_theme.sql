-- 首页两块配置独立：主题随心订 vs 案例轮播，互不关联
UPDATE `app_config`
SET `remark` = '首页三张滑动案例卡（独立配置，与主题随心订无关）；link 支持 pattern:ID 跳转商品详情'
WHERE `config_key` = 'home_cases';

UPDATE `app_config`
SET `remark` = '首页主题随心订三张小卡（独立配置，与案例轮播无关）'
WHERE `config_key` = 'home_themes';
