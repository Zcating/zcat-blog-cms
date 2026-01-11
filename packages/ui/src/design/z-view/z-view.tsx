export type ZViewProps = React.ComponentProps<'div'> & {
  backgroundColor?: string;
};

export function ZView(props: ZViewProps) {
  const { backgroundColor, ...rest } = props;
  return <div {...rest} style={{ backgroundColor }} />;
}
