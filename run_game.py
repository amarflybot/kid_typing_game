#!/usr/bin/env python3
"""
Launcher for Mario Typing Adventure - opens the browser version.
Use this if the tkinter version has compatibility issues on your system.
"""

import webbrowser
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
html_path = os.path.join(script_dir, "typing_game.html")
webbrowser.open("file://" + html_path)
print("Opening Mario Typing Adventure in your browser! 🎮")
