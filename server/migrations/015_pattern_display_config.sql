-- 花型级浏览页/详情页展示配置
ALTER TABLE `pattern`
  ADD COLUMN `display_config` JSON NULL COMMENT '浏览页条目与详情页展示配置' AFTER `thumb_url`;
