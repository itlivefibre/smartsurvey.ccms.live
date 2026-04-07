<template></template>

<script setup lang="ts">
interface RepairRecord {
  result: RepairRecord[];
  accesskey: string;
  pageSize: number;
  currentPage: number;
}

const {
  data: apiData,
  pending,
  error,
} = await useAsyncData<{
  result: RepairRecord[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}>(
  "repairingList",
  () =>
    $fetch(
      "https://ayodhya.water.live/api/surveyNew.php?action=get_repairing_list",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          accesskey,
          perPage: pageSize.value,
          page: currentPage.value,
        },
      },
    ),
  {
    watch: [currentPage, pageSize],
  },
);
</script>

<style></style>
