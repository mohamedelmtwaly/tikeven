import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Providers } from './../Providers';

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

    <>
      <Nav wide />
      <main className="pt-16">{children}</main>
      <Footer />
    </>
  );
}
