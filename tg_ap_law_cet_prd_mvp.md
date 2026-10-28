# TG/AP Law CET Question Intelligence Platform

## Product Requirements Document (PRD) and MVP Specification

**Document status:** Initial implementation specification\
**Version:** 1.0\
**Date:** 27 October 2026\
**Product:** TG LAWCET and AP LAWCET previous-year question analysis
website

------------------------------------------------------------------------

## 1. Executive Summary

The TG/AP Law CET Question Intelligence Platform is a student-facing
website that organizes previous-year Telangana (TG/TS) LAWCET and Andhra
Pradesh (AP) LAWCET questions and helps students understand how
questions and legal concepts recur across exam papers.

The platform will let students navigate from a broad topic to a
subtopic, then inspect groups of repeated or related questions and the
exam papers in which those questions appeared. Students will also be
able to search questions, filter the repository, and view topic-level
frequency analytics.

The core product is not simply a question bank. It is a **question
repository plus a traceable repetition-analysis system**.

The MVP should prioritize reliable data ingestion, topic/subtopic
navigation, question search and filters, transparent repetition
grouping, and frequency analytics. Practice tests, user accounts, paid
plans, bookmarks, and other learning-management features are outside the
initial MVP unless explicitly added later.

## 2. Background and Current Inputs

The project owner has extracted previous-year questions into CSV files.
The intended full dataset includes both TG LAWCET and AP LAWCET, with
exam dates, exam type, categories/topics, and question content.

Files shared during initial planning include:

-   `lawcet2020_questions.csv`
-   `lawcet2020_questions.json`
-   `import_neo4j.cypher`

The inspected 2020 sample represents TS LAWCET, 3-Year LLB, and contains
two shifts. The sample structure includes question identifiers, exam
name, year, exam date, course, shift, question number, section/part,
topic code, topic name, English question text, four options, answer, and
answer text.

**Scope note:** the supplied sample is not evidence that the complete
multi-year TG and AP dataset has already been provided. The import
process must support additional years, states, exam types, courses,
shifts, and file variations as they are confirmed.

The existing Neo4j import script indicates that graph storage has been
explored. The final database choice is not yet confirmed. This
specification therefore defines logical data requirements independently
of a mandatory database vendor.

## 3. Product Vision

Help a law entrance exam student answer:

1.  Which topics and subtopics have the most questions?
2.  Which questions have appeared more than once?
3.  In which years, states, exams, and shifts did a question or related
    question appear?
4.  Which questions repeat exactly, which are similar in wording, and
    which test the same legal concept?
5.  What should the student review first based on historical frequency?

The platform must present historical evidence, not promise that a
question will appear in a future exam. Frequency is descriptive, not a
prediction or guarantee.

## 4. Goals and Non-Goals

### 4.1 MVP goals

-   Import and validate TG and AP question CSV/JSON data.
-   Preserve each source question and its exam-paper provenance.
-   Provide a consistent topic and subtopic hierarchy across datasets
    where the source data supports mapping.
-   Support three distinct repetition types:
    -   Exact repetition
    -   Similar/near repetition
    -   Concept-level repetition
-   Display repetition groups with the original question occurrences and
    their exam metadata.
-   Provide topic/subtopic frequency rankings and year-by-year history.
-   Support full-text question search and useful filters.
-   Make uncertain repetition matches reviewable rather than silently
    treating them as facts.
-   Provide an internal method to correct topic mappings and repetition
    classifications.

### 4.2 Non-goals for the MVP

Unless separately approved, the MVP will not include:

-   Timed mock tests or a test-taking engine.
-   Student accounts, profiles, saved progress, bookmarks, or
    subscriptions.
-   A mobile application.
-   Automatic generation of legal explanations or answers.
-   Predictions that a question will appear in a future examination.
-   An unrestricted AI chatbot.
-   Microservices or a complex distributed architecture.
-   A claim that semantic matches are correct without validation.

## 5. Target Users and Primary User Journey

### Primary user

A student preparing for TG LAWCET or AP LAWCET who wants to focus
revision using previous-year papers and repetition patterns.

### Secondary operational user

A project administrator or data curator who imports datasets, resolves
topic inconsistencies, and reviews proposed similar/concept matches. An
internal curation workflow is required even if a public admin interface
is deferred.

### Main user journey

