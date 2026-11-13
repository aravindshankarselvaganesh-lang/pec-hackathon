import React from 'react';
import Image from 'next/image';
import { Clock, Sparkles, ArrowDown, CheckCircle2, HeartHandshake, UtensilsCrossed } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-8 sm:py-14">
      {/* Visual Anchor: Organic Decorative SVG Blob */}
      <div
        className="absolute top-0 right-0 -mr-20 -mt-20 w-[550px] h-[550px] pointer-events-none opacity-40 -z-10"
        aria-hidden="true"
      >
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full fill-[#E6EFE8]">
          <path
            d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.1,72.7,41.4C64,53.7,52.2,63.7,39.1,70.9C26,78.1,13,82.4,-0.4,83.1C-13.8,83.7,-27.6,80.7,-39.8,73.4C-52,66.1,-62.6,54.5,-70.7,41.4C-78.7,28.2,-84.3,14.1,-84.6,-0.2C-84.9,-14.4,-80,-28.8,-71.8,-41.2C-63.5,-53.6,-51.9,-63.9,-38.8,-71.6C-25.7,-79.3,-12.9,-84.3,1.4,-86.7C15.7,-89.1,30.6,-83.6,44.7,-76.4Z"
            transform="translate(100 100)"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Conversational Headline & Grounded Story */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF8F3] text-[#183F35] text-xs font-bold border border-[#E7E5DD] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-extrabold">Crossroads Food Hall</span>
              <span className="text-[#707A73]">•</span>
              <span className="text-[#707A73] font-medium">Campus Express Kitchen</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#183F35] tracking-tight leading-[1.15]">
              Fresh food. <br />
              <span className="text-[#D96D4C] underline decoration-[#E6B65C] decoration-wavy decoration-2">
                Ready on your time.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#202923] leading-relaxed max-w-xl">
              Tell us when you need your order. We check live kitchen wait times so your food is ready the minute you arrive.
            </p>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-semibold text-[#707A73]">
              <span className="flex items-center gap-1.5 text-[#202923]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Live kitchen wait times
              </span>
              <span className="flex items-center gap-1.5 text-[#202923]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Faster swaps if busy
              </span>
              <span className="flex items-center gap-1.5 text-[#202923]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                On-time pickup guarantee
              </span>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href="#bento-section"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#183F35] text-white font-extrabold text-xs sm:text-sm hover:bg-[#245447] active:scale-[0.98] transition-all duration-200 shadow-float hover:-translate-y-0.5"
              >
                <span>Set Time & Order</span>
                <ArrowDown className="w-4 h-4 text-[#E6B65C]" />
              </a>

              <a
                href="#how-breakfit-works"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full border border-[#E7E5DD] bg-white text-[#202923] font-bold text-xs sm:text-sm hover:bg-[#FAF8F3] active:scale-[0.98] transition-all duration-200 shadow-2xs hover:-translate-y-0.5"
              >
                <Clock className="w-4 h-4 text-[#707A73]" />
                <span>How It Works</span>
              </a>
            </div>
          </div>

          {/* Asymmetric Polaroid-style Visual Card with Physical Shadow & Soft Tilt */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none rounded-[32px] overflow-hidden border border-[#E7E5DD] shadow-diffuse bg-white p-3 rotate-[1deg] hover:rotate-0 transition-transform duration-500 ease-out group">
              <div className="relative h-64 sm:h-72 w-full rounded-[24px] overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80"
                  alt="Crossroads freshly prepared food spread"
                  fill
                  sizes="(max-width: 768px) 100vw, 500px"
                  priority
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E6B65C] text-[#183F35] shadow-xs mb-1">
                    Today&apos;s Specials
                  </div>
                  <p className="font-extrabold text-sm sm:text-base leading-snug">
                    Dosas, Burgers, Momos & Boba Tea
                  </p>
                </div>
              </div>

              {/* Lived-in Kitchen Status Footer */}
              <div className="p-3 bg-white flex items-center justify-between text-xs border-t border-[#F0ECE2] mt-1">
                <div>
                  <span className="text-[#707A73] block text-[11px] font-medium">Live Kitchen Wait</span>
                  <span className="font-extrabold text-[#183F35]">Quick Bites: ~2m • Grill: ~9m • Drinks: ~2m</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 font-extrabold text-[11px] border border-emerald-200">
                  Open
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
