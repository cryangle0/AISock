-- 发现页配图 + 商品详情页默认可配内容（后台「小程序配置」维护）
INSERT INTO `app_config` (`config_key`, `title`, `value`, `status`, `remark`) VALUES
('feed_discover', '发现页-配图',
 JSON_ARRAY(
   JSON_OBJECT('id','hero','title','顶部背景/Banner','cover','https://onnsa.cn/aisock/static/images/feed-hero.webp'),
   JSON_OBJECT('id','model_a','title','记录卡模特A','cover','/static/discover/model-a.png'),
   JSON_OBJECT('id','model_b','title','记录卡模特B','cover','/static/discover/model-b.png'),
   JSON_OBJECT('id','sock_a','title','记录卡袜子A','cover','/static/discover/sock-a.png'),
   JSON_OBJECT('id','sock_b','title','记录卡袜子B','cover','/static/discover/sock-b.png')
 ), 1, '发现页顶部背景、主题 Banner、记录卡左右模特/袜子样机图'),
('product_detail', '商品详情-默认内容',
 JSON_ARRAY(
   JSON_OBJECT('id','main','title','袜版定制 · 杭城','en','杭城袜韵','cover','https://onnsa.cn/aisock/pkg/static/detail/hangzhou-hero.webp','desc','将杭州城市文化融入袜品设计\n舒适与美学兼具\n传递城市温度与品质生活'),
   JSON_OBJECT('id','slide_2','title','轮播图2','cover','https://onnsa.cn/aisock/pkg/static/detail/hangzhou-hero.webp'),
   JSON_OBJECT('id','slide_3','title','轮播图3','cover','https://onnsa.cn/aisock/pkg/static/detail/hangzhou-hero.webp'),
   JSON_OBJECT('id','slide_4','title','轮播图4','cover','https://onnsa.cn/aisock/pkg/static/detail/hangzhou-hero.webp'),
   JSON_OBJECT('id','grid_1','title','设计展示1','cover','https://onnsa.cn/aisock/pkg/static/detail/hangzhou-1.webp'),
   JSON_OBJECT('id','grid_2','title','设计展示2','cover','https://onnsa.cn/aisock/pkg/static/detail/hangzhou-2.webp'),
   JSON_OBJECT('id','grid_3','title','设计展示3','cover','https://onnsa.cn/aisock/pkg/static/detail/hangzhou-3.webp')
 ), 1, '商品详情默认文案与配图；花型 ID 仅用于立即购买关联，不覆盖本页展示')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `remark` = VALUES(`remark`);
