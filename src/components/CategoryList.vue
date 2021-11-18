<template>
  <ForumList
    v-for="category in categories"
    :key="category.id"
    :category-id="category.id"
    :title="category.name"
    :forums="getCategoryForums(category)"/>
</template>

<script>
import ForumList from '@/components/ForumList'

export default {
  components: {
    ForumList
  },

  props: {
    categories: {
      required: true,
      type: Array
    }
  },

  methods: {
    getCategoryForums (category) {
      return this.$store.state.forums.items.filter(forum => forum.categoryId === category.id)
    }
  }
}
</script>
