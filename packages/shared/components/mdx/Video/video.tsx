import { type ComponentProps, type JSX } from "react";

export const Video = ({ ...props }: ComponentProps<"iframe">): JSX.Element => {
  return (
    <iframe
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      height="100%"
      sandbox="allow-scripts allow-same-origin allow-presentation"
      title="Video"
      width="100%"
      {...props}
    />
  );
};
