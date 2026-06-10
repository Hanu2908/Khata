import React from 'react'

export const HowItWorks: React.FC = () => {
  return (
    <section className="w-full bg-card border-y border-divider py-16 lg:py-24 transition-colors duration-200 font-sans">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 text-center flex flex-col gap-12">
        <div className="flex flex-col gap-3 max-w-xl mx-auto">
          <h2 className="text-[12px] font-medium tracking-[0.08em] uppercase text-accent">Simple Flow</h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
            Log &rarr; Share &rarr; Settle
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            Skip the spreadsheet math. Log splits in seconds and get paid back via direct WhatsApp UPI links.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
          {/* Step 1 */}
          <div className="bg-bg/40 p-6 rounded-hero border border-divider flex flex-col gap-4">
            <div className="w-10 h-10 rounded-hero bg-accent/10 text-accent flex items-center justify-center font-bold text-sm shrink-0">
              Log
            </div>
            <h4 className="text-base font-semibold text-text-primary">1. Quick Record</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Add friends directly, type the rupee amount, and select who paid. Equal split arithmetic is handled instantly down to the last paise.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-bg/40 p-6 rounded-hero border border-divider flex flex-col gap-4">
            <div className="w-10 h-10 rounded-hero bg-green-500/10 text-green-500 flex items-center justify-center font-bold text-sm shrink-0">
              Share
            </div>
            <h4 className="text-base font-semibold text-text-primary">2. WhatsApp Summary</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Generate a live shareable summary link and message it. Your friends get a clean breakdown on their web browser—no signups or app installs needed!
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-bg/40 p-6 rounded-hero border border-divider flex flex-col gap-4">
            <div className="w-10 h-10 rounded-hero bg-positive/10 text-positive flex items-center justify-center font-bold text-sm shrink-0">
              Settle
            </div>
            <h4 className="text-base font-semibold text-text-primary">3. Direct UPI Pay</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              The link shows a custom UPI QR code and deep-link. Clicking "Pay" opens GPay/PhonePe automatically to pre-fill your exact UPI ID and amount.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
