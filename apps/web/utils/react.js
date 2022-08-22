import React from "react";

export const useLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;
