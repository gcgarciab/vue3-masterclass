import firebase from 'firebase'

export default {
  state: {
    // authId: 'vdRpwF3D60dJR6Ud0Sv4u9Pcoxn2',
    id: null,
    authUserUnsubscribe: null,
    authObserverUnsubscribe: null
  },

  getters: {
    authUser: (state, getters) => {
      return getters.user(state.authId)
    }
  },

  actions: {
    initAuthentication ({ dispatch, commit, state }) {
      if (state.authObserverUnsubscribe) state.authObserverUnsubscribe()

      return new Promise((resolve) => {
        const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
          console.log('👣 the user has changed')
          dispatch('unsubscribeAuthUserSnapshot')

          if (user) {
            await dispatch('fetchAuthUser')
            resolve(user)
          } else {
            dispatch('signOut')
            resolve(null)
          }
        })

        commit('setAuthObserverUnsubscribe', unsubscribe)
      })
    },

    async fetchAuthUsersPost ({ commit, state }) {
      const posts = await firebase.firestore().collection('posts').where('userId', '==', state.authId).get()
      posts.forEach(item => {
        commit('setItem', { resource: 'posts', item })
      })
    },

    async fetchAuthUser ({ state, dispatch, commit }) {
      const userId = await firebase.auth().currentUser?.uid

      if (userId || state.authId) {
        await dispatch('fetchItem', {
          resource: 'users',
          id: userId,
          emoji: '🙋🏻‍',
          handleUnsubscribe: (unsubscribe) => commit('setAuthUserUnsubscribe', unsubscribe)
        })
        commit('setAuthId', userId)
      }
    },

    async registerUserWithEmailAndPassword ({ dispatch }, { email, name, username, password, avatar = null }) {
      const result = await firebase.auth().createUserWithEmailAndPassword(email, password)
      await dispatch('createUser', { id: result.user.uid, avatar, email, name, username })
    },

    signInWithEmailAndPassword ({ context }, { email, password }) {
      return firebase.auth().signInWithEmailAndPassword(email, password)
    },

    async signInWithGoogle ({ dispatch }) {
      const provider = new firebase.auth.GoogleAuthProvider()
      const response = await firebase.auth().signInWithPopup(provider)
      const user = response.user
      const userRef = firebase.firestore().collection('users').doc(user.uid)
      const userDoc = await userRef.get()

      if (!userDoc.exists) {
        dispatch('createUser', { id: user.uid, name: user.displayName, email: user.email, username: user.email, avatar: user.photoURL })
      } else {
        console.log(user)
      }
    },

    async signOut ({ commit }) {
      await firebase.auth().signOut()
      commit('setAuthId', null)
    },

    async unsubscribeAuthUserSnapshot ({ state, commit }) {
      if (state.authUserUnsubscribe) {
        state.authUserUnsubscribe()
        commit('setAuthUserUnsubscribe', null)
      }
    }
  },

  mutations: {
    setAuthId (state, id) {
      state.id = id
    },

    setAuthUserUnsubscribe (state, unsubscribe) {
      state.authUserUnsubscribe = unsubscribe
    },

    setAuthObserverUnsubscribe (state, unsubscribe) {
      state.authObserverUnsubscribe = unsubscribe
    }
  }
}
