---
title: "How AI Agents Reason: ReAct, Chain-of-Thought & Planning Patterns"
url: https://cowork.ink/blog/ai-agent-reasoning/
date: 2026-06-22
author: Michael Chen
date_modified: 2026-03-14
tags:
  - ai agent reasoning
  - react pattern ai agents
  - chain of thought
  - planning patterns
  - tree of thoughts
  - reflexion agents
---

# How AI Agents Reason: ReAct, Chain-of-Thought & Planning Patterns

> **Quick answer:** AI agents reason by generating explicit "thought" steps before acting. The five core patterns — Chain-of-Thought, ReAct, Tree of Thoughts, ReWOO, and Reflexion — trade off cost, flexibility, and exploration depth. ReAct is the default for most tool-use agents; ReWOO cuts token costs by 5x; Tree of Thoughts enables backtracking; Reflexion makes agents improve from failure.

---

A chatbot answers. An AI agent *reasons* about how to answer.

This distinction is what separates a stateless prompt-response system from an agent that can research the web, write and run code, recover from errors, and produce a better result on the second try than the first. **AI agent reasoning** is the cognitive scaffolding that makes all of this possible.

The field has converged on a small set of core reasoning patterns — each a different answer to the question "how should an agent think before it acts?" Understanding these patterns tells you why your LangGraph agent keeps spinning, why o3 is better than GPT-4o at complex tasks, and how to design agents that reason efficiently without burning your API budget.

This guide covers every major pattern with benchmarks, implementation notes, and framework-specific guidance for 2026.

---

## What Is AI Agent Reasoning?

AI agent reasoning is the process by which an LLM-based agent plans, deliberates, and decides what actions to take before committing to them.

Unlike a basic language model call — prompt in, completion out — a reasoning agent maintains state across multiple steps, evaluates intermediate results, and can revise its plan when evidence changes. It separates "thinking" from "doing," which is precisely why reasoning agents outperform naive chatbots on complex tasks.

Reasoning happens via two broad mechanisms:

- **Externalized reasoning**: The model writes explicit "thought" tokens into the context window, making its reasoning visible in logs (Chain-of-Thought, ReAct, Tree of Thoughts).
- **Internalized reasoning**: The model computes a private reasoning trace during inference without exposing it in the output (OpenAI o1/o3/o4-mini family, DeepSeek-R1). The thinking happens, but you can't read it.

Both approaches work. Externalized reasoning is more interpretable and debuggable. Internalized reasoning is faster and increasingly dominant at the frontier. The patterns below all belong to the externalized family — they're what you implement when building production agents on top of any model.

---

## Pattern 1: Chain-of-Thought (CoT)

Chain-of-Thought is the foundation on which every other reasoning pattern is built. It elicits step-by-step reasoning from a language model by including explicit reasoning steps in the prompt.

**The original insight** (Wei et al., Google Brain, 2022): if you include worked examples that show step-by-step reasoning in the few-shot prompt, large models learn to generate similar reasoning traces. Accuracy on math and logic tasks improves dramatically.

**Zero-shot CoT** (Kojima et al., 2022): simply appending "Let's think step by step" to any prompt elicits CoT reasoning without examples. In benchmarks it raised GSM8K accuracy from 10.4% to 40.7% and MultiArith from 17.7% to 78.7%.

### How CoT works in agents

In an agent, CoT generates the "thought" traces you see in execution logs — the inner monologue that runs before each tool call or decision. A single reasoning step might look like:

```
Thought: The user wants the revenue figures for Q1 2025.
         I need to check the CRM. The relevant tool is get_sales_data.
         I should filter by date range 2025-01-01 to 2025-03-31.
Action: get_sales_data(start="2025-01-01", end="2025-03-31")
```

Without this reasoning step, the model might call the wrong tool, pass wrong parameters, or skip the step entirely. CoT grounds each action in explicit logic.

> **CoT requires large models**: Chain-of-Thought is an emergent capability that only reliably appears in models at roughly 100B+ parameters. Smaller models produce fluent but logically unsound reasoning chains — the text looks reasonable but the logic is broken. For production agents, use frontier models or fine-tuned smaller models trained specifically for structured reasoning.

**Key limitation**: CoT is linear. The agent generates one chain of reasoning and follows it through. It can't explore multiple approaches simultaneously, and it can't backtrack when a reasoning chain hits a dead end.

---

## Pattern 2: ReAct (Reason + Act)

ReAct is the dominant agent architecture in 2026. It interleaves reasoning traces with tool actions and their observations, creating a tight feedback loop between thinking and doing.

**Paper**: "ReAct: Synergizing Reasoning and Acting in Language Models" (Yao et al., ICLR 2023 — arXiv:2210.03629).

