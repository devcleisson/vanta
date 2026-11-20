import Image, { type ImageProps } from "next/image";

/** next/image wrapper: SVG renders are served as-is, photos go through the optimizer. */
export function ProductImage(props: ImageProps & { src: string }) {
  const isSvg = props.src.split("?")[0].endsWith(".svg");
  return <Image {...props} unoptimized={isSvg || props.unoptimized} />;
}
