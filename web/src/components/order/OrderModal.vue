<template>
  <BaseModal title="提交订单" :subtitle="`${total} 双 · 工厂 5 分钟接单`" size="md" @close="$emit('close')">
    <div class="form">
      <!-- 设计名称 -->
      <section class="field">
        <label class="field-label">设计名称</label>
        <input v-model="designName" class="ipt" placeholder="给这个袜版取个名字" />
      </section>

      <!-- 尺码与数量 -->
      <section class="field">
        <label class="field-label">尺码与数量</label>
        <div v-for="s in sizeList" :key="s" class="size-line">
          <span class="size-tag">{{ s }}</span>
          <button class="step-btn" type="button" @click="stepSize(s, -10)">−</button>
          <input class="size-ipt" type="number" :value="sizes[s]" @input="onSizeInput(s, $event)" />
          <button class="step-btn" type="button" @click="stepSize(s, 10)">＋</button>
          <span class="size-unit">双</span>
        </div>
        <div class="size-total">合计 <b>{{ total }}</b> 双（起订 {{ MIN_ORDER }} 双）</div>
      </section>

      <!-- 材质 -->
      <section class="field">
        <label class="field-label">面料材质</label>
        <div class="chip-row">
          <button
            v-for="m in materials"
            :key="m.value"
            type="button"
            :class="['chip-card', { active: material === m.value }]"
            @click="material = m.value"
          >
            <span class="chip-name">{{ m.label }}</span>
            <span class="chip-desc">{{ m.desc }}</span>
            <span class="chip-price">¥{{ UNIT_PRICE[m.value].toFixed(1) }}/双</span>
          </button>
        </div>
      </section>

      <!-- 工艺 -->
      <section class="field">
        <label class="field-label">工艺选型</label>
        <div class="chip-row">
          <button
            v-for="c in crafts"
            :key="c.value"
            type="button"
            :class="['chip-card', { active: craft === c.value }]"
            @click="craft = c.value"
          >
            <span class="chip-name">{{ c.label }}</span>
            <span class="chip-desc">{{ c.desc }}</span>
            <span class="chip-price">{{ CRAFT_FEE[c.value] ? `+¥${CRAFT_FEE[c.value].toFixed(1)}` : '不加价' }}</span>
          </button>
        </div>
      </section>

      <!-- 收货信息 -->
      <section class="field">
        <label class="field-label">收货信息</label>
        <div class="input-row">
          <input v-model="contact" class="ipt" placeholder="联系人" />
          <input v-model="phone" class="ipt" type="tel" placeholder="手机号" />
        </div>
        <input v-model="address" class="ipt" placeholder="详细地址（省/市/区/街道）" />
      </section>

      <!-- 备注 -->
      <section class="field">
        <label class="field-label">备注（选填）</label>
        <textarea v-model="note" class="ipt textarea" placeholder="包装要求、加急说明等" />
      </section>
    </div>

    <template #footer>
      <button class="cta secondary" @click="$emit('close')">取消</button>
      <button class="cta primary" :disabled="!canSubmit" @click="submit">
        下一步：去支付（¥{{ estimate.toFixed(2) }}）
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { MATERIALS, CRAFTS, SIZE_LIST, UNIT_PRICE, CRAFT_FEE, DEFAULT_SIZES } from '@/data/order'

export interface OrderFormData {
  designName: string
  sizes: Record<string, number>
  total: number
  material: string
  materialValue: string
  craft: string
  craftValue: string
  contact: string
  phone: string
  address: string
  note: string
}

const props = defineProps<{ defaultDesignName?: string }>()
const emit = defineEmits<{ close: []; submit: [data: OrderFormData] }>()

const MIN_ORDER = 50
const materials = MATERIALS
const crafts = CRAFTS
const sizeList = SIZE_LIST

const designName = ref(props.defaultDesignName || '未命名袜版')
const sizes = reactive<Record<string, number>>({ ...DEFAULT_SIZES })
const material = ref('cotton')
const craft = ref('uv')
const contact = ref('')
const phone = ref('')
const address = ref('')
const note = ref('')

const total = computed(() => Object.values(sizes).reduce((a, b) => a + b, 0))
const unit = computed(() => UNIT_PRICE[material.value] || 6.8)
const fee = computed(() => CRAFT_FEE[craft.value] || 0)
const estimate = computed(() => total.value * (unit.value + fee.value))

const canSubmit = computed(
  () =>
    total.value >= MIN_ORDER &&
    !!contact.value.trim() &&
    /^1\d{10}$/.test(phone.value.trim()) &&
    !!address.value.trim(),
)

function stepSize(s: string, delta: number) {
  sizes[s] = Math.max(0, sizes[s] + delta)
}
function onSizeInput(s: string, e: Event) {
  sizes[s] = Math.max(0, Number((e.target as HTMLInputElement).value) || 0)
}

function submit() {
  if (!canSubmit.value) return
  const m = materials.find((x) => x.value === material.value)
  const c = crafts.find((x) => x.value === craft.value)
  emit('submit', {
    designName: designName.value || '未命名袜版',
    sizes: Object.fromEntries(Object.entries(sizes).filter(([, v]) => v > 0)),
    total: total.value,
    material: m?.label || '精梳棉',
    materialValue: material.value,
    craft: c?.label || 'UV 印花',
    craftValue: craft.value,
    contact: contact.value.trim(),
    phone: phone.value.trim(),
    address: address.value.trim(),
    note: note.value.trim(),
  })
}
</script>

<style scoped>
.field {
  margin-bottom: 18px;
}
.field-label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 8px;
}
.ipt {
  width: 100%;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
  background: var(--bg);
  box-sizing: border-box;
}
.ipt:focus {
  border-color: var(--primary);
  outline: none;
}
.textarea {
  height: 72px;
  padding: 10px 12px;
  resize: vertical;
  font-family: inherit;
}
.input-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.input-row .ipt {
  flex: 1;
}
.size-line {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.size-tag {
  width: 36px;
  font-size: 14px;
  font-weight: 700;
}
.step-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  font-size: 18px;
  color: var(--text-2);
  cursor: pointer;
}
.size-ipt {
  width: 80px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
}
.size-unit {
  font-size: 13px;
  color: var(--text-3);
}
.size-total {
  text-align: right;
  font-size: 13px;
  color: var(--text-2);
  margin-top: 6px;
}
.size-total b {
  color: var(--primary);
  font-size: 16px;
}
.chip-row {
  display: flex;
  gap: 10px;
}
.chip-card {
  flex: 1;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  background: var(--bg-card);
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}
.chip-card.active {
  border-color: var(--primary);
  background: var(--primary-soft);
}
.chip-name {
  font-size: 14px;
  font-weight: 700;
}
.chip-desc {
  font-size: 11px;
  color: var(--text-3);
}
.chip-price {
  font-size: 12px;
  color: var(--primary);
  font-weight: 600;
  margin-top: 2px;
}
.cta {
  flex: 1;
  height: 44px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.cta.secondary {
  background: var(--bg-hover);
  color: var(--text-2);
}
.cta.primary {
  background: var(--primary);
  color: #fff;
}
.cta.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
