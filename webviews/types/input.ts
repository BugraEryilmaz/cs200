// Type definitions for IO messages

/**
 * Structure to represent 10x12 RGB LED array.
 * Each element in the array is a 10-bit RGB value representing a column.
 * Red, green and blue values are sent in separate arrays.
 */
export interface LedArray_t {
  r?: number[];
  g?: number[];
  b?: number[];
}

/**
 * Structure to represent four 7-segment displays.
 * Each element is a 8-bit value representing a digit and comma.
 */
export interface SevenSegment_t {
  zero?: number;
  one?: number;
  two?: number;
  three?: number;
}

export interface BoardUpdate_t {
  ledArray: LedArray_t;
  sevenSegment: SevenSegment_t;
}

export interface JoyStick_t {
  up?: boolean;
  down?: boolean;
  left?: boolean;
  right?: boolean;
  pressed?: boolean;
}

export interface Buttons_t {
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  center?: boolean;
}
export interface UpdateInput_t {
  joystick: JoyStick_t;
  button: Buttons_t;
  dip_switches?: number;
}
