const LoadingSpinner = ({ size = "md", className = "" }) => {
  const s = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" }[size];
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${s} animate-spin rounded-full border-2 border-white/10 border-t-[#2ee6a6]`} />
    </div>
  );
};

export default LoadingSpinner;
