"use client";

import { useEffect, useState } from "react";

/**
 * False during SSR/prerender and the first client render, true afterwards.
 *
 * Charts need it: recharts' ResponsiveContainer measures its parent, which has
 * no size during prerender, so it logged "width(-1) and height(-1)" on every
 * build and shipped an empty SVG in the HTML. Gate the chart on this and render
 * a skeleton until the real size exists.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  // The one legitimate use of setState-in-effect: this flag exists precisely to
  // detect "we are now past hydration", which no other signal gives us.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  return mounted;
}
