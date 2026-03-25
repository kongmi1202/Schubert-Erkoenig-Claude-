import { create } from 'zustand';

export const screenOrder = ['intro','studentInfo','videoPage','sensoryPage','analyticalOverview','voiceDesign','pianoAnalysis','historyCards','aestheticPage','finalCard'];

export const stepNames = {
  sensoryPage: '1단계 감각적 감상',
  analyticalOverview: '2단계 분석적 감상',
  voiceDesign: '음색 설계',
  pianoAnalysis: '피아노 반주',
  historyCards: '역사적 맥락',
  aestheticPage: '3단계 심미적 감상',
  finalCard: '최종 감상문'
};

export const useAppStore = create((set) => ({
  student: { id: '', name: '', className: '' },
  selectedKeywords: [],
  selectedColors: [],
  sensoryDesc: '',
  aiOpen: {},
  answerCheckOpen: false,
  stageCompletion: {
    video: false,
    sensory: false,
    analytical: false,
    voice: false,
    piano: false,
    history: false,
    aesthetic: false
  },
  q1: '',
  q2: '',
  q3: '',
  q2Type: '',
  analyticalCharacters: ['', '', '', ''],
  analyticalStory: '',
  sensoryArtifacts: {
    selectedActivities: [],
    pePhoto: '',
    peAnswer: '',
    scienceSelected: [],
    scienceAnswer: '',
    mapAddress: '',
    mapAnswer: '',
    mathDrawing: '',
    mathAnswer: ''
  },
  selectedCharacter: '해설자',
  flippedCards: [],
  setStudentField: (field, value) => set((s) => ({ student: { ...s.student, [field]: value } })),
  toggleKeyword: (kw) => set((s) => ({
    selectedKeywords: s.selectedKeywords.includes(kw)
      ? s.selectedKeywords.filter((k) => k !== kw)
      : [...s.selectedKeywords, kw]
  })),
  toggleColor: (color) => set((s) => {
    if (s.selectedColors.includes(color)) {
      return { selectedColors: s.selectedColors.filter((c) => c !== color) };
    }
    if (s.selectedColors.length >= 4) return s;
    return { selectedColors: [...s.selectedColors, color] };
  }),
  setSensoryDesc: (value) => set({ sensoryDesc: value }),
  toggleAi: (id) => set((s) => ({ aiOpen: { ...s.aiOpen, [id]: !s.aiOpen[id] } })),
  setQ1: (v) => set({ q1: v }),
  setQ2: (v) => set({ q2: v }),
  setQ3: (v) => set({ q3: v }),
  setQ2Type: (v) => set({ q2Type: v }),
  setStageCompletion: (key, value = true) => set((s) => ({
    stageCompletion: { ...s.stageCompletion, [key]: value }
  })),
  setAnalyticalCharacter: (idx, value) => set((s) => ({
    analyticalCharacters: s.analyticalCharacters.map((item, i) => (i === idx ? value : item))
  })),
  setAnalyticalStory: (value) => set({ analyticalStory: value }),
  setSensoryArtifacts: (partial) => set((s) => ({ sensoryArtifacts: { ...s.sensoryArtifacts, ...partial } })),
  setSelectedCharacter: (v) => set({ selectedCharacter: v }),
  flipHistoryCard: (id) => set((s) => ({
    flippedCards: s.flippedCards.includes(id) ? s.flippedCards : [...s.flippedCards, id]
  })),
  setAnswerCheckOpen: (v) => set({ answerCheckOpen: v })
}));
