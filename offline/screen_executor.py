"""
Screen executor — runs on the client machine.
Called by Electron via child_process to execute mouse/keyboard actions.
"""
import sys
import json
import pyautogui
import time

pyautogui.FAILSAFE = True  # Move mouse to corner to abort
pyautogui.PAUSE = 0.5      # Small delay between actions


def execute(action: dict) -> dict:
    action_type = action.get("action")

    if action_type == "click":
        x, y = action["x"], action["y"]
        pyautogui.click(x, y)
        return {"success": True, "action": "click", "at": [x, y]}

    elif action_type == "type":
        text = action.get("text", "")
        pyautogui.write(text, interval=0.05)
        return {"success": True, "action": "type", "length": len(text)}

    elif action_type == "key":
        key = action.get("key", "")
        pyautogui.hotkey(*key.split("+"))
        return {"success": True, "action": "key", "key": key}

    elif action_type == "scroll":
        direction = action.get("scroll_direction", "down")
        amount = action.get("scroll_amount", 3)
        clicks = amount if direction == "down" else -amount
        pyautogui.scroll(clicks)
        return {"success": True, "action": "scroll", "direction": direction}

    elif action_type == "screenshot":
        # Just signal to take another screenshot (handled by Electron)
        return {"success": True, "action": "screenshot", "needs_new_screenshot": True}

    elif action_type == "done":
        return {"success": True, "action": "done", "complete": True}

    else:
        return {"success": False, "error": f"Unknown action type: {action_type}"}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No action provided"}))
        sys.exit(1)

    try:
        action = json.loads(sys.argv[1])
        result = execute(action)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
