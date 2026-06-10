import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/Button'
import { ArrowRight, Sparkles, Shield, Lock, Code } from 'lucide-react'
import { AppPreview } from './AppPreview'

export const LandingHero: React.FC = () => {
  const navigate = useNavigate()

  return (
    <section className="w-full max-w-6xl mx-auto px-4 lg:px-8 pt-12 pb-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="lg:col-span-7 flex flex-col gap-6 text-left"
      >
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent font-semibold px-3 py-1 rounded-full text-xs self-start">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Made for Indian College Students</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-1px] text-text-primary leading-[1.15]">
          Keep your friendships chill. 
          <br />
          Track daily expenses, share <span className="text-accent underline decoration-wavy decoration-accent/30 underline-offset-4">UPI pay links</span> on WhatsApp.
        </h1>
        
        <p className="text-sm sm:text-base text-text-secondary max-w-lg leading-relaxed">
          No more awkward <i>"bhai paise de"</i> messages. Log chai, auto, or dinner splits in 3 taps. Your friends don't need to sign up or install the app to pay you back!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-2 cursor-pointer"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Button>
          <a
            href="#sandbox"
            className="inline-flex items-center justify-center font-semibold border border-border text-text-secondary hover:text-text-primary hover:bg-card px-6 py-3.5 rounded-cta text-[15px] transition-colors"
          >
            Try Live Sandbox
          </a>
        </div>

        {/* Trust Signals & Privacy Badge */}
        <div className="mt-8 border-t border-divider pt-6 flex flex-col sm:flex-row gap-4 sm:gap-6 text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent shrink-0" />
            <span>Direct UPI deep-links (we never hold your money)</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent shrink-0" />
            <span>Privacy-first &amp; Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-accent shrink-0" />
            <span>100% Open Source</span>
          </div>
        </div>
      </motion.div>

      {/* App Preview UI Mockup (Right Column on lg) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="lg:col-span-5 flex justify-center"
      >
        <AppPreview />
      </motion.div>
    </section>
  )
}
