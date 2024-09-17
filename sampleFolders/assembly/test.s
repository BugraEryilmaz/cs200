.section ".text"
.global _start

_start:
la a0, 0x80001000
la a1, 0x80002000
li a2, 1

1:
sb a2, 0(a0)
addi a0, a0, 1
blt a0, a1, 1b

2:
j 2b