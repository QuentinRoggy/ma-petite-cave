// Cette page ne devrait jamais être visible car le middleware
// redirige vers /dashboard (merchant) ou /boxes (client)
export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-muted-foreground">Chargement...</div>
    </div>
  )
}
