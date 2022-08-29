import React from "react";

const getMatches = (query) => {
  // Prevents SSR issues
  if (typeof window === "undefined") return null;
  return window.matchMedia(query).matches;
};

const useMediaQuery = (query) => {
  const [matches, setMatches] = React.useState(null);

  React.useEffect(() => {
    const matchMedia = window.matchMedia(query);

    const handleChange = () => {
      setMatches(getMatches(query));
    };

    // Triggered at the first client-side load and if query changes
    handleChange();

    matchMedia.addEventListener("change", handleChange);

    return () => {
      matchMedia.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
};

export default useMediaQuery;
