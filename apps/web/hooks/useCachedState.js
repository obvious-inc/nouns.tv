import React from "react";

let defaultStorage;
try {
  defaultStorage = window.localStorage;
} catch (e) {
  console.warn(e);
}

const useCachedState = (key, initialState, storage = defaultStorage) => {
  const [cachedState, setState] = React.useState(initialState);

  React.useEffect(() => {
    try {
      const cachedState = storage.getItem(key);
      if (cachedState == null) return;
      setState(JSON.parse(cachedState));
    } catch (error) {
      console.error(error);
    }
  }, [key, storage]);

  const setCachedState = (newState_) => {
    try {
      const newState =
        typeof newState_ === "function" ? newState_(cachedState) : newState_;

      setState(newState);
      storage.setItem(key, JSON.stringify(newState));
    } catch (error) {
      console.error(error);
    }
  };

  return [cachedState, setCachedState];
};

export default useCachedState;
