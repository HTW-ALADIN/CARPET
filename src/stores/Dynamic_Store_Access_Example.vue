<script setup>
import { ref, reactive, watch, computed } from "vue";

const msg = ref("Hello World!");
const obj = reactive({});

obj["X"] = {};
obj["X"]["Y"] = {};
obj["X"]["Y"]["Z"] = { foo: 0 };

function resolve(path, obj) {
  return path.split("_").reduce(function (prev, curr) {
    return prev ? prev[curr] : null;
  }, obj || self);
}

const x = "X_Y_Z";

const computedHelper = computed(() => {
  return resolve(x, obj);
});

watch(computedHelper.value, (val) => {
  msg.value = val.foo.toString();
});
</script>

<template>
  <div>{{ msg }}</div>
  <button @click="obj['X']['Y']['Z'].foo += 1">change</button>
</template>

<!-- Probably just flatten the store? -->
<!-- see https://github.com/joetex/flatstore -->
