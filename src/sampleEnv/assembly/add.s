.section ".text"
  .globl add
.section ".text.init"
  .globl _start
_start:
  li sp, 0xFFFFFF0
  li x16, 0
  li x15, 0x800000a0
loop:
  addi x16, x16, 1
  sb x16, 0(x15)
  addi x15, x15, 1
  j loop
  call add
  li x10, 0
  li x1, 0
  ret

1:
  j 1b