1.  Student opens the website.
2.  Student chooses TG LAWCET, AP LAWCET, or both.
3.  Student browses a topic.
4.  Student selects a subtopic.
5.  Student views questions and repetition groups within that subtopic.
6.  Student opens a group to see its question variants and exam
    appearances.
7.  Student filters by year, course, exam, shift, section, or repetition
    type.
8.  Student uses frequency information to guide revision.

## 6. Information Architecture and Core Pages

### 6.1 Home / Overview

Show a concise dataset overview, topic entry points, frequently
recurring question groups, and search.

### 6.2 Topic Explorer

A hierarchy such as:

**Exam scope → Section/Part → Topic → Subtopic → Repetition group →
Individual question occurrences**

Not every source may have an explicit subtopic. The system must not
invent one as if it came from the source. Missing subtopics should be
shown as "Unclassified" or be added through a reviewed mapping process.

### 6.3 Topic and Subtopic Detail

Display: - Topic/subtopic name and source code where applicable. -
Number of question occurrences. - Number of distinct exam papers
represented. - Repetition groups and their frequency. - Year-by-year
distribution. - Filters for state/exam, course, year, shift, and
repetition type.

### 6.4 Repetition Group Detail

Display: - Group classification: exact, similar, or concept-level. -
Canonical/display question text, where appropriate. - Number of distinct
exam papers represented. - All linked occurrences with original wording,
options, answer data when present, state/exam, year, date, course,
shift, section, question number, and source ID. - Similarity/confidence
information for proposed semantic matches, where useful. - Review status
for internally curated matches.

Do not merge different original question records destructively. A group
links records; it does not replace the original records.

### 6.5 Search Results

Search question text and return matching questions/repetition groups.
Support filtering and pagination. Exact text search is required for MVP;
semantic search may be added if it can be implemented and evaluated
reliably.

### 6.6 Analytics

Provide: - Most frequently appearing topics and subtopics. - Most
frequently repeated exact questions. - Similar-question and
concept-level group rankings, shown separately. - Appearance by year. -
TG versus AP comparison when both datasets have sufficient coverage. -
Filters that make the data scope explicit.

All counts must state what is being counted: question records, distinct
question groups, or distinct exam papers.

## 7. Functional Requirements

Priority labels: **P0 = required for MVP**, **P1 = valuable next**, **P2
= later enhancement**.

  -------------------------------------------------------------------------
  ID                Priority          Requirement       Acceptance
                                                        criterion
  ----------------- ----------------- ----------------- -------------------
  FR-01             P0                Import CSV/JSON   Import reports
                                      question datasets accepted, rejected,
                                                        duplicate, and
                                                        warning counts;
                                                        errors identify the
                                                        source row and
                                                        reason.

  FR-02             P0                Preserve source   Every imported
                                      provenance        occurrence can be
                                                        traced to a source
                                                        file/record and
                                                        exam paper.

  FR-03             P0                Normalize exam    State, exam,
                                      metadata          year/date, course,
                                                        shift/session,
                                                        section, and
                                                        question number are
                                                        stored consistently
                                                        where supplied.

  FR-04             P0                Topic/subtopic    Student can
                                      navigation        navigate from topic
                                                        to subtopic to
                                                        questions/groups.

  FR-05             P0                Exact repetition  Normalized
                                      detection         identical question
                                                        text can be
                                                        grouped, with all
                                                        original
                                                        occurrences
                                                        retained.

  FR-06             P0                Repetition group  Group detail lists
                                      detail            all member
                                                        occurrences and
                                                        their exam
                                                        metadata.

  FR-07             P0                Search and        Student can search
                                      filters           question text and
                                                        filter by
                                                        state/exam, year,
                                                        course, shift,
                                                        section, topic, and
                                                        repetition type
                                                        where data exists.

  FR-08             P0                Frequency         Rankings and counts
                                      analytics         use documented
                                                        counting rules and
                                                        respond to active
                                                        filters.

  FR-09             P0                Similar-match     System can generate
                                      proposals         candidate
                                                        similar-question
                                                        pairs/groups for
                                                        review; unreviewed
                                                        candidates are not
                                                        presented as
                                                        confirmed facts.

  FR-10             P0                Concept-level     Concept links can
                                      mapping           be assigned and
                                                        corrected by a
                                                        curator; automated
                                                        suggestions may
                                                        assist but do not
                                                        silently override
                                                        curated data.

  FR-11             P0                Cross-dataset     Equivalent topics
                                      topic mapping     across TG and AP
                                                        can be mapped while
                                                        retaining original
                                                        source topic
                                                        codes/names.

  FR-12             P0                Data quality      Detect missing
                                      checks            required fields,
                                                        invalid dates,
                                                        duplicate source
                                                        IDs, inconsistent
                                                        metadata, and
                                                        unmapped topics.

  FR-13             P0                Responsive        Core browsing,
                                      interface         search, and group
                                                        details work on
                                                        mobile and desktop
                                                        widths.

  FR-14             P1                Curator interface Authorized curator
                                                        can review match
                                                        candidates and edit
                                                        topic/concept
                                                        mappings.

  FR-15             P1                Export filtered   Download a filtered
                                      data              question/group list
                                                        as CSV, if
                                                        approved.

  FR-16             P2                Student accounts  Students can save
                                      and bookmarks     questions and
                                                        progress.

  FR-17             P2                Practice mode     Build practice sets
                                                        from topics or
                                                        repetition groups.
  -------------------------------------------------------------------------

