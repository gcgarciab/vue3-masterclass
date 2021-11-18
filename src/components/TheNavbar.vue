<!--suppress JSUnresolvedVariable -->
<template>
  <header class="header" id="header"
    v-click-outside="closeMobileNavbar"
    v-page-scroll="closeMobileNavbar"
  >
    <router-link :to="{ name: 'Home' }" class="logo">
      <img src="../assets/svg/vueschool-logo.svg" alt="Vueschool logo">
    </router-link>

    <div class="btn-hamburger" @click="mobileNavMenu = !mobileNavMenu">
      <!-- use .btn-hamburger-active to open the menu -->
      <div class="top bar"></div>
      <div class="middle bar"></div>
      <div class="bottom bar"></div>
    </div>

    <!-- use .navbar-open to open nav -->
    <nav class="navbar" :class="{ 'navbar-open': mobileNavMenu }">
      <ul>
        <li v-if="authUser" class="navbar-user">
          <a
            @click.prevent="userDropdownOpen = !userDropdownOpen"
            v-click-outside="closeDropdown"
          >
            <img class="avatar-small" :src="authUser.avatar" :alt="authUser.name">
            <span>
              {{ authUser.name }}
              <img class="icon-profile" src="../assets/svg/arrow-profile.svg" alt="Arrow profile">
            </span>
          </a>

          <!-- dropdown menu -->
          <!-- add class "active-drop" to show the dropdown -->
          <div id="user-dropdown" :class="{ 'active-drop': userDropdownOpen }">
            <div class="triangle-drop"></div>
            <ul class="dropdown-menu">
              <li class="dropdown-menu-item"><router-link :to="{ name: 'Profile' }">View profile</router-link></li>
              <li class="dropdown-menu-item"><a @click.prevent="signOut()">Sign Out</a></li>
            </ul>
          </div>
        </li>
        <li v-if="!authUser" class="navbar-item">
          <router-link :to="{ name: 'SignIn' }">Sign In</router-link>
        </li>
        <li v-if="!authUser" class="navbar-item">
          <router-link :to="{ name: 'Register' }">Register</router-link>
        </li>
        <li v-if="authUser" class="navbar-mobile-item">
          <router-link :to="{ name: 'Profile' }">View Profile</router-link>
        </li>
        <li v-if="authUser" class="navbar-mobile-item">
          <a @click.prevent="signOut()">Sign Out</a>
        </li>
      </ul>

      <!-- <ul>
        <li class="navbar-item">
          <a href="index.html">Home</a>
        </li>
        <li class="navbar-item">
          <a href="category.html">Category</a>
        </li>
        <li class="navbar-item">
          <a href="forum.html">Forum</a>
        </li>
        <li class="navbar-item">
          <a href="thread.html">Thread</a>
        </li>
        <li class="navbar-item mobile-only">
          <a href="profile.html">My Profile</a>
        </li>
        <li class="navbar-item mobile-only">
          <a href="#">Logout</a>
        </li>
      </ul> -->
    </nav>
  </header>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  data () {
    return {
      userDropdownOpen: false,
      mobileNavMenu: false
    }
  },

  computed: {
    ...mapGetters('auth', ['authUser'])
  },

  methods: {
    closeDropdown () {
      this.userDropdownOpen = false
    },

    closeMobileNavbar () {
      this.mobileNavMenu = false
    },

    signOut () {
      this.$store.dispatch('auth/signOut')
      this.$router.push({ name: 'Home' })
    }
  },

  created () {
    this.$router.beforeEach((to, from) => {
      this.mobileNavMenu = false
    })
  }
}
</script>
