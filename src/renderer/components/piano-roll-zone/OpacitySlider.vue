<template>
  <div
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <v-slider
      :value="value"
      @input="debouncedHandleInput"
      @click:prepend="handleClickGrid"
      @click:append="handleClickWaves"
      prepend-icon="grid_on"
      append-icon="waves"
      thumb-color="rgb(0, 139, 139)"
    />
  </div>
</template>

<script>
// @flow
import { debounce } from 'lodash';
import { getPianoRollData, setPianoRollOpacity, setPianoRollOpacityWillChange } from '../../interactors/PianoRoll';

export default {
  computed: {
    value () {
      const { spectrogramOpacity, gridOpacity } = getPianoRollData();
      if (spectrogramOpacity < 1) return spectrogramOpacity * 50;
      return (1 - gridOpacity) * 50 + 50;
    }
  },
  created () {
    this.debouncedHandleInput = debounce(this.handleInput, 12);
  },
  methods: {
    handleInput (val) {
      if (val > 50) {
        setPianoRollOpacity(1, 1 - (val - 50) / 50);
        return;
      }
      setPianoRollOpacity(val / 50, 1);
    },
    handleClickGrid () {
      setPianoRollOpacity(0, 1);
    },
    handleClickWaves () {
      setPianoRollOpacity(1, 0);
    },
    handleMouseEnter () {
      setPianoRollOpacityWillChange(true);
    },
    handleMouseLeave () {
      setPianoRollOpacityWillChange(false);
    }
  }
};
</script>

<style scoped>

</style>
