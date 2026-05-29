<template>
  <BottomSheet title="提交订单" :subtitle="`${total} 双 · 5 分钟交付`" size="tall" @close="$emit('close')">
    <view class="form">
      <view class="field">
        <text class="field-label">设计名称</text>
        <input v-model="designName" class="ipt" placeholder="给这个袜版取个名字" />
      </view>

      <view class="field">
        <text class="field-label">尺码与数量</text>
        <view v-for="s in sizeList" :key="s" class="size-line">
          <text class="size-tag">{{ s }}</text>
          <view class="step-btn" @tap="stepSize(s, -10)">−</view>
          <input type="number" :value="sizes[s]" class="size-ipt" @input="onSizeInput(s, $event)" />
          <view class="step-btn" @tap="stepSize(s, 10)">＋</view>
          <text class="size-unit">双</text>
        </view>
        <view class="size-total">合计 <text class="total-num">{{ total }}</text> 双</view>
      </view>

      <view class="field">
        <text class="field-label">面料材质</text>
        <view class="chip-row">
          <view v-for="m in materials" :key="m.value" :class="['chip-card', { active: material === m.value }]" @tap="material = m.value">
            <text class="chip-name">{{ m.label }}</text>
            <text class="chip-desc">{{ m.desc }}</text>
          </view>
        </view>
      </view>

      <view class="field">
        <text class="field-label">工艺选型</text>
        <view class="chip-row">
          <view v-for="c in crafts" :key="c.value" :class="['chip-card', { active: craft === c.value }]" @tap="craft = c.value">
            <text class="chip-name">{{ c.label }}</text>
            <text class="chip-desc">{{ c.desc }}</text>
          </view>
        </view>
      </view>

      <view class="field">
        <text class="field-label">收货信息</text>
        <view class="input-row">
          <input v-model="contact" class="ipt" placeholder="联系人" />
          <input v-model="phone" class="ipt" type="number" placeholder="手机号" />
        </view>
        <input v-model="address" class="ipt" placeholder="详细地址（省/市/区/街道）" />
      </view>

      <view class="field">
        <text class="field-label">备注（选填）</text>
        <textarea v-model="note" class="ipt textarea" placeholder="包装要求、加急说明等" />
      </view>
    </view>

    <template #footer>
      <view class="footer-row">
        <button class="cta secondary" @tap="$emit('close')">取消</button>
        <button class="cta primary" :disabled="!canSubmit" @tap="submit">下一步：去支付</button>
      </view>
    </template>
  </BottomSheet>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import BottomSheet from '@/components/BottomSheet.vue'
import { MATERIALS, CRAFTS, SIZE_LIST } from '@aisock/common'

const props = defineProps<{ defaultDesignName?: string }>()
const emit = defineEmits<{ close: []; submit: [data: OrderData] }>()

interface OrderData {
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

const materials = MATERIALS
const crafts = CRAFTS
const sizeList = SIZE_LIST

const designName = ref(props.defaultDesignName || '未命名袜版')
const sizes = reactive<Record<string, number>>({ S: 0, M: 50, L: 30, XL: 0 })
const material = ref('cotton')
const craft = ref('uv')
const contact = ref('')
const phone = ref('')
const address = ref('')
const note = ref('')

const total = computed(() => Object.values(sizes).reduce((a, b) => a + b, 0))
const canSubmit = computed(() => total.value > 0 && !!contact.value.trim() && !!phone.value.trim() && !!address.value.trim())

function stepSize(s: string, delta: number) {
  sizes[s] = Math.max(0, sizes[s] + delta)
}
function onSizeInput(s: string, e: any) {
  sizes[s] = Math.max(0, Number(e.detail.value) || 0)
}
function submit() {
  if (!canSubmit.value) return
  const m = materials.find((x) => x.value === material.value)
  const c = crafts.find((x) => x.value === craft.value)
  emit('submit', {
    designName: designName.value,
    sizes: Object.fromEntries(Object.entries(sizes).filter(([, v]) => v > 0)),
    total: total.value,
    material: m?.label || '棉',
    materialValue: material.value,
    craft: c?.label || 'UV 印花',
    craftValue: craft.value,
    contact: contact.value,
    phone: phone.value,
    address: address.value,
    note: note.value,
  })
}
</script>

<style scoped lang="scss">
@import '@aisock/common/styles/variables.scss';

.field {
  margin-bottom: 24rpx;
}
.field-label {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  color: $mp-text-primary;
  margin-bottom: 12rpx;
}
.ipt {
  width: 100%;
  height: 76rpx;
  border: 1rpx solid $mp-border;
  border-radius: 14rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
  background: $mp-bg-card;
  box-sizing: border-box;
}
.textarea {
  height: 120rpx;
  padding: 16rpx 20rpx;
}
.input-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 12rpx;
}
.input-row .ipt {
  flex: 1;
}
.size-line {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}
.size-tag {
  width: 50rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: $mp-text-primary;
}
.step-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 12rpx;
  border: 1rpx solid $mp-border;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  color: $mp-text-secondary;
}
.size-ipt {
  width: 120rpx;
  height: 56rpx;
  border: 1rpx solid $mp-border;
  border-radius: 12rpx;
  text-align: center;
  font-size: 26rpx;
}
.size-unit {
  font-size: 24rpx;
  color: $mp-text-muted;
}
.size-total {
  text-align: right;
  font-size: 24rpx;
  color: $mp-text-secondary;
  margin-top: 8rpx;
}
.total-num {
  color: $mp-primary;
  font-weight: 700;
  font-size: 30rpx;
}
.chip-row {
  display: flex;
  gap: 12rpx;
}
.chip-card {
  flex: 1;
  padding: 16rpx;
  border: 1rpx solid $mp-border;
  border-radius: 14rpx;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.chip-card.active {
  border-color: $mp-primary;
  background: $mp-primary-soft;
}
.chip-name {
  font-size: 26rpx;
  font-weight: 600;
  color: $mp-text-primary;
}
.chip-desc {
  font-size: 20rpx;
  color: $mp-text-muted;
}
.footer-row {
  display: flex;
  gap: 16rpx;
}
.cta {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  padding: 0;
}
.cta.secondary {
  background: $mp-bg;
  color: $mp-text-secondary;
}
.cta.primary {
  background: $mp-primary;
  color: #fff;
}
.cta.primary[disabled] {
  opacity: 0.5;
}
</style>
