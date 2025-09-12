export default function Home() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-4xl font-bold">StudyBuddy</h1>
        <p className="text-gray-600">Design first. Wire auth later.</p>
        <a href="/dashboard" className="inline-block px-5 py-2.5 rounded bg-black text-white">
          Continue to sign in
        </a>
      </div>
    </main>
  );
}
