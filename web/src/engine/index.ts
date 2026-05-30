/**
 * 设计器渲染引擎 — 统一出口。
 * 纯 TS 模块（无框架耦合）+ 一个 Vue 组合式封装，便于复用与扩展。
 */
export * from './types'
export * from './patternImage'
export * from './imageLoader'
export * from './colorMapping'
export * from './sockMasks'
export * from './sockRenderer'
export * from './hitTest'
export * from './styleVariants'
export { useSockResources } from './useSockResources'
