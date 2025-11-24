# UCAT Style Practice Platform - Project Guide

## 1. Product vision

Goal: Build a free, unofficial UCAT style cognitive test platform that is:
- Easy to access (no paywall, simple UX)
- Competitive (leaderboards, streaks, personal bests)
- Helpful (clear explanations, skill feedback)
- A strong public portfolio piece for full stack skills

Scope: UCAT style means similar structure and skills to the Universal Cognitive Aptitude Test by Criteria, but with completely original content and clear disclaimer: this is an unofficial practice platform.

---

## 2. Core product decisions

### 2.1 Test structure

- Test name: "UCAT style Test"
- Duration: 20 minutes (1200 seconds)
- Number of questions: 40 per full test
- Format: Multiple choice, 4 options, one correct answer
- Categories (skill tags):
  - number_series
  - arithmetic
  - logic
  - pattern
  - verbal_logic

### 2.2 Scoring

- Raw score: number of correct answers (0 to 40)
- Optionally store:
  - Accuracy per tag (correct / total per tag)
  - Time spent per question
  - Overall time usage (finished_at - started_at)

### 2.3 Feedback

After each completed test:
- Show:
  - Score (X / 40)
  - Time used and average seconds per question
  - Skill breakdown by tag
- Auto generate short feedback from score bands:
  - 0 to 39 percent: weak area
  - 40 to 69 percent: average area
  - 70 percent plus: strong area

---

## 3. Domain model (TypeScript)

This is the core structured format for content and results.

```ts
export type Difficulty = "easy" | "medium" | "hard";

export type SkillTag =
  | "number_series"
  | "arithmetic"
  | "logic"
  | "pattern"
  | "verbal_logic";

export interface Question {
  id: string; // uuid
  prompt: string;
  options: string[]; // length 4
  correctIndex: number; // 0 to 3
  explanation: string; // short, clear explanation
  difficulty: Difficulty;
  tags: SkillTag[];
  createdAt: string;
  updatedAt: string;
}

export interface TestTemplate {
  id: string; // uuid
  name: string; // "UCAT style Test 1"
  durationSeconds: number; // e.g. 1200
  questionIds: string[]; // 40 question ids
  createdAt: string;
  updatedAt: string;
}

export interface TestAnswer {
  questionId: string;
  chosenIndex: number | null; // null if skipped
  isCorrect: boolean;
  timeSpentMs: number;
}

export interface TestAttempt {
  id: string; // uuid
  userId: string | null; // null for guests
  testTemplateId: string;
  startedAt: string;
  finishedAt: string | null;
  answers: TestAnswer[];
  score: number; // total correct
  // Optional snapshot fields to avoid recalculating with every load
  accuracyByTag: Record<SkillTag, number>; // 0 to 1
  percentileSnapshot: number | null; // 0 to 100, based on data at that time
}
```

---

## 4. Database schema (Postgres, high level)

Tables:

1) users  
2) questions  
3) test_templates  
4) test_attempts  
5) test_answers (optional separate table instead of JSON)  
6) leaderboard_entries (optional)

