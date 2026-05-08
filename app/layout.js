export const metadata = {
  title: "MathCraft v7",
  description: "Adaptive dungeon math game"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
