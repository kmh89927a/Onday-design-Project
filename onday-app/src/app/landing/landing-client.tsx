"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight, MapPin, Clock, Shield, Users, Zap, ChevronDown,
  Home, TrendingUp, CheckCircle2, BookOpen, CalendarClock, Heart,
  Share2, Save, AlertTriangle, Target, Bell, Menu, X,
} from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackLandingViewed } from "@/lib/analytics/mixpanel";
import { motion, MotionConfig, useScroll, useTransform, useReducedMotion, useMotionValue, animate } from "framer-motion";
import CountUp from "react-countup";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 1.0, ease: "easeOut" as const },
};

const cardFadeUpNormal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px 0px -100px 0px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const cardFadeUpFast = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px 0px -100px 0px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};

const heroItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const ioContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
};

const ioBox = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const, when: "beforeChildren" as const, staggerChildren: 0.08 } },
};

const ioBoxItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const ioCenter = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const baContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const baItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

function CountUpStat({ end, prefix = "", suffix = "", duration = 2 }: {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion || duration === 0) {
    return <>{prefix}{end}{suffix}</>;
  }
  return (
    <CountUp
      end={end}
      duration={duration}
      prefix={prefix}
      suffix={suffix}
      enableScrollSpy
      scrollSpyOnce
    />
  );
}

/* ── Hero ── */
function HeroSection() {
  const ref = React.useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const mountOpacity = useMotionValue(0);
  const mountY = useMotionValue(24);
  const scrollOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const opacity = useTransform([mountOpacity, scrollOpacity], (latest: number[]) => latest[0] * latest[1]);

  React.useEffect(() => {
    if (reduceMotion) return;
    const c1 = animate(mountOpacity, 1, { duration: 1.2, ease: "easeOut" });
    const c2 = animate(mountY, 0, { duration: 1.2, ease: "easeOut" });
    return () => { c1.stop(); c2.stop(); };
  }, [reduceMotion, mountOpacity, mountY]);

  return (
    <motion.section ref={ref} style={reduceMotion ? undefined : { opacity, y: mountY }} id="hero" className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-s-5 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, hsl(221 83% 53% / 0.15) 0%, transparent 70%), linear-gradient(180deg, hsl(var(--bg)) 0%, hsl(var(--primary-soft)) 50%, hsl(var(--bg)) 100%)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <span key={`dot-${i}`} className="absolute rounded-full bg-primary/10 animate-pulse-soft" style={{ width: `${12 + i * 8}px`, height: `${12 + i * 8}px`, top: `${15 + i * 14}%`, left: `${10 + ((i * 17) % 80)}%`, animationDelay: `${i * 0.3}s` }} />
        ))}
      </div>

      <motion.div
        variants={heroContainer}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-xl md:max-w-2xl space-y-s-6"
      >
        <motion.div variants={heroItem}>
          <Logo size="lg" className="mx-auto" />
        </motion.div>

        {/* 핵심 Pain 자극 뱃지 */}
        <motion.div variants={heroItem} className="mx-auto flex w-fit items-center gap-s-2 rounded-chip border border-warning/30 bg-warning-soft px-s-4 py-1.5">
          <AlertTriangle className="size-3.5 text-warning" />
          <span className="text-caption-xs font-bold text-warning">탐색 평균 4.2개월 · 부부 1차 합의 실패율 70% — 자체 인터뷰 14건</span>
        </motion.div>

        <motion.div variants={heroItem}>
          <h1 className="text-display-2 font-extrabold leading-[1.15] tracking-[-0.03em] text-ink sm:text-display-1 md:text-5xl lg:text-6xl">
            주말 6시간 발품을,
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              6초 진단으로
            </span>
          </h1>
        </motion.div>

        <motion.div variants={heroItem}>
          <p className="mx-auto max-w-sm text-body-lg md:text-xl lg:text-2xl leading-relaxed text-ink-2">
            복잡한 비교는 AI에게,
            <br />
            <strong className="text-ink">부부는 결정만.</strong>
          </p>
        </motion.div>

        <motion.div variants={heroItem}>
          <p className="mx-auto max-w-sm text-body-sm md:text-base lg:text-lg leading-relaxed text-ink-3">
            남편 직장 + 아내 직장,
            <br />
            두 동선을 동시에 만족하는 동네를 찾아드려요.
          </p>
        </motion.div>

        <div className="flex flex-col items-center gap-s-3 pt-s-2">
          <motion.div variants={heroItem} className="w-full max-w-xs">
            <Link href="/login" className="block">
              <Button fullWidth size="lg" trailing={<ArrowRight />}>
                지금 무료로 진단 시작하기
              </Button>
            </Link>
          </motion.div>
          <motion.div variants={heroItem}>
            <p className="text-caption text-ink-3">
              회원가입 없이 게스트 체험 가능 · 게스트 진단 데이터는 자동 삭제
            </p>
          </motion.div>
        </div>
      </motion.div>

      <button onClick={() => document.getElementById("pain")?.scrollIntoView({ behavior: "smooth" })} className="absolute bottom-8 animate-bounce text-ink-3 transition-colors hover:text-primary" aria-label="아래로 스크롤">
        <ChevronDown className="size-6" />
      </button>
    </motion.section>
  );
}

