import { useEffect } from "react";

import Home from "./pages/Home";

import { useDuckDBStore } from "./store/duckDBStore";

import {applyThemeColor} from '@/utils/theme';




const App = () => {

  const { initialize } = useDuckDBStore();
  
  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const savedColor = localStorage.getItem("theme-primary-color");
    if (savedColor) {
      applyThemeColor(savedColor);
    }
  }, []);
  return <Home />;
};

export default App;
