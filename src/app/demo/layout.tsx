import { PortalNav } from '@/components/nav/PortalNav';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PortalNav />
      {children}
    </>
  );
}
