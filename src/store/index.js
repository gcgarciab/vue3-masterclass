import { createStore } from 'vuex'
import sourceData from '@/data'

export default createStore({
  state: sourceData,

  actions: {
    createPost (context, post) {
      post.id = 'gggg' + Math.random()
      context.commit('setPost', { post }) // Set the post
      context.commit('appendPostToThread', { postId: post.id, threadId: post.threadId }) // append the post to thread
    }
  },

  mutations: {
    setPost (state, { post }) {
      state.posts.push(post)
    },

    appendPostToThread (state, { postId, threadId }) {
      const thread = state.threads.find(thread => thread.id === threadId)
      thread.posts.push(postId)
    }
  }
})
