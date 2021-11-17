import { appendChildToParentMutation } from '@/helpers'

export default {
  state: {
    items: []
  },
  getters: {},
  actions: {
    fetchForums: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'forums', ids, emoji: '🏁' }),

    fetchForum: ({ dispatch }, { id }) => dispatch('fetchItem', { resource: 'forums', id, emoji: '🏁' })
  },
  mutations: {
    appendThreadToForum: appendChildToParentMutation({ parent: 'forums', child: 'threads' })
  }
}
