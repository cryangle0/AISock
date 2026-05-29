import { defineStore } from 'pinia'

interface AppState {
  collapsed: boolean
}

const useAppStore = defineStore('app', {
  state: (): AppState => ({
    collapsed: false,
  }),
  actions: {
    toggleCollapsed() {
      this.collapsed = !this.collapsed
    },
  },
})

export default useAppStore
