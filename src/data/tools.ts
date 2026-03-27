import { ToolDeclaration } from '../types';

/** Tool declarations sent to Gemini Live API for function calling */
export const checklistTools: ToolDeclaration[] = [
  {
    name: 'markItemDone',
    description: 'Mark the current checklist item as completed and advance to the next item.',
    parameters: {
      type: 'object',
      properties: {
        itemIndex: { type: 'number', description: 'Zero-based index of the item to mark as done' },
      },
      required: ['itemIndex'],
    },
  },
  {
    name: 'skipItem',
    description: 'Skip the current checklist item without marking it as done and advance to the next item.',
    parameters: {
      type: 'object',
      properties: {
        itemIndex: { type: 'number', description: 'Zero-based index of the item to skip' },
      },
      required: ['itemIndex'],
    },
  },
  {
    name: 'goBack',
    description: 'Go back to the previous checklist item.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'getProgress',
    description: 'Get the current progress through the checklist. Returns checked count, skipped count, and remaining count.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'completeSession',
    description: 'Mark the checklist session as complete. Call this when all items have been addressed.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];
