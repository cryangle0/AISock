-- ============================================================
-- 005 演示数据种子（方便客户查看各业务模块）
-- 原则：
--   1) 幂等：可重复执行，不会产生重复（靠唯一键 INSERT IGNORE / WHERE NOT EXISTS 守卫）
--   2) 仅初始化"业务数据"：袜型 / 花型 / Banner / 资讯 / 演示用户 / 演示订单 / 物流
--   3) 不触碰"按 UI 设计稿渲染"的运营配置（app_config 的 home_themes/home_zones/home_cases
--      与 site_config/ai_generation 均不改），首页主题/案例/AI 推荐官界面保持设计稿原样
--   4) 图片：复用客户 OSS(cdn.onnsa.cn) 已生成的真实图 + placehold 占位，客户可在后台替换
-- ============================================================
SET NAMES utf8mb4;

-- ── 1. 袜型模板（code 唯一，重复执行自动跳过）────────────────
INSERT IGNORE INTO `sock_model`
  (`code`, `name`, `craft`, `min_order`, `unit_price`, `recommend_dpi`, `phys_width_mm`, `phys_height_mm`, `sort`, `status`)
VALUES
  ('demo-crew',  '经典中筒袜', '针织提花', 50, 6.80, 150, 110, 360, 1, 1),
  ('demo-ankle', '运动船袜',   '喷墨印花', 50, 5.50, 150, 100, 180, 2, 1),
  ('demo-tube',  '时尚长筒袜', '数码染色', 50, 8.80, 150, 120, 520, 3, 1),
  ('demo-short', '休闲短袜',   '绣花',     50, 5.00, 150, 100, 150, 4, 1),
  ('demo-kids',  '萌趣童袜',   '点胶',     30, 4.50, 150,  80, 220, 5, 1);

-- ── 2. 花型分类（name 唯一）──────────────────────────────────
INSERT IGNORE INTO `pattern_category` (`name`, `sort`) VALUES
  ('国潮纹样', 1),
  ('浪漫花卉', 2),
  ('几何线条', 3),
  ('萌趣卡通', 4),
  ('节气文创', 5),
  ('简约纯色', 6);

-- ── 3. 公共花型素材（无唯一键，按名称守卫幂等）───────────────
INSERT INTO `pattern` (`category_id`, `owner_id`, `name`, `image_url`, `thumb_url`, `tileable`, `source`, `status`)
SELECT * FROM (
  SELECT (SELECT id FROM `pattern_category` WHERE name='国潮纹样') AS category_id, NULL AS owner_id, '敦煌飞天' AS name,
         'https://cdn.onnsa.cn/ai/202606/238a55c8dc702fb7.png' AS image_url,
         'https://cdn.onnsa.cn/ai/202606/238a55c8dc702fb7.png' AS thumb_url, 1 AS tileable, 'public' AS source, 1 AS status
  UNION ALL SELECT (SELECT id FROM `pattern_category` WHERE name='国潮纹样'), NULL, '九色神鹿',
         'https://cdn.onnsa.cn/ai/202606/08d66227021421b8.png', 'https://cdn.onnsa.cn/ai/202606/08d66227021421b8.png', 1, 'public', 1
  UNION ALL SELECT (SELECT id FROM `pattern_category` WHERE name='国潮纹样'), NULL, '祥云回纹',
         'https://placehold.co/600x600/8e4f43/ffffff.png', 'https://placehold.co/300x300/8e4f43/ffffff.png', 1, 'public', 1
  UNION ALL SELECT (SELECT id FROM `pattern_category` WHERE name='浪漫花卉'), NULL, '水彩碎花',
         'https://placehold.co/600x600/d98aa0/ffffff.png', 'https://placehold.co/300x300/d98aa0/ffffff.png', 1, 'public', 1
  UNION ALL SELECT (SELECT id FROM `pattern_category` WHERE name='浪漫花卉'), NULL, '玫瑰花影',
         'https://placehold.co/600x600/c77b8e/ffffff.png', 'https://placehold.co/300x300/c77b8e/ffffff.png', 1, 'public', 1
  UNION ALL SELECT (SELECT id FROM `pattern_category` WHERE name='几何线条'), NULL, '复古格纹',
         'https://placehold.co/600x600/a8854e/ffffff.png', 'https://placehold.co/300x300/a8854e/ffffff.png', 1, 'public', 1
  UNION ALL SELECT (SELECT id FROM `pattern_category` WHERE name='几何线条'), NULL, '极简条纹',
         'https://placehold.co/600x600/5b9bb8/ffffff.png', 'https://placehold.co/300x300/5b9bb8/ffffff.png', 1, 'public', 1
  UNION ALL SELECT (SELECT id FROM `pattern_category` WHERE name='萌趣卡通'), NULL, '萌趣小猫',
         'https://placehold.co/600x600/e0a85a/ffffff.png', 'https://placehold.co/300x300/e0a85a/ffffff.png', 1, 'public', 1
  UNION ALL SELECT (SELECT id FROM `pattern_category` WHERE name='节气文创'), NULL, '二十四节气·立春',
         'https://placehold.co/600x600/5a8a7d/ffffff.png', 'https://placehold.co/300x300/5a8a7d/ffffff.png', 1, 'public', 1
  UNION ALL SELECT (SELECT id FROM `pattern_category` WHERE name='简约纯色'), NULL, '燕麦米白',
         'https://placehold.co/600x600/c9b89a/ffffff.png', 'https://placehold.co/300x300/c9b89a/ffffff.png', 0, 'public', 1
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM `pattern` WHERE name='敦煌飞天' AND owner_id IS NULL);

