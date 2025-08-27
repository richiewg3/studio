'use server';

/**
 * @fileOverview A data manipulation AI agent for spreadsheets.
 *
 * - manipulateData - A function that handles data manipulation in spreadsheets.
 * - ManipulateDataInput - The input type for the manipulateData function.
 * - ManipulateDataOutput - The return type for the manipulateData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ManipulateDataInputSchema = z.object({
  spreadsheetData: z
    .string()
    .describe('The data from the spreadsheet as a CSV string.'),
  selectedRange: z
    .string()
    .describe('The selected range of cells in the spreadsheet (e.g., A1:C5).'),
  instruction: z
    .string()
    .describe(
      'The natural language instruction for data manipulation (e.g., sort by column A, filter out rows where column B is less than 5, calculate the sum of column C)'
    ),
});
export type ManipulateDataInput = z.infer<typeof ManipulateDataInputSchema>;

const ManipulateDataOutputSchema = z.object({
  manipulatedData: z
    .string()
    .describe('The manipulated data in CSV format.'),
});
export type ManipulateDataOutput = z.infer<typeof ManipulateDataOutputSchema>;

export async function manipulateData(input: ManipulateDataInput): Promise<ManipulateDataOutput> {
  return manipulateDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'manipulateDataPrompt',
  input: {schema: ManipulateDataInputSchema},
  output: {schema: ManipulateDataOutputSchema},
  prompt: `You are an AI assistant specializing in data manipulation within spreadsheets.

You will receive spreadsheet data in CSV format, a selected range of cells, and a natural language instruction.
Your goal is to perform the data manipulation task described in the instruction on the selected range of the spreadsheet data.

Spreadsheet Data (CSV):
{{spreadsheetData}}

Selected Range: {{selectedRange}}

Instruction: {{instruction}}

Return the manipulated data in CSV format.

Make sure you return valid CSV.
`,
});

const manipulateDataFlow = ai.defineFlow(
  {
    name: 'manipulateDataFlow',
    inputSchema: ManipulateDataInputSchema,
    outputSchema: ManipulateDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
