import React from 'react'
import { Smartphone, Wallet, Zap, ShieldCheck } from 'lucide-react'

export const WhyYaariKhaatha: React.FC = () => {
  return (
    <section className="w-full py-16 lg:py-24 bg-bg transition-colors duration-200 font-sans">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 flex flex-col gap-12">
        <div className="text-center flex flex-col gap-3 max-w-xl mx-auto">
          <h2 className="text-[12px] font-medium tracking-[0.08em] uppercase text-accent">Why Yaari Khaatha</h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
            Built Specifically for Indian Friend Groups
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            How we match up against standard group expense apps or raw messaging.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Diff 1 */}
          <div className="p-5 bg-card border border-border rounded-hero flex flex-col gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Smartphone className="w-4.5 h-4.5" />
            </div>
            <h4 className="font-bold text-text-primary text-[14px]">No App for Friends</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Unlike Splitwise which forces everyone to download an app and register, your friends view the read-only breakdown instantly on any web browser.
            </p>
          </div>

          {/* Diff 2 */}
          <div className="p-5 bg-card border border-border rounded-hero flex flex-col gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Wallet className="w-4.5 h-4.5" />
            </div>
            <h4 className="font-bold text-text-primary text-[14px]">UPI &amp; QR Deep Links</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Direct integration with UPI protocol. Friends pay with a single click inside GPay/PhonePe or by scanning the custom rupee QR code.
            </p>
          </div>

          {/* Diff 3 */}
          <div className="p-5 bg-card border border-border rounded-hero flex flex-col gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <h4 className="font-bold text-text-primary text-[14px]">3 Taps Speed</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Log on the go at the college canteen or auto stand. Designed to record transactions in under 10 seconds without navigation friction.
            </p>
          </div>

          {/* Diff 4 */}
          <div className="p-5 bg-card border border-border rounded-hero flex flex-col gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <h4 className="font-bold text-text-primary text-[14px]">Paise-Accurate Splits</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              We handle decimal divisions down to integer paise (no rounding error), resolving remainder allocations to ensure zero leakage.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
