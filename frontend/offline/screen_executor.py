#!/usr/bin/env python3
"""
Screen action executor for Humanoid desktop app.
Receives a JSON action from Electron and executes it using PyAutoGUI.

Usage: python screen_executor.py '{"type":"click","x":100,"y":200}'

Install dependency: pip install pyautogui
"""
import sys
import json
import time


def execute_action(action):
    try:
        import pyautogui
        pyautogui.FAILSAFE = True
        pyautogui.PAUSE = 0.3
    except ImportError:
        return {"success": False, "error": "PyAutoGUI not installed. Run: pip install pyautogui"}

    action_type = action.get("action") or action.get("type", "")

    try:
        if action_type == "click":
            x = int(action.get("x") or 0)
            y = int(action.get("y") or 0)
            button = action.get("button", "left")
            double = action.get("double", False)
            if double:
                pyautogui.doubleClick(x, y, button=button)
            else:
                pyautogui.click(x, y, button=button)

        elif action_type == "type":
            text = action.get("text", "")
            pyautogui.write(str(text), interval=0.04)

        elif action_type == "key":
            key = action.get("key", "")
            if "+" in str(key):
                parts = [k.strip() for k in key.split("+")]
                pyautogui.hotkey(*parts)
            else:
                pyautogui.press(str(key))

        elif action_type == "scroll":
            x = int(action.get("x") or 0)
            y = int(action.get("y") or 0)
            direction = action.get("scroll_direction", "down")
            amount = int(action.get("scroll_amount") or 3)
            clicks = amount if direction == "up" else -amount
            pyautogui.scroll(clicks, x=x, y=y)

        elif action_type == "move":
            x = int(action.get("x") or 0)
            y = int(action.get("y") or 0)
            pyautogui.moveTo(x, y, duration=0.3)

        elif action_type == "screenshot":
            # No-op — caller will take screenshot via Electron's desktopCapturer
            pass

        elif action_type == "done":
            pass  # Goal complete, nothing to execute

        else:
            return {"success": False, "error": f"Unknown action type: {action_type}"}

        return {"success": True}

    except pyautogui.FailSafeException:
        return {"success": False, "error": "Safety stop: mouse moved to screen corner"}
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No action provided"}))
        sys.exit(1)

    try:
        action = json.loads(sys.argv[1])
    except json.JSONDecodeError as e:
        print(json.dumps({"success": False, "error": f"Invalid JSON: {e}"}))
        sys.exit(1)

    result = execute_action(action)
    print(json.dumps(result))
