import { useAppStore } from '../../store/useAppStore';

function StudentInfo({ go }) {
  const student = useAppStore((s) => s.student);
  const setStudentField = useAppStore((s) => s.setStudentField);

  return (
    <div className="screen active">
      <div className="stage-header"><div className="s-eyebrow">시작하기</div><div className="s-title">학번과 이름을 입력해주세요</div><div className="s-desc">입력한 정보는 감상문 제출에 사용됩니다.</div></div>
      <div className="body">
        <div className="field"><label>학번</label><input value={student.id} onChange={(e) => setStudentField('id', e.target.value)} placeholder="예) 10130" /></div>
        <div className="field"><label>이름</label><input value={student.name} onChange={(e) => setStudentField('name', e.target.value)} placeholder="홍길동" /></div>
        <div className="btn-row"><button className="btn-p" onClick={() => go('songSelect')}>다음 →</button></div>
      </div>
    </div>
  );
}

export default StudentInfo;