## 8. Repetition Definitions and Counting Rules

This is the most important domain rule in the product.

### 8.1 Exact repetition

Questions whose normalized question text matches exactly. Normalization
may standardize case, whitespace, and common punctuation. It must not
remove meaningful numbers, dates, legal section/article references,
negations, or mathematical values.

The exact-match key should be calculated from normalized text. Options
and answers should be compared as additional validation signals, not
used to silently rewrite question text.

### 8.2 Similar/near repetition

Questions with different wording that appear to ask substantially the
same question. Similarity may be proposed using text similarity or
embeddings, but candidate matches must be evaluated and should carry a
confidence score and review status.

A threshold alone is not a sufficient guarantee of correctness.
Different questions can share many words, especially in legal provisions
and multiple-choice templates.

### 8.3 Concept-level repetition

Questions that test the same underlying legal concept, doctrine,
provision, case, or other syllabus concept, even when the wording and
answer differ. This relies on a controlled concept taxonomy and curator
review. For non-law sections, concepts can represent the relevant
subject matter.

### 8.4 Groups and overlapping classifications

One occurrence may belong to more than one useful relationship---for
example, it can be an exact match with another occurrence and also
belong to a broader concept group. Store repetition relationships/groups
separately by type. Do not force all relationships into a single
mutually exclusive group.

### 8.5 Frequency rules

Every count shown in the interface must be defined:

-   **Question occurrences:** number of source question records.
-   **Distinct papers:** number of unique exam papers/sessions
    containing a group.
-   **Years appeared:** number/list of distinct years represented.
-   **Exact repetition frequency:** number of distinct papers containing
    the exact-question group; optionally show total occurrences
    separately.
-   **Topic volume:** question occurrences and distinct papers for the
    topic, shown as separate metrics.

Questions repeated in two shifts on the same date count as two paper
appearances only if the source identifies those shifts as distinct
papers. Repeated rows within the same paper must not inflate the
distinct-paper count.

## 9. Data Model Requirements

The logical model should include the following entities. Physical
table/label names may differ based on the chosen database.

### 9.1 Exam

Represents the exam family/type, such as TG LAWCET or AP LAWCET.

Suggested fields: - `id` - `state` - `exam_name` - `exam_type` -
`course` - Other stable exam metadata

### 9.2 ExamPaper / ExamSession

Represents a specific paper or session and is essential for accurate
frequency counts.

Suggested fields: - `id` - `exam_id` - `year` - `exam_date` - `course` -
`shift` or `session` - `paper_identifier` where available -
`source_file_id`

A unique paper key must be based on reliable source fields. Do not
assume exam name + year alone uniquely identifies a paper.

### 9.3 QuestionOccurrence

Represents a question as it appeared in a specific paper.

Suggested fields: - `id` - `source_question_id` - `exam_paper_id` -
`question_number` - `section_code` - `section_name` -
`original_question_text` - `normalized_question_text` - `option_a`,
`option_b`, `option_c`, `option_d` or a flexible options structure -
`answer` - `answer_text` - `source_topic_code` - `source_topic_name` -
`source_row` or source record locator - timestamps/import batch metadata

The original text and source metadata must be preserved.

### 9.4 Topic

Supports a hierarchy with parent-child relationships.

Suggested fields: - `id` - `name` - `parent_topic_id` - `canonical_code`
where appropriate - `source` or mapping metadata - `review_status`

