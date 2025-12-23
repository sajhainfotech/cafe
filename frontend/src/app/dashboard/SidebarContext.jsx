"use client";

import React, { createContext, useContext, useState } from "react";

const SidebarContext = createContext();

const getInitialCollapsed = () => {
  if (typeof window === "undefined") return true;
  return window.innerWidth < 1024; 
};

export const SidebarProvider = ({ children }) => {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, sidebarOpen, setSidebarOpen }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
