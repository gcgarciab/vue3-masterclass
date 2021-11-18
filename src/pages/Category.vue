<template>
  <section v-if="asyncDataStatus_ready" class="container">
    <h1>{{ category.name }}</h1>

    <ForumList
      :title="category.name"
      :forums="getCategoryForums(category)"/>
  </section>
</template>

<script>
import ForumList from '@/components/ForumList'
import { findById } from '@/helpers'
import { mapActions } from 'vuex'
import asyncDataStatus from '@/mixins/async-data-status'

export default {
  components: {
    ForumList
  },

  mixins: [asyncDataStatus],

  props: {
    id: {
      required: true,
      type: String
    }
  },

  computed: {
    category () {
      return findById(this.$store.state.categories.items, this.id) || {}
    }
  },

  methods: {
    ...mapActions('categories', ['fetchCategory']),
    ...mapActions('forums', ['fetchForums']),

    getCategoryForums (category) {
      return this.$store.state.forums.items.filter(forum => forum.categoryId === category.id)
    }
  },

  async created () {
    const category = await this.fetchCategory({ id: this.id })
    await this.fetchForums({ ids: category.forums })
    this.asyncDataStatus_fetched()
  }
}
</script>
