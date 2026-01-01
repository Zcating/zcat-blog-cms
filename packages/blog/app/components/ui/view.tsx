import React from "react";

interface ViewProps extends React.HTMLAttributes<HTMLDivElement> {
  backgroundColor?: string;
}

export const View = React.forwardRef<HTMLDivElement, ViewProps>(
  function View(props, ref) {
    const { backgroundColor, ...rest } = props;
    return (
      <div {...rest} ref={ref} style={{ backgroundColor, ...rest.style }} />
    );
  },
);
