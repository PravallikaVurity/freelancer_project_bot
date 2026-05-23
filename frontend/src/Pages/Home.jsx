import { Link } from "react-router-dom";
import {
  FaUsers,
  FaShieldAlt,
  FaBullseye,
  FaArrowRight,
  FaRocket,
} from "react-icons/fa";

const features = [
  {
    icon: FaUsers,
    title: "Verified Talent",
    desc: "A curated network of professionals ready to deliver impact-driven work.",
    accent: "from-[#2ee6a6]/20 to-transparent",
    iconColor: "text-[#2ee6a6]",
  },
  {
    icon: FaShieldAlt,
    title: "Secure Platform",
    desc: "Escrow-ready workflows keep your projects and payments protected end to end.",
    accent: "from-[#9b6dff]/20 to-transparent",
    iconColor: "text-[#9b6dff]",
  },
  {
    icon: FaBullseye,
    title: "Impact Driven",
    desc: "Every gig fuels meaningful change — connect skills with social good.",
    accent: "from-[#ff6b6b]/20 to-transparent",
    iconColor: "text-[#ff6b6b]",
  },
];

const Home = () => {
  return (
    <div className="text-[#e8e8f0]">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="animate-fade-up">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-[#8b8ba3] mb-6 px-4 py-2 rounded-full glass-light">
                <FaRocket className="text-[#2ee6a6]" />
                Social Impact Freelance Network
              </p>

              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
                Find talent that{" "}
                <span className="text-gradient">moves the needle</span>
              </h1>

              <p className="text-lg text-[#8b8ba3] max-w-lg mb-10 leading-relaxed">
                Connect local freelancers with clients who care. Build
                remarkable projects while empowering communities worldwide.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="btn-primary">
                  Start a project
                  <FaArrowRight className="text-sm" />
                </Link>
                <Link to="/browse-jobs" className="btn-ghost">
                  Browse jobs
                </Link>
              </div>
            </div>

            <div className="relative animate-fade-up delay-2">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#2ee6a6]/20 via-transparent to-[#9b6dff]/20 rounded-3xl blur-2xl" />
              <div className="relative glass rounded-3xl p-8 md:p-10 card-glow">
                <img
                  src="https://illustrations.popsy.co/violet/work-from-home.svg"
                  alt="Freelancers collaborating"
                  className="w-full drop-shadow-2xl"
                />
                <div className="absolute -bottom-4 -left-4 glass-light rounded-2xl px-5 py-4 shadow-xl">
                  <p className="text-xs text-[#8b8ba3] uppercase tracking-wider">
                    Live now
                  </p>
                  <p className="font-display font-bold text-2xl text-[#2ee6a6]">
                    127
                  </p>
                  <p className="text-sm text-[#8b8ba3]">freelancers online</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Features — bento grid */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Built for modern work
            </h2>
            <p className="text-[#8b8ba3] max-w-xl mx-auto">
              Everything you need to hire, collaborate, and ship — without the
              friction of traditional platforms.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`glass rounded-2xl p-8 card-glow animate-fade-up ${["delay-1", "delay-2", "delay-3"][i]}`}
              >
                <div
                  className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${f.accent} mb-6`}
                >
                  <f.icon className={`text-3xl ${f.iconColor}`} />
                </div>
                <h3 className="font-display text-xl font-bold mb-3">
                  {f.title}
                </h3>
                <p className="text-[#8b8ba3] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl glass p-12 md:p-16 text-center card-glow">
          <div className="absolute inset-0 bg-gradient-to-r from-[#2ee6a6]/10 via-transparent to-[#9b6dff]/10 pointer-events-none" />
          <div className="relative">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Ready to make an impact?
            </h2>
            <p className="text-[#8b8ba3] mb-8 max-w-md mx-auto">
              Join thousands of freelancers and clients building the future of
              purposeful work.
            </p>
            <Link to="/register" className="btn-primary">
              Create free account
              <FaArrowRight className="text-sm" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-[#8b8ba3]">
        <p>
          Freelancer Board © {new Date().getFullYear()} · Crafted for impact
        </p>
      </footer>
    </div>
  );
};

export default Home;
