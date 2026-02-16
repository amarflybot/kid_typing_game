#!/usr/bin/env python3
"""
Mario Typing Game for Kids
Type 3-letter words correctly to make Mario climb the ladder!
"""

import tkinter as tk
from tkinter import font as tkfont
import random

# Kid-friendly 3-letter words
WORDS = [
    "cat", "dog", "run", "fun", "sun", "bat", "hat", "mat", "rat", "car",
    "bug", "mug", "big", "pig", "sit", "hit", "bit", "dot", "pot", "hot",
    "cup", "top", "hop", "pop", "map", "nap", "cap", "lap", "sad", "mad",
    "bed", "red", "fed", "wed", "get", "pet", "net", "wet", "let", "met",
    "mom", "dad", "box", "fox", "mix", "fix", "six", "cub", "tub", "bus",
    "jam", "ham", "ram", "can", "man", "pan", "van", "ant", "egg", "add",
    "log", "fog", "jog", "saw", "paw", "law", "raw", "new", "few", "sew",
]

# Colors - bright and kid-friendly
BG_COLOR = "#1a1a2e"
LADDER_COLOR = "#e94560"
LADDER_RUNG = "#16213e"
MARIO_RED = "#ff6b6b"
MARIO_BLUE = "#4ecdc4"
MARIO_SKIN = "#ffd93d"
TEXT_COLOR = "#f0f0f0"
INPUT_BG = "#16213e"
INPUT_FOCUS = "#0f3460"
SUCCESS_COLOR = "#6bcb77"
WORD_COLOR = "#ffd93d"


