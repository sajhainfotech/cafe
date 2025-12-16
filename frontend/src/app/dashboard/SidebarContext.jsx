"use client";

import React, { createContext, useContext, useState } from "react";

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false); // desktop
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, sidebarOpen, setSidebarOpen }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
