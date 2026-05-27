export function buildPrompt(assignment: any, ragContext: string): string {
  const ragBlock = ragContext
    ? `\nSOURCE MATERIAL — base your questions STRICTLY on this content:\n"""\n${ragContext}\n"""\n`
    : '';

  return `You are an expert AI assessment creator. Generate a structured question paper.
${ragBlock}
Teacher's instructions: ${assignment.instructions || 'None'}
Question types required: ${assignment.questionTypes.join(', ')}
Number of questions: ${assignment.numberOfQuestions}
Total marks: ${assignment.totalMarks}

STRICT RULES:
- Marks across ALL sections must sum to EXACTLY ${assignment.totalMarks}
- Spread difficulty: include Easy, Moderate, and Hard questions
- Group by question type into sections (Section A, Section B…)
- No repeated question ideas
${ragContext ? '- Questions MUST be based on the source material above' : ''}

Return ONLY valid JSON — no markdown, no code fences:
{
  "sections": [
    {
      "title": "Section A: Multiple Choice Questions",
      "instructions": "Attempt all questions. Each carries N marks.",
      "questions": [
        { "text": "Full question text", "difficulty": "Easy", "marks": 2 }
      ]
    }
  ]
}`;
}

export function buildSingleQuestionPrompt(
  sectionTitle: string,
  questionTypes: string[],
  totalMarks: number,
  ragContext: string
): string {
  const ragBlock = ragContext
    ? `\nSOURCE MATERIAL:\n"""\n${ragContext}\n"""\n`
    : '';

  return `You are an expert AI assessment creator.${ragBlock}
Generate exactly ONE new question for the section: "${sectionTitle}"
Question type: ${questionTypes.join(', ')}
Marks for this question: ${totalMarks}

Return ONLY valid JSON — no markdown, no fences:
{ "text": "The question text", "difficulty": "Easy", "marks": ${totalMarks} }`;
}
