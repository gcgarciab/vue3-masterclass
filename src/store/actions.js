import { docToResource, findById } from '@/helpers'
import firebase from 'firebase'

export default {
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

  async createPost ({ commit, state }, post) {
    post.userId = state.authId
    post.publishedAt = firebase.firestore.FieldValue.serverTimestamp()

    const batch = firebase.firestore().batch()
    const postRef = firebase.firestore().collection('posts').doc()
    const threadRef = firebase.firestore().collection('threads').doc(post.threadId)
    const userRef = firebase.firestore().collection('users').doc(state.authId)
    batch.set(postRef, post)
    batch.update(threadRef, {
      posts: firebase.firestore.FieldValue.arrayUnion(postRef.id),
      contributors: firebase.firestore.FieldValue.arrayUnion(state.authId)
    })
    batch.update(userRef, { postsCount: firebase.firestore.FieldValue.increment(1) })
    await batch.commit()
    const newPost = await postRef.get()

    commit('setItem', { resource: 'posts', item: newPost }) // Set the post
    commit('appendPostToThread', { childId: newPost.id, parentId: post.threadId }) // append the post to thread
    commit('appendContributorToThread', { childId: state.authId, parentId: post.threadId }) // append the post to thread
  },

  async createThread ({ commit, state, dispatch }, { text, title, forumId }) {
    const userId = state.authId
    const publishedAt = firebase.firestore.FieldValue.serverTimestamp()
    const threadRef = firebase.firestore().collection('threads').doc()
    const thread = { forumId, title, publishedAt, userId, id: threadRef.id }
    const forumRef = firebase.firestore().collection('forums').doc(forumId)
    const userRef = firebase.firestore().collection('users').doc(userId)
    const batch = firebase.firestore().batch()

    batch.set(threadRef, thread)
    batch.update(userRef, { threads: firebase.firestore.FieldValue.arrayUnion(threadRef.id) })
    batch.update(forumRef, { threads: firebase.firestore.FieldValue.arrayUnion(threadRef.id) })
    await batch.commit()
    const newThread = await threadRef.get()

    commit('setItem', { resource: 'threads', item: newThread })
    commit('appendThreadToUser', { parentId: userId, childId: thread.id })
    commit('appendThreadToForum', { parentId: forumId, childId: thread.id })
    await dispatch('createPost', { text, threadId: thread.id })

    return findById(state.threads, thread.id)
  },

  async updateThread ({ commit, state }, { title, text, id }) {
    const thread = findById(state.threads, id)
    const post = findById(state.posts, thread.posts[0])
    let newThread = { ...thread, title }
    let newPost = { ...post, text }
    const threadRef = firebase.firestore().collection('threads').doc(id)
    const postRef = firebase.firestore().collection('posts').doc(post.id)
    const batch = firebase.firestore().batch()

    batch.update(threadRef, newThread)
    batch.update(postRef, newPost)
    await batch.commit()
    newThread = await threadRef.get()
    newPost = await postRef.get()

    commit('setItem', { resource: 'threads', item: newThread })
    commit('setItem', { resource: 'posts', item: newPost })

    return docToResource(newThread)
  },

  async updatePost ({ commit, state }, { text, id }) {
    const post = {
      text,
      edited: {
        at: firebase.firestore.FieldValue.serverTimestamp(),
        by: state.authId,
        moderated: false
      }
    }

    const postRef = firebase.firestore().collection('posts').doc(id)
    await postRef.update(post)
    const updatedPost = await postRef.get()
    commit('setItem', { resource: 'posts', item: updatedPost })
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

  async createUser ({ commit }, { id, email, name, username, avatar = null }) {
    const registeredAt = firebase.firestore.FieldValue.serverTimestamp()
    const usernameLower = username.toLowerCase()
    email = email.toLowerCase()
    const user = { avatar, email, name, username, usernameLower, registeredAt }

    const userRef = await firebase.firestore().collection('users').doc(id)
    userRef.set(user)
    const newUser = await userRef.get()

    commit('setItem', { resource: 'users', item: newUser })
    return docToResource(newUser)
  },

  async updateUser ({ commit }, user) {
    const updates = {
      avatar: user.avatar || null,
      username: user.username || null,
      name: user.name || null,
      bio: user.bio || null,
      website: user.website || null,
      email: user.email || null,
      location: user.location || null
    }

    const userRef = firebase.firestore().collection('users').doc(user.id)
    await userRef.update(updates)
    commit('setItem', { resource: 'users', item: user })
  },

  async fetchAuthUsersPost ({ commit, state }) {
    const posts = await firebase.firestore().collection('posts').where('userId', '==', state.authId).get()
    posts.forEach(item => {
      commit('setItem', { resource: 'posts', item })
    })
  },

  // ---------------------------------------------------------
  // Fetch all categories
  // ---------------------------------------------------------

  fetchAllCategories ({ commit }) {
    console.log('🔥', '🏷', 'all')
    return new Promise((resolve) => {
      firebase.firestore().collection('categories').onSnapshot((querySnapshot) => {
        const categories = querySnapshot.docs.map(doc => {
          const item = { id: doc.id, ...doc.data() }
          commit('setItem', { resource: 'categories', item })

          return item
        })

        resolve(categories)
      })
    })
  },

  // ---------------------------------------------------------
  // Fetch multiple resources
  // ---------------------------------------------------------

  fetchCategories: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'categories', ids, emoji: '🏷' }),
  fetchForums: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'forums', ids, emoji: '🏁' }),
  fetchThreads: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'threads', ids, emoji: '📄' }),
  fetchUsers: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'users', ids, emoji: '🙋🏻‍' }),
  fetchPosts: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'posts', ids, emoji: '💬' }),

  fetchItems ({ dispatch }, { ids, emoji, resource }) {
    return Promise.all(ids.map(id => dispatch('fetchItem', { id, emoji, resource })))
  },

  // ---------------------------------------------------------
  // Fetch single resource
  // ---------------------------------------------------------

  fetchCategory: ({ dispatch }, { id }) => dispatch('fetchItem', { resource: 'categories', id, emoji: '🏷' }),
  fetchForum: ({ dispatch }, { id }) => dispatch('fetchItem', { resource: 'forums', id, emoji: '🏁' }),
  fetchThread: ({ dispatch }, { id }) => dispatch('fetchItem', { resource: 'threads', id, emoji: '📄' }),
  fetchPost: ({ dispatch }, { id }) => dispatch('fetchItem', { resource: 'posts', id, emoji: '💬' }),
  fetchUser: ({ dispatch }, { id }) => dispatch('fetchItem', { resource: 'users', id, emoji: '🙋🏻‍' }),

  fetchAuthUser: async ({ state, dispatch, commit }) => {
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
  },

  async unsubscribeAuthUserSnapshot ({ state, commit }) {
    if (state.authUserUnsubscribe) {
      state.authUserUnsubscribe()
      commit('setAuthUserUnsubscribe', null)
    }
  }
}
