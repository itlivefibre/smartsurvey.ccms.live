<script setup>
definePageMeta({ ssr: false })

import { ref } from "vue"

const responseData = ref(null)
const errorMsg = ref(null)

const accesskey = localStorage.getItem("access_token") || "20251114102944"
const accessForm = 1

async function loadData() {
  responseData.value = null
  errorMsg.value = null

  try {
    const res = await $fetch("https://ayodhya.water.live/api/surveyNew.php?action=get_servey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        accesskey,
        accessForm,
      },
    })

    console.log("API Success:", res)
    responseData.value = res
  } catch (err) {
    console.error("API Error:", err)
    errorMsg.value = err.toString()
  }
}
</script>

<template>
  <div class="p-4">
    <button @click="loadData" class="px-4 py-2 bg-blue-600 text-white rounded">
      Call API
    </button>

    <pre v-if="responseData" class="mt-4 bg-gray-100 p-2 border rounded">
{{ responseData }}
    </pre>

    <pre v-if="errorMsg" class="mt-4 bg-red-100 p-2 border border-red-400 text-red-700 rounded">
{{ errorMsg }}
    </pre>
  </div>
</template>
