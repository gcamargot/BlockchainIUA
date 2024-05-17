<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-spacer></v-spacer>
      <div class="d-flex align-center">
        <v-btn v-if="stamper && !account" @click="enableEthereum">Habilitar Ethereum</v-btn>
        <v-img v-if="stamper" alt="Contract" class="shrink mr-2" contain :src="contract_logo"
          transition="scale-transition" width="60" />
        <v-img alt="Metamask" class="shrink mr-2" contain :style="grayed" :src="metamask_logo"
          transition="scale-transition" width="40" />
      </div>
    </v-app-bar>

    <v-main>
      <v-alert v-model="error" type="error" dismissible>{{
        errorMessage
      }}</v-alert>
      <v-alert v-model="warning" type="warning" dismissible>{{
        warningMessage
      }}</v-alert>
      <stamper :web3="web3" 
        :apiUrl="apiUrl" 
        :stamper="stamper" 
        :account="account" 
        @error="showError"
        @warning="showWarning" />
    </v-main>
  </v-app>
</template>

<script>
import axios from "axios"
import Web3 from "web3";
import Stamper from "./components/Stamper.vue";
export default {
  name: "App",
  components: {
    Stamper,
  },
  data: () => ({
    metamask_logo: require("./assets/metamask.png"),
    contract_logo: require("./assets/contract.png"),
    networkId: 0,
    web3: window.ethereum ? new Web3(window.ethereum) : null,
    account: null,
    error: false,
    errorMessage: "Error",
    warning: false,
    warningMessage: "Advertencia",
    apiContractAddress: "",
  }),
  props: ["abi", "networks", "apiUrl"],
  methods: {
    async enableEthereum() {
      window.ethereum
        .request({ method: "eth_requestAccounts" })
        .then(this.accountsChanged)
        .then(window.ethereum.on("accountsChanged", this.accountsChanged))
        .catch((err) => {
          if (err.code === 4001) {
            this.errorMessage = "El usuario negó la habilitación de Ethereum";
          } else {
            this.errorMessage =
              "Se ha producido un error al habilitar Ethereum";
            console.log(err);
          }
          this.error = true;
        });
    },
    async accountsChanged(accounts) {
      this.account = this.web3.utils.toChecksumAddress(accounts[0]);
    },
    async updateNetwork() {
      this.networkId = window.ethereum.request({ method: "net_version" }).then(
        (id) => (this.networkId = id),
        () => (this.networkId = 0)
      );
    },
    showError(errorMessage) {
      if (errorMessage) {
        this.error = true;
        this.errorMessage = errorMessage;
      } else {
        this.error = false;
      }
    },
    showWarning(warningMessage) {
      if (warningMessage) {
        this.warning = true;
        this.warningMessage = warningMessage;
      } else {
        this.warning = false;
      }
    },
  },
  computed: {
    grayed() {
      if (this.web3) return {};
      else
        return {
          filter: "grayscale(100%)",
        };
    },
    stamperAddress() {
      return this.networks?.[this.networkId]?.address;
    },
    stamper() {
      if (!this.web3) {
        return null;
      }
      let address = this.stamperAddress;
      if (address == this.apiContractAddress) {
        return new this.web3.eth.Contract(this.abi, address);
      } else {
        return null;
      }
    },
  },
  created() {
    if (this.web3) {
      this.updateNetwork().then(
        window.ethereum?.on("chainChanged", () => this.updateNetwork())
      );
    }
    axios.get(`${this.apiUrl}/contract`)
      .then((res) => this.apiContractAddress = res.data.address)
      .catch(err => {
        this.errorMessage = `Fallo al obtener la dirección del contrato de la API: ${err.message}`
        this.error = true
      })
  },
};
</script>
