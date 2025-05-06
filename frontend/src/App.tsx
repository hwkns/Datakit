import { useEffect } from "react";

import Home from "./pages/Home";

import {applyThemeColor} from '@/utils/theme';



const App = () => {
  useEffect(() => {
    const savedColor = localStorage.getItem("theme-primary-color");
    if (savedColor) {
      applyThemeColor(savedColor);
    }
  }, []);
  return <Home />;
};

export default App;
