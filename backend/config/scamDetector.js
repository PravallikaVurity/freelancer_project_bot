const Project = require("../models/Project");
const ScamReport = require("../models/ScamReport");

const SPAM_WORDS = [
  "whatsapp", "telegram", "wechat", "wire transfer", "western union",
  "moneygram", "gift card", "bitcoin", "crypto", "guaranteed",
  "100% profit", "make money fast", "work from home", "no experience needed",
  "urgent", "asap", "immediately", "click here", "free money",
];

const SUSPICIOUS_CONTACT = [
  /\b\d{10,}\b/,                        // raw phone numbers
  /\b[a-z0-9._%+-]+@(gmail|yahoo|hotmail|outlook)\.[a-z]{2,}\b/i, // personal emails
  /t\.me\//i,                           // telegram links
  /wa\.me\//i,                          // whatsapp links
];

const analyzeProject = async (project) => {
  const reasons = [];
  const text = `${project.title} ${project.description}`.toLowerCase();

  // 1. Missing or very short description
  if (!project.description || project.description.trim().length < 30)
    reasons.push("Missing or very short description");

  // 2. Unrealistic budget (max > 500,000 or max < 10 for fixed)
  if (project.budget?.type === "fixed") {
    if (project.budget.max > 500000)
      reasons.push("Unrealistically high budget");
    if (project.budget.max < 10)
      reasons.push("Unrealistically low budget");
  }

  // 3. Very short deadline (less than 1 day from now)
  if (project.deadline) {
    const hoursUntilDeadline = (new Date(project.deadline) - Date.now()) / 36e5;
    if (hoursUntilDeadline < 24)
      reasons.push("Extremely short deadline (less than 24 hours)");
  }

  // 4. Spam words in title or description
  const foundSpam = SPAM_WORDS.filter((w) => text.includes(w));
  if (foundSpam.length > 0)
    reasons.push(`Suspicious keywords detected: ${foundSpam.slice(0, 3).join(", ")}`);

  // 5. Suspicious contact info in description
  if (SUSPICIOUS_CONTACT.some((r) => r.test(project.description || "")))
    reasons.push("Suspicious contact information in description");

  // 6. Duplicate project title by same client (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const escapedTitle = project.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const duplicate = await Project.findOne({
    _id: { $ne: project._id },
    client: project.client,
    title: { $regex: new RegExp(`^${escapedTitle}$`, "i") },
    createdAt: { $gte: thirtyDaysAgo },
  });
  if (duplicate)
    reasons.push("Duplicate project title detected from same client");

  // 7. Repeated posting (more than 5 projects by same client in last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCount = await Project.countDocuments({
    client: project.client,
    createdAt: { $gte: oneDayAgo },
  });
  if (recentCount > 5)
    reasons.push("Unusually high number of projects posted in 24 hours");

  // Determine risk level
  let riskLevel = "low";
  if (reasons.length >= 3) riskLevel = "high";
  else if (reasons.length >= 1) riskLevel = "medium";

  // Save report
  await ScamReport.findOneAndUpdate(
    { project: project._id },
    { project: project._id, riskLevel, reasons },
    { upsert: true, new: true }
  );

  return { riskLevel, reasons };
};

module.exports = analyzeProject;
