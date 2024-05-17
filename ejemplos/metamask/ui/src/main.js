import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import buildInfo from "../../contracts/build/contracts/Stamper.json"

Vue.config.productionTip = false

const apiUrl = "http://localhost:5000"
const abi = buildInfo.abi
const networks = buildInfo.networks
new Vue({
  vuetify,
  render: h => h(App, {
    props: {
      abi,
      networks,
      apiUrl
    }
  })
}).$mount('#app')
