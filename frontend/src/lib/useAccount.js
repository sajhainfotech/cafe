"use client";

import { useEffect, useState } from "react";

/**
 * The signed-in account's context, as stashed by the login page.
 *
 * sessionStorage is browser-only, so every value starts empty and fills in after
 * mount — reading it during render is what broke the production build
 * originally. Previously duplicated across the sidebar, the header and the order
 * screen; they now share this.
 */
export function useAccount() {
  const [account, setAccount] = useState({
    restaurant: "",
    branch: "",
    username: "",
  });

  useEffect(() => {
    let username = "";
    try {
      const stored = sessionStorage.getItem("user_info");
      if (stored) {
        const user = JSON.parse(stored);
        username = user.first_name || user.username || "";
      }
    } catch {
      // Malformed payload — fall through with the other fields.
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAccount({
      restaurant: sessionStorage.getItem("restaurant_name") || "",
      branch: sessionStorage.getItem("branch_name") || "",
      username,
    });
  }, []);

  return account;
}
