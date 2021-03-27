<template>
  <div class="col-full">
      <form @submit.prevent="save">
        <div class="form-group">
          <textarea
            v-model="text"
            name=""
            id=""
            cols="30"
            rows="10"
          ></textarea>
        </div>

        <div class="form-actions">
          <button class="btn-blue">Submit post</button>
        </div>
      </form>
    </div>
</template>

<script>
export default {
  data () {
    return {
      text: ''
    }
  },

  methods: {
    save () {
      const postId = 'gggg' + Math.random()
      const post = {
        id: postId,
        text: this.text,
        publishedAt: Math.floor(Date.now() / 1000),
        userId: 'rpbB8C6ifrYmNDufMERWfQUoa202'
      }

      this.$emit('save', { post })

      this.text = ''
    }
  }
}
</script>
