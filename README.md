# Recipe Radar

Recipe Radar is a full-stack cooking companion for answering a very practical question: **what can I make with what I already have?**

It combines a personal recipe library, pantry-based recipe matching, external recipe discovery, and grocery-list planning in one workflow.

## What it does

- Create and save recipes with ingredients, quantities, optional items, and cooking steps.
- Search TheMealDB for recipe inspiration and import recipes into your own library.
- Enter pantry ingredients to find recipes you can cook now or are close to making.
- Select multiple recipes and generate a grocery list for the ingredients you are missing.
- Save grocery lists and check items off while shopping.
- Use the app across desktop and mobile layouts.

## Tech stack

| Area | Technology |
| --- | --- |
| Web | React, TypeScript, Vite, React Router, Tailwind CSS |
| API | Node.js, Fastify, TypeScript |
| Data | PostgreSQL, Prisma ORM |
| External recipes | TheMealDB |
| Testing | Playwright |
| Local database | Docker Compose |

## Project structure

```text
recipe-radar/
├── apps/
│   ├── web/        # React application
│   ├── api/        # Fastify API and Prisma integration
│   └── e2e/        # Playwright API and end-to-end tests
├── docker-compose.yml
└── package.json
```

## Run locally

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Configure the API

Create `apps/api/.env` using `apps/api/.env.example` as a starting point.

### 4. Apply the database migrations

```bash
npm exec -w apps/api -- prisma migrate deploy
```

Optional demo data:

```bash
npm exec -w apps/api -- prisma db seed
```

### 5. Start the app

```bash
npm run dev
```

The web app runs on Vite's local development URL and the API defaults to `http://localhost:4000`.

## Existing automated checks

The repository currently includes Playwright coverage for API health/external recipe integration and a recipe journey that creates data through the API and verifies it through the UI. The test suite will be expanded as the application evolves.

```bash
npm test -w apps/e2e
```

## Current focus

Recipe Radar is being iterated as a product as well as an engineering project. Current work focuses on improving the end-user experience, tightening application architecture, and building a layered automated test strategy around the highest-risk workflows.
