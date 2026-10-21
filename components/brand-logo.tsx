import Image from 'next/image';
import Link from 'next/link';

export function BrandLogoMark({ size = 40 }: { size?: number; interactive?: boolean }) {
  return <Image src="/brand/bidcraft-icon.webp" width={size} height={size} alt="" className="brand-mark shrink-0 rounded-[24%]" />;
}

export function BrandWordmark() {
  return <Link href="/" aria-label="Bidcraft home" className="group inline-flex items-center gap-2.5">
    <BrandLogoMark />
    <span className="text-[25px] font-bold tracking-[-0.055em]">bidcraft<span className="text-[#168B7A]">.</span></span>
  </Link>;
}