/* ── Pain Points ── */
function PainSection() {
  const pains = [
    { icon: Target, title: "트레이드오프 마비", desc: "내 직장에 가까우면 배우자 직장이 멀고,\n둘 다 만족하는 동네는 찾을 도구가 없음", severity: "AOS 4.00 · 1위" },
    { icon: Clock, title: "정보 과부하", desc: "네이버 지도·부동산앱·통근앱\n수동 조합에 회당 평균 2~3시간", severity: "평균 2~3시간" },
    { icon: CalendarClock, title: "긴급 이사 패닉", desc: "전세 만료·발령 통보 후\n일 2시간씩 앱만 뒤지는 탐색 루프", severity: "AOS 3.80" },
  ];
  return (
    <motion.section {...fadeUp} id="pain" className="bg-surface px-s-5 py-s-10">
      <div className="mx-auto max-w-xl md:max-w-3xl space-y-s-6">
        <div className="space-y-s-2 text-center">
          <p className="text-caption-xs font-bold tracking-widest text-danger">PAIN POINT</p>
          <h2 className="text-h2 md:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink">
            3040 부부가 겪는
            <br />3가지 구조적 문제
          </h2>
          <p className="text-body-sm md:text-base text-ink-3"><strong className="text-danger">자체 JTBD 인터뷰 14건</strong> 분석 결과</p>
        </div>
        <div className="space-y-s-3">
          {pains.map((p, i) => (
            <motion.article key={p.title} {...cardFadeUpNormal} className="flex gap-s-4 rounded-2xl border border-card-border bg-bg p-s-5 shadow-card">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-danger-soft">
                <p.icon className="size-5 text-danger" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-s-2">
                  <h3 className="text-title font-bold text-ink">{p.title}</h3>
                  <span className="rounded-chip bg-danger/10 px-2 py-0.5 text-caption-xs font-bold text-danger tabular">{p.severity}</span>
                </div>
                <p className="mt-s-1 whitespace-pre-line text-body-sm md:text-base leading-relaxed text-ink-3">{p.desc}</p>
              </div>
            </motion.article>
          ))}
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary-soft/50 p-s-5 text-center">
          <p className="text-body-sm font-bold text-primary">💡 의사결정 단위가 &lsquo;부부&rsquo;이므로</p>
          <p className="mt-s-1 text-body-sm text-ink-2">한 사람의 납득만으로는 이사가 진행되지 않습니다.<br />배우자 설득용 데이터가 핵심 전환 레버입니다.</p>
        </div>
      </div>
    </motion.section>
  );
}

