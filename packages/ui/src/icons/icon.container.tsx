import React from 'react';

import { iconVariants, IconVariantsProps } from './variants';

interface IconProps extends IconVariantsProps {
  Renderer: React.ComponentType<any>;
}

export function IconContainer(props: IconProps) {
  const Renderer = props.Renderer;
  return <Renderer className={iconVariants({ size: props.size })} />;
}
