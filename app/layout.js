import './globals.css';

export const metadata = {
  title: 'PGA Championship Pick 3',
  description: 'Live Pick 3 golf pool leaderboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