Example schema sketch:

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  username text unique,
  hashed_password text,
  created_at timestamptz not null default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  options text[] not null check (cardinality(options) = 4),
  correct_index int not null check (correct_index between 0 and 3),
  explanation text not null,
  difficulty text not null,
  tags text[] not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table test_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_seconds int not null,
  question_ids uuid[] not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  test_template_id uuid references test_templates(id),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score int not null default 0,
  answers jsonb not null default '[]'::jsonb,
  accuracy_by_tag jsonb,
  percentile_snapshot numeric,
  created_at timestamptz not null default now()
);
```

You can normalize answers into a separate table later if needed for analytics.

---

## 5. Application architecture

### 5.1 Tech stack

- Frontend and backend: Next.js (App Router)
- Language: TypeScript
- Database: Postgres (for example with Prisma ORM)
- Auth: Email plus password or OAuth (or anonymous first)
- Deployment: Your choice (for example Vercel plus managed Postgres or a custom VPS)

### 5.2 High level architecture

- Next.js server components for:
  - Landing page
  - Test list page
  - Results page
  - Leaderboard page
- API routes or server actions for:
  - Fetching test templates and questions
  - Creating test attempts
  - Updating test attempts as answers come in or at finish
  - Fetching leaderboard data

---

## 6. User flows

### 6.1 Anonymous user flow (MVP)

1) Landing page
   - Short explanation
   - Button: "Start test"

2) Test choice page
   - Show available test templates (for MVP: just one)
   - Button: "Start 20 minute UCAT style test"

3) Test session page
   - Timer countdown (20 minutes)
   - Show current question with 4 options
   - Buttons:
     - Select answer
     - Next question
     - Previous question (optional)
   - At end or when time expires, submit answers.

4) Results page
   - Score (X / 40)
   - Time usage
   - Breakdown by skill tag
   - Table of questions with:
     - Your answer
     - Correct answer
     - Explanation

5) Optional share card
   - Simple image or text summary that can be copied:
     - "I scored 32 / 40 on an unofficial UCAT style test."

### 6.2 Registered user extras

- Account creation and login
- History of attempts
- Personal best for each test
- XP and levels
- Streaks

---

## 7. Gamification design

### 7.1 XP and levels

- Base rule:
  - +1 XP per correct answer
  - Bonus XP for finishing a test (for example +5)
- Level formula:
  - Level up for each N XP (for example N = 50)
- Store:
  - user.xp
  - Derive level from XP

### 7.2 Streaks

- Track:
  - last_active_date per user
  - current_streak_days
  - longest_streak_days
- Rule:
  - If user completes any test on a day that is consecutive to last_active_date, increment streak.
  - If more than one day gap, reset streak to 1.

### 7.3 Leaderboards

Basic leaderboard variants:
- Global best scores for last 7 days
- Best scores per test template
- Optionally per skill tag (average score per user on questions tagged with that skill)

Store snapshots in a leaderboard_entries table or compute on the fly from attempts with a time filter.

---

## 8. AI content pipeline (for question generation)

Goal: Use AI to generate UCAT style questions but keep full control and avoid copying.

### 8.1 Workflow

1) Draft generation
   - Use a prompt that asks for:
     - Question prompt
     - 4 options
     - Correct index
     - Explanation
     - Tags
     - Difficulty

2) Manual review
   - Check:
     - Logic is correct
     - Exactly one correct answer
     - Difficulty is reasonable
     - Wording is clear and short
   - Spot check any patterns with small scripts if needed.

3) Import into database
   - Use a small admin panel or scripts that:
     - Accept JSON
     - Show preview
     - On approve, insert questions into the questions table.

4) Build tests
   - Create test_templates by picking 40 question ids with a mix of:
     - Difficulties
     - Tags

### 8.2 Example JSON structure from AI

```json
{
  "questions": [
    {
      "prompt": "Which number should come next in the sequence 4, 9, 16, 25, 36, ?",
      "options": ["42", "43", "48", "49"],
      "correctIndex": 3,
      "explanation": "These are squares of consecutive integers: 2^2, 3^2, 4^2, 5^2, 6^2. Next is 7^2 = 49.",
      "difficulty": "easy",
      "tags": ["number_series"]
    }
  ]
}
```

---

## 9. MVP definition

To get a first version online quickly:

1) Content
   - 1 full test template with 40 questions
   - Each question has:
     - Prompt
     - 4 options
     - Explanation
     - Tags and difficulty set manually

2) Features
   - Anonymous test taking
   - Timer and navigation
   - Result summary and per question explanations
   - Basic stats for test:
     - Average score of all attempts
     - Count of attempts

3) Tech
   - Next.js app
   - Postgres
   - Minimal styling

No auth, no leaderboards, no streaks yet.

---

## 10. Phase 2 and beyond

Once MVP is stable:

### Phase 2: Accounts and history

- Add user signup and login
- Save attempts per user
- Show personal history and stats
- Add personal best per test

### Phase 3: Gamification

- Implement XP and levels
- Implement streaks
- Implement leaderboards

### Phase 4: More content and modes

- Add more tests with different mixes of tags and difficulties
- Add practice mode:
  - Focus on one skill tag
  - Short 10 question drills

### Phase 5: Polish and portfolio

- Add a public "About" page:
  - Explain that this is an unofficial UCAT style project
  - Explain tech stack and architecture at a high level
- Add a link to your GitHub repo
- Consider a simple blog post or dev log about building it

---

## 11. Legal and naming notes (high level)

- Do not use official questions or copy materials from Criteria or other prep sites.
- Use clear wording like:
  - "Unofficial UCAT style practice tests."
  - "Not affiliated with Criteria or the official UCAT."
- Avoid using "UCAT" in the domain name. Use it only descriptively on the page with context.

---

## 12. Checklist

Short checklist you can use while building:

- [ ] Postgres schema created and migrations run
- [ ] Question admin import flow ready
- [ ] At least 40 questions created and tested
- [ ] One test_template created
- [ ] Test taking UI with timer working
- [ ] Results page with explanations working
- [ ] Basic stats for test (average score, attempts count)
- [ ] Deployed to production and reachable by public URL
- [ ] README updated with tech overview and screenshots

This document should be enough as a base project guide for the UCAT style practice platform.
