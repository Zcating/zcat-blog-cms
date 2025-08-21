import { cn } from "../utils";
import { tv } from "tailwind-variants";

type ContentMode = "cover" | "contain" | "fill" | "none" | "scale-down";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  contentMode?: ContentMode;
}

const imageTv = tv({
  variants: {
    contentMode: {
      cover: "object-cover",
      contain: "object-contain",
      fill: "object-fill",
      none: "object-none",
      "scale-down": "object-scale-down",
    },
  },
  defaultVariants: {
    contentMode: "cover",
  },
});

export function Image(props: ImageProps) {
  const { src, alt, className, contentMode, ...rest } = props;
  return (
    <img
      className={cn(imageTv({ contentMode }), className)}
      src={src}
      alt={alt}
      {...rest}
    />
  );
}
