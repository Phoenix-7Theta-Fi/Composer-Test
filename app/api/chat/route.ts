import { NextRequest, NextResponse } from 'next/server';
import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatGoogleGenerativeAI } from 'langchain/chat_models/googlegenai';
import { PromptTemplate } from 'langchain/prompts';
import { RunnableSequence } from 'langchain/schema/runnable';
import { StringOutputParser } from 'langchain/schema/output_parser';

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const llm = new ChatGoogleGenerativeAI({
  modelName: 'gemini-pro',
  maxOutputTokens: 2048,
});

const retriever = async (query: string) => {
  const results = await qdrant.search('your_collection_name', {
    vector: await model.embedContent(query),
    limit: 5,
  });
  return results.map((r) => r.payload?.text as string).join('\n');
};

const template = `Answer the question based on the following context:
Context: {context}

Question: {question}

Answer:`;

const prompt = PromptTemplate.fromTemplate(template);

const chain = RunnableSequence.from([
  {
    context: retriever,
    question: (input: { question: string }) => input.question,
  },
  prompt,
  llm,
  new StringOutputParser(),
]);

export async function POST(req: NextRequest) {
  const { question } = await req.json();

  try {
    const response = await chain.invoke({ question });
    return NextResponse.json({ answer: response });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
  }
}