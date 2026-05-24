const User = require("../models/User");
const Notification = require("../models/Notification");
const sendEmail = require("../config/email");

async function findMatchingFreelancers(project) {
  const query = {
    role: "freelancer",
    isActive: true,
    email: { $exists: true, $ne: "" },
  };
  if (project.skills && project.skills.length > 0) {
    query.skills = { $in: project.skills.map((s) => new RegExp(`^${s}$`, "i")) };
  }
  return User.find(query).select("name email phone linkedin").lean();
}

async function saveRecord(userId, projectId, notificationType, status) {
  try {
    await Notification.findOneAndUpdate(
      { userId, projectId, notificationType },
      { status, ...(status === "sent" ? { sentAt: new Date() } : {}) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (_) {}
}

async function sendEmailNotification(freelancer, project) {
  const deadline = project.deadline
    ? new Date(project.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "No deadline specified";

  const budgetText =
    project.budget.type === "hourly"
      ? `₹${project.budget.min}–₹${project.budget.max}/hr`
      : `₹${project.budget.min}–₹${project.budget.max}`;

  const projectUrl = `${process.env.CLIENT_URL}/projects/${project._id}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      <div style="background:#4f46e5;padding:24px;color:#fff">
        <h2 style="margin:0">New Project Available!</h2>
        <p style="margin:4px 0 0;opacity:.85">A project matching your skills was just posted.</p>
      </div>
      <div style="padding:24px">
        <h3 style="margin:0 0 16px;color:#111">${project.title}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#6b7280;width:130px">Category</td><td style="padding:6px 0;color:#111">${project.category}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Budget</td><td style="padding:6px 0;color:#111">${budgetText}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Skills Required</td><td style="padding:6px 0;color:#111">${(project.skills || []).join(", ") || "—"}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Deadline</td><td style="padding:6px 0;color:#111">${deadline}</td></tr>
        </table>
        <p style="margin:16px 0;color:#374151;font-size:14px;line-height:1.6">${project.description.slice(0, 300)}${project.description.length > 300 ? "…" : ""}</p>
        <a href="${projectUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">View Project</a>
      </div>
      <div style="padding:16px 24px;background:#f9fafb;font-size:12px;color:#9ca3af">
        You received this because your skills match this project. <a href="${process.env.CLIENT_URL}" style="color:#4f46e5">Freelancer Board</a>
      </div>
    </div>`;

  await sendEmail({ to: freelancer.email, subject: `New Project: ${project.title}`, html });
}

async function sendSmsNotification(freelancer, project) {
  if (!freelancer.phone) return;
  const message = `New project available: ${project.title}. Open app to apply. ${process.env.CLIENT_URL}/projects/${project._id}`;
  // TODO: integrate SMS provider (e.g. Twilio)
  // await twilioClient.messages.create({ body: message, from: process.env.TWILIO_FROM, to: freelancer.phone });
  console.log(`[SMS stub] To: ${freelancer.phone} | ${message}`);
}

async function sendLinkedInNotification(freelancer, project) {
  if (!freelancer.linkedin) return;
  // TODO: integrate LinkedIn API when OAuth tokens are available
  console.log(`[LinkedIn stub] To: ${freelancer.linkedin} | New project: ${project.title}`);
}

async function notifyFreelancers(project, io) {
  try {
    const freelancers = await findMatchingFreelancers(project);
    if (!freelancers.length) return;

    for (const freelancer of freelancers) {
      const uid = freelancer._id;
      const pid = project._id;

      // Email
      try {
        await sendEmailNotification(freelancer, project);
        await saveRecord(uid, pid, "email", "sent");
      } catch (err) {
        console.error(`[Notification] Email failed for ${freelancer.email}:`, err.message);
        await saveRecord(uid, pid, "email", "failed");
      }

      // SMS
      if (freelancer.phone) {
        try {
          await sendSmsNotification(freelancer, project);
          await saveRecord(uid, pid, "sms", "sent");
        } catch (err) {
          console.error(`[Notification] SMS failed for ${freelancer.phone}:`, err.message);
          await saveRecord(uid, pid, "sms", "failed");
        }
      }

      // LinkedIn
      if (freelancer.linkedin) {
        try {
          await sendLinkedInNotification(freelancer, project);
          await saveRecord(uid, pid, "linkedin", "sent");
        } catch (err) {
          console.error(`[Notification] LinkedIn failed for ${freelancer.linkedin}:`, err.message);
          await saveRecord(uid, pid, "linkedin", "failed");
        }
      }

      // Socket (real-time in-app)
      if (io) {
        try {
          io.emit("newProjectNotification", {
            projectId: project._id,
            title: project.title,
            category: project.category,
            skills: project.skills,
          });
          await saveRecord(uid, pid, "socket", "sent");
        } catch (err) {
          console.error(`[Notification] Socket failed:`, err.message);
          await saveRecord(uid, pid, "socket", "failed");
        }
      }
    }

    console.log(`[Notification] Notified ${freelancers.length} freelancer(s) for project: ${project.title}`);
  } catch (err) {
    console.error("[Notification] notifyFreelancers error:", err.message);
  }
}

async function notifyFreelancerSelection(project, selectedFreelancerId, io) {
  try {
    const proposals = await require("../models/Proposal").find({ project: project._id }).select("freelancer");
    for (const p of proposals) {
      const isSelected = p.freelancer.toString() === selectedFreelancerId.toString();
      const message = isSelected
        ? `You have been selected for Project: ${project.title}`
        : `Another freelancer was selected for this project`;
      if (io) {
        io.to(p.freelancer.toString()).emit("freelancerSelected", {
          projectId: project._id,
          projectTitle: project.title,
          isSelected,
          message,
        });
      }
    }
  } catch (err) {
    console.error("[Notification] notifyFreelancerSelection error:", err.message);
  }
}

module.exports = { notifyFreelancers, notifyFreelancerSelection };
