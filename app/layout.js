export const metadata = {
  title: "MathCraft Campaign v5",
  description: "Minecraft-inspired multiplication game"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
