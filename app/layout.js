export const metadata = {
  title: 'MathCraft v0.9.0',
  description: 'Mobile-first Minecraft-inspired multiplication practice game',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
