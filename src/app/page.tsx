import { auth } from "@/auth";

const Page = async () => {
  const session = await auth();
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-4xl font-bold">StudyBuddy</h1>
        {session?.user ? (
          <p className="text-lg">
            Welcome back, <span className="font-medium">{session.user.name ?? session.user.email}</span>!
          </p>
        ) : (
          <p className="text-lg">Welcome to StudyBuddy! Please sign in to continue.</p>
        )}
      </div>
    </main>
  );
}

export default Page;