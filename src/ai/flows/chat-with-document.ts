'use server';

/**
 * @fileOverview A conversational flow for editing a document.
 *
 * - chatWithDocument - A function that handles the conversational editing process.
 * - ChatWithDocumentInput - The input type for the chatWithDocument function.
 * - ChatWithDocumentOutput - The return type for the chatWithDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithDocumentInputSchema = z.object({
  document: z.string().describe('The current content of the document.'),
  instruction: z.string().describe('The user\'s instruction for what to change.'),
  chatHistory: z.string().optional().describe('The history of the conversation so far.'),
});
export type ChatWithDocumentInput = z.infer<typeof ChatWithDocumentInputSchema>;

const ChatWithDocumentOutputSchema = z.object({
  reply: z.string().describe('A conversational reply to the user about the changes made.'),
  rewrittenDocument: z.string().describe('The full, updated document content.'),
});
export type ChatWithDocumentOutput = z.infer<typeof ChatWithDocumentOutputSchema>;

export async function chatWithDocument(input: ChatWithDocumentInput): Promise<ChatWithDocumentOutput> {
  return chatWithDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithDocumentPrompt',
  input: {schema: ChatWithDocumentInputSchema},
  output: {schema: ChatWithDocumentOutputSchema},
  prompt: `You are an AI assistant that helps users edit a document through conversation.
  
  The user will provide the current document, an instruction, and the chat history.
  
  Your tasks are:
  1.  Rewrite the document based on the user's latest instruction, taking into account the context of the conversation.
  2.  Provide a short, conversational reply explaining what you did. For example, if the user says "make it shorter", you could reply "I've condensed it for you."
  
  Chat History:
  {{{chatHistory}}}
  
  Current Document:
  {{{document}}}
  
  User Instruction:
  "{{{instruction}}}"
  
  Now, generate the reply and the rewritten document.`,
});

const chatWithDocumentFlow = ai.defineFlow(
  {
    name: 'chatWithDocumentFlow',
    inputSchema: ChatWithDocumentInputSchema,
    outputSchema: ChatWithDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
