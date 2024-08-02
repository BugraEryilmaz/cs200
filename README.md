# cs200 README

This is an extension for the cs200 course at EPFL. It provides a debugger extension for the students to debug their assembly and verilog code using a virtual Gecko 5 board.

## Features

- Debugging assembly and verilog code
- Having a virtual Gecko 5 board view
- Setting breakpoints
- Stepping through the code
- Viewing the registers and memory

## Requirements

The extension assumes the following:

- There is a `Makefile` in the same folder as the file the student presses debug button on. We will provide the `Makefile` for the students.
- The `Makefile` has the following targets:
  - `build_{BINARY_NAME}`: builds the assembly or verilog code
  - `clean`: cleans the build directory
- After the build, there should be an executable called `Vtb` in the same folder as the file the student presses debug button on. For assembly assignments, we will provide the `Vtb` executable from the CPU we have written in verilog. For verilog assignments, the makefile should generate the `Vtb` executable. This executable should implement the debug adapter protocol.
- After the build, if the compiled verilog supports `mem_init` functionality, there should be a binary file called `{BINARY_NAME}.bin` and an executable that is compiled with debug symbols and called `{BINARY_NAME}` in the `out` directory.

## Extension Settings

Will be added later.

## Known Issues

If you wncounter any issues, please report them on the GitHub page of the extension.

## Release Notes

### 0.1.0

Initial release of cs200 extension.
