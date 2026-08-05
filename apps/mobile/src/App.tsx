import { Button } from '@apron/ui'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8 text-primary">Apron Mobile</h1>
      <p className="mb-4">Tailwind v4 & HeroUI Setup Successful!</p>
      <Button color="secondary" variant="shadow">
        Click Me (HeroUI Button)
      </Button>
    </div>
  )
}

export default App
