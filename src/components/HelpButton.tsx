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
      '악곡 선택 → 1단계(감각적) → 2단계(분석적) → 3단계(심미적) → 최종 감상문 순서로 진행해요. 왼쪽(모바일에서는 위)에서 언제든 음악을 다시 들을 수 있어요.'
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
      question: '이 곡에서 느낀 나의 감정 분석하기는 뭔가요?',
      answer:
        '내가 선택한 표현을 바탕으로 AI가 6가지 기본 감정(기쁨, 슬픔, 분노, 두려움, 놀람, 혐오) 중 어떤 감정이 담겨 있는지 분석해줘요.'
    }
  ],
  step2: [
    {
      question: '각 탭에서 뭘 하나요?',
      answer:
        '악곡마다 3개의 탭이 있어요. 음악의 구성 → 음악 요소 1 → 음악 요소 2 순서로 진행해요. 사회·역사 맥락은 3단계에서 해요.'
    },
    {
      question: '가락선은 어떻게 그리나요?',
      answer:
        '음악을 들으며 음의 높낮이 변화를 느끼는 대로 화면에 선을 그으면 돼요. 마우스를 클릭한 채로 드래그하세요.'
    },
    {
      question: '틀렸을 때 바로 정답을 알 수 있나요?',
      answer:
        '정답을 바로 알려주는 대신 힌트를 먼저 드려요. 힌트를 보고 다시 한번 생각해보세요.'
    },
    {
      question: '피드백 보기·정답 확인하기 버튼은 뭔가요?',
      answer:
        '「음악의 구성」에서는 모든 질문을 작성한 뒤 맨 아래에 「정답 확인하기」가 한 번 나타나요. 내 답과 정답을 비교해 볼 수 있어요. 「음악 요소」 활동과 심미적 감상에서는 「피드백 보기」로 힌트·설명을 받아요.'
    }
  ],
  step3: [
    {
      question: '3단계에서는 뭘 하나요?',
      answer:
        '먼저 사회·역사 맥락 카드를 확인한 뒤, 감각·분석 감상을 바탕으로 음악의 가치를 판단해요.'
    },
    {
      question: '질문에 어떻게 답하면 되나요?',
      answer:
        '앞서 느끼고 분석한 내용과 역사적 맥락을 바탕으로 음악의 가치와 내 삶을 연결해서 자유롭게 써요.'
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
        '2단계 분석적 감상은 필수 문항 전체를 100%로 두고, 미응답·오답은 모두 오답으로 봐요. 모든 문항에 응답했고 정답률이 90% 이상이면 상, 60~89%는 중, 60% 미만은 하예요. 미응답이 하나라도 있으면 상은 나오지 않아요.'
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

