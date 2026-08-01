import { type ComponentProps, type JSX } from "react";

export const Video = ({ ...props }: ComponentProps<"iframe">): JSX.Element => {
  return (
    <iframe
      allowFullScreen
      height="100%"
      title="Video"
      width="100%"
      {...props}
      // allow/sandbox are enforced defaults — set after the spread so MDX
      // content can't weaken the frame's permissions or sandboxing.
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      sandbox="allow-scripts allow-same-origin allow-presentation"
    />
  );
};
