'use client';

import { useEffect, useMemo, useState } from 'react';

type HelpStep = 'intro' | 'step1' | 'step2' | 'step3' | 'final';

type FaqItem = {
  question: string;
  answer: string;
};

const COMMON_FAQ: FaqItem[] = [
  {
    question: '이 프로그램은 무엇인가요?',
    answer:
      '음악을 감각적으로 느끼고, 분석하고, 가치를 판단하는 3단계 감상 활동을 도와주는 학습 프로그램이에요. 마지막에 AI가 감상문을 완성해줘요.'
  },
  {
    question: '어떤 순서로 진행하나요?',
    answer:
      '악곡 선택 → 영상 감상 → 1단계(감각적) → 2단계(분석적) → 3단계(심미적) → 최종 감상문 순서로 진행해요.'
  }
];

const STEP_FAQ: Record<HelpStep, FaqItem[]> = {
  intro: [],
  step1: [
    {
      question: '감성 키워드는 어떻게 선택하나요?',
      answer:
        '음악을 들으며 떠오르는 느낌과 가장 가까운 단어를 골라요. 정답이 없으니 자유롭게 선택하세요.'
    },
    {
      question: '색상은 왜 선택하나요?',
      answer:
        '음악에서 느껴지는 분위기를 색으로 표현하는 활동이에요. 정답이 없으니 자유롭게 골라요.'
    },
    {
      question: '다른 방식으로 음악 표현하기는 뭔가요?',
      answer:
        '음악의 느낌을 체육, 과학, 사회, 수학 등 다른 교과와 연결해서 표현하는 활동이에요.'
    },
    {
      question: '이 곡에서 느낀 나의 감정 분석하기는 뭔가요?',
      answer:
        '내가 선택한 표현을 바탕으로 AI가 6가지 기본 감정(기쁨, 슬픔, 분노, 두려움, 놀람, 혐오) 중 어떤 감정이 담겨 있는지 분석해줘요.'
    }
  ],
  step2: [
    {
      question: '각 탭에서 뭘 하나요?',
      answer:
        '악곡마다 4개의 탭이 있어요. 개요파악, 음악 요소 분석, 가락선 그리기(또는 매칭 활동), 역사맥락 순서로 진행해요.'
    },
    {
      question: '가락선은 어떻게 그리나요?',
      answer:
        '음악을 들으며 음의 높낮이 변화를 느끼는 대로 화면에 선을 그으면 돼요. 마우스를 클릭한 채로 드래그하세요.'
    },
    {
      question: '틀렸을 때 바로 정답을 알 수 있나요?',
      answer:
        '정답을 바로 알려주는 대신 힌트를 먼저 드려요. 힌트를 보고 다시 한번 생각해보세요. 그래도 모르겠으면 정답 비교 버튼을 눌러요.'
    },
    {
      question: 'AI 맞춤형 피드백 보기 버튼은 뭔가요?',
      answer:
        '활동을 완료하면 나타나는 버튼이에요. 누르면 내 답변에 대한 AI의 맞춤형 피드백과 정답 비교를 확인할 수 있어요.'
    }
  ],
  step3: [
    {
      question: '앞 단계 결과를 다시 볼 수 있나요?',
      answer:
        '네, 화면 상단에 1·2단계 결과가 자동으로 요약돼요. 펼치기 버튼을 누르면 자세히 볼 수 있어요.'
    },
    {
      question: '질문에 어떻게 답하면 되나요?',
      answer:
        '앞서 느끼고 분석한 내용을 바탕으로 음악의 가치와 내 삶을 연결해서 자유롭게 써요.'
    }
  ],
  final: [
    {
      question: '감상문은 누가 쓰나요?',
      answer:
        '내가 1·2·3단계에서 입력한 내용을 바탕으로 AI가 자연스러운 감상문으로 완성해줘요.'
    },
    {
      question: '등급은 어떻게 매겨지나요?',
      answer:
        'AI가 내 감상 내용을 모범 답안과 비교해서 상·중·하 3단계로 평가하고, 개선할 점을 알려줘요.'
    },
    {
      question: '감상문을 저장할 수 있나요?',
      answer:
        '네, 감상문 화면 하단의 다운로드 버튼을 누르면 PDF 형식으로 저장할 수 있어요.'
    }
  ]
};

