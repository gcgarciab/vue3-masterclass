import { createStore } from 'vuex'
import sourceData from '@/data'
import { findById, upsert } from '@/helpers'

export default createStore({
  state: {
    ...sourceData,
    authId: 'f5xvKdIPQdSrUtT6i3UiHYttRXO2'
  },

  getters: {
    authUser: state => {
      const user = findById(state.users, state.authId)
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
      commit('setPost', { post }) // Set the post
      commit('appendPostToThread', { childId: post.id, parentId: post.threadId }) // append the post to thread
      commit('appendContributorToThread', { childId: state.authId, parentId: post.threadId }) // append the post to thread
    },

    async createThread ({ commit, state, dispatch }, { text, title, forumId }) {
      const id = 'gggg' + Math.random()
      const userId = state.authId
      const publishedAt = Math.floor(Date.now() / 1000)
      const thread = { forumId, title, publishedAt, userId, id }

      commit('setThread', { thread })
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

      commit('setThread', { thread: newThread })
      commit('setPost', { post: newPost })

      return newThread
    },

    updateUser ({ commit }, user) {
      commit('setUser', { user, userId: user.id })
    }
  },

  mutations: {
    setPost (state, { post }) {
      upsert(state.posts, post)
    },

    setThread (state, { thread }) {
      upsert(state.threads, thread)
    },

    setUser (state, { user, userId }) {
      const userIndex = state.users.findIndex(user => user.id === userId)
      state.users[userIndex] = user
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