**The core insight**: prior work treated reasoning (CoT) and acting (tool use) as separate concerns. CoT alone reasons but can't gather new information. Tool-use agents act but don't reason. ReAct combines them — reasoning informs better actions, and tool results ground subsequent reasoning in real evidence, preventing hallucination drift.

### The ReAct loop

```
Thought:      [Reasoning trace — what does the agent think?]
Action:       [Tool call or final answer decision]
Observation:  [Tool result returned from environment]
Thought:      [Next reasoning, incorporating the observation]
Action:       [Next tool call...]
...
Final Answer: [When no more actions needed]
```

This thought-action-observation cycle repeats until the agent produces a final answer or hits a stopping condition.

### Benchmarks

ReAct was evaluated on HotPotQA (multi-hop QA), FEVER (fact verification), ALFWorld (text game environment), and WebShop (web navigation). It outperformed both standalone CoT and standalone tool-use agents on all four tasks — and unlike CoT alone, it produced interpretable decision traces that could be audited and debugged.

### Framework adoption

ReAct is the default agent architecture in LangChain and LangGraph. LangGraph implements it as a two-node cycle: an Agent Node (LLM call that may produce tool calls) and a Tools Node (tool execution). The cycle continues until the Agent Node produces no more tool calls.

> **ReAct in LangGraph**: The `langchain-ai/react-agent` GitHub template is the official reference implementation. LangGraph's `create_react_agent` function wraps this pattern in a few lines of code, making ReAct the default choice for any tool-augmented agent built on the LangChain stack.

### Limitations

Each reasoning step requires an additional LLM call, adding latency and token cost. Non-informative tool results (empty search results, API errors) can derail the reasoning chain if the model doesn't handle them gracefully. Most critically, **ReAct commits to one trajectory** — it has no mechanism for backtracking or exploring alternatives when the initial approach fails.

---

## Pattern 3: Tree of Thoughts (ToT)

Tree of Thoughts generalizes CoT from a linear chain to a tree. Instead of committing to one reasoning path, the agent generates multiple candidate thoughts at each step, evaluates them, and searches for the best path through BFS or DFS.

**Paper**: "Tree of Thoughts: Deliberate Problem Solving with Large Language Models" (Yao et al., NeurIPS 2023 — arXiv:2305.10601).

### How ToT works

At each step, the model:

1. Generates 3–5 candidate "thoughts" (next reasoning moves)
2. Evaluates each candidate with a separate LLM call (scoring feasibility: "sure / maybe / impossible")
3. Selects the most promising candidate(s) to expand
4. Backtracks if a branch reaches a dead end

This is the key capability CoT and ReAct lack: **the ability to explore and abandon unpromising paths**.

### Benchmarks

| Task | GPT-4 + CoT | GPT-4 + ToT | Improvement |
|------|-------------|-------------|-------------|
| **Game of 24** | 4% | **74%** | +70pp |
| **Creative Writing** | Baseline | +15% over CoT | Qualitative |
| **Mini Crosswords** | Low | Substantially higher | Word success |

The Game of 24 result is striking — a 18.5x improvement on a task where CoT nearly always fails.

### When to use ToT

**Use ToT when**:

- The task has discrete, evaluable intermediate states (puzzles, math proofs, structured planning)
- Backtracking is critical — early mistakes compound into final failure
- Quality matters more than cost

**Avoid ToT when**:

- The task is open-ended and intermediate quality is hard to score
- You're cost-sensitive (ToT costs 10–100x more tokens than CoT)
- Response latency is a hard constraint

---

## Pattern 4: ReWOO (Reasoning Without Observation)

ReWOO rethinks the ReAct loop's biggest inefficiency: the model re-reads the entire reasoning + observation context at every step. For a 10-step task, the final step's LLM call includes all previous thoughts and observations, which is expensive.

**Paper**: "ReWOO: Decoupling Reasoning from Observations for Efficient Augmented Language Models" (Xu et al., 2023 — arXiv:2305.18323).

**The insight**: for predictable tasks, you can generate the full plan upfront, execute all tool calls in parallel, and synthesize the results once at the end.

### The three modules

1. **Planner**: Generates the complete multi-step execution plan upfront, naming each tool call and its dependencies
2. **Worker**: Executes tool calls according to the plan — no LLM reasoning per call, just execution
3. **Solver**: Takes the plan + all tool outputs together and synthesizes the final answer

### Benchmarks vs. ReAct

On HotPotQA:

- **ReWOO**: 42.4% accuracy, ~2,000 tokens
- **ReAct**: 40.8% accuracy, ~10,000 tokens

ReWOO is **5x more token-efficient** while achieving **higher accuracy** on this benchmark. For high-volume agents or cost-sensitive deployments, this matters significantly.

