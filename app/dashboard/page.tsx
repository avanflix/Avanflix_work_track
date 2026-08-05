import { auth } from "@/lib/auth";
import { AdminOverview } from "@/components/dashboard/AdminOverview";
import { EmployeeOverview } from "@/components/dashboard/EmployeeOverview";

export default async function DashboardPage() {
  const session = await auth();
  const role = (session?.user as any)?.role as string;

  if (role === "EMPLOYEE") return <EmployeeOverview />;
  return <AdminOverview />;
}
