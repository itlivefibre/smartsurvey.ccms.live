<!-- <script setup lang="ts">
import type { DateValue } from "@internationalized/date";
import {
  DateFormatter,
  CalendarDate,
  getLocalTimeZone,
} from "@internationalized/date";

const df = new DateFormatter("en-US", { dateStyle: "medium" });

const modelValue = defineModel<{
  start: DateValue | null;
  end: DateValue | null;
}>();

const todayCalendar = new CalendarDate(
  new Date().getFullYear(),
  new Date().getMonth() + 1,
  new Date().getDate()
);
</script>

<template>
  <UPopover>
    <UButton color="neutral" variant="subtle" icon="i-lucide-calendar">
      <template v-if="modelValue?.start">
        <template v-if="modelValue?.end">
          {{ df.format(modelValue.start.toDate(getLocalTimeZone())) }}
          -
          {{ df.format(modelValue.end.toDate(getLocalTimeZone())) }}
        </template>
        <template v-else>
          {{ df.format(modelValue.start.toDate(getLocalTimeZone())) }}
        </template>
      </template>

      <template v-else> Pick date range </template>
    </UButton>

    <template #content>
      <UCalendar
        v-model="modelValue"
        range
        :number-of-months="1"
        :max-value="todayCalendar"
        class="p-2"
      />
    </template>
  </UPopover>
</template> -->

<script setup lang="ts">
import { ref, shallowRef, watch } from "vue";
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
} from "@internationalized/date";

const props = defineProps<{
  modelValue: {
    start: CalendarDate | null;
    end: CalendarDate | null;
  };
}>();

const emit = defineEmits<{
  (
    e: "update:modelValue",
    value: {
      start: CalendarDate | null;
      end: CalendarDate | null;
    },
  ): void;
}>();

const modelValue = shallowRef(props.modelValue);
// console.log(modelValue);
const df = new DateFormatter("en-US", { dateStyle: "medium" });

/* FINAL (APPLIED) VALUE */

// const modelValue = shallowRef<{
//   start: CalendarDate | null;
//   end: CalendarDate | null;
// }>({
//   start: null,
//   end: null,
// });

/* TEMP VALUE (POPUP STATE) */
const tempRange = ref<{
  start: CalendarDate | null;
  end: CalendarDate | null;
}>({
  start: null,
  end: null,
});

const isOpen = ref(false);

/* Open calendar */
function openCalendar() {
  // tempRange.value = { ...modelValue.value };
  // isOpen.value = true;
  tempRange.value = { ...props.modelValue };
  isOpen.value = true;
}

/* APPLY */
function applyRange() {
  // modelValue.value = { ...tempRange.value };
  // isOpen.value = false;
  // console.log("tempRange", { ...tempRange.value });
  emit("update:modelValue", { ...tempRange.value });
  isOpen.value = false;
}

/* CANCEL */
function cancelRange() {
  tempRange.value = { ...modelValue.value };
  isOpen.value = false;
}

/* RESET */
function resetRange() {
  tempRange.value = {
    start: null,
    end: null,
  };
}

const todayCalendar = new CalendarDate(
  new Date().getFullYear(),
  new Date().getMonth() + 1,
  new Date().getDate(),
);

watch(
  () => props.modelValue,
  (val) => {
    modelValue.value = { ...val };
  },
  { deep: true },
);
</script>

<template>
  <UPopover v-model:open="isOpen">
    <!-- Trigger -->
    <UButton
      color="neutral"
      variant="subtle"
      icon="i-lucide-calendar"
      @click="openCalendar"
    >
      <template v-if="modelValue.start">
        <template v-if="modelValue.end">
          {{ df.format(modelValue.start.toDate(getLocalTimeZone())) }}
          -
          {{ df.format(modelValue.end.toDate(getLocalTimeZone())) }}
        </template>
        <template v-else>
          {{ df.format(modelValue.start.toDate(getLocalTimeZone())) }}
        </template>
      </template>
      <template v-else> Pick a date range </template>
    </UButton>

    <!-- Popover -->
    <template #content>
      <div class="p-3 w-[320px]">
        <UCalendar
          v-model="tempRange"
          range
          :number-of-months="1"
          :max-value="todayCalendar"
        />

        <!-- ACTION BUTTONS -->
        <div class="flex justify-between items-center mt-3 border-t pt-3">
          <!-- Reset -->
          <UButton
            size="sm"
            variant="ghost"
            color="red"
            @click="resetRange"
            :disabled="!tempRange.start && !tempRange.end"
          >
            Reset
          </UButton>

          <!-- Cancel / Apply -->
          <div class="flex gap-2">
            <UButton
              size="sm"
              variant="ghost"
              color="gray"
              @click="cancelRange"
            >
              Cancel
            </UButton>

            <UButton size="sm" color="primary" @click="applyRange">
              Apply
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>
