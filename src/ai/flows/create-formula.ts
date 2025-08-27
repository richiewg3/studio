'use server';

/**
 * @fileOverview Creates a spreadsheet formula based on a user's natural language description.
 *
 * - createFormula - A function that generates a spreadsheet formula from a description.
 * - CreateFormulaInput - The input type for the createFormula function.
 * - CreateFormulaOutput - The return type for the createFormula function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateFormulaInputSchema = z.object({
  description: z.string().describe('A natural language description of the desired calculation.'),
  columnNames: z.array(z.string()).describe('The names of the columns available in the spreadsheet.'),
});
export type CreateFormulaInput = z.infer<typeof CreateFormulaInputSchema>;

const CreateFormulaOutputSchema = z.object({
  formula: z.string().describe('The generated spreadsheet formula.'),
});
export type CreateFormulaOutput = z.infer<typeof CreateFormulaOutputSchema>;

export async function createFormula(input: CreateFormulaInput): Promise<CreateFormulaOutput> {
  return createFormulaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createFormulaPrompt',
  input: {schema: CreateFormulaInputSchema},
  output: {schema: CreateFormulaOutputSchema},
  prompt: `You are a spreadsheet expert. You will generate a spreadsheet formula based on the user's description.

  Here are the available column names: {{columnNames}}

  Description: {{{description}}}

  Given the description, create a valid spreadsheet formula that performs the calculation. The formula should be compatible with common spreadsheet software like Google Sheets or Microsoft Excel.
  Ensure that the formula is syntactically correct and uses the appropriate column names. Use column names directly, do not assume column order.
  The formula should NOT include an equals sign (=).
  If no columns are mentioned, assume that the formula should use columns A, B, C, etc.
`,
});

const createFormulaFlow = ai.defineFlow(
  {
    name: 'createFormulaFlow',
    inputSchema: CreateFormulaInputSchema,
    outputSchema: CreateFormulaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
