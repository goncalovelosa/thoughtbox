---
title: "Supervising Ralph Wiggum: Exploring a Metacognitive Co-Regulation Agentic AI Loop for Engineering Design"
url: https://arxiv.org/abs/2603.24768
date: 2026-03-25
---

# Supervising Ralph Wiggum: Exploring a Metacognitive Co-Regulation Agentic AI Loop for Engineering Design

Zeda Xu, Department of Mechanical Engineering, Carnegie Mellon University, Pittsburgh, PA 15213, zedaxu@cmu.edu
Nikolas Martelaro, Human-Computer Interaction Institute, Carnegie Mellon University, Pittsburgh, PA, 15213, nikmart@cmu.edu
Christopher McComb, Department of Mechanical Engineering, Carnegie Mellon University, Pittsburgh, PA, 15213, ccm@cmu.edu (Corresponding author)

## Abstract

The engineering design research community has studied agentic AI systems that use Large Language Model (LLM) agents to automate the engineering design process. However, these systems are prone to some of the same pathologies that plague humans. Just as human designers, LLM design agents can fixate on existing paradigms and fail to explore alternatives when solving design challenges, potentially leading to suboptimal solutions. In this work, we propose (1) a novel Self-Regulation Loop (SRL), in which the Design Agent self-regulates and explicitly monitors its own metacognition, and (2) a novel Co-Regulation Design Agentic Loop (CRDAL), in which a Metacognitive Co-Regulation Agent assists the Design Agent in metacognition to mitigate design fixation, thereby improving system performance for engineering design tasks. In the battery pack design problem examined here, we found that the novel CRDAL system generates designs with better performance, without significantly increasing the computational cost, compared to a plain Ralph Wiggum Loop (RWL) and the metacognitively self-assessing Self-Regulation Loop (SRL). Also, we found that the CRDAL system navigated through the latent design space more effectively than both SRL and RWL. However, the SRL did not generate designs with significantly better performance than RWL, even though it explored a different region of the design space. The proposed system architectures and findings of this work provide practical implications for future development of agentic AI systems for engineering design.

## 1 Introduction

Engineering design can be framed as a process that involves taking iterative design steps informed by design thinking and reasoning [57, 45, 44, 67, 6]. In an effort to assist or automate the design process, research in engineering design has widely explored the implementation of Artificial Intelligence (AI) [2]. One of the key focus areas has been agent systems [9, 10], especially reflective agents that solve design problems iteratively upon feedback [40, 21, 37, 38]. These have been especially attractive for their ability to directly emulate the patterns of engineering teams and organizations. Recent Large Language Models have demonstrated incredible performance in reasoning, planning, and solving math and engineering problems [8, 27, 62, 72]. These support the emergence of modern LLM AI agents, which are LLM-powered automated agents capable of conducting a certain task independently without human intervention. These agents show promise for automated engineering design practices [35, 14, 41].

A variety of techniques have been proposed to supplement the capabilities of LLMs further. For instance, LLMs have been shown to improve task performance using feedback iteratively through self-reflection and self-refinement [53, 34]. In software engineering, practitioners have pioneered the Ralph Wiggum Loop (named after the Simpsons character Ralph Wiggum for a similar behavior pattern), in which an AI agent(s) runs continuously in a loop and repeatedly attempts the given task until success, to empower LLM self-reflection and more effectively implement LLM AI agents [23]. In a Ralph Wiggum Loop, the success of the solution is determined by external validation rather than the agent's own judgment. The LLM AI agent(s) take the external feedback, inspect the output, reflect, and try to generate a better solution. This pattern resembles precursor reflective agentic systems from prior research [40, 21, 37, 38]. The reflective process is also analogically similar to how designers are theorized to work, by reflection in and on their action [50, 51, 49, 59].

However, poorly regulated reflection can lend itself to design fixation. Specifically, design fixation occurs when designers adhere prematurely to limited paradigms and fail to see alternative solutions [54, 52]. Design fixation and insufficient design exploration reduce design creativity and potentially design quality [25, 31, 60]. Much like human designers, AI systems may also exhibit design fixation [11], potentially leading to similar issues in creativity and design quality for AI design systems.

Mitigating fixation is challenging, but may be possible through appropriate metacognitive strategies. Metacognition is the cognition and monitoring of the cognitive process [7, 15], and described by Kellogg as the "cognition about cognition, or thinking about thinking" [26, 13]. To mitigate design fixation and insufficient design exploration for human designers, research in cognitive science and human-computer interaction (HCI) has explored metacognitive support in the design process [20, 19], whereby systems prompt users with questions and interactions to help scaffold their thinking and problem-solving process.