-- ── 4. 首页 Banner（无唯一键，按标题守卫幂等）────────────────
INSERT INTO `banner` (`title`, `subtitle`, `image_url`, `link`, `sort`, `status`)
SELECT * FROM (
  SELECT '敦煌入梦 · 国潮新生' AS title, '一键定制你的专属国潮袜款' AS subtitle,
         'https://cdn.onnsa.cn/ai/202606/238a55c8dc702fb7.png' AS image_url, '/pages/feed/index' AS link, 1 AS sort, 1 AS status
  UNION ALL SELECT '九色神鹿 · 限定系列', 'AI 生成花型，独一无二',
         'https://cdn.onnsa.cn/ai/202606/08d66227021421b8.png', '/pages/ai/index', 2, 1
  UNION ALL SELECT '新人专享 · 每日免费生图', '注册即享 5 次 AI 生图',
         'https://placehold.co/750x320/8e4f43/ffffff.png', '/pages/ai/index', 3, 1
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM `banner` WHERE title='敦煌入梦 · 国潮新生');

-- ── 5. 推荐流 / 资讯 / FAQ 文章（按标题守卫幂等）─────────────
INSERT INTO `article` (`kind`, `title`, `cover_url`, `summary`, `content`, `tag`, `sort`, `status`, `published_at`)
SELECT * FROM (
  SELECT 'feed' AS kind, '野趣精灵 · 蝶舞系列' AS title, 'https://cdn.onnsa.cn/ai/202606/238a55c8dc702fb7.png' AS cover_url,
         '灵动蝶舞，点亮夏日穿搭' AS summary, '蝶舞系列以轻盈的蝴蝶纹样搭配清新配色，适合日常与出行。' AS content, '新品' AS tag, 1 AS sort, 1 AS status, NOW() AS published_at
  UNION ALL SELECT 'feed', '松弛田园 · 花影系列', 'https://cdn.onnsa.cn/ai/202606/08d66227021421b8.png',
         '柔和花影，松弛随性', '花影系列融合水彩花卉与莫兰迪配色，温柔耐看。', '热销', 2, 1, NOW()
  UNION ALL SELECT 'feed', '国潮新生 · 祥瑞系列', 'https://placehold.co/600x400/a05a3c/ffffff.png',
         '祥云瑞兽，国风新潮', '祥瑞系列取材传统纹样，重新演绎国潮气质。', '国潮', 3, 1, NOW()
  UNION ALL SELECT 'news', '爱花型 AI 袜版设计平台正式上线', 'https://placehold.co/600x400/8e4f43/ffffff.png',
         '从灵感到成品，一站式 AI 定制', '平台支持 AI 文生图、图生图改色、款式衍生、亲子袜等多种玩法。', '公告', 1, 1, NOW()
  UNION ALL SELECT 'news', '如何用一句话生成专属袜款花型', 'https://placehold.co/600x400/5a8a7d/ffffff.png',
         '输入描述，AI 帮你画', '在 AI 设计页用文字或语音描述需求，即可生成花型并一键定制。', '教程', 2, 1, NOW()
  UNION ALL SELECT 'faq', '起订量和价格是怎样的？', NULL,
         '不同袜型起订量与单价不同', '各袜型起订量一般为 50 双（童袜 30 双），单价随材质与工艺浮动，详见下单页试算。', NULL, 1, 1, NOW()
  UNION ALL SELECT 'faq', '生产周期多久？', NULL,
         '一般 7-15 个工作日', '确认设计并支付后进入生产，常规周期 7-15 个工作日，旺季顺延。', NULL, 2, 1, NOW()
  UNION ALL SELECT 'faq', '支持哪些印花工艺？', NULL,
         '喷墨/印花/绣花/点胶/针织提花', '可根据图案与预算选择不同工艺，下单页可切换并实时试算价格。', NULL, 3, 1, NOW()
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM `article` WHERE title='野趣精灵 · 蝶舞系列');

