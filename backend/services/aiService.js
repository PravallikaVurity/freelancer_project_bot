/**
 * AI Service — Google Gemini powered with rule-based fallback.
 * Supports conversation history, project context, and general knowledge.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── Gemini client (singleton) ─────────────────────────────────────────────────
let genAI = null;

function getGenAI() {
  if (genAI) return genAI;
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "your_gemini_api_key") return null;
  try {
    genAI = new GoogleGenerativeAI(key);
    return genAI;
  } catch (err) {
    console.error("[AI] Failed to init Gemini client:", err.message);
    return null;
  }
}

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt = {
  budget: (b) => {
    if (!b) return "not specified";
    return b.type === "hourly"
      ? `₹${b.min}–₹${b.max}/hr (hourly)`
      : `₹${b.min}–₹${b.max} (fixed price)`;
  },
  date: (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : "no deadline set",
  skills: (s) => (s && s.length ? s.join(", ") : "not specified"),
  status: (s) =>
    ({ open: "Open", in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled", draft: "Draft" }[s] || s || "Unknown"),
};

// ── Build system prompt ───────────────────────────────────────────────────────
function buildSystemPrompt(ctx) {
  const { project, proposals = [], myProposal, user } = ctx;

  let system = `You are FB Assistant, a smart and helpful AI assistant built into Freelancer Board — a platform connecting freelancers and clients.

You help freelancers with:
- Project analysis, suitability assessment, and skill matching
- Proposal writing, improvement, and strategy
- Technical questions: coding, debugging, frameworks, tools, best practices
- Career guidance, interview preparation, and learning paths
- Freelancing tips, pricing strategy, and client communication
- General knowledge, explanations, and problem solving

Personality: Friendly, concise, and genuinely helpful. Use bullet points and structure when it improves clarity. Include working code examples when relevant. Always give a complete, useful answer — never say you cannot help or that you lack context.

If project information is not available, answer the question using your general knowledge and expertise. Never respond with "I don't have project context" — instead, provide a helpful answer directly.`;

  if (user) {
    system += `\n\n--- CURRENT USER ---
Name: ${user.name}
Role: ${user.role}
Skills: ${fmt.skills(user.skills)}
Rating: ${user.rating || "N/A"} ⭐
Completed Projects: ${user.completedProjects || 0}
Hourly Rate: ${user.hourlyRate ? `₹${user.hourlyRate}/hr` : "N/A"}
Location: ${user.location || "N/A"}
Bio: ${user.bio || "N/A"}`;
  }

  if (project) {
    system += `\n\n--- CURRENT PROJECT ---
Title: ${project.title}
Description: ${project.description}
Category: ${project.category || "N/A"}
Skills Required: ${fmt.skills(project.skills)}
Budget: ${fmt.budget(project.budget)}
Deadline: ${fmt.date(project.deadline)}
Status: ${fmt.status(project.status)}
Posted: ${fmt.date(project.createdAt)}`;

    if (project.client) {
      system += `\nClient: ${project.client.name} | Rating: ${project.client.rating || "N/A"} | Location: ${project.client.location || "N/A"} | Projects: ${project.client.completedProjects || 0}`;
    }

    if (myProposal) {
      system += `\n\n--- FREELANCER'S PROPOSAL ---
Bid: ₹${myProposal.bidAmount}
Delivery: ${myProposal.deliveryTime} days
Status: ${myProposal.status}
Cover Letter: ${myProposal.coverLetter?.slice(0, 300) || "N/A"}`;
    } else if (user?.role === "freelancer") {
      system += `\n\nNote: This freelancer has NOT yet submitted a proposal for this project.`;
    }

    if (proposals.length > 0) {
      const avgBid = Math.round(
        proposals.reduce((s, p) => s + (p.bidAmount || 0), 0) / proposals.length
      );
      system += `\n\nProposals received: ${proposals.length} total, average bid ₹${avgBid}`;
    }

    if (user?.role === "freelancer" && user.skills?.length && project.skills?.length) {
      const u = user.skills.map((s) => s.toLowerCase());
      const p = project.skills.map((s) => s.toLowerCase());
      const matched = p.filter((s) => u.includes(s));
      const missing = p.filter((s) => !u.includes(s));
      system += `\nSkill match: ${Math.round((matched.length / p.length) * 100)}% | Matched: ${matched.join(", ") || "none"} | Missing: ${missing.join(", ") || "none"}`;
    }
  }

  system += `\n\n--- INSTRUCTIONS ---
- Always respond helpfully and completely
- If project context is missing, answer using general knowledge — never mention missing context
- Maintain conversation continuity across messages
- Use code blocks for code examples
- Keep responses focused and concise`;

  return system;
}

// ── Call Gemini ───────────────────────────────────────────────────────────────
async function callGemini(message, history, ctx) {
  const client = getGenAI();
  if (!client) {
    console.warn("[AI] Gemini not configured — using rule-based fallback");
    return null;
  }

  const systemInstruction = buildSystemPrompt(ctx);

  // Create model with systemInstruction (correct placement per SDK docs)
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.7,
    },
  });

  // Build strictly alternating user/model history for Gemini
  // Gemini requires: history must start with "user" and strictly alternate
  const chatHistory = [];
  const filtered = history.filter((m) => m.from === "user" || m.from === "bot");

  for (let i = 0; i < filtered.length; i++) {
    const msg = filtered[i];
    const role = msg.from === "user" ? "user" : "model";

    // Skip if same role as previous (Gemini requires strict alternation)
    if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === role) continue;

    chatHistory.push({
      role,
      parts: [{ text: String(msg.text || "").trim() || "..." }],
    });
  }

  // History must start with user turn
  while (chatHistory.length > 0 && chatHistory[0].role !== "user") {
    chatHistory.shift();
  }

  // History must end with model turn (current message will be the next user turn)
  while (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role !== "model") {
    chatHistory.pop();
  }

  console.log(`[AI] Gemini request | message: "${message.slice(0, 80)}" | history: ${chatHistory.length} turns | project: ${ctx.project?.title || "none"}`);

  const chat = model.startChat({ history: chatHistory });
  const result = await chat.sendMessage(message);
  const text = result.response.text();

  if (!text?.trim()) {
    console.warn("[AI] Gemini returned empty response");
    return null;
  }

  console.log(`[AI] Gemini response: "${text.slice(0, 80)}..."`);
  return text.trim();
}

// ── Rule-based fallback ───────────────────────────────────────────────────────
function matchSkills(userSkills = [], projectSkills = []) {
  const u = userSkills.map((s) => s.toLowerCase());
  const p = projectSkills.map((s) => s.toLowerCase());
  return {
    matched: p.filter((s) => u.includes(s)),
    missing: p.filter((s) => !u.includes(s)),
  };
}

function ruleBased(message, ctx) {
  const { project, myProposal, user } = ctx;
  const q = message.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|howdy)[!?\s]*$/.test(q)) {
    const name = user?.name?.split(" ")[0] || "there";
    return project
      ? `Hi ${name}! 👋 I have context for "${project.title}". Ask me anything about it!`
      : `Hi ${name}! 👋 Ask me about projects, proposals, coding, or anything else!`;
  }

  // Project-specific answers
  if (project) {
    if (/skill|technolog|stack|require/.test(q))
      return `Skills required for "${project.title}":\n${project.skills?.map((s) => `• ${s}`).join("\n") || "Not specified"}\n\nCategory: ${project.category}`;

    if (/budget|pay|cost|how much|compensation/.test(q))
      return `Budget for "${project.title}": ${fmt.budget(project.budget)}`;

    if (/deadline|due|when|timeline/.test(q))
      return `Deadline for "${project.title}": ${fmt.date(project.deadline)}`;

    if (/status|open|available/.test(q))
      return `Status: ${fmt.status(project.status)}${project.status === "open" ? " ✅ Open for proposals." : ""}`;

    if (/summar|about|overview|describe|what is/.test(q))
      return `📁 ${project.title}\n\nCategory: ${project.category}\nBudget: ${fmt.budget(project.budget)}\nDeadline: ${fmt.date(project.deadline)}\nSkills: ${fmt.skills(project.skills)}\n\n${project.description?.slice(0, 400) || "No description available."}`;

    if (user?.role === "freelancer") {
      if (/suitable|fit|qualify|can i|should i|am i/.test(q)) {
        const { matched, missing } = matchSkills(user.skills || [], project.skills || []);
        const pct = project.skills?.length
          ? Math.round((matched.length / project.skills.length) * 100)
          : 0;
        return `Skill match for "${project.title}": ${pct}%\n✅ Matched: ${matched.join(", ") || "none"}\n❌ Missing: ${missing.join(", ") || "none"}\n\n${pct >= 70 ? "👍 Strong candidate — go ahead and apply!" : pct >= 40 ? "⚠️ Partial match. Highlight transferable skills." : "💡 Missing key skills. Consider a strong cover letter."}`;
      }

      if (/my proposal|my bid|my application|did i apply/.test(q)) {
        if (!myProposal)
          return `You haven't applied to "${project.title}" yet. Click "Apply Now" to get started.`;
        return `Your proposal for "${project.title}":\n• Bid: ₹${myProposal.bidAmount}\n• Delivery: ${myProposal.deliveryTime} days\n• Status: ${myProposal.status}`;
      }

      if (/improve|tip|cover letter|write.*proposal|how.*apply/.test(q))
        return `Tips for "${project.title}":\n1. Reference the project description directly\n2. Highlight: ${fmt.skills(project.skills)}\n3. Justify your bid vs budget: ${fmt.budget(project.budget)}\n4. Mention deadline awareness: ${fmt.date(project.deadline)}\n5. Keep under 200 words with a clear CTA`;
    }
  }

  // General tech knowledge
  if (/\breact\b/.test(q))
    return "React is a JavaScript library for building UIs.\n\nKey concepts:\n• Components — reusable UI blocks\n• JSX — HTML-like syntax in JS\n• useState — manage component state\n• useEffect — side effects (API calls, subscriptions)\n• Props — pass data between components\n• Virtual DOM — efficient updates\n\nBest for SPAs, dashboards, and dynamic interfaces.";

  if (/\bnode\.?js\b/.test(q))
    return "Node.js is a server-side JavaScript runtime built on Chrome's V8 engine.\n\nKey features:\n• Non-blocking, event-driven I/O\n• npm — largest package ecosystem\n• Great for REST APIs, real-time apps, microservices\n\nExample:\n```js\nconst express = require('express');\nconst app = express();\napp.get('/', (req, res) => res.send('Hello!'));\napp.listen(3000);\n```";

  if (/mongodb|mongoose/.test(q))
    return "MongoDB is a NoSQL document database storing JSON-like documents.\n\nKey concepts:\n• Collections (like tables), Documents (like rows)\n• Schema-less and flexible\n• Mongoose — ODM for Node.js with validation\n\nExample schema:\n```js\nconst schema = new mongoose.Schema({\n  name: { type: String, required: true },\n  role: { type: String, enum: ['freelancer', 'client'] }\n});\n```";

  if (/\bapi\b|rest.*api/.test(q))
    return "A REST API uses HTTP methods to exchange data:\n• GET — fetch data\n• POST — create data\n• PUT/PATCH — update data\n• DELETE — remove data\n\nExample:\n```js\nconst res = await fetch('/api/users');\nconst data = await res.json();\n```\nSecured with JWT tokens or API keys.";

  if (/\bjavascript\b|\bjs\b/.test(q))
    return "JavaScript is the language of the web.\n\nKey features:\n• async/await for async code\n• Arrow functions: `const fn = () => {}`\n• Destructuring: `const { name } = user`\n• Optional chaining: `user?.profile?.bio`\n• Spread: `const merged = { ...obj1, ...obj2 }`\n• Array methods: map, filter, reduce, find";

  if (/typescript/.test(q))
    return "TypeScript adds static types to JavaScript.\n\nBenefits:\n• Catch errors at compile time\n• Better IDE autocomplete\n• Clearer code contracts\n\nExample:\n```ts\ninterface User {\n  name: string;\n  role: 'freelancer' | 'client';\n}\nfunction greet(user: User): string {\n  return `Hello, ${user.name}!`;\n}\n```";

  if (/\bgit\b/.test(q))
    return "Git essentials:\n```bash\ngit init              # new repo\ngit clone <url>       # clone\ngit add .             # stage changes\ngit commit -m 'msg'   # commit\ngit push origin main  # push\ngit pull              # fetch + merge\ngit branch feature    # new branch\ngit checkout feature  # switch branch\ngit merge feature     # merge\n```";

  if (/debug|fix.*bug|not working/.test(q))
    return "Debugging steps:\n1. Read the error message carefully — it tells you file and line\n2. Use console.log() to trace values\n3. Check Network tab in DevTools for API errors\n4. Use breakpoints in DevTools for step-by-step execution\n5. Isolate the problem — comment out code sections\n6. Search the exact error on Stack Overflow\n7. Use try/catch for async errors";

  if (/interview/.test(q))
    return "Common developer interview questions:\n\nTechnical:\n• Difference between == and === in JS\n• What is the event loop in Node.js?\n• How does React's virtual DOM work?\n• SQL vs NoSQL differences\n• What is CORS and how to fix it?\n• Explain async/await vs Promises\n\nBehavioral:\n• Describe a challenging project\n• How do you handle tight deadlines?\n• How do you estimate timelines?";

  if (/proposal.*tip|winning proposal|write.*proposal/.test(q))
    return "How to write a winning proposal:\n1. Start with the client's problem, not your skills\n2. Show you've read the project description\n3. Highlight relevant experience briefly\n4. Give a realistic timeline with reasoning\n5. Justify your bid — don't just state a number\n6. Keep it 150–250 words\n7. End with a clear call to action\n8. Proofread — typos kill credibility";

  if (/get.*client|find.*work|more.*project/.test(q))
    return "Tips to get more clients:\n1. Complete your profile — skills, bio, hourly rate, portfolio\n2. Write tailored proposals for each project\n3. Start competitive to build reviews\n4. Respond quickly to messages\n5. Deliver quality work on time\n6. Ask satisfied clients for reviews\n7. Specialize in a niche";

  // Generic helpful fallback — never return empty
  return `I couldn't find a specific answer, but I can help with:\n• Project details (skills, budget, deadline, status)\n• Proposal writing and improvement\n• Coding questions (React, Node.js, JS, APIs, Git)\n• Interview preparation\n• Freelancing tips\n\nWhat would you like to know?`;
}

// ── Main exported function ────────────────────────────────────────────────────
/**
 * @param {string} message  - Current user message
 * @param {object} ctx      - { user, project, myProposal, proposals }
 * @param {Array}  history  - Previous messages [{ from: "user"|"bot", text: string }]
 */
async function getAIAnswer(message, ctx = {}, history = []) {
  if (!message?.trim()) {
    return "Please type a question and I'll do my best to help!";
  }

  console.log(`[AI] Incoming prompt: "${message.slice(0, 100)}"`);

  // Try Gemini first
  try {
    const geminiAnswer = await callGemini(message, history, ctx);
    if (geminiAnswer) return geminiAnswer;
  } catch (err) {
    console.error("[AI] Gemini API failure:", err.message);
    if (err.message?.includes("timeout") || err.code === "ECONNABORTED") {
      console.error("[AI] Gemini timeout — falling back to rule-based");
    }
  }

  // Fallback to rule-based
  console.log("[AI] Using rule-based fallback");
  try {
    const answer = ruleBased(message, ctx);
    console.log(`[AI] Rule-based response: "${answer.slice(0, 80)}..."`);
    return answer;
  } catch (err) {
    console.error("[AI] Rule-based fallback error:", err.message);
    return "I encountered an issue processing your question. Please try again.";
  }
}

module.exports = { getAIAnswer };
