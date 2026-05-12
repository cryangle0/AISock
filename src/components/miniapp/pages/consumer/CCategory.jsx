import { useState } from 'react'
import { Filter } from 'lucide-react'

const TABS = ['全部', '男袜', '女袜', '亲子', '运动']
const PRODUCTS = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: ['碎花甜美', '商务经典', '运动透气', '亲子同款', '薄荷清新', '海蓝度假', '金色奢华', '梦幻大花'][i],
  price: `¥${[28, 32, 26, 45, 26, 30, 38, 35][i]}`,
  sales: [1200, 890, 2100, 560, 780, 430, 320, 670][i],
  color: ['#fce8ef', '#e8f0fc', '#eaf6f0', '#fff8e7', '#eaf6f0', '#e8f0fc', '#fff8e7', '#fce8ef'][i],
}))

export default function CCategory({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('全部')

  return (
    <div className="mp-page">
      {/* 分类 tab */}
      <div className="mp-filter-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`mp-filter-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="mp-filter-bar">
        <button className="mp-filter-btn"><Filter size={11} /> 筛选</button>
        <span className="mp-filter-count">{PRODUCTS.length} 款</span>
      </div>

      {/* 商品列表 */}
      <div className="mp-product-grid cols-2">
        {PRODUCTS.map(item => (
          <button key={item.id} className="mp-product-card" onClick={() => onNavigate('c-detail')}>
            <div className="mp-product-img" style={{ background: item.color }}>
              <div className="mp-product-placeholder" />
            </div>
            <div className="mp-product-info">
              <span className="mp-product-name">{item.name}</span>
              <div className="mp-product-meta">
                <span className="mp-product-price">{item.price}</span>
                <span className="mp-product-sales">已售 {item.sales}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