-- ── 6. 演示用户（phone 唯一）────────────────────────────────
INSERT IGNORE INTO `user` (`phone`, `nickname`, `status`, `ai_quota_daily`) VALUES
  ('13900000001', '演示客户·小花', 1, 5),
  ('13900000002', '演示客户·阿月', 1, 5);

-- ── 7. 演示订单（order_no 唯一，覆盖各状态便于查看订单/物流模块）──
INSERT IGNORE INTO `order`
  (`order_no`, `user_id`, `design_name`, `sizes`, `quantity`, `unit_price`, `total_amount`, `material`, `craft`, `address`, `remark`, `status`, `pay_method`, `paid_at`)
SELECT 'DEMO20260601001', u.id, '敦煌飞天定制袜', '{"M":30,"L":20}', 50, 6.80, 340.00, '棉', '针织提花',
       '浙江省杭州市西湖区文一路1号 演示收件人 13900000001', '演示数据', 'pending', NULL, NULL
FROM (SELECT id FROM `user` WHERE phone='13900000001') u;

INSERT IGNORE INTO `order`
  (`order_no`, `user_id`, `design_name`, `sizes`, `quantity`, `unit_price`, `total_amount`, `material`, `craft`, `address`, `remark`, `status`, `pay_method`, `paid_at`)
SELECT 'DEMO20260601002', u.id, '九色神鹿礼盒袜', '{"S":20,"M":40,"L":20}', 80, 8.80, 704.00, '锦纶', '数码染色',
       '浙江省杭州市西湖区文一路1号 演示收件人 13900000001', '演示数据', 'paid', 'wxpay', NOW()
FROM (SELECT id FROM `user` WHERE phone='13900000001') u;

INSERT IGNORE INTO `order`
  (`order_no`, `user_id`, `design_name`, `sizes`, `quantity`, `unit_price`, `total_amount`, `material`, `craft`, `address`, `remark`, `status`, `pay_method`, `paid_at`)
SELECT 'DEMO20260601003', u.id, '水彩碎花情侣袜', '{"M":50,"L":50}', 100, 5.50, 550.00, '棉', '喷墨印花',
       '上海市浦东新区世纪大道100号 演示收件人 13900000002', '演示数据', 'shipped', 'wxpay', NOW()
FROM (SELECT id FROM `user` WHERE phone='13900000002') u;

INSERT IGNORE INTO `order`
  (`order_no`, `user_id`, `design_name`, `sizes`, `quantity`, `unit_price`, `total_amount`, `material`, `craft`, `address`, `remark`, `status`, `pay_method`, `paid_at`)
SELECT 'DEMO20260601004', u.id, '萌趣小猫童袜', '{"S":30}', 30, 4.50, 135.00, '纯棉', '点胶',
       '上海市浦东新区世纪大道100号 演示收件人 13900000002', '演示数据', 'done', 'wxpay', NOW()
FROM (SELECT id FROM `user` WHERE phone='13900000002') u;

-- ── 8. 演示订单物流（order_id 唯一）─────────────────────────
INSERT IGNORE INTO `order_shipment` (`order_id`, `carrier`, `tracking_no`, `status`, `traces`)
SELECT o.id, '顺丰速运', 'SF1234567890123', 'in-transit',
       '[{"time":"2026-06-02 09:10","desc":"已揽收"},{"time":"2026-06-02 20:30","desc":"杭州转运中心已发出"},{"time":"2026-06-03 08:15","desc":"运输中"}]'
FROM (SELECT id FROM `order` WHERE order_no='DEMO20260601003') o;

INSERT IGNORE INTO `order_shipment` (`order_id`, `carrier`, `tracking_no`, `status`, `traces`)
SELECT o.id, '京东物流', 'JD9876543210987', 'delivered',
       '[{"time":"2026-05-28 10:00","desc":"已揽收"},{"time":"2026-05-29 14:00","desc":"派送中"},{"time":"2026-05-29 17:20","desc":"已签收，感谢使用"}]'
FROM (SELECT id FROM `order` WHERE order_no='DEMO20260601004') o;
