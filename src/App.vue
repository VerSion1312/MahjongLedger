<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 移动端优化样式 */
@media (max-width: 768px) {
  body {
    font-size: 14px;
  }
}

/* 平板优化样式 */
@media (min-width: 769px) and (max-width: 1024px) {
  body {
    font-size: 16px;
  }
}

/* 桌面端优化样式 */
@media (min-width: 1025px) {
  body {
    font-size: 16px;
  }
  
  #app {
    max-width: 400px;
    margin: 0 auto;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  }
}
</style> 