export const metadata = {
  title: "MathCraft Dungeon",
  description: "A Minecraft-inspired multiplication game"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
