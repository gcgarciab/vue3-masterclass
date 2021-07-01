<template>
  <h1 class="push-top">Welcome to the Forum</h1>

  <CategoryList :categories="categories"/>
</template>

<script>
import CategoryList from '@/components/CategoryList'

export default {
  components: {
    CategoryList
  },

  computed: {
    categories () {
      return this.$store.state.categories
    }
  },

  async beforeCreate () {
    const categories = await this.$store.dispatch('fetchAllCategories')
    const forumIds = categories.map(category => category.forums).flat()
    this.$store.dispatch('fetchForums', { ids: forumIds })
    console.log('Before create', this.categories)
  },

  created () {
    console.log('Created', this.categories)
  },

  beforeMount () {
    console.log('Before mount', this.categories)
  }
}
</script>