/* ── I/O Diagram ── */
function InputOutputSection() {
  return (
    <motion.section {...fadeUp} id="how" className="px-s-5 py-s-10">
      <div className="mx-auto max-w-xl md:max-w-3xl space-y-s-7 text-center">
        <div className="space-y-s-2">
          <p className="text-caption-xs font-bold tracking-widest text-primary">HOW IT WORKS</p>
          <h2 className="text-h2 md:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink">복잡한 건 AI가,<br />결과만 확인하세요</h2>
        </div>
        <motion.div
          variants={ioContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-s-4"
        >
          <motion.div variants={ioBox} className="rounded-2xl border border-card-border bg-surface p-s-5 shadow-card">
            <p className="mb-s-3 text-caption font-bold text-ink-3">INPUT — 30초면 끝</p>
            <div className="flex items-center justify-center gap-s-3 flex-wrap">
              {[
                { icon: MapPin, label: "내 직장", color: "bg-primary-soft text-primary" },
                { icon: MapPin, label: "배우자 직장", color: "bg-[hsl(262_83%_95%)] text-secondary" },
              ].map((item) => (
                <motion.div variants={ioBoxItem} key={item.label} className="flex flex-col items-center gap-s-1">
                  <span className={cn("flex size-10 items-center justify-center rounded-xl", item.color.split(" ")[0])}>
                    <item.icon className={cn("size-5", item.color.split(" ")[1])} />
                  </span>
                  <span className="text-caption font-medium text-ink-2">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div variants={ioCenter} className="flex flex-col items-center gap-s-1">
            <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary shadow-marker">
              <Zap className="size-5 text-white" />
            </div>
            <span className="text-caption-xs font-bold text-primary">AI 동선 교차 분석</span>
          </motion.div>
          <motion.div variants={ioBox} className="rounded-2xl border border-primary/20 bg-primary-soft/50 p-s-5 shadow-card">
            <p className="mb-s-3 text-caption font-bold text-primary">OUTPUT</p>
            <div className="grid grid-cols-4 gap-s-2">
              {[
                { icon: Home, label: "최적 동네\n6~8곳" },
                { icon: Share2, label: "부부 공유\n링크" },
                { icon: TrendingUp, label: "시세·매물\n연결" },
                { icon: Shield, label: "야간 안전·\n편의시설" },
              ].map(({ icon: Icon, label }) => (
                <motion.div variants={ioBoxItem} key={label} className="flex flex-col items-center gap-s-1">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-surface shadow-card"><Icon className="size-4 text-primary" /></span>
                  <span className="whitespace-pre-line text-center text-caption-xs font-medium leading-snug text-ink-2">{label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ── Before/After ── */
function BeforeAfterSection() {
  return (
    <motion.section {...fadeUp} className="bg-surface px-s-5 py-s-10">
      <div className="mx-auto max-w-xl md:max-w-3xl space-y-s-6">
        <div className="space-y-s-2 text-center">
          <p className="text-caption-xs font-bold tracking-widest text-primary">BEFORE & AFTER</p>
          <h2 className="text-h2 md:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink">이사 리서치,<br />이렇게 달라져요</h2>
        </div>
        <motion.div
          variants={baContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-s-6"
        >
          <div className="grid grid-cols-2 gap-s-3">
            <motion.div variants={baItem} className="rounded-2xl border border-danger/20 bg-danger-soft p-s-4 space-y-s-3">
              <span className="inline-block rounded-chip bg-danger/10 px-s-3 py-1 text-caption-xs font-bold text-danger">BEFORE</span>
              <div className="space-y-s-2">
                {["주말 6시간 발품", "앱 4~5개 번갈아", "앱·카페 탐색 평균 4.2개월", "배우자 설득 근거 없음"].map((t) => (
                  <div key={t} className="flex items-center gap-s-2 text-body-sm md:text-base text-ink-2">
                    <Clock className="size-4 shrink-0 text-danger" /><span>{t}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div variants={baItem} className="rounded-2xl border border-success/20 bg-success-soft p-s-4 space-y-s-3">
              <span className="inline-block rounded-chip bg-success/10 px-s-3 py-1 text-caption-xs font-bold text-success">AFTER</span>
              <div className="space-y-s-2">
                {[
                  { t: "6초 AI 진단", bold: "6초" },
                  { t: "한 화면에 모두", bold: "한 화면" },
                  { t: "통근+시세+안전 통합", bold: "통합" },
                  { t: "공유 링크로 합의", bold: "합의" },
                ].map(({ t, bold }) => (
                  <div key={t} className="flex items-center gap-s-2 text-body-sm md:text-base text-ink-2">
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
          <motion.div variants={baItem} className="flex items-center justify-center gap-s-4 rounded-2xl bg-primary-soft/60 p-s-5">
            <div className="text-center">
              <p className="text-display-2 font-extrabold text-primary tabular">12~18배</p>
              <p className="text-caption text-ink-3">시간 단축</p>
            </div>
            <div aria-hidden className="h-10 w-px bg-line" />
            <p className="text-body-sm md:text-base leading-relaxed text-ink-2">
              수작업 비교 <strong className="text-ink">2~3시간</strong> →{" "}
              <strong className="text-primary">10분 탐색 완료</strong>
              <br />진단 응답은 단 몇 초
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ── 5대 핵심 기능 (Value Prop) ── */
function ValueProposition() {
  const features = [
    { icon: MapPin, title: "F1. 두 동선 교차 진단", desc: "남편 직장 + 아내 직장 교집합에서 최적 동네를 자동 산출. 서비스의 핵심 정체성.", tag: "AOS 4.00 — 1위", accent: "primary" as const },
    { icon: Share2, title: "F2. 배우자 공유 링크", desc: "앱 설치 없이 모바일 웹에서 리포트 + 무료 미리보기 1곳. 부부 합의 돌파의 핵심 레버.", tag: "바이럴 루프", accent: "secondary" as const },
    { icon: CalendarClock, title: "F3. 데드라인 모드", desc: "전세 만료 D-Day 역산 타임라인 + 네이버 부동산 매물 아웃링크. 이사 체크리스트(D-30~D-Day) 자동 생성.", tag: "AOS 3.80", accent: "warning" as const },
    { icon: Shield, title: "F4. 싱글 모드", desc: "학군 숨김, 야간 치안·편의시설 강조. 1인 가구 맞춤 분석.", tag: "1인가구", accent: "success" as const },
    { icon: Save, title: "F5. 간이 저장", desc: "입력값 자동 저장 + 불러오기. 2년 주기 발령 교사도 재사용 가능.", tag: "재방문", accent: "primary" as const },
  ];
  const accentMap = {
    primary: { bg: "bg-primary-soft", text: "text-primary" },
    success: { bg: "bg-success-soft", text: "text-success" },
    secondary: { bg: "bg-[hsl(262_83%_95%)]", text: "text-secondary" },
    warning: { bg: "bg-warning-soft", text: "text-warning" },
  };
  return (
    <motion.section {...fadeUp} id="features" className="px-s-5 py-s-10">
      <div className="mx-auto max-w-xl md:max-w-3xl space-y-s-6">
        <div className="space-y-s-2 text-center">
          <p className="text-caption-xs font-bold tracking-widest text-primary">SOLUTION — 5대 핵심 기능</p>
          <h2 className="text-h2 md:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink">왜 OnDay (온데이)인가요?</h2>
          <p className="text-body-sm md:text-base text-ink-3">기능이 아닌, 당신이 얻을 <strong className="text-ink">가치</strong>를 말해요</p>
        </div>
        <div className="space-y-s-3">
          {features.map((f) => (
            <motion.article key={f.title} {...cardFadeUpFast} className="group flex gap-s-4 rounded-2xl border border-card-border bg-surface p-s-5 shadow-card transition-shadow duration-220 hover:shadow-card-hover">
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", accentMap[f.accent].bg)}>
                <f.icon className={cn("size-5", accentMap[f.accent].text)} />
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-s-2">
                  <h3 className="text-title font-bold text-ink">{f.title}</h3>
                  <span className={cn("rounded-chip px-2 py-0.5 text-caption-xs font-bold", accentMap[f.accent].bg, accentMap[f.accent].text)}>{f.tag}</span>
                </div>
                <p className="mt-s-1 text-body-sm md:text-base leading-relaxed text-ink-3">{f.desc}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ── In-App Capabilities ── */
function InAppSection() {
  const items = [
    { icon: TrendingUp, title: "거래유형 전환", badge: "전세·매매·월세", desc: "토글 한 번으로 거래유형을 바꾸면 모든 후보 동네 시세가 즉시 재계산돼요", accent: "primary" as const },
    { icon: Target, title: "타협 인사이트", badge: "더 싸게 · 더 빠르게", desc: "1위 동네 대비 “여기로 가면 월 얼마 절약, 통근 몇 분 단축”을 숫자로 비교해 부부 합의 근거를 만들어줘요", accent: "secondary" as const },
    { icon: Clock, title: "AI 동네 하루 미리보기", badge: "카드 탭", desc: "후보 동네 카드를 누르면 출근부터 퇴근 후까지, 그 동네에서의 하루를 AI가 미리 그려줘요", accent: "warning" as const },
    { icon: BookOpen, title: "AI 30분 요약", badge: "Top 3", desc: "후보 중 Top 3 동네를 AI가 카드로 요약하고 네이버 부동산 매물로 바로 연결돼요", accent: "success" as const },
  ];
  const accentMap = {
    primary: { bg: "bg-primary-soft", text: "text-primary" },
    success: { bg: "bg-success-soft", text: "text-success" },
    secondary: { bg: "bg-[hsl(262_83%_95%)]", text: "text-secondary" },
    warning: { bg: "bg-warning-soft", text: "text-warning" },
  };
  return (
    <motion.section {...fadeUp} id="in-app" className="bg-surface px-s-5 py-s-10">
      <div className="mx-auto max-w-xl md:max-w-3xl space-y-s-6">
        <div className="space-y-s-2 text-center">
          <p className="text-caption-xs font-bold tracking-widest text-primary">IN THE APP</p>
          <h2 className="text-h2 md:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink">결과 화면에서<br />바로 되는 것들</h2>
          <p className="text-body-sm md:text-base text-ink-3">지금 베타에서 실제로 동작하는 기능이에요</p>
        </div>
        <motion.div
          variants={baContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-s-3"
        >
          {items.map((item) => (
            <motion.article key={item.title} variants={baItem} className="flex gap-s-4 rounded-2xl border border-card-border bg-bg p-s-5 shadow-card">
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", accentMap[item.accent].bg)}>
                <item.icon className={cn("size-5", accentMap[item.accent].text)} />
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-s-2">
                  <h3 className="text-title font-bold text-ink">{item.title}</h3>
                  <span className={cn("rounded-chip px-2 py-0.5 text-caption-xs font-bold", accentMap[item.accent].bg, accentMap[item.accent].text)}>{item.badge}</span>
                </div>
                <p className="mt-s-1 whitespace-pre-line text-body-sm md:text-base leading-relaxed text-ink-3">{item.desc}</p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ── Persona Testimonials ── */
function PersonaSection() {
  const personas = [
    { name: "INT-01", age: 36, type: "맞벌이", quote: "저는 여의도인데 남편은 판교잖아요. 각자 검색하면 서로 원하는 동네가 달라서… 합의를 못 해요.", feature: "→ F1 교차 진단 + F2 공유로 해결" },
    { name: "INT-07", age: 38, type: "긴급 이사", quote: "집주인 연락이랑 발령 문자가 같은 날 왔어요. 눈앞이 하얘지더라고요. 이 상황이면 10만원도 냈겠어요.", feature: "→ F3 데드라인 모드로 해결" },
    { name: "INT-13", age: 32, type: "이직 후 1인 가구", quote: "치안 점수가 저한테는 제일 중요해요. 학군 항목이 불필요해요.", feature: "→ F4 싱글 모드로 해결" },
  ];
  return (
    <motion.section {...fadeUp} id="stories" className="bg-surface px-s-5 py-s-10">
      <div className="mx-auto max-w-xl md:max-w-3xl space-y-s-6">
        <div className="space-y-s-2 text-center">
          <p className="text-caption-xs font-bold tracking-widest text-primary">USER RESEARCH</p>
          <h2 className="text-h2 md:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink">사전 인터뷰 14건에서<br />들은 목소리</h2>
          <p className="text-body-sm md:text-base text-ink-3">2026.03 자체 JTBD 인터뷰 발췌 · 출시 전 조사 결과예요</p>
        </div>
        <div className="space-y-s-3">
          {personas.map((p) => (
            <motion.article key={p.name} {...cardFadeUpNormal} className="rounded-2xl border border-card-border bg-bg p-s-5 shadow-card">
              <div className="mb-s-2">
                <span className="inline-block rounded-chip bg-ink-3/10 px-2 py-0.5 text-caption-xs font-bold text-ink-3">JTBD 인터뷰</span>
              </div>
              <p className="text-body-sm md:text-base leading-relaxed text-ink-2">&ldquo;{p.quote}&rdquo;</p>
              <div className="mt-s-3 flex items-center justify-between">
                <div className="flex items-center gap-s-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-caption font-bold text-primary">{p.name[0]}</span>
                  <div>
                    <p className="text-caption font-bold text-ink">{p.name} ({p.age})</p>
                    <p className="text-caption-xs text-ink-3">{p.type}</p>
                  </div>
                </div>
                <span className="rounded-chip bg-primary-soft px-2 py-0.5 text-caption-xs font-bold text-primary">{p.feature}</span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ── Market & Trust ── */
function MarketSection() {
  return (
    <motion.section {...fadeUp} className="px-s-5 py-s-10">
      <div className="mx-auto max-w-xl md:max-w-3xl space-y-s-6">
        <div className="space-y-s-2 text-center">
          <p className="text-caption-xs font-bold tracking-widest text-primary">MARKET INSIGHT</p>
          <h2 className="text-h2 md:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink">왜 지금인가요?</h2>
        </div>
        <div className="grid grid-cols-2 gap-s-3">
          {[
            { end: 4.2, prefix: "", suffix: "개월", duration: 0, label: "평균 동네 탐색 기간", sub: "인터뷰 14건 실측" },
            { end: 470, prefix: "$", suffix: "억", duration: 2, label: "글로벌 프롭테크", sub: "CAGR 16%" },
            { end: 0, prefix: "", suffix: "개", duration: 0, label: "두 동선 동시 계산 도구", sub: "블루오션" },
            { end: 10, prefix: "", suffix: "분", duration: 1.5, label: "탐색 완료 목표", sub: "기존 2~3시간" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-s-1 rounded-2xl border border-card-border bg-surface p-s-4 shadow-card">
              <span className="text-h3 font-extrabold text-ink tabular">
                <CountUpStat end={s.end} prefix={s.prefix} suffix={s.suffix} duration={s.duration} />
              </span>
              <span className="text-caption font-medium text-ink-2">{s.label}</span>
              <span className="text-caption-xs text-ink-3">{s.sub}</span>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary-soft/50 p-s-5 text-center">
          <p className="text-body-sm md:text-base font-bold text-ink">🔵 두 동선 동시 계산 도구는 시장에 전무</p>
          <p className="mt-s-1 text-body-sm md:text-base text-ink-3">프롭테크 × 하이퍼로컬 × 라이프스타일의 교차점<br />매물 중개와 경쟁하지 않는 비적대적 가치사슬</p>
        </div>
        <div className="flex items-start gap-s-2 rounded-xl bg-info-soft p-s-4">
          <Shield className="mt-0.5 size-4 shrink-0 text-info" />
          <p className="text-body-sm md:text-base text-ink-2">
            <strong className="text-ink">카카오 모빌리티 (자차 경로) · ODsay (대중교통) · 국토교통부 실거래가 (시세) · 행정안전부 지역안전지수·CCTV 공공데이터 (야간 안전)</strong>
            <br /><span className="text-caption text-ink-3">게스트 진단 데이터는 자동 삭제 · 로그인 시 입력값을 저장해 다음에 불러올 수 있어요</span>
          </p>
        </div>
      </div>
    </motion.section>
  );
}

/* ── Final CTA ── */
function FinalCTA() {
  return (
    <motion.section {...fadeUp} className="px-s-5 py-s-10">
      <div className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-deep p-s-7 text-center shadow-elevated">
        <p className="text-caption-xs font-bold tracking-widest text-white/60">Closed Beta 2026.08 예정</p>
        <h2 className="mt-s-2 text-h2 font-extrabold leading-snug text-white">
          우리 가족에게 딱 맞는 동네,
          <br />10분이면 찾을 수 있어요.
        </h2>
        <p className="mt-s-2 text-body-sm text-white/70">
          직장 주소 두 개만 입력하면 → AI가 교집합 동네를 추천해요
        </p>
        <div className="mt-s-5 flex flex-col items-center gap-s-3">
          <Link href="/login" className="w-full max-w-xs">
            <Button fullWidth size="lg" className="border-2 border-white/20 bg-white text-primary shadow-floating hover:bg-white/90" trailing={<ArrowRight />}>
              지금 무료로 진단 시작하기
            </Button>
          </Link>
          <p className="text-caption text-white/50">게스트 체험 가능 · 가입 없이 바로 시작</p>
        </div>
      </div>
    </motion.section>
  );
}

/* ── Pricing ── */
function PricingSection() {
  const betaBenefits = [
    "F1+F2 — 두 동선 교차 진단 + 배우자 공유 링크",
    "F3 — 데드라인 모드 (D-Day 역산 체크리스트 + 네이버 급매 연동)",
    "F4+F5 — 싱글 모드 + 입력값 저장 / 무제한 재진단",
  ];
  const oneTimeBenefits = [
    "F1 — AI 동선 교차 진단 1회",
    "F2 — 결과 리포트 영구 저장 + 공유 링크",
    "F4 — 싱글 모드 / 학군 숨김 옵션",
  ];
  const subscriptionBenefits = [
    "F5 — 무제한 재진단 (시세 변동 시 즉시 재계산)",
    "F2+F5 — 시세 변동 리마인더 (예정)",
    "2년 후 재진단 리마인더 (반복 이사 대비)",
  ];
  return (
    <motion.section {...fadeUp} id="pricing" className="px-s-5 py-s-10">
      <div className="mx-auto max-w-xl md:max-w-3xl space-y-s-6">
        <div className="space-y-s-2 text-center">
          <p className="text-caption-xs font-bold tracking-widest text-primary">PRICING</p>
          <h2 className="text-h2 md:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink">
            베타 무료.<br />정식 출시 후 1회 / 월정액 선택
          </h2>
          <p className="text-body-sm md:text-base text-ink-3">
            베타 기간 모든 기능 자유 이용 · 정식 출시 시점은 미리 보여드려요
          </p>
        </div>
        <div className="space-y-s-3">
          <motion.article
            {...cardFadeUpFast}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-deep p-s-5 shadow-card ring-2 ring-primary/30 transition-shadow duration-220 hover:shadow-card-hover"
          >
            <span className="inline-block rounded-chip bg-white/20 px-s-3 py-1 text-caption-xs font-bold text-white">
              지금 이용 가능 · Closed Beta 2026.08
            </span>
            <h3 className="mt-s-3 text-h3 font-extrabold text-white">베타 기간 무료</h3>
            <p className="mt-s-1 text-caption text-white/80">정식 출시 전까지 모든 기능 자유 이용</p>
            <div className="mt-s-3 flex items-baseline gap-s-1">
              <span className="text-display-2 font-extrabold text-white tabular">₩0</span>
            </div>
            <ul className="mt-s-4 space-y-s-2">
              {betaBenefits.map((b) => (
                <li key={b} className="flex gap-s-2 text-body-sm text-white/90">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-white/80" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </motion.article>

          <motion.article
            {...cardFadeUpFast}
            className="rounded-2xl border border-card-border bg-surface p-s-5 shadow-card opacity-85"
          >
            <span className="inline-block rounded-chip bg-ink-3/10 px-s-3 py-1 text-caption-xs font-bold text-ink-3">
              Open Beta 2026.09 예정
            </span>
            <h3 className="mt-s-3 text-h3 font-extrabold text-ink">1회 진단</h3>
            <p className="mt-s-1 text-caption text-ink-3">베타 기간 WTP 설문 결과로 확정해요</p>
            <div className="mt-s-3 flex items-baseline gap-s-1">
              <span className="text-display-2 font-extrabold text-ink tabular">가격 미정</span>
            </div>
            <ul className="mt-s-4 space-y-s-2">
              {oneTimeBenefits.map((b) => (
                <li key={b} className="flex gap-s-2 text-body-sm text-ink-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ink-3" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </motion.article>

          <motion.article
            {...cardFadeUpFast}
            className="rounded-2xl border border-card-border bg-surface p-s-5 shadow-card opacity-85"
          >
            <span className="inline-block rounded-chip bg-ink-3/10 px-s-3 py-1 text-caption-xs font-bold text-ink-3">
              정식 출시 2026.11 예정
            </span>
            <h3 className="mt-s-3 text-h3 font-extrabold text-ink">월정액 구독</h3>
            <p className="mt-s-1 text-caption text-ink-3">베타 기간 WTP 설문 결과로 확정해요</p>
            <div className="mt-s-3 flex items-baseline gap-s-1">
              <span className="text-display-2 font-extrabold text-ink tabular">가격 미정</span>
            </div>
            <ul className="mt-s-4 space-y-s-2">
              {subscriptionBenefits.map((b) => (
                <li key={b} className="flex gap-s-2 text-body-sm text-ink-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ink-3" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </motion.article>
        </div>

        <motion.div
          {...cardFadeUpNormal}
          className="rounded-2xl border border-primary/20 bg-primary-soft/50 p-s-5 space-y-s-3"
        >
          <div className="space-y-s-2 text-center">
            <span className="inline-block rounded-chip bg-primary/10 px-s-3 py-1 text-caption-xs font-bold text-primary">
              비용 ROI
            </span>
            <h3 className="text-title font-bold text-ink">
              1주 살아보기 vs 10분 진단
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-s-3">
            <div className="rounded-xl bg-bg p-s-4 text-center">
              <p className="text-caption-xs text-ink-3">단기체류 1주</p>
              <p className="mt-s-1 text-h3 font-extrabold text-ink-2 tabular">
                50~80<span className="ml-0.5 text-body-sm font-bold text-ink-3">만원</span>
              </p>
            </div>
            <div className="rounded-xl bg-bg p-s-4 text-center">
              <p className="text-caption-xs text-primary">온데이 1회</p>
              <p className="mt-s-1 text-h3 font-extrabold text-primary tabular">
                3~5<span className="ml-0.5 text-body-sm font-bold text-ink-3">만원</span>
              </p>
            </div>
          </div>
          <p className="text-center text-body-sm font-bold text-primary">
            93~96% 절감
          </p>
          <div className="space-y-s-2 text-center text-caption-xs text-ink-2 leading-relaxed">
            <p>
              ※ 비용 출처: 단기체류 플랫폼 1주 요금 기준
            </p>
            <p>
              목표: 임장 12회→3회 (75%↓) · 부부 합의 4.2개월→2주
            </p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ── Footer ── */
function Footer() {
  return (
    <footer className="border-t border-line bg-surface px-s-5 py-s-6">
      <div className="mx-auto max-w-xl space-y-s-3 text-center">
        <Logo size="sm" text="OnDay 온데이" className="mx-auto" />
        <p className="text-caption text-ink-3">© 2026 OnDay 온데이. 모든 권리 보유.</p>
        <p className="text-caption-xs italic text-ink-3">그곳에서의 하루(One Day)를 켜다(On)</p>
        <p className="text-caption-xs text-ink-3">카카오 모빌리티 (자차 경로) · ODsay (대중교통) · 국토교통부 실거래가 (시세) · 행정안전부 지역안전지수·CCTV 공공데이터 (야간 안전)</p>
      </div>
    </footer>
  );
}

/* ── Header Nav ── */
const NAV_LINKS = [
  { href: "#how", label: "진단 과정" },
  { href: "#features", label: "기능" },
  { href: "#stories", label: "인터뷰" },
  { href: "#pricing", label: "가격" },
];

function HeaderNav() {
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace("#", "");
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    setMenuOpen(false);
  };

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-nav border-b backdrop-blur-lg transition-all duration-200",
        scrolled
          ? "border-line bg-bg/95 shadow-sm"
          : "border-line/50 bg-bg/80",
      )}
    >
      <div className="flex items-center justify-between px-s-5 py-s-3">
        <Link href="/">
          <Logo size="sm" />
        </Link>
        <ul className="hidden items-center gap-s-5 md:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={(e) => handleLinkClick(e, l.href)}
                className="text-body-sm font-medium text-ink-2 transition-colors hover:text-primary"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-s-2">
          <Link href="/login">
            <Button size="sm">시작하기</Button>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex size-9 items-center justify-center rounded-md text-ink hover:bg-surface md:hidden"
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-line bg-bg md:hidden">
          <ul className="space-y-s-1 px-s-5 py-s-3">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={(e) => handleLinkClick(e, l.href)}
                  className="block rounded-md px-s-3 py-s-2 text-body font-medium text-ink-2 hover:bg-surface hover:text-primary"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}

/* ── Main ── */
export function LandingClient() {
  // ★ 상단 퍼널 시작점 — 랜딩 진입 1회. trackedRef = Strict Mode 2회·재마운트 중복 방지(result-view 선례).
  const trackedRef = React.useRef(false);
  React.useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    trackLandingViewed();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen bg-bg">
      <HeaderNav />
      <HeroSection />
      <PainSection />
      <InputOutputSection />
      <BeforeAfterSection />
      <ValueProposition />
      <InAppSection />
      <PersonaSection />
      <PricingSection />
      <MarketSection />
      <FinalCTA />
      <Footer />
    </div>
    </MotionConfig>
  );
}
