import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { CreateUserForm } from "./CreateUserForm";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { toggleUserActive } from "./actions";

export default async function UsersPage() {
  const admin = await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Users</h1>

      <CreateUserForm />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2 text-slate-900">{u.name}</td>
                <td className="px-4 py-2 text-slate-600">{u.email}</td>
                <td className="px-4 py-2">
                  <span className={u.role === "ADMIN" ? "text-indigo-600" : "text-slate-600"}>{u.role}</span>
                </td>
                <td className="px-4 py-2">
                  {u.active ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-600">Disabled</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <form action={toggleUserActive}>
                      <input type="hidden" name="id" value={u.id} />
                      <button
                        type="submit"
                        disabled={u.id === admin.id}
                        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                        title={u.id === admin.id ? "You cannot disable yourself" : ""}
                      >
                        {u.active ? "Disable" : "Enable"}
                      </button>
                    </form>
                    <ResetPasswordForm userId={u.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
