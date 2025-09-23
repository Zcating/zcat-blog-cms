export interface ColProps {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  children?: React.ReactNode;
}

export function Col(props: ColProps) {
  return <div {...props} />;
}