Researchers in engineering design education have investigated Self-Regulated Learning (SRL) as a metacognitive self-regulation strategy for student learning [69, 28, 29]. Self-Regulated Learning emphasizes self-regulation, and prompts self-driven goal-setting, progress monitoring, and reflection to guide and support the learning process [71, 5, 63, 43]. A close variant of Self-Regulated Learning, Co-Regulated Learning, introduces metacognition through co-regulation with others as a different style of learning regulation [36, 30, 1]. Self-Regulated Learning and co-regulated learning have shown their effectiveness in improving student learning outcomes [24, 66, 65, 55]. Since designing can also be modeled as a learning process [4], the success of self-regulation and co-regulation as metacognitive support in learning might be transferable to human designers in engineering design.

As LLMs demonstrate strong capabilities in learning and reasoning [8, 27, 62, 72], research has explored modeling metacognition in LLM agents, with substantial performance benefits [61, 46, 70, 33]. Therefore, self-regulation and co-regulation as metacognitive support might also be beneficial to LLM agents in engineering design tasks.

So far, there have been few attempts in the research community to use metacognitive support (through either self-regulation or co-regulation) to assist LLM agents in agentic AI systems for engineering design. To address this gap, we draw inspiration from metacognitive support for human designers and Self-Regulated/Co-Regulated Learning in engineering design education. In this paper, we propose (1) a novel Self-Regulation Loop (SRL), in which the Design Agent self-regulates and explicitly monitors its own metacognition, and (2) a novel Co-Regulation Design Agentic Loop (CRDAL), in which a Metacognitive Co-Regulation Agent assists the Design Agent in metacognition. We believe that such novel agentic AI system architectures can mitigate design fixation, leading to improved system performance in engineering design tasks.

This leads to our research question: Do metacognitive self- and co-regulation processes improve agentic system performance for engineering design tasks? We hypothesize that (1) a metacognitive Self-Regulation Loop improves system performance over a plain Ralph Wiggum Loop, (2) a metacognitive Co-Regulation Design Agentic Loop improves system performance over a plain Ralph Wiggum Loop, and (3) both the metacognitive self-regulation and co-regulation agentic loops will mitigate design fixation and allow the agentic systems to explore a design space more effectively.

To test our hypotheses, we compare the Self-Regulation Loop (SRL), and the Co-Regulation Design Agentic Loop (CRDAL), against a plain Ralph Wiggum Loop (RWL), through a battery pack cell configuration design problem. The agentic design systems are asked to design a battery pack that maximizes capacity while satisfying physical, thermal, and electrical constraints, using 18650 Lithium-ion battery cells.

Our results confirm hypothesis (2) fully and also partially confirm hypothesis (3). In the design problem demonstrated in this paper, we found that our novel CRDAL system generates designs with better performance, without significantly increasing the computational cost, compared to a plain Ralph Wiggum Loop (RWL) and the metacognitively self-assessing Self-Regulation Loop (SRL). Also, we found that the CRDAL system navigated through the latent design space more effectively. However, our hypothesis (1) was not supported, as SRL did not generate designs with significantly better performance than RWL, even though it explored a different region of the design space. This paper makes three primary contributions:

- We examine three different agentic AI system architectures for engineering design tasks, including a novel Self-Regulation Loop (SRL) and Co-Regulation Design Agentic Loop (CRDAL) for metacognition-enabled agentic AI systems. The proposed system architectures provide practical implications for future development of agentic AI systems for engineering design.
- We present early evidence on the effectiveness of the novel CRDAL system for improved design solution performance and design space exploration. We also demonstrate the effectiveness of the other two systems, RWL and SRL, in completing an engineering design task.
- We introduce a multi-disciplinary design problem and its related design evaluation, which differentiates agentic AI systems' performance. This can serve as a benchmark for agentic system performance in engineering design tasks.

## 2 Methodology

To evaluate the effect of metacognitive co-regulation, we define a constrained battery pack design task, instantiate three agentic system architectures, and compare them under a common experimental protocol.

### 2.1 Design Problem

We compare the agentic systems using a battery pack cell configuration design problem. This entails designing a battery pack that maximizes capacity while satisfying physical, thermal, and electrical constraints, using only 18650 Lithium-ion battery cells. In the design problem, the 18650 battery cells are hexagonally close-packed in a gridded pack. This task is a multi-disciplinary engineering design problem with multi-step design optimization and objective design performance evaluation. With multiple constraints and several distinct physics types, the design problem poses a significant challenge for the agentic systems examined here.

