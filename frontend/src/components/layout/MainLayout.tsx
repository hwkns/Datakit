import React from "react";
import Sidebar, { DataLoadWithDuckDBResult } from "./Sidebar";
import { useAppStore } from "@/store/appStore";
import { motion } from "framer-motion";

interface MainLayoutProps {
  children: React.ReactNode;
  onDataLoad?: (result: DataLoadWithDuckDBResult) => void;
}

/**
 * Main layout component containing the sidebar and main content area
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children, onDataLoad }) => {
  const { sidebarCollapsed } = useAppStore();

  // Animation variants for the main content
  const contentVariants = {
    sidebarExpanded: { 
      marginLeft: "0", 
      width: "calc(100% - 16rem)"  // subtract w-64 (16rem)
    },
    sidebarCollapsed: { 
      marginLeft: "0", 
      width: "calc(100% - 4rem)"   // subtract mini sidebar width
    },
  };

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar onDataLoad={onDataLoad} />
      
      {/* Main content area */}
      <motion.main 
        className="flex-1 h-full overflow-hidden"
        initial={sidebarCollapsed ? "sidebarCollapsed" : "sidebarExpanded"}
        animate={sidebarCollapsed ? "sidebarCollapsed" : "sidebarExpanded"}
        variants={contentVariants}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {children}
      </motion.main>
    </div>
  );
};

export default MainLayout;