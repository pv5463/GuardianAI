'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, Zap, Eye, Lock, ArrowRight, CheckCircle, Star } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

export default function HomePage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  
  const features = [
    {
      icon: Eye,
      title: 'Real-Time Analysis',
      description: 'Instant scam detection with AI-powered analysis of messages, URLs, and UPI IDs'
    },
    {
      icon: Shield,
      title: 'Multi-Layer Protection',
      description: 'Advanced pattern recognition and threat intelligence to keep you safe'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Get results in seconds with our optimized detection algorithms'
    },
    {
      icon: Lock,
      title: 'Privacy First',
      description: 'Your data is encrypted and never shared with third parties'
    }
  ];
  
  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Small Business Owner',
      content: 'Guardian AI saved me from a phishing scam. The instant analysis gave me confidence to report it immediately.',
      rating: 5
    },
    {
      name: 'Rajesh Kumar',
      role: 'IT Professional',
      content: 'The best scam detection tool I\'ve used. The UI is beautiful and the results are incredibly accurate.',
      rating: 5
    },
    {
      name: 'Anita Desai',
      role: 'Retired Teacher',
      content: 'Easy to use and very helpful. I check every suspicious message now before taking any action.',
      rating: 5
    }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            style={{ y, opacity }}
            className="absolute inset-0"
          >
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />
          </motion.div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-8 shadow-2xl shadow-blue-500/50"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
          >
            Protect Yourself from
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Digital Scams
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto"
          >
            AI-powered real-time scam detection for messages, URLs, and UPI IDs.
            Stay safe with Guardian AI's advanced threat intelligence.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all flex items-center gap-2 justify-center"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gray-800/50 backdrop-blur-xl border border-gray-700 text-white font-semibold rounded-xl hover:bg-gray-700/50 transition-all"
              >
                Sign In
              </motion.button>
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 flex items-center justify-center gap-8 text-gray-400 text-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Free Forever</span>
            </div>
          </motion.div>
        </div>
      </section>
      
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need to stay protected
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="p-6 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl hover:border-blue-500/50 transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-gray-400">
              See what our users have to say
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-xl"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <p className="text-white font-semibold">{testimonial.name}</p>
                  <p className="text-gray-400 text-sm">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center bg-gradient-to-br from-blue-500/10 to-purple-600/10 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-12 shadow-2xl"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Stay Protected?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of users who trust Guardian AI to keep them safe from digital scams
          </p>
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all inline-flex items-center gap-2"
            >
              Start Protecting Yourself Now
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </section>
      
      <footer className="border-t border-gray-800 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>&copy; 2024 Guardian AI. All rights reserved.</p>
          <p className="mt-2 text-sm">Protecting users from digital scams with AI-powered detection</p>
        </div>
      </footer>
    </div>
  );
}
