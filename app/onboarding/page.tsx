"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";

const questions = [
  {
    id: 1,
    title: "您目前处于哪个人生阶段？",
    description: "了解您的身份有助于我们为您定制更贴合场景的任务",
    options: [
      { label: "🎓 学生党", subtext: null },
      { label: "💼 职场人", subtext: null },
      { label: "🏡 自由生活者", subtext: null },
      { label: "🌟 其他", subtext: null },
    ]
  },
  {
    id: 2,
    title: "您是否已获得 ADHD 临床确诊？",
    description: "确诊用户与倾向用户对功能的需求深度不同，我们将据此为您调整建议的专业度。",
    options: [
      { label: "✅ 已确诊", subtext: "为您提供基于认知行为疗法的辅助建议" },
      { label: "❓ 疑似 / 倾向中", subtext: "为您提供易上手的注意力改善工具" },
      { label: "💡 非 ADHD，单纯想提高效率", subtext: "为您精简界面，专注核心待办" },
    ]
  },
  {
    id: 3,
    title: "此时此刻，您最希望我们帮您解决什么？",
    description: "请选择您最头疼的问题，我们将为您优先开启对应的核心功能模块。",
    options: [
      { label: "⏳ 起步万年难", subtext: "为您提供任务原子化拆解" },
      { label: "🧠 大脑快爆炸了", subtext: "为您提供情绪支持" },
      { label: "🐜 坐不住/易分心", subtext: "为您提供专注计时" },
      { label: "📅 总是在救火", subtext: "为您提供视觉化时间轴、任务紧急程度排序" },
    ]
  }
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<{[key: number]: string}>({});

  const completeOnboarding = async () => {
    if (typeof window === "undefined") return;
    try {
      const res = await fetch("/api/me");
      const { userId } = (await res.json()) as { userId: string | null };
      if (userId) {
        localStorage.setItem(`onboarding_${userId}`, "true");
      } else {
        localStorage.setItem("onboarding_completed", "true");
        localStorage.removeItem("adhd-coach-todos");
      }
    } catch {
      localStorage.setItem("onboarding_completed", "true");
      localStorage.removeItem("adhd-coach-todos");
    }
    window.location.href = "/dashboard";
  };

  const handleSelect = (optionLabel: string) => {
    setSelections(prev => ({...prev, [currentStep]: optionLabel}));
    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 300);
    } else {
      setTimeout(completeOnboarding, 500);
    }
  };

  const handleSkip = () => {
    window.location.href = "/dashboard";
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-[#F7FAF8] font-sans text-[#1A2E1A] onboarding-root"
      style={{ position: "relative", zIndex: 1, pointerEvents: "auto" }}
    >
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#D2EDDA] via-[#E6F4EA] to-[#F7FAF8]" style={{ pointerEvents: 'none' }} />

      <div className="relative z-10 flex h-full flex-col px-6 py-6" style={{ pointerEvents: 'auto' }}>
        <div className="mb-8 flex flex-col gap-4">
          <div className="h-1.5 w-full rounded-full bg-[#1A2E1A]/10">
            <div
              className="h-full rounded-full bg-[#5DB896] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {currentStep > 0 && (
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBack(); }} className="self-start text-[#1A2E1A]/60 hover:text-[#1A2E1A] cursor-pointer">
              <ArrowLeft size={24} />
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          <h1 className="text-3xl font-bold leading-tight text-[#1A2E1A] mb-4">
            {currentStep + 1}/{questions.length}. {currentQuestion.title}
          </h1>
          <p className="text-[#4A5E4A] text-base mb-8 leading-relaxed">
            {currentQuestion.description}
          </p>

          <div className="flex flex-col gap-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(option.label)}
                className={`w-full rounded-full border px-6 py-4 text-left transition-all active:scale-[0.98] cursor-pointer
                  ${selections[currentStep] === option.label
                    ? 'border-[#5DB896] bg-[#5DB896] text-white shadow-md'
                    : 'border-[#1A2E1A]/10 bg-white/50 text-[#1A2E1A] hover:bg-white hover:border-[#5DB896]/50'
                  }`}
                style={{ touchAction: 'manipulation' }}
              >
                <span className="block text-base font-medium">{option.label}</span>
                {option.subtext && (
                  <span className="mt-1 block text-xs font-normal text-[#4A5E4A]/70">
                    {option.subtext}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSkip(); }}
            className="mt-6 w-full py-3 text-center text-sm font-medium text-[#4A5E4A] hover:text-[#1A2E1A] transition-all cursor-pointer"
          >
            一键跳过
          </button>
        </div>
      </div>
    </div>
  );
}
