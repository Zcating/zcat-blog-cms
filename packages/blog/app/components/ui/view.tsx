import type React from "react";

interface ViewProps extends React.HTMLAttributes<HTMLDivElement> {
  backgroundColor?: string;
}

export function View(props: ViewProps) {
  const { backgroundColor, ...rest } = props;
  return <div {...rest} style={{ backgroundColor, ...rest.style }} />;
}
