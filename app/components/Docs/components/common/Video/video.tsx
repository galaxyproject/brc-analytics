export const Video = ({ ...props }): JSX.Element | null => {
  return (
    <iframe
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      height="100%"
      sandbox="allow-scripts allow-same-origin allow-presentation"
      width="100%"
      {...props}
    />
  );
};
