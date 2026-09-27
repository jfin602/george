import fcntl
import json
import os
import pty
import select
import signal
import struct
import subprocess
import sys
import termios
import time

node, fixture, workspace, report = sys.argv[1:]
master, slave = pty.openpty()
fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack("HHHH", 24, 80, 0, 0))
env = dict(os.environ, TERM="xterm-kitty")
process = subprocess.Popen([node, "--experimental-ffi", fixture, workspace, report], stdin=slave, stdout=slave, stderr=slave, env=env, start_new_session=True)
os.close(slave)
output = bytearray()


def state(expected_page=None, expected_draft=None, active=False, task_ready=False):
    deadline = time.monotonic() + 8
    while time.monotonic() < deadline:
        ready, _, _ = select.select([master], [], [], 0.05)
        if ready:
            try:
                output.extend(os.read(master, 65536))
            except OSError:
                pass
        if os.path.exists(report):
            try:
                with open(report) as saved:
                    current = json.load(saved)
            except (OSError, json.JSONDecodeError):
                continue
            if (expected_page is None or current["page"] == expected_page) and (expected_draft is None or current["draft"] == expected_draft) and (not active or current["calls"] >= 2 and any("Read BOOT.md" in item for item in current["work"])) and (not task_ready or "Goal" in current["task"] and "Recent work" in current["task"]):
                return current
        if process.poll() is not None:
            break
    raise AssertionError(f"native navigation timed out: page={expected_page!r} draft={expected_draft!r}; output={output[-3000:]!r}")


try:
    state("transcript", "")
    prompt = b"GEORGE TASK FORMAT: 1\n\nTASK: P1 \xe2\x80\x94 Native navigation\nKIND: implementation\n\nGOAL\n\n- Show task state.\n\nREQUIREMENTS\n\n- R1: Navigate both pages.\n\nWORKFLOW\n\nW1 \xe2\x80\x94 Navigate\nCovers: R1\nDepends on: none\n\nVALIDATION\n\nV1 \xe2\x80\x94 Check\nCovers: R1\nRun: node --version\n\nSTOP CONDITIONS\n\n- S1: Stop safely."
    os.write(master, b"\x1b[200~" + prompt + b"\x1b[201~")
    state("transcript", prompt.decode())
    os.write(master, b"\r")
    initial = state("transcript", "", active=True)
    transcript = json.loads(initial["session"])["transcript"]
    assert transcript == [{"role": "user", "text": prompt.decode(), "origin": "structured_task"}]
    assert "GEORGE TASK FORMAT: 1" in initial["transcript"] and "Native navigation" in initial["transcript"]
    assert "Read BOOT.md" in initial["transcript"]
    os.write(master, b"preserved draft")
    state("transcript", "preserved draft")
    os.write(master, b"\x1b[50;5u")
    state("task", "preserved draft", task_ready=True)
    os.write(master, b"\x1b[49;5u")
    state("transcript", "preserved draft")
    os.write(master, b"\x1b[<0;19;7M\x1b[<0;19;7m")
    state("task", "preserved draft")
    os.write(master, b"\x1b[<0;4;7M\x1b[<0;4;7m")
    final = state("transcript", "preserved draft")
    assert final["session"] == initial["session"]
    print(json.dumps({"submission": True, "work": True, "keyboard": True, "mouse": True, "draft": final["draft"], "sessionUnchanged": True}))
finally:
    if process.poll() is None:
        os.killpg(process.pid, signal.SIGTERM)
    process.wait(timeout=5)
    os.close(master)
