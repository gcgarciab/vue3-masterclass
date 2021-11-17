import firebase from 'firebase'
import { appendChildToParentMutation, docToResource, findById } from '@/helpers'

export default {
  state: {
    items: []
  },

  getters: {
    thread: state => {
      return (id) => {
        const thread = findById(state.items, id)

        if (!thread) return {}
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

      return findById(state.items, thread.id)
    },

    async updateThread ({ commit, state }, { title, text, id }) {
      const thread = findById(state.items, id)
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

    fetchThread: ({ dispatch }, { id }) => dispatch('fetchItem', { resource: 'threads', id, emoji: '📄' }),

    fetchThreads: ({ dispatch }, { ids }) => dispatch('fetchItems', { resource: 'threads', ids, emoji: '📄' })
  },

  mutations: {
    appendPostToThread: appendChildToParentMutation({ parent: 'threads', child: 'posts' }),

    appendContributorToThread: appendChildToParentMutation({ parent: 'threads', child: 'contributors' })
  }
}