#### 2.1.1 Design Objective, Constraints, and Assumptions

The agentic design systems are instructed to generate a battery pack design using only 18650 cells to satisfy all constraints, while maximizing capacity:

Design a 400V battery pack with a minimum capacity of 25Ah, capable of continuously supplying at least 48A of current draw while staying at or below 60 degrees C during operation, within a 750mm x 750mm x 250mm envelope.

The 18650 cells have a diameter of 18 mm and a height of 65 mm. They are assumed to have a nominal voltage of 3.7 V, a nominal capacity of 2.5 Ah, and an internal resistance of 0.05 Ohm. The cells are assumed to be placed in an upright orientation (cylindrical axis vertical), in a grid pattern, using hexagonal close packing, and with uniform spacing between cells. Hexagonal close packing is a common and optimal packing method for compact battery pack designs using cylindrical Lithium-ion battery cells, such as 18650 cells [42, 3]. The minimum spacing between cells is 2mm to allow for cooling and manufacturing tolerances. We also assume an ambient temperature of 20 degrees Celsius and passive cooling for the battery pack.

#### 2.1.2 Design Actions

The design agent can generate designs using the following specific design actions:

1. Defining cell locations:

   CELL_LOCATIONS: [[x1,y1,z1],[x2,y2,z2],...]

   Each x,y,z triplet is the coordinates of a cell's location. This design action allows the agent to add or remove cells, and adjust the cells' positions within the battery pack. Adding or removing cells may affect one or more aspects of the battery pack's electrical performance (e.g., voltage, capacity, maximum current), its physical dimensions, and thermal performance.

2. Defining cell connections:

   CELL_CONNECTIONS: [N_series, N_parallel]

   N_series and N_parallel are the number of series and parallel connections in the battery pack. This design action allows the agent to define the number of series and parallel connections in the battery pack. Adjusting the number of series and parallel connections will change the electrical performance of the battery pack (e.g., voltage, capacity, maximum current).

3. Defining cell spacing:

   CELL_SPACING: [D_spacing]

   D_spacing is the uniform spacing between battery cells in millimeters. This design action allows the agent to define the spacing between cells in a hexagonal close-packed arrangement. Adding or reducing the cell spacing will change the battery pack's physical dimensions and thermal performance.

#### 2.1.3 Design Evaluation and Assumptions

The designs generated by the design agent are assessed through two approaches.

- A numerical evaluator evaluates the design for mechanical performance (e.g., battery pack dimensions and design volume), thermal performance (e.g., maximum temperature of the cells under load), and electrical performance (e.g., voltage, capacity, maximum current).
- A numerical validator checks for design validity, including physical validity (e.g., whether there are overlapping cells or insufficient spacing between cells) and electrical connection validity (e.g., whether the claimed connections are feasible with the claimed cell numbers). It also checks whether the design constraints (e.g., physical dimension constraints, electrical property constraints, cell temperature constraints) are met.

Together, the numerical evaluator and the numerical validator objectively and comprehensively assess the performance of the generated battery pack designs.

### 2.2 Agentic Design Systems

We introduce the architecture and design of each agentic design system in the following paragraphs.

#### 2.2.1 Ralph Wiggum Loop (RWL)

In the plain Ralph Wiggum Loop (RWL), the Design Agent is made to generate designs until a valid final design is given. After each design generation, the design solution is evaluated and validated by the numerical evaluator and validator. If the design is not valid, the design specification and validation information for the current design are provided to the Design Agent as Design Feedback (e.g., design attempt failed because of failing thermal constraints, the current design capacity and voltage, the current design dimensions and maximum cell temperature). The design agent uses the feedback, reflects on it, and then creates another design. Across multiple iterations, the Design Agent also has access to the full design history and previous Design Feedback.

Additionally, the Design Agent self-evaluates after each design generation. It can make another attempt to make further improvements, even when the design solution is valid. In this case, the Design Agent will also receive Design Feedback, and can reflect and generate another design. The Design Agent is informed that it may receive multiple rounds of feedback with valid designs. It is instructed to judge whether the design can be improved further, and to terminate only when it is confident that the design cannot be meaningfully improved further.

A maximum of 30 design generations is allowed for a given design problem. This value was determined during pilot testing, where we observed that the systems generated final designs in 30 design steps or fewer in most cases.

The Design Agent can only terminate the design loop and output a final design solution when two conditions are met: (1) it has received feedback from the numerical evaluator and validator, and the design is both valid and feasible; and (2) it is confident that the design cannot be meaningfully improved further.

