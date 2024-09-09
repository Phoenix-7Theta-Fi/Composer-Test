import ChatInterface from './components/ChatInterface';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold mb-8">RAG Q&A Chatbot</h1>
      <ChatInterface />
    </main>
  );
}