import React from "react";

export function useUpdate() {
  const [_, update] = React.useState({});
  return React.useCallback(() => {
    update({});
  }, []);
}