const STEP_LABEL: Record<HelpStep, string> = {
  intro: '안내',
  step1: '1단계 · 감각적 감상',
  step2: '2단계 · 분석적 감상',
  step3: '3단계 · 심미적 감상',
  final: '최종 감상문'
};

type HelpButtonProps = {
  currentStep: HelpStep;
};

export default function HelpButton({ currentStep }: HelpButtonProps) {
  const [open, setOpen] = useState(false);
  const [openedQuestion, setOpenedQuestion] = useState<number | null>(null);

  const faqs = useMemo(() => [...COMMON_FAQ, ...STEP_FAQ[currentStep]], [currentStep]);

  useEffect(() => {
    setOpenedQuestion(null);
  }, [currentStep]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  return (
    <>
      {!open ? (
        <div
          style={{
            position: 'fixed',
            right: 72,
            top: 22,
            zIndex: 89,
            background: 'rgba(18, 14, 30, 0.95)',
            border: '1px solid var(--border2)',
            color: 'var(--text)',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.4,
            boxShadow: '0 8px 18px rgba(0,0,0,.28)'
          }}
          aria-hidden="true"
        >
          모르는 게 있으면 눌러보세요!
          <span
            style={{
              position: 'absolute',
              right: -7,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '7px solid transparent',
              borderBottom: '7px solid transparent',
              borderLeft: '7px solid rgba(18, 14, 30, 0.95)'
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: -8,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderLeft: '8px solid var(--border2)',
              zIndex: -1
            }}
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="도움말 열기"
        style={{
          position: 'fixed',
          right: 16,
          top: 16,
          zIndex: 90,
          width: 46,
          height: 46,
          borderRadius: '9999px',
          border: '1px solid rgba(167,139,250,.7)',
          background: '#7c3aed',
          color: '#fff',
          fontSize: 22,
          fontWeight: 700,
          boxShadow: '0 10px 24px rgba(0,0,0,.35)',
          cursor: 'pointer'
        }}
      >
        ?
      </button>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 95,
          pointerEvents: open ? 'auto' : 'none'
        }}
        aria-hidden={!open}
      >
        <button
          type="button"
          aria-label="도움말 닫기"
          onClick={() => setOpen(false)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,.45)',
            opacity: open ? 1 : 0,
            transition: 'opacity .2s'
          }}
        />

        <aside
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            height: '100%',
            width: '100%',
            maxWidth: 420,
            borderLeft: '1px solid var(--border2)',
            background: 'var(--surface)',
            padding: 20,
            boxShadow: '-12px 0 24px rgba(0,0,0,.35)',
            transform: open ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform .28s ease'
          }}
        >
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>도움말</p>
              <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-dim)' }}>{STEP_LABEL[currentStep]}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                border: '1px solid var(--border2)',
                background: 'var(--surface2)',
                color: 'var(--text-dim)',
                borderRadius: 6,
                padding: '4px 8px',
                cursor: 'pointer'
              }}
            >
              닫기
            </button>
          </div>

          <div style={{ display: 'grid', gap: 8, overflowY: 'auto', maxHeight: 'calc(100vh - 92px)', paddingBottom: 12 }}>
            {faqs.map((faq, index) => {
              const expanded = openedQuestion === index;
              return (
                <div
                  key={`${faq.question}-${index}`}
                  style={{
                    borderRadius: 10,
                    border: '1px solid var(--border2)',
                    overflow: 'hidden',
                    background: 'var(--surface2)'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenedQuestion(expanded ? null : index)}
                    aria-expanded={expanded}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '12px 14px',
                      textAlign: 'left',
                      color: 'var(--text)',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: 'transparent',
                      border: 'none'
                    }}
                  >
                    <span>{faq.question}</span>
                    <span style={{ color: 'var(--purple-light)', fontWeight: 700 }}>{expanded ? '−' : '+'}</span>
                  </button>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateRows: expanded ? '1fr' : '0fr',
                      transition: 'grid-template-rows .2s'
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <p
                        style={{
                          borderTop: '1px solid var(--border2)',
                          padding: '12px 14px',
                          color: 'var(--text-dim)',
                          fontSize: 13,
                          lineHeight: 1.7,
                          margin: 0
                        }}
                      >
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </>
  );
}

