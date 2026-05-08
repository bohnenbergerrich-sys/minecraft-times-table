export const metadata = {
  title: "MathCraft v8",
  description: "Mobile-friendly adaptive dungeon math game"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