Keep source topic codes as strings. Preserve the original source topic
name/code even if a canonical cross-state topic is assigned.

### 9.5 Concept

Represents a specific syllabus concept, doctrine, provision, case, or
subject-matter concept.

Suggested fields: - `id` - `name` - `description` (optional) -
`topic_id` - `review_status`

### 9.6 RepetitionGroup and RepetitionMember / Relationship

Store: - repetition type (`exact`, `similar`, `concept`) - linked
question occurrences - similarity/confidence score when applicable -
detection method/version - review status (`proposed`, `approved`,
`rejected`) - reviewer and review timestamps where applicable

For graph storage, these may be represented as nodes and relationships.
For relational storage, use group and membership tables or typed
pairwise relationships.

### 9.7 ImportBatch

Track source file, import time, status, record counts, validation
issues, and any processing version. Re-importing the same file should
not create duplicate question occurrences.

## 10. Data Ingestion and Processing Pipeline

1.  **Upload/read source:** accept CSV/JSON and register an import
    batch.
2.  **Parse:** map source columns to the canonical schema.
3.  **Validate:** check required values, dates, IDs, question text,
    options, and metadata consistency.
4.  **Normalize:** standardize exam names, state identifiers,
    whitespace, and safe text normalization without losing original
    content.
5.  **Resolve topic mappings:** preserve source classifications and map
    known equivalents to canonical topics.
6.  **Deduplicate imports:** use stable source identifiers and paper
    identity; make import idempotent.
7.  **Create question occurrences:** retain all valid source records and
    their provenance.
8.  **Detect exact matches:** generate exact groups from normalized
    text.
9.  **Propose similar matches:** generate candidate matches with scores
    and processing version.
10. **Assign/review concepts:** use curator-approved concept mappings
    and optionally machine-generated suggestions.
11. **Recalculate analytics:** update counts and year/state
    distributions.
12. **Publish:** make only validated, publishable records and approved
    classifications visible as confirmed.

The pipeline should be rerunnable. Changing the similarity algorithm
should not require re-uploading every source file or deleting the source
records.

## 11. Recommended Technical Architecture

### 11.1 Architectural style

Start with a **modular monolith**. The expected dataset is under 5,000
questions, so microservices and distributed processing are not justified
for the MVP.

### 11.2 Suggested default stack

Subject to the existing repository and the project owner's preferences:

-   Frontend: Next.js + TypeScript
-   UI: Tailwind CSS and a consistent accessible component library
-   Backend: Next.js server-side API or a separately deployed API only
    if needed
-   Database: PostgreSQL for structured question data, filtering, and
    aggregate reporting
-   ORM/query layer: Prisma or Drizzle
-   Search: PostgreSQL full-text search initially
-   Similarity analysis: a replaceable module using a suitable
    text-similarity or embedding approach; use a batch process and
    review workflow
-   Charts: a React chart library
-   Deployment: managed application hosting and managed PostgreSQL
-   Testing: unit tests, integration tests, and data-validation fixtures

### 11.3 Neo4j decision

An existing `import_neo4j.cypher` file was supplied, so graph storage
has been considered. This PRD does not mandate removing or adopting
Neo4j.

Before implementation, determine whether: - Neo4j is already running and
contains valuable imported data; - the graph model is a prototype only;
or - the project owner specifically wants Neo4j.

PostgreSQL is a strong default for this MVP. Neo4j is reasonable if
graph traversal is a core requirement or an existing graph database is
already operational. A dual-database architecture should be avoided for
MVP unless a concrete requirement justifies the additional
synchronization and operational cost.

### 11.4 Logical modules

-   `ingestion`: parsing, validation, import batches, idempotency
-   `catalog`: exams, papers, questions, topics, concepts
-   `matching`: exact matching and candidate similarity generation
-   `curation`: review and correction of mappings/groups
-   `search`: text search, filters, pagination
-   `analytics`: frequency calculations and aggregations
-   `web`: student-facing pages and internal curation tools

## 12. API Surface (Initial Proposal)

