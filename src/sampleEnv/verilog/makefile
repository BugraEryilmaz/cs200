export HERE = $(patsubst %/,%,$(dir $(abspath $(lastword $(MAKEFILE_LIST)))))


SHELL   := /usr/bin/bash
NULL    := >/dev/null 2>&1

TOOL    ?= verilator
TSCALE  := 1ns/1ns
# All c, cpp, verilog and system verilog files in the folder and src folder
FILES   := $(addprefix $(HERE)/, $(notdir $(wildcard *.v *.sv *.c *.cpp)))
FILES   += $(addprefix $(HERE)/src/, $(notdir $(wildcard src/*.v src/*.sv src/*.c src/*.cpp)))

OUT_DIR := $(HERE)/out
OUT_MT  ?= 12

SIM_DIR := $(HERE)/sim
SIM_MT  ?= 4

.PHONY: clean build_%

clean:
	rm -rf $(OUT_DIR) $(SIM_DIR)
	rm -f Vtb

build_%: $(OUT_DIR)
	cd $(OUT_DIR) && verilator -j $(OUT_MT) --threads $(SIM_MT) --timescale $(TSCALE) --top-module tb --cc --exe --build --assert --x-initial-edge --timing --trace --trace-underscore -Wno-WIDTH -Wno-UNSIGNED -Wno-UNOPTTHREADS -O2 -LDFLAGS -lcppdap -LDFLAGS -ldw -LDFLAGS -lelf -CFLAGS -std=c++20 $(FILES)
	ln -s $(OUT_DIR)/obj_dir/Vtb $(HERE)/Vtb

$(OUT_DIR):
	mkdir -p $@
	
