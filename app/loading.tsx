import Image from "next/image";

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Bidcraft"
      className="flex min-h-dvh flex-col items-center justify-center bg-[#F8F6EF] px-6 text-[#101714] dark:bg-[#101714] dark:text-[#F8F6EF]"
    >
      <div className="flex flex-col items-center gap-5">
        <Image
          src="/brand/bidcraft-icon.webp"
          alt=""
          width={112}
          height={112}
          priority
          className="h-24 w-24 rounded-[24%] shadow-[0_18px_45px_#10171424] motion-safe:animate-[pulse_2s_ease-in-out_infinite] sm:h-28 sm:w-28"
        />
        <div className="text-center">
          <p className="text-3xl font-bold tracking-[-0.06em]">
            bidcraft<span className="text-[#168B7A] dark:text-[#DDFB82]">.</span>
          </p>
          <p className="mt-1.5 text-sm font-medium text-[#52615A] dark:text-[#B9C7BF]">
            Make every bid count.
          </p>
        </div>
      </div>
      <span className="sr-only">Preparing your workspace…</span>
    </div>
  );
}