> **LangGraph ships an official ReWOO template**: LangGraph includes a `Plan-and-Execute` pattern that implements the ReWOO architecture. If your agent has predictable multi-step workflows (research -> summarize -> format), ReWOO is worth benchmarking against ReAct for cost savings.

### Trade-off

ReWOO's weakness is **inflexibility**. If a tool call returns unexpected results mid-plan, the agent can't adapt — the plan was fixed at the start. Use ReWOO when tasks are predictable and well-structured; use ReAct when the agent needs to adapt to what it finds.

---

## Pattern 5: Reflexion

Reflexion enables agents to improve from failure without retraining. After an unsuccessful attempt at a task, the agent generates a natural-language reflection on what went wrong, stores it in memory, and uses that reflection on subsequent attempts.

**Paper**: "Reflexion: Language Agents with Verbal Reinforcement Learning" (Shinn, Cassano, Berman et al., NeurIPS 2023 — arXiv:2303.11366).

**The core idea**: traditional RL updates model weights based on scalar reward signals. Reflexion uses *verbal* feedback — the model critiques its own performance in natural language and stores the critique in an episodic memory buffer. No weight updates, no fine-tuning — just better context on the next run.

### How Reflexion works

```
Attempt 1:  [Agent tries the task] → FAIL
Reflect:    "I searched for X but the query was too broad. Next time,
             I should use more specific search terms and filter by year."
Memory:     [Reflection stored in episodic buffer]

Attempt 2:  [Agent prepends reflection to context, tries again]
            → SUCCESS
```

### Benchmarks

Reflexion achieved **91% pass@1 on HumanEval** (the standard coding benchmark), compared to GPT-4's prior state-of-the-art of 80% — an 11-point improvement purely from self-reflection.

On decision-making tasks (ALFWorld, WebShop), Reflexion similarly outperformed one-shot ReAct and CoT by allowing iterative refinement.

### When to use Reflexion

**Best for tasks with**:

