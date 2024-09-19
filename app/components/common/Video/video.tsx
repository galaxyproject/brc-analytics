import { useEffect, useState } from "react";
import ReactPlayer from "react-player";

// React Player works only in the browser environment; to prevent hydration errors, the "mounted" state is required.

export const Video = ({ ...props }): JSX.Element | null => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <ReactPlayer height="100%" width="100%" {...props} /> : null;
};
