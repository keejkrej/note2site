Use when the user provides lecture notes, course materials, slides text, or academic content to convert into a website.

# Parse lecture notes

## 1. Identify structure

Scan the input for:

- **Title and course metadata** — course name, instructor, term, prerequisites
- **Chapters / lectures** — numbered sections, week labels, or topic headings
- **Subsections** — H2/H3-level topics within each chapter
- **Key artifacts** — definitions, theorems, formulas, code samples, diagrams, examples, exercises, references

## 2. Normalize content

Create a mental (or written) outline:

```json
{
  "title": "Course Title",
  "description": "One-line summary",
  "chapters": [
    {
      "slug": "introduction",
      "title": "Introduction",
      "sections": [
        { "slug": "what-is-x", "title": "What is X?", "summary": "..." }
      ]
    }
  ]
}
```

Save this to `/workspace/site-structure.json` using `write_file`.

## 3. Flag issues

- Missing context → ask the user
- Duplicate or conflicting sections → merge and note the decision
- Broken formatting → clean up markdown before generating pages
- Images referenced but not provided → use placeholder callouts

## 4. Map to routes

| Content type | Typical route |
| --- | --- |
| Course home | `/` |
| Chapter overview | `/chapters/[slug]` or `/[chapter-slug]` |
| Section page | `/chapters/[chapter]/[section]` |
| Glossary | `/glossary` |
| Quiz | `/quiz` or `/quiz/[chapter]` |
| Search API | `/api/search` |

Prefer flat, readable URLs. Keep slugs lowercase with hyphens.