- Clear binary success/failure signals (code either runs or doesn't; a test passes or fails)
- Multiple allowed attempts (research tasks, iterative writing, automated workflows)
- Loops where the same task recurs and quality should improve over time

**Not suitable when**: only one attempt is allowed, or the task lacks an objective success signal. For more on how episodic memory powers Reflexion-style improvement, see the guide to [AI agent memory](https://cowork.ink/blog/ai-agent-memory/).

---

## Bonus: LATS — Unifying Everything

**Language Agent Tree Search (LATS)** (ICML 2024 — arXiv:2310.04406) is an advanced pattern that unifies ReAct, Tree of Thoughts, and Reflexion under a single MCTS-inspired framework. The LLM serves simultaneously as:

- The **agent** (generating actions and reasoning)
- The **value function** (scoring the quality of each state)
- The **reflection module** (generating self-critiques for failed paths)

LATS with GPT-3.5 outperformed ReAct, Reflexion, CoT, and ToT across programming, HotPotQA, and WebShop benchmarks. The cost is high — multiple LLM calls per reasoning step — making it suitable for high-stakes tasks where quality trumps cost.

---

## Choosing the Right Reasoning Pattern

No single pattern dominates. Production systems increasingly combine patterns: ReAct for standard tool use, ReWOO for high-volume cost-sensitive workflows, Reflexion for iterative refinement loops.

| Pattern | Best For | Token Cost | Backtracking | Adaptable |
|---------|----------|------------|--------------|-----------|
| **CoT** | Math, logic, single-step reasoning | Low | No | No |
| **ReAct** | Tool-augmented research, open-ended tasks | Medium | No | Yes |
| **Tree of Thoughts** | Puzzles, constrained planning, exploration | Very high | Yes | Medium |
| **ReWOO** | Predictable multi-step tasks, cost optimization | Low | No | No |
| **Reflexion** | Iterative improvement with feedback | Medium per trial | Via retry | Yes |
| **LATS** | Complex tasks needing broad exploration | Very high | Yes | Yes |

**The practical decision tree:**

1. Is the task predictable and multi-step? -> **ReWOO** (5x token savings)
2. Does the task require tool calls and adaptive reasoning? -> **ReAct** (default)
3. Does the task have discrete evaluable states and need backtracking? -> **Tree of Thoughts**
4. Does the agent need to improve across multiple attempts? -> **ReAct + Reflexion**
5. Is this a high-stakes complex task with quality as the only constraint? -> **LATS**

---

## How Frameworks Implement Reasoning in 2026

### LangGraph

The most widely used open-source orchestration framework (38M+ monthly PyPI downloads, stable v1.0). ReAct is the default pattern via `create_react_agent`. LangGraph also ships official templates for Plan-and-Execute (ReWOO) and supports Reflexion via its memory integrations. The graph-based architecture makes it straightforward to add reflection loops alongside standard ReAct cycles.

### OpenAI Agents SDK

Delegates reasoning almost entirely to the underlying model. o3 and o4-mini are OpenAI's reasoning models — they internalize chain-of-thought as a private inference step using RL training. Planning and multi-step reasoning happen inside the model rather than in an explicit loop you control. The tradeoff: less transparency, but frontier-level performance on complex reasoning tasks without framework overhead.

### CrewAI

Focuses on multi-agent role-based coordination rather than explicit single-agent reasoning patterns. Agents reason implicitly through their role definitions and task instructions. Explicit ReAct-style traces are not the primary interface — teams compose agents into crews and define workflows at a higher level of abstraction.

### OpenAI o3/o4-mini (Reasoning Models)

These models internalize CoT as a private compute step during inference. o4-mini introduced adaptive reasoning effort (Low/Medium/High), making "deep thinking" cost-controllable. The hidden CoT is not exposed in the API response but can improve o4-mini's benchmark performance dramatically at the Medium and High settings.

> **Reasoning models vs. explicit patterns**: If you're using o3 or o4-mini, you don't need to implement ReAct or CoT in your prompts — the model handles reasoning internally. The explicit patterns (ReAct, ToT, Reflexion) are most valuable when working with standard completion models (GPT-4o, Claude Sonnet, Gemini Flash) that don't have built-in reasoning modes.

---

## Common Reasoning Pitfalls

**1. Reasoning without tool grounding.** Pure CoT can drift into confident hallucination. Always combine reasoning steps with tool-based fact-checking for claims that require current or precise information.

**2. Unrestricted reasoning loops.** ReAct agents without a maximum step limit will loop indefinitely on unanswerable questions. Always set `max_iterations` or a step budget.

**3. Ignoring token costs.** Tree of Thoughts and LATS can use 100x more tokens than CoT. For any reasoning-intensive pattern, measure actual token usage against a CoT baseline before deploying at scale.

**4. No fallback when reasoning fails.** Every agent needs a graceful degradation path. If the reasoning loop hasn't converged after N steps, return a partial answer with an explanation rather than timing out silently.

**5. Treating reasoning traces as ground truth.** Externalized reasoning ("the model said it thought X") is not a reliable reflection of the model's actual computation. Treat it as a useful approximation and validate conclusions against tool outputs, not just reasoning traces.

---

## Reasoning and the Agent Loop

Reasoning patterns are not standalone features — they're components of a larger agent loop that includes memory, tool use, planning, and orchestration. The best agents in production today combine multiple reasoning patterns within a single workflow, switching between them based on task characteristics.

The trend in 2026 is clear: reasoning is moving inside the model (o3, o4-mini, DeepSeek-R1) for simple tasks, while explicit patterns (ReAct, Reflexion, LATS) remain essential for complex multi-step workflows where transparency, tool grounding, and iterative improvement matter.

---

## Frequently Asked Questions

**What is the ReAct pattern in AI agents?**

ReAct (Reason + Act) is an agent architecture that interleaves reasoning traces ("thought: I need to search for X") with tool actions and their observations, forming a thought-action-observation loop. Introduced at ICLR 2023 by Yao et al., it outperformed standalone Chain-of-Thought on HotPotQA, FEVER, and WebShop. It is the default agent pattern in LangChain and LangGraph.

**What is Chain-of-Thought prompting for AI agents?**

Chain-of-Thought (CoT) prompting elicits step-by-step reasoning from a language model by including explicit reasoning steps in the prompt or by simply appending "Let's think step by step" (zero-shot CoT, Kojima et al. 2022). CoT is the foundation all other reasoning patterns build on — it gives agents the ability to reason within a single step before committing to an action.

**When should I use Tree of Thoughts instead of ReAct?**

Use Tree of Thoughts for tasks with well-defined intermediate states that can be evaluated — mathematical puzzles, structured planning, logic problems. GPT-4 + ToT solved 74% of Game of 24 tasks vs. 4% with standard CoT. Avoid ToT for open-ended tasks where intermediate quality is hard to score, and be aware it costs 10-100x more tokens than CoT.

**What is Reflexion in AI agents?**

Reflexion (Shinn et al., NeurIPS 2023) lets agents improve through verbal self-feedback without retraining. After a failed attempt, the agent writes a natural-language reflection on what went wrong, stores it in episodic memory, and uses it on the next try. It achieved 91% pass@1 on HumanEval coding benchmarks — surpassing GPT-4's prior SOTA of 80%.

**Which reasoning pattern is most token-efficient?**

ReWOO (Xu et al. 2023) is the most token-efficient reasoning pattern for multi-step tasks. By separating the planning phase from execution, it reduces token usage by ~5x vs. ReAct while matching or improving accuracy. On HotPotQA it achieved 42.4% accuracy using ~2,000 tokens vs. ReAct's 40.8% at ~10,000 tokens.
