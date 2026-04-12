export function HolographicBackground() {
  return (
    <div
      className="fixed inset-0 z-[-1] overflow-hidden bg-[#0A0A1A]"
      style={{ contain: "layout style" }}
    >
      <div className="absolute inset-0 opacity-40 mix-blend-screen">
        <div
          className="holo-blob-1 absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-r from-[#7B2FFF] to-[#00D4FF]"
          style={{ filter: "blur(90px)" }}
        />
        <div
          className="holo-blob-2 absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-r from-[#FF0080] to-[#7B2FFF]"
          style={{ filter: "blur(80px)" }}
        />
        <div
          className="holo-blob-3 absolute top-[20%] left-[30%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-r from-[#C6FF00] to-[#00D4FF] opacity-30"
          style={{ filter: "blur(110px)" }}
        />
      </div>
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23fff' fill-opacity='0.05'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