class MarioTypingGame:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("🎮 Mario Typing Adventure")
        self.root.geometry("500x650")
        self.root.configure(bg=BG_COLOR)
        self.root.resizable(False, False)

        # Game state
        self.current_word = ""
        self.ladder_rungs = 8  # Number of rungs to climb
        self.current_rung = 0
        self.words_used = set()

        self._setup_ui()
        self._draw_ladder()
        self._create_mario()
        self._new_word()
        self._center_window()

    def _setup_ui(self):
        """Set up the game UI elements."""
        # Fonts (fallback for systems without Comic Sans)
        self.title_font = tkfont.Font(family=("Comic Sans MS", "Helvetica", "Arial"), size=22, weight="bold")
        self.word_font = tkfont.Font(family=("Comic Sans MS", "Helvetica", "Arial"), size=36, weight="bold")
        self.input_font = tkfont.Font(family=("Comic Sans MS", "Helvetica", "Arial"), size=24)

        # Title
        title = tk.Label(
            self.root,
            text="🦸 Mario Typing Adventure",
            font=self.title_font,
            fg=TEXT_COLOR,
            bg=BG_COLOR,
            pady=15,
        )
        title.pack()

        # Instructions
        instruct_font = tkfont.Font(family="Arial", size=12)
        instruct = tk.Label(
            self.root,
            text="Type the word below to make Mario climb! ✨",
            font=instruct_font,
            fg="#aaa",
            bg=BG_COLOR,
        )
        instruct.pack()

        # Canvas for ladder and Mario
        self.canvas = tk.Canvas(
            self.root,
            width=400,
            height=320,
            bg=BG_COLOR,
            highlightthickness=0,
        )
        self.canvas.pack(pady=20)

        # Word to type display
        self.word_label = tk.Label(
            self.root,
            text="",
            font=self.word_font,
            fg=WORD_COLOR,
            bg=BG_COLOR,
            pady=10,
        )
        self.word_label.pack()

        # Input frame
        input_frame = tk.Frame(self.root, bg=BG_COLOR)
        input_frame.pack(pady=15)

        self.input_var = tk.StringVar()
        self.input_var.trace("w", self._on_input_change)

        self.input_entry = tk.Entry(
            input_frame,
            textvariable=self.input_var,
            font=self.input_font,
            width=8,
            justify="center",
            bg=INPUT_BG,
            fg=TEXT_COLOR,
            insertbackground=TEXT_COLOR,
            relief="flat",
            bd=0,
        )
        self.input_entry.pack(ipady=10, ipadx=15, padx=5)
        self.input_entry.configure(highlightbackground=INPUT_FOCUS, highlightthickness=2)
        self.input_entry.bind("<Return>", lambda e: self._check_word())
        self.input_entry.focus_set()

        # Feedback label
        self.feedback_label = tk.Label(
            self.root,
            text="",
            font=tkfont.Font(family="Arial", size=14),
            fg=TEXT_COLOR,
            bg=BG_COLOR,
            pady=5,
        )
        self.feedback_label.pack()

        # Progress
        self.progress_label = tk.Label(
            self.root,
            text=f"Ladder: 0 / {self.ladder_rungs}",
            font=tkfont.Font(family="Arial", size=12),
            fg="#888",
            bg=BG_COLOR,
        )
        self.progress_label.pack(pady=5)

    def _center_window(self):
        """Center the window on screen."""
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f"+{x}+{y}")

    def _draw_ladder(self):
        """Draw the ladder on the canvas."""
        self.canvas.delete("ladder")

        # Ladder dimensions
        x_center = 200
        ladder_width = 80
        rung_height = 35
        start_y = 280

        # Draw two vertical poles
        for dx in [-ladder_width // 2, ladder_width // 2]:
            self.canvas.create_line(
                x_center + dx, 20,
                x_center + dx, start_y + 40,
                fill=LADDER_COLOR,
                width=8,
                tags="ladder",
            )

        # Draw rungs
        for i in range(self.ladder_rungs + 1):
            y = start_y - (i * rung_height)
            self.canvas.create_line(
                x_center - ladder_width // 2,
                y,
                x_center + ladder_width // 2,
                y,
                fill=LADDER_RUNG,
                width=6,
                tags="ladder",
            )

    def _create_mario(self):
        """Create Mario character (simple cartoon style)."""
        self._update_mario_position()

    def _update_mario_position(self):
        """Draw/update Mario at current ladder position."""
        self.canvas.delete("mario")

        x_center = 200
        rung_height = 35
        base_y = 280

        # Mario's position - centered on ladder
        mario_y = base_y - (self.current_rung * rung_height) - 25

        # Mario body - red overalls (rounded rect)
        body = self.canvas.create_oval(
            x_center - 18, mario_y - 10,
            x_center + 18, mario_y + 25,
            fill=MARIO_RED,
            outline="#c0392b",
            width=2,
            tags="mario",
        )

        # Mario head
        head = self.canvas.create_oval(
            x_center - 14, mario_y - 28,
            x_center + 14, mario_y - 5,
            fill=MARIO_SKIN,
            outline="#e6b422",
            width=2,
            tags="mario",
        )

        # Cap (Mario's iconic cap)
        cap = self.canvas.create_oval(
            x_center - 16, mario_y - 30,
            x_center + 16, mario_y - 18,
            fill=MARIO_RED,
            outline="#c0392b",
            width=2,
            tags="mario",
        )

        # M on cap (simplified - a small rectangle)
        self.canvas.create_rectangle(
            x_center - 6, mario_y - 26,
            x_center + 6, mario_y - 20,
            fill="white",
            outline=MARIO_RED,
            tags="mario",
        )

    def _new_word(self):
        """Pick a new 3-letter word to type."""
        available = [w for w in WORDS if w not in self.words_used]
        if not available:
            self.words_used.clear()
            available = WORDS

        self.current_word = random.choice(available)
        self.words_used.add(self.current_word)
        self.word_label.config(text=self.current_word.upper())
        self.input_var.set("")
        self.feedback_label.config(text="")
        self.input_entry.focus_set()

    def _on_input_change(self, *args):
        """Handle input change - limit to 3 characters."""
        value = self.input_var.get()
        if len(value) > 3:
            self.input_var.set(value[:3])

    def _check_word(self):
        """Check if typed word matches and move Mario up."""
        typed = self.input_var.get().strip().lower()

        if not typed:
            return

        if typed == self.current_word:
            self.current_rung += 1
            self.progress_label.config(
                text=f"Ladder: {self.current_rung} / {self.ladder_rungs}",
                fg=SUCCESS_COLOR,
            )
            self.feedback_label.config(text="🎉 Great job! Mario climbs up!", fg=SUCCESS_COLOR)

            self._update_mario_position()

            if self.current_rung >= self.ladder_rungs:
                self._win_game()
                return

            self.root.after(500, self._new_word)
        else:
            self.feedback_label.config(
                text="Oops! Try again. 💪",
                fg="#ff6b6b",
            )
            self.input_var.set("")
            self.input_entry.focus_set()

    def _win_game(self):
        """Handle game win."""
        self.word_label.config(text="🏆")
        self.feedback_label.config(
            text="Mario reached the top! You're a typing champion! 🌟",
            fg=SUCCESS_COLOR,
            font=tkfont.Font(family=("Comic Sans MS", "Helvetica", "Arial"), size=14, weight="bold"),
        )
        self.input_entry.config(state="disabled")

        # Restart button
        restart_btn = tk.Button(
            self.root,
            text="Play Again! 🎮",
            font=tkfont.Font(family=("Comic Sans MS", "Helvetica", "Arial"), size=14, weight="bold"),
            bg=SUCCESS_COLOR,
            fg="white",
            activebackground="#5ab869",
            activeforeground="white",
            relief="flat",
            padx=20,
            pady=10,
            cursor="hand2",
            command=self._restart,
        )
        restart_btn.pack(pady=15)

    def _restart(self):
        """Restart the game."""
        self.root.destroy()
        MarioTypingGame().run()

    def run(self):
        """Start the game loop."""
        self.root.mainloop()


def main():
    game = MarioTypingGame()
    game.run()


if __name__ == "__main__":
    main()
