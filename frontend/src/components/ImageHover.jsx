import React from "react";
import { Image } from "antd";
const MenuImageHover = ({ src, name = "Menu Item" }) => (
  <Image src={src} width={15} height={15} alt={name} />
);
export default MenuImageHover;
