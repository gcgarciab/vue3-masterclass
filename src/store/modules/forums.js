import { appendChildToParentMutation } from '@/helpers'

export default {
  namespaced: true,

  state: {
    items: []
  },

  getters: {},

  actions: {
    fetchForum: ({ dispatch }, { id }) => dispatch('fetchItem',
      { resource: 'forums', id, emoji: '🏁' },
      { root: true }
    ),

    fetchForums: ({ dispatch }, { ids }) => dispatch('fetchItems',
      { resource: 'forums', ids, emoji: '🏁' },
      { root: true }
    )
  },

  mutations: {
    appendThreadToForum: appendChildToParentMutation({ parent: 'forums', child: 'threads' })
  }
}
