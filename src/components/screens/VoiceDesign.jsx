import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ArtSongTakeaway from '../ArtSongTakeaway';
import { SegmentYoutubePlayer } from '../SegmentYoutubePlayer';
import { canOpenAnswerAfterFormativeAiGate } from '../../lib/compareFeedback';
import {
  createEmptyMawangVoiceDesign,
  getMawangMelodyOptions,
  isVoiceDesignRowFilled,
  MAWANG_VOICE_ANSWER_KEY,
  normalizeMawangVoiceDesign,
  VOICE_DESIGN_FIELD_KEYS
} from '../../lib/voiceDesignAnswers';
import FormativeFeedbackBlock from '../FormativeFeedbackBlock';
import { getVoiceDesignFixedFeedback } from '../../lib/fixedFormativeFeedback';
import { useAppStore } from '../../store/useAppStore';

const chars = [
  {
    name: '해설자',
    icon: '🗣️',
    lyric: `"이 밤 폭풍 속 누가 말 달려 그들은 아버지와 아들"\n(독일 원어: "Wer reitet so spät durch Nacht und Wind? Es ist der Vater mit seinem Kind.")`,
    audioTitle: '해설자 구간 영상',
    start: 20,
    end: 36
  },
  {
    name: '아버지',
    icon: '👨',
    lyric: `"진정해, 진정해라, 아가. 마른 버들잎 소리란다."\n(독일 원어: "Sei ruhig, bleibe ruhig, mein Kind; in dürren Blättern säuselt der Wind.")`,
    audioTitle: '아버지 구간 영상',
    start: 121,
    end: 130
  },
  {
    name: '아들',
    icon: '👦',
    lyric: `"아버지, 아버지, 들리잖아요. 저 마왕이 내게 속삭여요."\n(독일 원어: "Mein Vater, mein Vater, und hörest du nicht, was Erlenkönig mir leise verspricht?")`,
    audioTitle: '아들 구간 영상',
    start: 108,
    end: 121
  },
  {
    name: '마왕',
    icon: '👁️',
    lyric: `"예쁜 아가, 나와 가자. 참 재미나는 놀이하며 아름다운 꽃동산에서 비단 옷도 많이 입혀주마."\n(독일 원어: "Du liebdes Kind, komm, geh' mit mir! Gar schöne Spiele spiel' ich mit dir; Mach' bunte Blumen sind an dem Strand,  meine Mutter hat manch' gülden Gewand.")`,
    audioTitle: '마왕 구간 영상',
    start: 86,
    end: 109
  }
];
const VOICE_CHAR_NAMES = ['해설자', '아버지', '아들', '마왕'];

const VOICE_SCALE_TIMBRE_CATEGORIES = [
  {
    key: '음계',
    tone: 'scale',
    cols: 2,
    tip: '음악의 기분이에요. 단조는 어둡고 진지한 느낌, 장조는 밝고 신나는 느낌이 나요.',
    options: [
      { value: '단조', icon: '🌙', hint: '어둡고 진지' },
      { value: '장조', icon: '☀️', hint: '밝고 경쾌' }
    ]
  },
  {
    key: '음색',
    tone: 'timbre',
    cols: 2,
    tip: '목소리의 색깔 같은 거예요. 두꺼우면 묵직하고, 얇으면 가볍고 여리게 들려요.',
    options: [
      { value: '두꺼움', icon: '▬', hint: '묵직하고 풍부' },
      { value: '얇음', icon: '│', hint: '가볍고 여린' }
    ]
  }
];

