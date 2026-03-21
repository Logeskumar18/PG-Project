import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
const [theme, setTheme] = useState(() => {
    // Try to get theme from localStorage, default to 'light'
    return localStorage.getItem('theme') || 'light';
  });

  const colors = {
    light: {
      bgPrimary: '#f8f9fa',
      bgNavbar: '#ffffff',
      textPrimary: '#212529',
      textSecondary: '#6c757d',
      accent: '#0d6efd', // Bootstrap primary
      accentHod: '#6610f2', // purple
      success: '#198754',
      warning: '#ffc107',
      danger: '#dc3545',
      gradient: 'linear-gradient(135deg, #0d6efd 0%, #6610f2 100%)'
    },
    dark: {
      bgPrimary: '#212529', // bg-dark
      bgNavbar: '#343a40',
      textPrimary: '#f8f9fa',
      textSecondary: '#adb5bd',
      accent: '#4dabf7', // lighter blue for dark
      accentHod: '#a855f7', // lighter purple
      success: '#75b798',
      warning: '#f4b747',
      danger: '#f87171',
      gradient: 'linear-gradient(135deg, #4dabf7 0%, #a855f7 100%)'
    }
  };

  const getColor = (key) => colors[theme][key];


  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, colors, getColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
