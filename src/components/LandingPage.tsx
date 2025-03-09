import { useEffect, useState } from 'react';
import { Code2, Mail, Presentation, Mic, Brain, Zap, Shield, ArrowRight, Star } from 'lucide-react';
import Header from './LandingHeader';
import './Landingpagestyle.css';
import { useNavigate } from 'react-router-dom';

function App() {
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <Header />
      
      {/* Hero Section with Enhanced Parallax */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Parallax Background Layers */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10"></div>
        </div>
        
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(#2a1458 1px, transparent 1px),
                             linear-gradient(90deg, #2a1458 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            transform: `translateY(${scrollY * 0.2}px)`,
          }}></div>
        </div>

        {/* Floating Elements with Glow */}
        <div className="absolute inset-0 z-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float"
              style={{
                width: Math.random() * 100 + 50 + 'px',
                height: Math.random() * 100 + 50 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                background: `radial-gradient(circle at center, rgba(139, 92, 246, 0.15), rgba(76, 29, 149, 0))`,
                animationDelay: Math.random() * 5 + 's',
                animationDuration: Math.random() * 10 + 10 + 's',
              }}
            ></div>
          ))}
        </div>

        {/* Hero Content with Glowing Effect and 3D Cube */}
        <div className="relative z-10 text-center px-4 max-w-7xl mx-auto">
          <div className="mb-8 flex justify-center">
            <div 
              className="relative"
              style={{
                transform: `translateY(${scrollY * -0.2}px)`,
              }}
            >
            </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 animate-gradient pb-2">
            BudX AI Assistant
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto">
            Revolutionize your workflow with AI-powered assistance for emails, presentations, and code development
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => navigate('/get-started')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(147,51,234,0.3)]"
            >
              Get Started
            </button>
            <button className="px-8 py-4 bg-transparent border-2 border-purple-600 rounded-full text-lg font-semibold transition-all duration-300 hover:bg-purple-600/20">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { number: "99%", text: "Accuracy Rate" },
            { number: "50K+", text: "Active Users" },
            { number: "1M+", text: "Tasks Completed" },
            { number: "24/7", text: "Support" },
          ].map((stat, index) => (
            <div key={index} className="text-center backdrop-blur-lg bg-white/5 rounded-2xl p-6 transform hover:-translate-y-2 transition-all duration-300">
              <h3 className="text-4xl font-bold text-purple-400 mb-2">{stat.number}</h3>
              <p className="text-gray-300">{stat.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section with Hover Effects */}
      <section className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Mail className="w-8 h-8" />,
                title: "Smart Email Generation",
                description: "Create professional emails with context-aware responses and perfect formatting for any recipient.",
                features: ["Custom Templates", "Tone Analysis", "Multi-language Support"]
              },
              {
                icon: <Presentation className="w-8 h-8" />,
                title: "Dynamic Presentations",
                description: "Generate compelling presentations tailored to your audience with just a few clicks.",
                features: ["Auto-layout", "Theme Customization", "Real-time Updates"]
              },
              {
                icon: <Code2 className="w-8 h-8" />,
                title: "Intelligent Code Assistant",
                description: "Get real-time code analysis and suggestions while you write.",
                features: ["Syntax Highlighting", "Error Detection", "Best Practices"]
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="backdrop-blur-lg bg-gradient-to-b from-white/10 to-white/5 rounded-2xl p-8 hover:transform hover:-translate-y-2 transition-all duration-300 border border-purple-900/30"
              >
                <div className="bg-purple-600/20 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-300 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((item, i) => (
                    <li key={i} className="flex items-center text-gray-400">
                      <ArrowRight className="w-4 h-4 mr-2 text-purple-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Highlights with Parallax */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent"
          style={{
            transform: `translateY(${scrollY * 0.1}px)`,
          }}
        ></div>
        <div className="max-w-7xl mx-auto relative">
          <h2 className="text-4xl font-bold text-center mb-16">Technical Excellence</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Brain />, text: "AI-Powered Analysis" },
              { icon: <Mic />, text: "Voice Recognition" },
              { icon: <Shield />, text: "Enterprise Security" },
              { icon: <Zap />, text: "Real-time Processing" }
            ].map((highlight, index) => (
              <div
                key={index}
                className="backdrop-blur-lg bg-white/5 rounded-xl p-6 text-center hover:bg-white/10 transition-all duration-300 border border-purple-900/30"
              >
                <div className="text-purple-400 mb-4 flex justify-center">
                  {highlight.icon}
                </div>
                <p className="text-lg">{highlight.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">What Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "BudX has transformed how I handle my daily communications. The email assistant is incredibly intuitive.",
                author: "Sarah Johnson",
                role: "Product Manager"
              },
              {
                quote: "The presentation features saved me countless hours. It's like having a professional designer on standby.",
                author: "Michael Chen",
                role: "Marketing Director"
              },
              {
                quote: "As a developer, the code assistance is invaluable. It's like pair programming with an AI expert.",
                author: "Alex Rivera",
                role: "Senior Developer"
              }
            ].map((testimonial, index) => (
              <div key={index} className="backdrop-blur-lg bg-white/5 rounded-2xl p-8 border border-purple-900/30">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-purple-400">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-4xl mx-auto text-center backdrop-blur-lg bg-gradient-to-b from-white/10 to-white/5 rounded-3xl p-12 border border-purple-900/30">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Workflow?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of professionals using BudX AI Assistant to enhance their productivity.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/get-started')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-lg font-semibold hover:shadow-[0_0_30px_rgba(147,51,234,0.3)] transition-all duration-300"
            >
              Start Free Trial
            </button>
            <button className="px-8 py-4 bg-white/10 rounded-full text-lg font-semibold hover:bg-white/20 transition-all duration-300">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;