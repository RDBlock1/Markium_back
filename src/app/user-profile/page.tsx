import UserExplorer from "@/components/user-profile/user-explorer"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-8 w-full mx-auto">
        <UserExplorer />
    </div>
  )
}