function MelodyShapeIcon({ type }) {
  const common = {
    viewBox: '0 0 64 40',
    className: 'vd-melody-svg',
    role: 'img',
    'aria-hidden': true
  };
  switch (type) {
    case 'narrate':
      // 잔잔히 이어지는 이야기 선
      return (
        <svg {...common}>
          <path d="M6 28 C16 28, 18 14, 28 14 S40 28, 50 22 S58 18, 60 18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <circle cx="14" cy="26" r="2.5" fill="currentColor" />
          <circle cx="28" cy="14" r="2.5" fill="currentColor" />
          <circle cx="50" cy="22" r="2.5" fill="currentColor" />
        </svg>
      );
    case 'stuck':
      // 같은 높이에서 반복
      return (
        <svg {...common}>
          <path d="M8 20 H56" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2 4" opacity=".45" />
          <circle cx="14" cy="20" r="3.2" fill="currentColor" />
          <circle cx="28" cy="20" r="3.2" fill="currentColor" />
          <circle cx="42" cy="20" r="3.2" fill="currentColor" />
          <circle cx="56" cy="20" r="3.2" fill="currentColor" />
        </svg>
      );
    case 'ornate':
      // 화려하게 꾸며진 곡선
      return (
        <svg {...common}>
          <path d="M6 30 C14 30, 16 8, 26 10 S34 34, 42 18 S52 6, 60 12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 8 l2.5 5 5.5.4-4.2 3.6 1.4 5.4-4.7-2.8-4.7 2.8 1.4-5.4-4.2-3.6 5.5-.4z" fill="currentColor" opacity=".9" />
          <path d="M48 6 l1.8 3.6 4 .3-3 2.6 1 3.8-3.4-2-3.4 2 1-3.8-3-2.6 4-.3z" fill="currentColor" opacity=".75" />
        </svg>
      );
    case 'softLow':
      // 낮고 부드러운 곡선
      return (
        <svg {...common}>
          <path d="M6 16 C18 16, 22 30, 34 30 S48 24, 60 26" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="2.4" fill="currentColor" />
          <circle cx="34" cy="30" r="2.8" fill="currentColor" />
          <circle cx="56" cy="26" r="2.4" fill="currentColor" />
        </svg>
      );
    case 'sharpHigh':
      // 높게 치솟는 날카로운 선
      return (
        <svg {...common}>
          <path d="M6 30 L22 28 L32 6 L42 28 L58 26" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="32" cy="6" r="3" fill="currentColor" />
        </svg>
      );
    case 'bounce':
      // 가볍게 뛰어오르는 음형
      return (
        <svg {...common}>
          <path d="M8 30 Q16 30 18 18 Q20 8 28 18 Q34 28 40 14 Q46 4 52 16 Q56 24 60 22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <circle cx="18" cy="18" r="2.4" fill="currentColor" />
          <circle cx="40" cy="14" r="2.4" fill="currentColor" />
          <circle cx="52" cy="16" r="2.4" fill="currentColor" />
        </svg>
      );
    case 'heavyLow':
      // 낮고 묵직한 덩어리
      return (
        <svg {...common}>
          <rect x="8" y="24" width="48" height="8" rx="3" fill="currentColor" opacity=".35" />
          <path d="M10 22 H54" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <circle cx="18" cy="22" r="3.4" fill="currentColor" />
          <circle cx="32" cy="22" r="3.4" fill="currentColor" />
          <circle cx="46" cy="22" r="3.4" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M10 28 C22 28 24 12 36 12 S50 28 58 22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
  }
}

function VoiceDesignOptionIcon({ option }) {
  if (option.melodyIcon) {
    return (
      <span className="vd-melody-icon" aria-hidden="true">
        <MelodyShapeIcon type={option.melodyIcon} />
      </span>
    );
  }
  return (
    <span className="vd-opt-icon" aria-hidden="true">
      {option.icon || '♪'}
    </span>
  );
}

const answerKey = MAWANG_VOICE_ANSWER_KEY;

/** 정답 확인 패널 하단 모범 해설 */
const voiceCompareCommentary = {
  해설자:
    '해설자는 밤길 상황을 듣는 이에게 담담히 전달하는 역할이에요. 장면을 전하는 선율과 단조의 어두운 음계, 두꺼운 음색이 이야기의 무게를 실어 줍니다.',
  아버지:
    '아버지는 아들을 달래며 현실을 지키려는 목소리예요. 낮고 부드러운 선율과 두꺼운 음색이 어른의 단단함을, 장조의 밝고 안정된 느낌이 안심을 함께 드러냅니다.',
  아들:
    '아들은 두려움과 호소가 섞인 목소리로 들려요. 한자리에 머무는 답답한 선율과 얇은 음색, 단조가 불안과 비극적 분위기를 표현합니다.',
  마왕:
    '마왕은 달콤한 유혹을 속삭이는 인물이에요. 달콤하고 화려한 선율과 장조의 밝음, 얇은 음색이 부드럽고 가벼운 유혹처럼 들리게 설계된 모범안입니다.'
};
function VoiceDesign({ go }) {
  const selectedSong = useAppStore((s) => s.selectedSong);
  const isErlkonig = selectedSong !== 'handel' && selectedSong !== 'hallelujah';
  const selectedCharacter = useAppStore((s) => s.selectedCharacter);
  const setSelectedCharacter = useAppStore((s) => s.setSelectedCharacter);
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const voiceDesignState = useAppStore((s) => s.voiceDesignState);
  const setVoiceDesignState = useAppStore((s) => s.setVoiceDesignState);
  const [selectedChars, setSelectedChars] = useState(() => voiceDesignState?.selectedChars || ['해설자', '아버지']);
  const [voiceDesign, setVoiceDesign] = useState(() =>
    normalizeMawangVoiceDesign(voiceDesignState?.voiceDesign || createEmptyMawangVoiceDesign())
  );
  const [showCompare, setShowCompare] = useState(false);
  const [segmentReplaySignal, setSegmentReplaySignal] = useState(0);
  /** { feedbackCompleted, responseAtFeedback, wasCorrectWhenFeedbackRequested } | null */
  const [voiceAiGate, setVoiceAiGate] = useState(null);

  const active = chars.find((c) => c.name === selectedCharacter) || chars[0];
  const videoId = '8noeFpdfWcQ';
  const melodyOptions = useMemo(
    () => getMawangMelodyOptions(selectedCharacter),
    [selectedCharacter]
  );
  const designCategories = useMemo(
    () => [
      {
        key: '선율',
        tone: 'pitch',
        cols: 3,
        tip: '선율은 “노래처럼 이어지는 음의 흐름”이에요. 음이 위로 올라갔다 내려오기도 하고, 같은 자리에서 맴돌기도 해요. 여기에서는 그 흐름이 담담한지·부드러운지·답답한지·화려한지처럼 어떤 느낌으로 들리는지 골라 보세요.',
        options: melodyOptions.map((opt) => ({
          value: opt.value,
          melodyIcon: opt.icon,
          hint: opt.hint
        }))
      },
      ...VOICE_SCALE_TIMBRE_CATEGORIES
    ],
    [melodyOptions]
  );

  const toggleChar = (name) => {
    setSelectedChars((prev) => {
      if (prev.includes(name)) {
        if (prev.length === 1) return prev;
        const next = prev.filter((v) => v !== name);
        if (selectedCharacter === name) setSelectedCharacter(next[0]);
        return next;
      }
      if (prev.length < 2) return [...prev, name];
      return [prev[1], name];
    });
    setSelectedCharacter(name);
  };

  const selectDesign = (category, value) => {
    setVoiceDesign((prev) => ({
      ...prev,
      [selectedCharacter]: { ...prev[selectedCharacter], [category]: value }
    }));
  };

  const isSel = (category, value) => voiceDesign[selectedCharacter]?.[category] === value;
  const isCharacterFilled = (name) => isVoiceDesignRowFilled(voiceDesign[name]);
  /** 상단 ‘2명 선택’과 무관하게, 네 인물 중 아무 두 명이든 네 항목을 모두 채우면 다음 단계 가능 */
  const canCheckAnswer = useMemo(() => {
    const n = VOICE_CHAR_NAMES.filter((name) => isCharacterFilled(name)).length;
    return n >= 2;
  }, [voiceDesign]);

  /** 현재 편집 중인 인물만 네 항목이 모두 채워졌을 때 정답 확인 UI 표시 */
  const canShowAnswerCheck = useMemo(
    () => isCharacterFilled(selectedCharacter),
    [selectedCharacter, voiceDesign]
  );

  const getVoiceFeedback = useCallback(
    () => getVoiceDesignFixedFeedback([selectedCharacter], voiceDesign, answerKey),
    [selectedCharacter, voiceDesign]
  );
  const designKeys = VOICE_DESIGN_FIELD_KEYS;
  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        selectedCharacter,
        row: voiceDesign[selectedCharacter]
      }),
    [selectedCharacter, voiceDesign]
  );
  const canOpenAnswerCheck =
    canShowAnswerCheck &&
    voiceAiGate?.feedbackCompleted &&
    canOpenAnswerAfterFormativeAiGate({
      feedbackCompleted: voiceAiGate.feedbackCompleted,
      wasCorrectWhenFeedbackRequested: voiceAiGate.wasCorrectWhenFeedbackRequested,
      responseAtFeedback: voiceAiGate.responseAtFeedback,
      currentResponse: currentSnapshot
    });
  const onFeedbackRequested = useCallback(() => {
    const wasCorrect = designKeys.every(
      (key) => voiceDesign[selectedCharacter]?.[key] === answerKey[selectedCharacter]?.[key]
    );
    setVoiceAiGate({
      feedbackCompleted: false,
      responseAtFeedback: currentSnapshot,
      wasCorrectWhenFeedbackRequested: wasCorrect
    });
    setShowCompare(false);
  }, [currentSnapshot, selectedCharacter, voiceDesign]);

  useEffect(() => {
    if (canCheckAnswer) setStageCompletion('voice', true);
  }, [canCheckAnswer, setStageCompletion]);

  useEffect(() => {
    if (!canShowAnswerCheck) setShowCompare(false);
  }, [canShowAnswerCheck]);

  useEffect(() => {
    setVoiceAiGate(null);
  }, [selectedCharacter]);

  useEffect(() => {
    setVoiceDesignState({ selectedChars, voiceDesign });
  }, [selectedChars, voiceDesign, setVoiceDesignState]);

  return (
    <div className="screen active"><div className="stage-header"><div className="s-eyebrow">STAGE 2 · 분석적 감상</div><div className="s-title">분석적 감상</div><div className="s-desc">목표: 음악 요소, 음악적 특징 및 구성을 분석하고 비교하여 음악이 어떻게 표현되고 구성되는지 파악해 보세요.</div></div>
      <div className="body voice-body">
        <div className="sec">{isErlkonig ? '등장인물 선택 · 설계할 인물로 전환' : '성부 선택 · 설계할 대상 전환'}</div>
        <div className="char-tabs">
          {chars.map((c) => (
            <button
              key={c.name}
              type="button"
              className={`char-tab ${selectedCharacter === c.name ? 'active' : ''} ${selectedChars.includes(c.name) ? 'picked' : ''}`}
              onClick={() => toggleChar(c.name)}
            >
              <span>{c.icon}</span> {c.name}
            </button>
          ))}
        </div>
        <div className="small-note">
          편집 중: {selectedCharacter} · 강조된 두 명: {selectedChars.join(', ')} · 네 인물 중{' '}
          {VOICE_CHAR_NAMES.filter((n) => isCharacterFilled(n)).length}
          명 완료 (2명 이상이면 다음 단계 가능)
        </div>

        <div className="char-card voice-char-card">
          <div className="char-emoji">{active.icon}</div>
          <div>
            <div className="char-name">{active.name}</div>
            <div className="char-lyric">{active.lyric}</div>
          </div>
        </div>

        <div className="audio-bar voice-audio-bar" style={{ display: 'block' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
            <div className="aud-title-sm">{active.audioTitle}</div>
            <button className="btn-s" type="button" onClick={() => setSegmentReplaySignal((k) => k + 1)}>다시 듣기</button>
          </div>
          <SegmentYoutubePlayer
            videoId={videoId}
            start={active.start}
            end={active.end}
            title={`${active.name} 구간 영상`}
            replaySignal={segmentReplaySignal}
          />
        </div>

        <div className="voice-design-panel">
          <div className="voice-design-panel-head">
            <span className="voice-design-panel-icon" aria-hidden="true">🎙️</span>
            <div>
              <div className="voice-design-panel-title">음색 설계</div>
              <div className="voice-design-panel-desc">듣고 느낀 대로 세 가지를 골라 {active.name}의 목소리를 설계해 보세요.</div>
            </div>
          </div>

          {designCategories.map((category) => (
            <div key={category.key} className="vd-item">
              <div className="vd-label">
                {category.key}
                <span className="tip-wrap">
                  <span className="q-mini">?</span>
                  <span className="tip-bubble">{category.tip}</span>
                </span>
              </div>
              <div className={`vd-opts vd-opts--${category.cols}`}>
                {category.options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`vd-opt vd-opt--${category.tone} ${category.key === '선율' ? 'vd-opt--melody' : ''} ${isSel(category.key, option.value) ? 'sel' : ''}`}
                    onClick={() => selectDesign(category.key, option.value)}
                  >
                    <VoiceDesignOptionIcon option={option} />
                    <span className="vd-opt-label">{option.value}</span>
                    <span className="vd-opt-hint">{option.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {canShowAnswerCheck ? (
          <>
            <FormativeFeedbackBlock
              key={`voice-fb-${currentSnapshot}`}
              getFeedback={getVoiceFeedback}
              onRequested={onFeedbackRequested}
              onResult={() => {
                setVoiceAiGate((g) => (g ? { ...g, feedbackCompleted: true } : g));
              }}
            />
            <button
              type="button"
              className="answer-check-toggle"
              onClick={() => setShowCompare((v) => !v)}
              aria-expanded={showCompare}
              disabled={!canOpenAnswerCheck}
              style={!canOpenAnswerCheck ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              <span className="answer-check-toggle-label">{canOpenAnswerCheck ? `정답 확인하기 · ${selectedCharacter}` : '피드백 반영 후 정답 확인하기'}</span>
              <span className="answer-check-toggle-chevron" aria-hidden="true">
                {showCompare ? '▲' : '▼'}
              </span>
            </button>
            {voiceAiGate?.feedbackCompleted &&
            voiceAiGate.wasCorrectWhenFeedbackRequested &&
            currentSnapshot === voiceAiGate.responseAtFeedback ? (
              <div className="small-note" style={{ marginTop: 8 }}>
                좋아요! 현재 입력이 이미 정답과 일치해서 바로 확인할 수 있어요.
              </div>
            ) : null}

            <div className={`answer-compare-slide ${showCompare ? 'open' : ''}`}>
              <div className="answer-compare-inner voice-compare-panel">
                <div className="voice-compare-head">
                  <span className="voice-compare-badge">{active.icon}</span>
                  <span className="voice-compare-title">{selectedCharacter} 음색 설계 비교</span>
                </div>
                <table className="cmp-table cmp-table-voice">
                  <thead>
                    <tr>
                      <th className="col-element">요소</th>
                      <th>나의 설계</th>
                      <th>정답</th>
                      <th className="col-mark" aria-label="일치 여부" />
                    </tr>
                  </thead>
                  <tbody>
                    {designKeys.map((key) => {
                      const mine = voiceDesign[selectedCharacter]?.[key] || '';
                      const correct = answerKey[selectedCharacter]?.[key] ?? '—';
                      const match = mine && mine === correct;
                      return (
                        <tr key={key}>
                          <td className="row-label col-element">{key}</td>
                          <td>{mine || '—'}</td>
                          <td className="voice-correct-cell">{correct}</td>
                          <td className="col-mark">
                            <span className={`voice-compare-mark ${match ? 'ok' : 'bad'}`} aria-label={match ? '일치' : '불일치 또는 미선택'}>
                              {match ? '✓' : '✗'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="vd-answer-comment">{voiceCompareCommentary[selectedCharacter] ?? ''}</div>
            <div className="fb show info">💬 위 정답은 {isErlkonig ? '시와 음악 해설' : '곡의 성부/화성 해설'}에 맞춘 모범안이에요. 나의 설계와 비교해 들어보며 감각을 맞춰 보세요.</div>
              </div>
            </div>
          </>
        ) : null}

        {canCheckAnswer ? (
          <ArtSongTakeaway
            eyebrow={isErlkonig ? '예술가곡의 첫 번째 특징' : '할렐루야 감상의 핵심'}
            title={isErlkonig ? '시와 음악이 하나가 된다' : '성부의 겹침이 감정을 키운다'}
            description={isErlkonig ? '괴테의 시 속 각 인물의 성격과 감정이 선율·음색·음계로 그대로 표현됩니다. 시의 내용을 음악이 직접 표현하는 것이 예술가곡의 핵심이에요.' : '할렐루야는 성부가 겹칠수록 울림이 커지고, 같은 후렴도 다르게 들려요. 성부별 음색과 움직임을 비교해 들으면 곡의 감정 구조가 선명해집니다.'}
          />
        ) : null}

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('analyticalOverview')}>← 이전</button>
          <button className="btn-p" disabled={!canCheckAnswer} style={!canCheckAnswer ? { opacity: 0.5, cursor: 'not-allowed' } : undefined} onClick={() => go('pianoAnalysis')}>다음 단계 →</button>
        </div>
      </div>
    </div>
  );
}

export default VoiceDesign;
