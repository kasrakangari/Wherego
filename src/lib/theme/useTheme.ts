"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const storageKey = "wherego-theme";
const themeChangeEvent = "wherego-theme-change";

function getSystemTheme(): Theme {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  ) {
    return "light";
  }

  return "dark";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  const savedTheme = window.localStorage.getItem(storageKey);
  return savedTheme === "light" || savedTheme === "dark" ? savedTheme : getSystemTheme();
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(theme);
  document.documentElement.dataset.theme = theme;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    function handleThemeChange(event: Event) {
      const nextTheme = (event as CustomEvent<Theme>).detail;

      if (nextTheme === "light" || nextTheme === "dark") {
        setThemeState(nextTheme);
      }
    }

    window.addEventListener(themeChangeEvent, handleThemeChange);

    return () => window.removeEventListener(themeChangeEvent, handleThemeChange);
  }, []);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
    window.dispatchEvent(new CustomEvent(themeChangeEvent, { detail: nextTheme }));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  return { theme, setTheme, toggleTheme };
}
