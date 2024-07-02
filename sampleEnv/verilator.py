import json
import sys


class IO:
    signals = {}
    def __init__(self):
        inputs = {}
        outputs = {}
        inputs["en"] = "false"
        inputs["reset"] = "false"
        outputs["counter"] = 0
        self.signals["inputs"] = inputs
        self.signals["outputs"] = outputs

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
        for key in io.signals["inputs"]:
            if key in data:
                io.signals["inputs"][key] = data[key]
    elif inp == "outputs":
        print(json.dumps(io.signals), flush=True)
    elif inp == "getinputs":
        print(json.dumps(io.signals), flush=True)
    elif inp == "runcycle":
        if io.signals["inputs"]["reset"] == "true":
            io.signals["outputs"]["counter"] = 0
            # if data["getResults"]:
            print(json.dumps(io.signals), flush=True)
        elif io.signals["inputs"]["en"] == "true":
            io.signals["outputs"]["counter"] += 1
            # if data["getResults"]:
            print(json.dumps(io.signals), flush=True)