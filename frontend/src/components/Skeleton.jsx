export default function Skeleton({ width = '100%', height = 20, mb = 8, borderRadius = 4 }) {
  return (
    <div
      className="skeleton"
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        marginBottom: mb,
        borderRadius,
      }}
    />
  );
}
