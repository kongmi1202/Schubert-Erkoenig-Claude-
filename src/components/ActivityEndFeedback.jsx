import CompareAiFeedbackBlock from './CompareAiFeedbackBlock';

/** 활동 맨 끝 피드백 — 버튼은 항상 활성화 */
export default function ActivityEndFeedback({ className = '', style, ...blockProps }) {
  return (
    <div className={`activity-end-feedback ${className}`.trim()} style={style}>
      <CompareAiFeedbackBlock {...blockProps} />
    </div>
  );
}
