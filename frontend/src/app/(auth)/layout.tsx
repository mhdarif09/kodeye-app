export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Optional: Add a subtle background pattern or gradient here if desired */}
      <div className="absolute inset-0 bg-background bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-25 z-0" />
      
      <div className="relative z-10 w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Kodeye</h1>
          <p className="text-sm text-muted-foreground mt-2">Masuk ke platform</p>
        </div>
        
        {children}
      </div>
    </main>
  );
}
