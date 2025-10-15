import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const IS_MAC =
  typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getShortcutLabel(shortcut: string) {
  if (!shortcut) return "";
  const parts = shortcut.split("+");
  return parts
    .map((part) => {
      const key = part.trim().toLowerCase();
      if (key === "ctrl") return IS_MAC ? "⌘" : "Ctrl";
      if (key === "meta") return "⌘";
      if (key === "alt") return IS_MAC ? "⌥" : "Alt";
      if (key === "shift") return IS_MAC ? "⇧" : "Shift";
      return key.length === 1 ? key.toUpperCase() : key.charAt(0).toUpperCase() + key.slice(1);
    })
    .join(IS_MAC ? "" : " + ");
}
