import json
import sys
from typing import Literal


class Binary(dict):
    def __init__(self, value: bool, direction: Literal["input", "output"], name: str):
        dict.__init__(self, value=value, direction=direction, type="binary", name=name)

    def __str__(self):
        return json.dumps(self)
    
    @property
    def value(self):
        return self["value"]
    
    @value.setter
    def value(self, value: bool):
        self["value"] = value

class Hex(dict):
    def __init__(self, value: str, direction: Literal["input", "output"], name: str):
        dict.__init__(self, value=value, direction=direction, type="hex", name=name)

    def __str__(self):
        return json.dumps(self)
    
    @property
    def value(self):
        return self["value"]
    
    @value.setter
    def value(self, value: int):
        self["value"] = value
    
class SevenSegment(dict):
    def __init__(self, value: int, direction: Literal["input", "output"], name: str):
        dict.__init__(self, value=value, direction=direction, type="sevensegment", name=name)

    def __str__(self):
        return json.dumps(self)
    
    @property
    def value(self):
        return self["value"]
    
    @value.setter
    def value(self, value: int):
        self["value"] = value
    
class LEDArray(dict):
    def __init__(self, value: int, height: int, width: int, direction: Literal["input", "output"], name: str):
        dict.__init__(self, value=value, direction=direction, height=height, width=width, type="ledarray", name=name)

    def __str__(self):
        return json.dumps(self.__dict__)
    
    @property
    def value(self):
        return self["value"]
    
    @value.setter
    def value(self, value: int):
        self["value"] = value
    

class IO():
    def __init__(self):
        self.en = Binary(False, "input", "en")
        self.reset = Binary(False, "input", "reset")
        self.counter = Hex(0, "output", "counter")
        self.leds = LEDArray(0x5bf0, 4, 4, "output", "leds")
        self.countersevensegment = SevenSegment(0, "output", "countersevensegment")

    def __str__(self):
        return json.dumps(list(self.__dict__.values()))

io = IO()

while True:
    try:
        data = json.loads(sys.stdin.readline())
    except:
        continue
    if "command" not in data:
        continue
    inp = data["command"]
    if inp == "exit":
        break
    elif inp.startswith("inputs"):
        for key in io.__dict__:
            if key in data:
                if data[key] == "true" or data[key] == "false":
                    io.__dict__[key].value = data[key] == "true"
                else:
                    io.__dict__[key].value = data[key]
    elif inp.startswith("outputs"):
        print(io, flush=True)
    elif inp.startswith("runcycle"):
        if io.reset.value == True:
            io.counter.value = 0
            io.leds.value = 0x5bf0
            io.countersevensegment.value = 0
        elif io.en.value == True:
            io.counter.value += 1
            io.leds.value = io.leds.value >> 1
            io.countersevensegment.value = io.counter.value
        print(io, flush=True)
    else:
        print(io, flush=True)
