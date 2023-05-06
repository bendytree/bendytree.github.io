
const {ref, onMounted, nextTick} = Vue;

export default {
  props: {
    text: {
      type: String,
      required: true
    }
  },
  template: `
    <div class="auto-size-text" ref="container">
      <div ref="textRef" :style="{ fontSize: fontSize + 'px' }">{{ text }}</div>
    </div>
  `,
  setup(props) {
    const container = ref(null);
    const textRef = ref(null);
    const fontSize = ref(108);

    const adjustFontSize = () => {
      if (!container.value || !textRef.value) return;

      if (fontSize.value < 10) return;

      if (textRef.value.scrollWidth > container.value.offsetWidth) {
        fontSize.value -= 1;
        nextTick(adjustFontSize);
      }
    };

    onMounted(adjustFontSize);

    return {
      container,
      textRef,
      fontSize
    };
  }
};