Routes are illustrative; exact conventions can be chosen during
implementation.

  -----------------------------------------------------------------------
  Endpoint                            Purpose
  ----------------------------------- -----------------------------------
  `GET /api/exams`                    List available exam scopes

  `GET /api/topics`                   List topic tree and counts

  `GET /api/topics/:id`               Topic detail and child topics

  `GET /api/questions`                Search/filter questions with
                                      pagination

  `GET /api/questions/:id`            Question occurrence detail

  `GET /api/repetition-groups`        List groups filtered by type,
                                      topic, exam, and year

  `GET /api/repetition-groups/:id`    Group members and exam history

  `GET /api/analytics/overview`       Dataset overview and aggregate
                                      metrics

  `GET /api/analytics/topics`         Topic/subtopic frequency ranking

  `GET /api/analytics/timeline`       Appearance counts by year

  `POST /api/imports`                 Start an authorized data import

  `GET /api/imports/:id`              Import status and validation report

  `GET /api/review/matches`           List candidate matches for review

  `PATCH /api/review/matches/:id`     Approve/reject a proposed match
  -----------------------------------------------------------------------

Import and review routes must be protected. Public read endpoints should
validate filter parameters and enforce reasonable pagination limits.

## 13. Non-Functional Requirements

-   **Correctness:** frequency numbers must follow documented
    paper-level counting rules.
-   **Traceability:** every displayed question occurrence can be traced
    to source data.
-   **Data integrity:** imported records and group membership must not
    be lost when a match is rejected or recalculated.
-   **Performance:** common search, topic browsing, and detail views
    should feel responsive for a dataset of this size; add indexes based
    on observed queries.
-   **Responsive design:** usable on mobile, tablet, and desktop.
-   **Accessibility:** semantic structure, keyboard operation, readable
    contrast, and clear labels.
-   **Security:** validate imports, protect curator endpoints, avoid
    executing uploaded content, and use environment variables for
    credentials.
-   **Maintainability:** separate business rules from UI components and
    keep matching logic replaceable.
-   **Observability:** log import failures and matching-job errors
    without exposing secrets.
-   **Reproducibility:** record the matching algorithm/version used to
    create proposed groups.
-   **Privacy:** the initial dataset is educational content; do not
    collect student personal information unless accounts are introduced
    later.

## 14. MVP Acceptance Criteria

The MVP is ready for initial release when:

1.  TG and AP records can be imported through the agreed schema, with an
    import report.
2.  Re-importing the same source does not create duplicate occurrences.
3.  A question can be traced to its original exam paper and source
    record.
4.  Students can browse topic → subtopic → question/repetition group.
5.  Students can search question text and filter by available exam
    metadata.
6.  Exact repeated questions are grouped reproducibly.
7.  Similar-match candidates are distinguishable from approved matches.
8.  Concept groups can be curated and linked to the relevant topic
    hierarchy.
9.  Group detail displays original variants and their exam appearances.
10. Topic frequency and repetition counts distinguish occurrences from
    distinct papers.
11. Year/state filters recalculate counts correctly.
12. The interface handles empty results, missing optional metadata, and
    loading/error states.
13. Automated tests cover normalization, duplicate imports, paper
    identity, counting rules, filters, and repetition-group membership.
14. The sample 2020 dataset can be imported and verified before adding
    the complete dataset.

## 15. Testing Strategy

### Unit tests

-   Safe question-text normalization
-   Exact-match hashing
-   Paper identity and distinct-paper counts
-   Topic mapping
-   Similarity score handling
-   Filter parameter validation

### Integration tests

-   CSV/JSON import
-   Idempotent re-import
-   Question-to-paper relationships
-   Group membership and review status
-   Analytics under combined filters
-   Authorization for import and review operations

### Data-quality tests

-   Duplicate source IDs
-   Missing question text
-   Invalid dates or years
-   Inconsistent exam/course/shift metadata
-   Unmapped or conflicting topic codes
-   Question records with missing options/answers where these are
    expected
-   Apparent duplicate papers

### Manual acceptance tests

Use representative questions from both states and multiple years.
Include: - an exact repeat; - a similar wording variant; - two different
questions about the same concept; - a question that shares vocabulary
but is not a repeat; - questions appearing in different shifts on the
same date.

## 16. Delivery Plan

### Phase 1 --- Data audit and schema

-   Inspect all available TG/AP CSV and JSON files.
-   Confirm column variations and paper identity rules.
-   Decide PostgreSQL versus continuing with Neo4j.
-   Define topic crosswalk and import validation rules.
-   Produce a small verified fixture dataset.

**Exit criterion:** canonical schema and counting rules are agreed.

### Phase 2 --- Data ingestion and catalog

-   Implement import batch handling.
-   Load exam papers, question occurrences, and topic mappings.
-   Make imports idempotent.
-   Build topic browsing and question detail APIs.

