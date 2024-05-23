<template>
  <v-container>
    <v-file-input v-model="selected_files" @change="handleFiles" @click="reset" id="input" multiple chips counter
      show-size></v-file-input>
    <v-simple-table v-if="showTable">
      <template v-slot:default>
        <thead>
          <tr>
            <th class="text-left" id="h-name">Nombre</th>
            <th class="text-left" id="h-hash">Hash</th>
            <th class="text-left" id="h-sealed">Sellado</th>
            <th class="text-left" id="h-block">Bloque</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in files" :key="item.name">
            <td>{{ item.name }}</td>
            <td>{{ item.hash }}</td>
            <td>
              <v-icon v-if="item.block > 0" 
                @mouseover.native="displaySigner(item.signer)"
                @mouseleave.native="showInfo = false" 
                :color="signerColor(item.signer)">
                mdi-thumb-up</v-icon>
              <v-icon v-else-if="item.block == 0" color="red">mdi-thumb-down</v-icon>
            </td>
            <td v-show="item.block > 0">{{ item.block }}</td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
    <v-divider></v-divider>
    <v-container>
      <v-row v-if="buttonsEnabled" align="center" justify="space-around">
        <v-btn @click="stamp"> Sellar </v-btn>
        <v-btn @click="verify"> Verificar </v-btn>
        <v-btn v-if="stamper && account" @click="stampMyself">
          Sellar con mi cuenta
        </v-btn>
      </v-row>
    </v-container>
    <v-snackbar v-model="showInfo" multi-line color="primary">
      {{ info }}
    </v-snackbar>
  </v-container>
</template>

<script>
import sha256 from "js-sha256";
import axios from "axios";
export default {
  name: "Stamper",
  props: ["web3", "apiUrl", "stamper", "account"],
  data: () => ({
    selected_files: [],
    files: [],
    info: "",
    showInfo: false,
  }),
  computed: {
    buttonsEnabled() {
      return this.files.length > 0 && this.verified < this.files.length;
    },
    verified() {
      return this.files.filter((file) => file.block > 0).length;
    },
    showTable() {
      return this.files.length > 0 && this.selected_files.length == 0;
    },
  },
  methods: {
    reset() {
      this.files = [];
      this.$emit("warning", false);
      this.$emit("error", false);
    },
    unhandledError(err, errorMessage) {
      this.$emit("error", errorMessage);
      console.log(err);
    },
    displaySigner(signer) {
      this.info = `Sellado por ${signer == this.account ? "mí" : signer}`;
      this.showInfo = true;
    },
    signerColor(signer) {
      return signer == this.account ? "blue" : "green";
    },
    handleFiles(files) {
      for (let file of files) {
        this.files.push({
          file: file,
          name: file.name,
          hash: "",
          block: -1,
          signer: "",
        });
      }
    },
    async hashFile(file) {
      let buffer = await file.file.arrayBuffer();
      let hash = sha256.create();
      hash.update(buffer);
      file.hash = `0x${hash.hex()}`;
    },
    async verifyFile(file) {
      try {
        if (!file.hash) {
          await this.hashFile(file);
        }
        let res = await axios.get(`${this.apiUrl}/stamped/${file.hash}`);
        file.block = res.data.blockNumber;
        file.signer = res.data.signer;
        if (file.block > 0) {
          return true;
        }
      } catch (err) {
        if (err.response?.status == 404) {
          file.block = 0;
          return false;
        }
        throw err;
      }
    },
    async verify() {
      this.selected_files = [];
      for (let file of this.files) {
        if (file.block > 0) continue;
        this.verifyFile(file).catch((err) =>
          this.unhandledError(
            err,
            `Se ha producido un error al verificar el archivo ${file.name}: ${err.message}`
          )
        );
      }
    },

    async stampFile(file) {
      let stamped = await this.verifyFile(file);
      if (stamped) return;
      await axios.post(`${this.apiUrl}/stamp`, { hash: file.hash });
      await this.verifyFile(file);
    },
    async stamp() {
      this.selected_files = [];
      for (let file of this.files) {
        if (file.block > 0) continue;
        this.stampFile(file).catch((err) => {
          let errorMessage = err.response?.data?.message;
          if (errorMessage) {
            this.$emit("error", errorMessage);
          } else {
            this.unhandledError(
              err,
              `Se ha producido un error al sellar el archivo ${file.name}: ${err.message}`
            );
          }
        });
      }
    },

    async verifyFileMyself(file) {
      if (file.block > 0) return;
      if (!file.hash) {
        await this.hashFile(file);
      }
      let res = await this.stamper.methods.stamped(file.hash).call();
      file.block = res.blockNumber;
      file.signer = res.signer;
    },
    async stampFileMyself(file) {
      await this.verifyFileMyself(file);
      if (file.block > 0) {
        return;
      }
      await this.stamper.methods.stamp(file.hash).send({ from: this.account });
      await this.verifyFileMyself(file);
    },

    async stampMyself() {
      if (!this.account) {
        this.$emit("error", "Sin acceso a cuenta ethereum");
        return;
      }
      this.selected_files = [];
      for (let file of this.files) {
        if (file.block > 0) continue;
        this.stampFileMyself(file).catch((err) => {
          if (err.code == 4001) {
            this.$emit(
              "warning",
              `El usuario denegó el permiso para sellar el archivo ${file.name}`
            );
          } else {
            this.$emit("error", `Error al sellar el archivo ${file.name}`);
            console.log(err);
          }
        });
      }
    },
  },
};
</script>
