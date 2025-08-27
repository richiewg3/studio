// src/ai/flows/rewrite-document.ts
'use server';
/**
 * @fileOverview A flow that rewrites a selected portion of text in a document using natural language instructions.
 *
 * - rewriteDocument - A function that handles the rewriting process.
 * - RewriteDocumentInput - The input type for the rewriteDocument function.
 * - RewriteDocumentOutput - The return type for the rewriteDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RewriteDocumentInputSchema = z.object({
  selectedText: z.string().describe('The text selected by the user to be rewritten.'),
  instructions: z.string().describe('Natural language instructions for rewriting the selected text.'),
});
export type RewriteDocumentInput = z.infer<typeof RewriteDocumentInputSchema>;

const RewriteDocumentOutputSchema = z.object({
  rewrittenText: z.string().describe('The rewritten text based on the instructions.'),
});
export type RewriteDocumentOutput = z.infer<typeof RewriteDocumentOutputSchema>;

export async function rewriteDocument(input: RewriteDocumentInput): Promise<RewriteDocumentOutput> {
  return rewriteDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'rewriteDocumentPrompt',
  input: {schema: RewriteDocumentInputSchema},
  output: {schema: RewriteDocumentOutputSchema},
  prompt: `You are an AI assistant specialized in rewriting text based on user instructions.

  Selected Text: {{{selectedText}}}
  Instructions: {{{instructions}}}

  Rewrite the selected text according to the instructions provided. Return only the rewritten text.`,
});

const rewriteDocumentFlow = ai.defineFlow(
  {
    name: 'rewriteDocumentFlow',
    inputSchema: RewriteDocumentInputSchema,
    outputSchema: RewriteDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
