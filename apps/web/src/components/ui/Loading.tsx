export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-4 h-4 border-2", md: "w-8 h-8 border-2", lg: "w-12 h-12 border-3" };
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizes[size]} border-[#4f6ef7] border-t-transparent rounded-full animate-spin`} />
    </div>
  );
}

export function PageLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-4">
      <div className="w-10 h-10 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
      <p className="text-[#94a3b8] text-sm">{message}</p>
    </div>
  );
}
