import { createStore } from 'vuex'
import { findById, upsert } from '@/helpers'
import firebase from 'firebase'

export default createStore({
  state: {
    categories: [],
    forums: [],
    threads: [],
    posts: [],
    users: [],
    authId: 'f5xvKdIPQdSrUtT6i3UiHYttRXO2'
  },

  getters: {
    authUser: (state, getters) => {
      return getters.user(state.authId)
    },

    user: state => {
      return (id) => {
        const user = findById(state.users, id)
        if (!user) return null

        return {
          ...user,
          get posts () {
            return state.posts.filter(post => post.userId === user.id)
          },
          get postsCount () {
            return this.posts.length
          },
          get threads () {
            return state.threads.filter(post => post.userId === user.id)
          },
          get threadsCount () {
            return this.threads.length
          }
        }
      }
    },

    thread: state => {
      return (id) => {
        const thread = findById(state.threads, id)

        return {
          ...thread,
          get author () {
            return findById(state.users, thread.userId)
          },
          get repliesCount () {
            return thread.posts.length - 1
          },
          get contributorsCount () {
            return thread.contributors.length
          }
        }
      }
    }
  },

  actions: {
    createPost ({ commit, state }, post) {
      post.id = 'gggg' + Math.random()
      post.userId = state.authId
      post.publishedAt = Math.floor(Date.now() / 1000)
      commit('setItem', { resource: 'posts', item: post }) // Set the post
      commit('appendPostToThread', { childId: post.id, parentId: post.threadId }) // append the post to thread
      commit('appendContributorToThread', { childId: state.authId, parentId: post.threadId }) // append the post to thread
    },

    async createThread ({ commit, state, dispatch }, { text, title, forumId }) {
      const id = 'gggg' + Math.random()
      const userId = state.authId
      const publishedAt = Math.floor(Date.now() / 1000)
      const thread = { forumId, title, publishedAt, userId, id }

      commit('setItem', { resource: 'threads', item: thread })
      commit('appendThreadToUser', { parentId: userId, childId: id })
      commit('appendThreadToForum', { parentId: forumId, childId: id })
      dispatch('createPost', { text, threadId: id })

      return findById(state.threads, id)
    },

    async updateThread ({ commit, state }, { title, text, id }) {
      const thread = findById(state.threads, id)
      const post = findById(state.posts, thread.posts[0].id)
      const newThread = { ...thread, title }
      const newPost = { ...post, text }

      commit('setItem', { resource: 'threads', item: newThread })
      commit('setItem', { resource: 'posts', item: newPost })

      return newThread
    },

    updateUser ({ commit }, user) {
      commit('setItem', { resource: 'users', item: user })
    },

    fetchThread ({ dispatch }, { id }) {
      return dispatch('fetchItem', { resource: 'threads', id, emoji: '📄' })
    },

    fetchUser ({ dispatch }, { id }) {
      return dispatch('fetchItem', { resource: 'users', id, emoji: '🙋🏻‍' })
    },

    fetchPost ({ dispatch }, { id }) {
      return dispatch('fetchItem', { resource: 'posts', id, emoji: '💬' })
    },

    fetchThreads ({ dispatch }, { ids }) {
      return dispatch('fetchItems', { resource: 'threads', ids, emoji: '📄' })
    },

    fetchUsers ({ dispatch }, { ids }) {
      return dispatch('fetchItems', { resource: 'users', ids, emoji: '🙋🏻‍' })
    },

    fetchPosts ({ dispatch }, { ids }) {
      return dispatch('fetchItems', { resource: 'posts', ids, emoji: '💬' })
    },

    fetchItem ({ state, commit }, { id, emoji, resource }) {
      console.log('🔥', emoji, id)
      return new Promise((resolve) => {
        firebase.firestore().collection(resource).doc(id).onSnapshot((doc) => {
          const item = {
            ...doc.data(),
            id: doc.id
          }
          commit('setItem', { resource, id, item })
          resolve(item)
        })
      })
    },

    fetchItems ({ dispatch }, { ids, emoji, resource }) {
      return Promise.all(ids.map(id => dispatch('fetchItem', { id, emoji, resource })))
    }
  },

  mutations: {
    setItem (state, { resource, item }) {
      upsert(state[resource], item)
    },

    appendPostToThread: appendChildToParentMutation({ parent: 'threads', child: 'posts' }),

    appendThreadToForum: appendChildToParentMutation({ parent: 'forums', child: 'threads' }),

    appendThreadToUser: appendChildToParentMutation({ parent: 'users', child: 'threads' }),

    appendContributorToThread: appendChildToParentMutation({ parent: 'threads', child: 'contributors' })
  }
})

function appendChildToParentMutation ({ parent, child }) {
  return (state, { childId, parentId }) => {
    const resource = findById(state[parent], parentId)
    resource[child] = resource[child] || []

    if (!resource[child].includes(childId)) {
      resource[child].push(childId)
    }
  }
}
