export const metadata = {
  title: "MathCraft v0.10",
  description: "Dungeon Bosses + Monster Gallery",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
