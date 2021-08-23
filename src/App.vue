<template>
  <TheNavbar/>
  <div class="container">
    <router-view v-show="showPage" @ready="showPage = true"/>
    <AppSpinner v-show="!showPage" />
  </div>
</template>

<script>
import TheNavbar from '@/components/TheNavbar'
import { mapActions } from 'vuex'
import AppSpinner from '@/components/AppSpinner'

export default {
  name: 'App',

  components: { AppSpinner, TheNavbar },

  data () {
    return {
      showPage: false
    }
  },

  methods: {
    ...mapActions(['fetchAuthUser'])
  },

  created () {
    this.fetchAuthUser()
    this.$router.beforeEach(() => {
      this.showPage = false
    })
  }
}
</script>

<style>
  @import "assets/style.css";
</style>
