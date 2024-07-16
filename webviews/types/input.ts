// Type definitions for IO messages

export interface LedArray_t {
  value: number;
  height: number;
  width: number;
  direction: "output";
}

export interface BoardUpdate_t {
  ledArray?: LedArray_t;
}

export interface UpdateInput_t {
  name: string;
  value: number;
  type: string;
}
