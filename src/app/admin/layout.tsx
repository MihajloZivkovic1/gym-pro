import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Block non-admin users
  if (!session || session.user.role !== "ADMIN") {
    redirect("/unauthorized")
  }

  return <>{children}</>
}