export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // 之前硬编码 bg-[#0a0a0f] 在白天主题下登录页背景全黑反差刺眼；
    // 改用主题 token bg-background，白/夜模式都自适应。
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px]" />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
