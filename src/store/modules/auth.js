import firebase from 'firebase'

export default {
  namespaced: true,

  state: {
    // authId: 'vdRpwF3D60dJR6Ud0Sv4u9Pcoxn2',
    authId: null,
    authUserUnsubscribe: null,
    authObserverUnsubscribe: null
  },

  getters: {
    authUser: (state, getters, rootState, rootGetters) => {
      return rootGetters['users/user'](state.authId)
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

    async fetchAuthUsersPost ({ commit, state }, { startAfter }) {
      let query = await firebase.firestore().collection('posts')
        .where('userId', '==', state.authId)
        .orderBy('publishedAt', 'desc')
        .limit(3)

      if (startAfter) {
        const doc = await firebase.firestore().collection('posts').doc(startAfter.id).get()
        query = query.startAfter(doc)
      }

      const posts = await query.get()

      posts.forEach(item => {
        commit('setItem', { resource: 'posts', item }, { root: true })
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
        },
        { root: true }
        )
        commit('setAuthId', userId)
      }
    },

    async registerUserWithEmailAndPassword ({ dispatch }, { email, name, username, password, avatar = null }) {
      const result = await firebase.auth().createUserWithEmailAndPassword(email, password)
      await dispatch('users/createUser', { id: result.user.uid, avatar, email, name, username }, { root: true })
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
        dispatch('users/createUser',
          { id: user.uid, name: user.displayName, email: user.email, username: user.email, avatar: user.photoURL },
          { root: true }
        )
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
      state.authId = id
    },

    setAuthUserUnsubscribe (state, unsubscribe) {
      state.authUserUnsubscribe = unsubscribe
    },

    setAuthObserverUnsubscribe (state, unsubscribe) {
      state.authObserverUnsubscribe = unsubscribe
    }
  }
}
