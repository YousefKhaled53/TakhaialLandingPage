import Image from "next/image";
import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-center py-5">
      <Link href="/" className="pointer-events-auto" aria-label="Takhaial home">
        <Image
          src="/logo.png"
          alt="Takhaial"
          width={78}
          height={78}
          priority
          className="drop-shadow-[0_0_18px_rgba(138,107,255,0.5)]"
        />
      </Link>
    </header>
  );
}
