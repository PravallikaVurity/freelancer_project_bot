import { FaUsers, FaShieldAlt, FaHeart, FaRocket } from "react-icons/fa";
import { Link } from "react-router-dom";

const values = [
  { icon: FaHeart, title: "Community First", desc: "We believe in empowering local talent and building meaningful connections.", color: "text-[#ff6b6b]", bg: "from-[#ff6b6b]/20" },
  { icon: FaShieldAlt, title: "Trust & Safety", desc: "Secure payments, verified profiles, and dispute resolution built in.", color: "text-[#9b6dff]", bg: "from-[#9b6dff]/20" },
  { icon: FaUsers, title: "Inclusive Growth", desc: "Helping junior freelancers grow alongside experienced professionals.", color: "text-[#2ee6a6]", bg: "from-[#2ee6a6]/20" },
  { icon: FaRocket, title: "Impact Driven", desc: "Every project on our platform contributes to social good.", color: "text-yellow-400", bg: "from-yellow-400/20" },
];

const About = () => (
  <div className="text-[#e8e8f0]">
    <section className="pt-20 pb-24 px-6">
      <div className="max-w-4xl mx-auto text-center animate-fade-up">
        <p className="text-sm uppercase tracking-widest text-[#8b8ba3] mb-4">Our Story</p>
        <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
          Built for <span className="text-gradient">impact</span>
        </h1>
        <p className="text-lg text-[#8b8ba3] max-w-2xl mx-auto leading-relaxed">
          Freelancer Board was founded to bridge the gap between talented freelancers and mission-driven clients. We believe great work should create lasting change.
        </p>
      </div>
    </section>

    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <div key={v.title} className={`glass rounded-2xl p-8 card-glow animate-fade-up delay-${i + 1}`}>
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${v.bg} to-transparent mb-6`}>
                <v.icon className={`text-3xl ${v.color}`} />
              </div>
              <h3 className="font-display text-lg font-bold mb-2">{v.title}</h3>
              <p className="text-[#8b8ba3] text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="pb-24 px-6">
      <div className="max-w-4xl mx-auto glass rounded-3xl p-12 text-center card-glow">
        <h2 className="font-display text-3xl font-bold mb-4">Join our mission</h2>
        <p className="text-[#8b8ba3] mb-8">Be part of a platform that puts people before profit.</p>
        <Link to="/register" className="btn-primary">Get started free</Link>
      </div>
    </section>
  </div>
);

export default About;
