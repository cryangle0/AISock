import { useState } from 'react'
import { Plus, Edit3, Trash2 } from 'lucide-react'

const INITIAL_ADDRESSES = [
  { id: 1, name: '张三', phone: '138 8888 8888', address: '浙江省杭州市西湖区文一路 123 号 3 栋 501', tag: '家', isDefault: true },
  { id: 2, name: '张三', phone: '138 8888 8888', address: '浙江省杭州市余杭区未来科技城橙园 5 号楼', tag: '公司', isDefault: false },
  { id: 3, name: '妈妈', phone: '139 7777 7777', address: '江苏省苏州市姑苏区人民路 888 号', tag: '父母', isDefault: false },
]

export default function CAddresses() {
  const [addresses, setAddresses] = useState(INITIAL_ADDRESSES)

  const setDefault = (id) => {
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })))
  }

  const remove = (id) => {
    setAddresses(prev => {
      const next = prev.filter(a => a.id !== id)
      // 保证至少一个默认
      if (next.length && !next.some(a => a.isDefault)) next[0].isDefault = true
      return next
    })
  }

  return (
    <div className="mp-page mp-page-addresses">
      {addresses.length > 0 ? (
        <div className="mp-addr-list">
          {addresses.map(a => (
            <div key={a.id} className={`mp-addr-card ${a.isDefault ? 'default' : ''}`}>
              <div className="mp-addr-head">
                <span className="mp-addr-name">{a.name}</span>
                <span className="mp-addr-phone">{a.phone}</span>
                {a.tag && <span className="mp-addr-tag">{a.tag}</span>}
                {a.isDefault && <span className="mp-addr-default">默认</span>}
              </div>
              <div className="mp-addr-detail">{a.address}</div>
              <div className="mp-addr-actions">
                {!a.isDefault && (
                  <button className="mp-addr-btn" onClick={() => setDefault(a.id)}>
                    设为默认
                  </button>
                )}
                <button className="mp-addr-btn">
                  <Edit3 size={11} /> 编辑
                </button>
                <button
                  className="mp-addr-btn danger"
                  onClick={() => remove(a.id)}
                  disabled={addresses.length <= 1}
                >
                  <Trash2 size={11} /> 删除
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mp-empty-state">
          <p>暂无地址</p>
        </div>
      )}

      <button className="mp-addr-add-btn">
        <Plus size={14} /> 新增收货地址
      </button>
    </div>
  )
}
