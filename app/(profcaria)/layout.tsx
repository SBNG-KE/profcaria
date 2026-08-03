import ProfcariaShell from './profcaria-shell';

export default function ProfcariaLayout({ children }: { children: React.ReactNode }) {
  return <ProfcariaShell>{children}</ProfcariaShell>;
}
