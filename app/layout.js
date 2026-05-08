export const metadata = {
  title: "MathCraft Campaign",
  description: "Minecraft-inspired math dungeon game"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
