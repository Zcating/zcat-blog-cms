import React from "react";
import { cn } from "../utils";
import { tv } from "tailwind-variants";
import { View } from "./view";
import { IconPhoto } from "../icons";

type ContentMode = "cover" | "contain" | "fill" | "none" | "scale-down";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  contentMode?: ContentMode;
}

const imageTv = tv({
  base: "max-h-full max-w-full",
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
      onLoad={(e) => console.log(e)}
      className={cn(imageTv({ contentMode }), className)}
      src={src}
      alt={alt}
      {...rest}
    />
  );
}

interface ImagePreloadProps extends ImageProps {
  imageClassName?: string;
}

export function ImagePreload(props: ImagePreloadProps) {
  const { src, className, imageClassName, ...rest } = props;
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!src) {
      return;
    }

    const image = new window.Image();
    image.onload = function () {
      setLoaded(true);
    };
    image.src = src;
  }, []);

  const cls = cn("flex items-center justify-center w-full h-full", className);

  return (
    <View className={cls}>
      {loaded ? (
        <Image
          contentMode="contain"
          src={src}
          className={imageClassName}
          {...rest}
        />
      ) : (
        <IconPhoto size="lg" />
      )}
    </View>
  );
}
