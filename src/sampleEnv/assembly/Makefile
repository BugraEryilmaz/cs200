RVPATH=/opt/riscv/bin/
RVTOOLPREFIX=$(RVPATH)riscv64-unknown-linux-gnu-
RVGCC=$(RVTOOLPREFIX)gcc -march=rv32i -mabi=ilp32 -static -nostdlib -nostartfiles -mcmodel=medany -g
RVOBJCOPY=$(RVTOOLPREFIX)objcopy
SOURCES=$(notdir $(wildcard *.s))


clean:
	rm -rf out

out:
	mkdir -p out

build_%: out
	$(RVGCC) -o out/$(basename $*) -Tmmio.ld $(SOURCES)
	$(RVOBJCOPY) -O binary out/$* out/$*.bin