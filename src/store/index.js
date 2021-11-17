import { createStore } from 'vuex'
import state from './state'
import getters from './getters'
import actions from './actions'
import mutations from './mutations'
import categories from '@/store/modules/categories'
import forums from '@/store/modules/forums'
import threads from '@/store/modules/threads'
import posts from '@/store/modules/posts'
import users from '@/store/modules/users'
import auth from '@/store/modules/auth'

export default createStore({
  modules: {
    categories,
    forums,
    threads,
    posts,
    users,
    auth
  },

  state,
  getters,
  actions,
  mutations
})
