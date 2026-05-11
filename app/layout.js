import "./globals.css";

export const metadata = {
  title: "MathCraft v0.10.3",
  description: "Dungeon loop with boss reveal and monster gallery",
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
