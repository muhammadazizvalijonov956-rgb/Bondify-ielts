import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Muhammadaziz | Full Stack Developer',
  description: 'Full-Stack Developer Specializing in EdTech Systems and High-Performance Web Applications.',
};

export default function AzizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