#### 2.2.2 Self-Regulation Loop (SRL)

The system architecture of the Self-Regulation Loop (SRL) is built upon the Ralph Wiggum Loop (RWL). The difference lies in the feedback the Design Agent receives after each iteration.

In SRL, when the Design Agent gets another attempt (i.e., if the design is not valid or it wants to make further improvements), a Progress Analyzer first takes the design step history, and explicitly shows the design progress trajectory and the trend summary (e.g., changes in capacity, which of the past attempts are valid designs) to the Design Agent, along with the Design Feedback.

In addition, in SRL, the Design Agent is specifically instructed to set design goals, make plans, monitor its progress, try potential alternatives, and pursue higher performance designs. Also, for each design step, it is asked to assess its design progress from design history (improving, stalling, or regressing), identify the bottleneck metric or constraint, and think for design strategy for the next design iteration. In the Ralph loop, the Design Agent also implicitly performs goal-setting, planning, and progress monitoring when self-reflecting, whereas in the SRL, we made it very explicit that the agent should do so. The SRL has the same termination rule as the RWL, and is also allowed a maximum of 30 design generations for a given design problem.

#### 2.2.3 Co-Regulation Design Agentic Loop (CRDAL)

Built upon SRL, the Co-Regulation Design Agentic Loop (CRDAL) adds a separate Metacognitive Co-Regulation Agent to the system. The Metacognitive Co-Regulation Agent is a separate LLM agent from the Design Agent. In CRDAL, when the Design Agent gets another attempt (i.e., if the design is not valid or it wants to make further improvements), the Progress Analyzer takes the design step history, and explicitly shows the design progress trajectory and the trend summary to the Metacognitive Co-Regulation Agent.

The Metacognitive Co-Regulation Agent then processes the Progress Trajectory Summary, analyzes the current design and the design history, and provides strategic Metacognitive Feedback to the Design Agent along with Design Feedback. Similar to the self-assessment in SRL, the Metacognitive Feedback includes an assessment of the Design Agent's progress (improving, stalling, or regressing), identification of the bottleneck metric or constraint, and a strategic suggestion for the next design iteration. In CRDAL, the Metacognitive Co-Regulation Agent is "supervising" the Design Agent. It provides design review and helps the "designer" think through a design problem, like a supervisor or a colleague. The CRDAL has the same termination rule as the previous two systems, and is also allowed a maximum of 30 design attempts for a given design problem.

#### 2.2.4 LLM Model Configuration

All of the LLM agents in this work, including the Design Agent and the Metacognitive Co-Regulation Agent, are powered by Google DeepMind's Gemini 3.1 Pro model. According to Google DeepMind's own benchmarking, at the time of writing, it is one of the most advanced and powerful LLMs for reasoning and solving complex math problems [17]. The LLM model is allowed the highest reasoning budget for optimal performance. Specifically, the authors used gemini-3.1-pro-preview model, Feb 2026 release. The model "thinking_level" was set to "high" and the "temperature" was set to 1.0 for optimal performance, as recommended by the model developer [16].

### 2.3 Measurement

For consistency and generalizability, all three systems were instructed to solve the same design problem 30 times (30 system runs for each system; this differs from the 30 maximum generation attempts the design agents have per system run). The agentic systems have no memory of previous or other systems' runs. For each system run, the LLM models are initialized with a different random seed, determined by a set base seed. The base seed is the same for all three systems. For each system run, the performance of the system is determined by the final designs it outputs. If a system fails to provide a valid final design within the allowed 30 design steps, it is considered a failed design generation and excluded from the design performance comparison.

For this work, our primary measure of system performance is the capacity of the generated battery packs. This is the objective that the agentic design systems are explicitly instructed to maximize. To better understand system behavior with respect to design fixation, we also examine their design trajectories and the location of final designs in the latent design space.

We are also interested in the computational cost of the systems, as this often defines a sharp trade-off against system performance. In engineering design practice for complex systems, the primary computational bottleneck tends to be design evaluation, which often makes use of long-running simulations. We assume that the computational cost of such simulations will be larger than the computational costs associated with LLMs for any sufficiently complex task. Therefore, in this work, we focus on the number of steps taken before a final design is given as an indication of computational cost for a more meaningful comparison.

## 3 Results

We report results on three aspects of system behavior in the battery pack design problem: final design performance, computational cost, and design-space exploration.

### 3.1 System Performance

The capacities of the final battery pack designs created by each agentic design system are reported. The dots show the capacities of the final battery pack designs for each run. The box plot shows the mean, 25%, and 75% quartiles of the valid final designs from the 30 runs.