**Exit criterion:** all approved source records are queryable with
traceable provenance.

### Phase 3 --- Exact repetition and MVP UI

-   Implement exact matching.
-   Build topic/subtopic pages, search, filters, and group detail.
-   Implement basic topic and year frequency analytics.

**Exit criterion:** students can navigate and inspect exact repetitions
with reliable counts.

### Phase 4 --- Similarity and concept curation

-   Generate candidate similar-question pairs/groups.
-   Add confidence and review status.
-   Add concept mappings and cross-state topic alignment.
-   Validate candidate quality on a human-reviewed sample.

**Exit criterion:** similar and concept-level groups are clearly
separated from exact matches and can be corrected.

### Phase 5 --- QA and deployment

-   Run integration and acceptance tests.
-   Validate analytics against manually calculated sample results.
-   Add production configuration, backups, logging, and error handling.
-   Deploy and verify the production build.

**Exit criterion:** acceptance criteria pass against the approved
dataset.

## 17. Risks and Mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  TG/AP topics use different names or Preserve source taxonomy and create
  codes                               a reviewed canonical crosswalk.

  False semantic matches              Treat automated matches as
                                      candidates; use review status and
                                      confidence.

  Incorrect frequency due to shifts   Model exam papers/sessions
  or paper duplication                explicitly and count distinct
                                      papers.

  Data loss from aggressive           Preserve each source occurrence;
  deduplication                       group records rather than deleting
                                      them.

  Question text changes during        Retain original text and test
  normalization                       normalization against legal
                                      references, negations, numbers, and
                                      mathematical content.

  Inconsistent CSV schemas            Use source-specific adapters mapped
                                      to a canonical schema.

  Analytics appear to predict future  Label results as historical
  exams                               observations, not guarantees.

  Premature infrastructure complexity Begin with a modular monolith and
                                      one primary database unless
                                      existing constraints require
                                      otherwise.
  -----------------------------------------------------------------------

## 18. Open Decisions and Assumptions

These are implementation decisions, not reasons to delay writing the
PRD:

1.  **Database:** PostgreSQL is the default recommendation; Neo4j
    remains an option because an import script exists.
2.  **Topic hierarchy:** the uploaded sample has topic codes and topic
    names. Explicit subtopic availability across all files must be
    audited. Missing subtopics require a reviewed mapping process.
3.  **Dataset coverage:** the uploaded 2020 sample does not establish
    the complete multi-year TG/AP coverage. Full import readiness
    depends on receiving and validating all intended files.
4.  **Answers and options:** the 2020 sample includes four options and
    an answer. Other files may differ and must be normalized without
    fabricating missing values.
5.  **Similar-question algorithm:** choose after evaluating
    representative records; retain algorithm/version metadata.
6.  **Access model:** student browsing is the primary experience.
    Accounts and monetization are not in the MVP.
7.  **Admin workflow:** a minimal protected review/import interface is
    recommended; it may initially be an internal tool rather than a
    public-facing admin product.
8.  **Hosting and budget:** not specified. Final deployment choices
    should follow the owner's existing environment and operational
    constraints.

## 19. MVP Definition of Done

The MVP is complete when the approved TG/AP dataset is imported,
students can browse the topic hierarchy and search/filter questions,
exact repetition and historical frequency are reliable, similar/concept
matches are clearly labelled and reviewable, and all counts can be
traced to the underlying exam-paper records.

The project should not be considered complete merely because the UI
displays repeated-question counts. The counts, group membership, source
provenance, and distinction between exact, similar, and concept-level
repetition must be correct.

------------------------------------------------------------------------

## Appendix A --- Initial source fields observed in the 2020 sample

The sample JSON/CSV structure includes:

-   `id`
-   `exam`
-   `year`
-   `exam_date`
-   `course`
-   `shift`
-   `question_no`
-   `part`
-   `part_name`
-   `topic_code`
-   `topic`
-   `question_en`
-   `option_a`
-   `option_b`
-   `option_c`
-   `option_d`
-   `answer`
-   `answer_text`

These fields are a starting point for the canonical import mapping, not
a guarantee that every file has exactly the same columns.

## Appendix B --- Key Product Principle

**Never confuse topic frequency with question repetition.**

A topic may appear frequently while containing many distinct questions.
A repeated-question group represents the same or related question across
occurrences. A concept group represents a recurring underlying concept.
The UI and analytics must make these distinctions explicit.
