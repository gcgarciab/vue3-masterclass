import firebase from 'firebase'

export default {
  fetchItems ({ dispatch }, { ids, emoji, resource }) {
    return Promise.all(ids.map(id => dispatch('fetchItem', { id, emoji, resource })))
  },

  fetchItem ({ state, commit }, { id, emoji, resource, handleUnsubscribe = null }) {
    console.log('🔥', emoji, id)
    return new Promise((resolve) => {
      const unsubscribe = firebase.firestore().collection(resource).doc(id).onSnapshot((doc) => {
        if (doc.exists) {
          const item = { ...doc.data(), id: doc.id }
          commit('setItem', { resource, id, item })
          resolve(item)
        } else {
          resolve(null)
        }
      })

      if (handleUnsubscribe) {
        handleUnsubscribe(unsubscribe)
      } else {
        commit('appendUnsubscribe', { unsubscribe })
      }
    })
  },

  async unsubscribeAllSnapshots ({ state, commit }) {
    state.unsubscribes.forEach(unsubscribe => unsubscribe())
    commit('clearAllUnsubscribes')
  }
}
