<template>
  <div class="container" style="width: 100%">
    <h1>My profile</h1>
    <div class="flex-grid">
      <div class="col-3 push-top">
        <UserProfileCard v-if="!edit" :user="user"/>
        <UserProfileCardEditor v-else :user="user"/>
      </div>

      <div class="col-7 push-top">
        <div class="profile-header">
          <span class="text-lead"> {{ user.username }} recent activity </span>
          <a href="#">See only started threads?</a>
        </div>

        <hr/>

        <PostList :posts="user.posts" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import PostList from '@/components/PostList'
import UserProfileCard from '@/components/UserProfileCard'
import UserProfileCardEditor from '@/components/UserProfileCardEditor'
import asyncDataStatus from '@/mixins/async-data-status'

export default {
  components: {
    PostList,
    UserProfileCard,
    UserProfileCardEditor
  },

  mixins: [asyncDataStatus],

  props: {
    edit: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    ...mapGetters('auth', { user: 'authUser' }),

    lastPostFetched () {
      if (this.user.posts.length === 0) return null

      return this.user.posts[this.user.posts.length - 1]
    }
  },

  async created () {
    await this.$store.dispatch('auth/fetchAuthUsersPost', {
      startAfter: this.lastPostFetched
    })

    this.asyncDataStatus_fetched()
  }
}
</script>
