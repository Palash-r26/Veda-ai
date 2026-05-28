export function buildPrompt(assignment: any, ragContext: string): string {
  const ragBlock = ragContext
    ? `\nSOURCE MATERIAL — base your questions STRICTLY on this content:\n"""\n${ragContext}\n"""\n`
    : '';

  return `You are an expert AI assessment creator. Generate a structured question paper.
${ragBlock}
Teacher's instructions: ${assignment.instructions || 'None'}
Question Configuration Breakdown:
${assignment.questionsConfig && assignment.questionsConfig.length > 0 
  ? assignment.questionsConfig.map((q: any) => `- ${q.count} ${q.type} (worth ${q.marks} marks each)`).join('\n') 
  : `Question types required: ${assignment.questionTypes.join(', ')}\nNumber of questions: ${assignment.numberOfQuestions}`
}
Total expected marks: ${assignment.totalMarks}

STRICT RULES:
- Marks across ALL sections must sum to EXACTLY ${assignment.totalMarks}
- Spread difficulty: include Easy, Moderate, and Hard questions
- Group by question type into sections (Section A, Section B…)
- No repeated question ideas
- EVERY question MUST include an accurate, detailed answer/solution in the "answer" field. For MCQs, provide the correct option and brief explanation. For short/long answers, provide the key points or a complete sample response.
${ragContext ? '- Questions MUST be based on the source material above' : ''}

Return ONLY valid JSON — no markdown, no code fences:
{
  "sections": [
    {
      "title": "Section A: Multiple Choice Questions",
      "instructions": "Attempt all questions. Each carries N marks.",
      "questions": [
        { 
          "text": "Full question text", 
          "difficulty": "Easy", 
          "marks": 2, 
          "answer": "Option (B) is correct because..." 
        }
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

STRICT RULES:
- Provide an accurate, detailed answer/solution in the "answer" field.

Return ONLY valid JSON — no markdown, no fences:
{ 
  "text": "The question text", 
  "difficulty": "Easy", 
  "marks": ${totalMarks}, 
  "answer": "Detailed answer key or explanation for this question." 
}`;
}
