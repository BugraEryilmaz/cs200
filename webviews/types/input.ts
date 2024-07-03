// Type definitions for IO messages

// [{"value": 1, "direction": "input", "type": "binary", "name": "en"}, {"value": 0, "direction": "input", "type": "binary", "name": "reset"}, {"value": 3, "direction": "output", "type": "hex", "name": "counter"}, {"value": 2942, "direction": "output", "length": 4, "width": 4, "type": "ledarray", "name": "leds"}, {"value": 3, "direction": "output", "type": "sevensegment", "name": "countersevensegment"}]

export type InputOutputMessage = {
  direction: "input" | "output";
  value: string | number | boolean;
  type: "binary" | "hex" | "ledarray" | "sevensegment";
  height?: number;
  width?: number;
  name: string;
};
