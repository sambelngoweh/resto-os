"use client";

import * as React from "react";
import { setThemeCookie } from "@/app/admin/menu/actions";

type ThemeContextType = { theme: string; setTheme: (theme: string) => void };
const ThemeContext = React.createContext<ThemeContextType>({ theme: "dark", setTheme: () => {} });

export function ThemeProvider({ children, initialTheme }: { children: React.ReactNode, initialTheme: string }) {
  const [theme, setThemeState] = React.useState(initialTheme);

  const setTheme = async (newTheme: string) => {
    setThemeState(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Save to Server Cookie for zero-FOUC perfect SSR
    await setThemeCookie(newTheme);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => React.useContext(ThemeContext);
