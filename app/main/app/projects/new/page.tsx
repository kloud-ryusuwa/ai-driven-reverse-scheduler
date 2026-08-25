import { Suspense } from "react";
import NewProjectPageContent from "./NewProjectPageContent";

export default function NewProjectPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-100 p-8 text-gray-800">
          読み込み中...
        </main>
      }
    >
      <NewProjectPageContent />
    </Suspense>
  );
}
