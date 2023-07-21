<template>
  <div class="wrapper" @clickout.prevent="closeContextMenu" @contextmenu.prevent="openContextMenu">
    <div class="contextMenuClickable" @click.prevent="openContextMenu">...</div>
    <slot></slot>
    <div :class="`contextMenu contextMenu_${id}`">
      <div v-for="(method, name) in componentMethods" :key="name" @click="methodWrapper(method)">{{ name }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import "clickout-event";

export default {
  name: "ContextMenu",
  props: { componentId: Number, methods: Object, storeObject: Object },
  setup(props) {
    const { getProperty, setProperty } = props.storeObject;
    const currentNode = getProperty("currentNode");

    const closeContextMenu = () => {
      const contextMenu = document.querySelector(".contextMenu.open");
      if (contextMenu) contextMenu.classList.remove("open");
      setProperty({
        path: `nodes__${currentNode}__components__${props.componentId}__contextMenu__isOpen`,
        value: false
      });
    };
    const openContextMenu = () => {
      // const parent = event.path.filter((n) => /vue-grid-item/.test(n.className))[0];
      const contextMenu: HTMLElement = <HTMLElement>document.querySelector(`.contextMenu_${props.componentId}`);
      if (Array.from(contextMenu.classList).includes("open")) contextMenu.classList.remove("open");
      else contextMenu.classList.add("open");
      setProperty({
        path: `nodes__${currentNode}__components__${props.componentId}__contextMenu__isOpen`,
        value: true
      });
    };

    const methodWrapper = (method: Function) => {
      setProperty({
        path: `nodes__${currentNode}__components__${props.componentId}__contextMenu__usedMethods`,
        value: method.name
      });

      method();
    };

    return { componentMethods: props.methods, id: props.componentId, openContextMenu, closeContextMenu, methodWrapper };
  }
};
</script>

<style scoped>
.wrapper {
  position: absolute;
  width: 100%;
  height: 100%;
}

.contextMenuClickable {
  position: absolute;
  top: -4px;
  left: 27px;
  transform: rotate(90deg);
  font-size: 35px;
  cursor: pointer;
}

.contextMenu {
  display: hidden;
  background: #57636b;
  color: #e8edf1;
}

.contextMenu.open {
  display: flex;
  position: relative;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 25px;
  left: 35px;
  z-index: 5;
  font-size: 20px;
  cursor: pointer;
  border: 1px solid black;
}

.contextMenu.open div {
  border: 1px solid black;
  width: 100%;
}
</style>
