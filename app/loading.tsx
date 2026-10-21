export default function Loading() {
  return (
    <div className="min-h-dvh bg-[#F8F6EF] dark:bg-[#0D0F0E] text-[#0D0F0E] dark:text-[#F5F7F6] p-4 lg:p-8 space-y-5">
      <div className="h-14 w-full rounded-3xl bg-white/80 dark:bg-[#161918] animate-pulse" />
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="hidden lg:block lg:col-span-2 h-[720px] rounded-3xl bg-[#E7E9E8] dark:bg-[#131615] animate-pulse" />
        <div className="lg:col-span-3 h-[720px] rounded-3xl bg-white/75 dark:bg-[#141716] animate-pulse" />
        <div className="lg:col-span-7 space-y-4">
          <div className="h-16 rounded-3xl bg-[#DDFB82]/40 dark:bg-[#161918] animate-pulse" />
          <div className="h-52 rounded-3xl bg-white dark:bg-[#161918] animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-80 rounded-3xl bg-white dark:bg-[#161918] animate-pulse" />
            <div className="h-80 rounded-3xl bg-white dark:bg-[#161918] animate-pulse" />
            <div className="h-80 rounded-3xl bg-white dark:bg-[#161918] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
