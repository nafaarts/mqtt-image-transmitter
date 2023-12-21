<script setup lang="ts">
import mqtt from "mqtt"
import { onMounted, reactive, ref } from 'vue'
import { initFlowbite } from "flowbite";

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import { faHistory, faTimes, faSpinner, faTrash } from '@fortawesome/free-solid-svg-icons'

library.add(faHistory, faTimes, faSpinner, faTrash)

useHead({
  title: 'MQTT Image Transmition',
})

onMounted(() => {
  initFlowbite();
})

interface History {
  _id: string,
  host: string,
  topic: string,
  message: string,
  created_at: Date
}

const connected = ref(false)
const loading = ref(false)
const showHistory = ref(false)
const histories = ref<History[]>([])

let client: any = null;

const clientCredential = reactive({
  host: 'broker.hivemq.com',
  port: '8000',
  topic: 'rafly/foto',
  username: '',
  password: '',
})

const connect = () => {
  if (!clientCredential.host || !clientCredential.topic || !clientCredential.port) {
    alert('Host, Port dan Topic harus diisi')
    return
  }

  loading.value = true

  const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
  client = mqtt.connect(`ws://${clientCredential.host}:${clientCredential.port}/mqtt`, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: clientCredential.username,
    password: clientCredential.password,
    reconnectPeriod: 1000,
    log: console.log.bind(console),
    keepalive: 60,
  });

  client.on('connect', function () {
    console.log("connected");
    loading.value = false
    connected.value = true
    client.subscribe(clientCredential.topic, { qos: 0 });
    getHistories()
  });

  client.on("message", async (topic: any, message: any) => {
    console.log('message: ', message);

    let encodedMessage = ''

    // check if message is int8array
    if (message instanceof Int8Array) {
      const b64encoded = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(message))));
      console.log('message is base64', topic, b64encoded);
      encodedMessage = `data:image/jpeg;base64,${b64encoded}`
    } else {
      console.log('message is other', topic, message.toString());
      encodedMessage = message.toString()
    }

    const payload = {
      host: clientCredential.host,
      topic,
      message: encodedMessage,
      created_at: new Date().toISOString()
    }

    try {
      const response = await $fetch('/api/histories', {
        method: 'POST',
        body: payload
      })

      if (response) {
        histories.value.unshift(response as History)
      }
    } catch (error) {
      console.error('error', error)
    }
  });

  client.on("close", () => {
    console.log("close");
    connected.value = false
  });
}

const disconnect = () => {
  if (client instanceof mqtt.MqttClient) {
    client.end();
  }
}

const toggleHistory = () => {
  showHistory.value = !showHistory.value
}

const getHistories = () => {
  $fetch('/api/histories')
    .then((response) => {
      if (response) {
        histories.value = response as History[]
      }
    })
    .catch((error) => {
      console.error('error', error)
    })
}

const deleteHistory = (id: string) => {
  $fetch(`/api/histories`, {
    method: 'DELETE',
    body: {
      _id: id
    }
  })
    .then((response) => {
      if (response) {
        histories.value = histories.value.filter((history) => history._id !== id)
      }
    })
    .catch((error) => {
      console.error('error', error)
    })
}
</script>

<template>
  <div class="h-screen bg-zinc-900">
    <div class="flex flex-col max-w-[500px] h-screen mx-auto md:py-10 py-5 px-4">
      <h2 class="text-2xl font-bold text-white text-center">MQTT Image Transmition</h2>
      <hr class="md:my-10 my-5" />
      <div v-if="!connected">
        <div class="bg-white rounded-md p-4">
          <h3 class="text-lg mb-3">Connect to Broker</h3>
          <div class="space-y-3 mb-5">
            <TextInput v-model="clientCredential.host" label="Host" placeholder="Masukan Host" :required="true" />
            <div class="flex gap-3">
              <div class="flex-1">
                <TextInput type="number" v-model="clientCredential.port" label="Port" placeholder="Masukan Port"
                  :required="true" />
              </div>
              <div class="flex-1">
                <TextInput v-model="clientCredential.topic" label="Topic" placeholder="Masukan Topic" :required="true" />
              </div>
            </div>
            <div class="flex gap-3">
              <div class="flex-1">
                <TextInput v-model="clientCredential.username" label="Username" placeholder="Masukan Username" />
              </div>
              <div class="flex-1">
                <TextInput v-model="clientCredential.password" label="Password" placeholder="Masukan Password" />
              </div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <Button v-if="!loading" label="Connect" @click="connect" :disabled="loading" />
            <Button v-else label="Cancel" @click="() => {
              loading = false
              client.end()
            }" />
            <small v-show="loading"><font-awesome-icon icon="fa-spinner" class="animate-spin" />
              Loading...</small>
          </div>
        </div>
      </div>
      <div v-else class="flex-1 relative">
        <Transition name="fade">
          <div v-show="!showHistory" class="space-y-5">
            <!-- status information -->
            <div class="flex items-center justify-between p-3 bg-blue-400/50 rounded-md border border-blue-700">
              <div class="flex flex-col text-white">
                <strong>Broker Connected</strong>
                <small>ws://{{ clientCredential.host }}:{{ clientCredential.port }} - {{ clientCredential.topic }}</small>
              </div>
              <Button label="Disconnect" @click="disconnect" />
            </div>
            <!-- latest message preview -->
            <div class="bg-white p-3 rounded-md">
              <div v-if="histories.length > 0">
                <div class="mb-3">
                  <img :src="histories[0].message" alt="image" class="w-full rounded-md" />
                </div>
                <div class="flex justify-between">
                  <small>Received on:</small>
                  <small><strong>{{ histories[0].created_at }}</strong></small>
                </div>
              </div>
              <div v-else>
                <div class="flex justify-center items-center h-40">
                  <small class="text-gray-500">No message received</small>
                </div>
              </div>
            </div>
            <!-- history button -->
            <div class="flex justify-center">
              <button class="text-white text-xs hover:underline" @click="toggleHistory">
                <font-awesome-icon icon="fa-history" /> history
              </button>
            </div>
          </div>
        </Transition>

        <Transition name="fade">
          <div v-show="showHistory" class="flex flex-col bg-white p-3 rounded-md w-full h-full absolute top-0 right-0">
            <div class="flex justify-between">
              <h3 class="text-lg">History</h3>
              <button @click="toggleHistory">
                <font-awesome-icon icon="fa-times" />
              </button>
            </div>
            <hr class="my-3" />
            <div class="overflow-y-auto flex-1">
              <ul>
                <li v-for="history in histories" :key="history._id" class="mb-3">
                  <div class="flex items-center gap-4">
                    <img :src="history.message" alt="image" class="h-16 rounded-md aspect-square" />
                    <div class="flex flex-col flex-1">
                      <small>{{ history.host }}</small>
                      <small class="text-gray-500 italic">{{ history.topic }}</small>
                      <small class="text-gray-500">{{ history.created_at }}</small>
                    </div>
                    <div class="p-3">
                      <button @click="deleteHistory(history._id)">
                        <font-awesome-icon icon="fa-trash" />
                      </button>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
