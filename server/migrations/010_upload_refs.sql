-- 袜版定制页「灵感参考」图（后台小程序/Web 首页配置同结构：title + cover）
INSERT INTO `app_config` (`config_key`, `title`, `value`, `status`, `remark`) VALUES
('upload_refs', '袜版定制-灵感参考',
 JSON_ARRAY(
   JSON_OBJECT('id','r1','title','灵感1','cover','/pkg/static/images/ref-1.png','bg','linear-gradient(135deg,#E9D5C2,#C9A98A)'),
   JSON_OBJECT('id','r2','title','灵感2','cover','/pkg/static/images/ref-2.png','bg','linear-gradient(135deg,#CFE0D6,#8FB3A0)'),
   JSON_OBJECT('id','r3','title','灵感3','cover','/pkg/static/images/ref-3.png','bg','linear-gradient(135deg,#E7D2D8,#C293A6)'),
   JSON_OBJECT('id','r4','title','灵感4','cover','/pkg/static/images/ref-4.png','bg','linear-gradient(135deg,#D8D2E4,#9C8FC4)'),
   JSON_OBJECT('id','r5','title','灵感5','cover','/pkg/static/images/ref-5.png','bg','linear-gradient(135deg,#E6D7B8,#C6A857)')
 ), 1, '袜版定制页灵感参考网格，cover 填图片 URL')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `remark` = VALUES(`remark`);
