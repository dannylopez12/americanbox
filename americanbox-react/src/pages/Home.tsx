import Hero from "../components/HeroCarousel";
import AboutTabs from "../components/AboutTabs";
import Clients from "../components/Clients";
import Services from "../components/Services";
import CTA from "../components/CTA";
import Testimonials from "../components/Testimonials";
import FAQ from "../components/FAQ";
import Contact from "../components/Contact";
import Reveal from "../components/Reveal";

export default function Home() {
  return (
    <>
      <Hero />

      <Reveal type="fadeUp" delay={0.1}>
        <AboutTabs />
      </Reveal>

      <Reveal type="zoomIn" delay={0.15}>
        <Clients />
      </Reveal>

      <Reveal type="fadeUp" delay={0.2}>
        <Services />
      </Reveal>

      <Reveal type="bounceIn" delay={0.1}>
        <CTA />
      </Reveal>

      <Reveal type="fadeLeft" delay={0.15}>
        <Testimonials />
      </Reveal>

      <Reveal type="fadeUp" delay={0.1}>
        <FAQ />
      </Reveal>

      <Reveal type="fadeUp" delay={0.15}>
        <Contact />
      </Reveal>
    </>
  );
}
