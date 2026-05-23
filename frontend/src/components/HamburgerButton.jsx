const HamburgerButton = ({ open, onClick, className = "" }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col justify-center items-center gap-[5px] w-10 h-10 rounded-lg hover:bg-white/5 transition shrink-0 ${className}`}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
    >
      <span
        className={`block h-0.5 w-5 bg-[#e8e8f0] rounded-full transition-all duration-300 ${
          open ? "translate-y-[7px] rotate-45" : ""
        }`}
      />
      <span
        className={`block h-0.5 w-5 bg-[#e8e8f0] rounded-full transition-all duration-300 ${
          open ? "opacity-0 scale-0" : ""
        }`}
      />
      <span
        className={`block h-0.5 w-5 bg-[#e8e8f0] rounded-full transition-all duration-300 ${
          open ? "-translate-y-[7px] -rotate-45" : ""
        }`}
      />
    </button>
  );
};

export default HamburgerButton;
