document.addEventListener('DOMContentLoaded', () => {
    let sessionKey = '';

    const pathParts = window.location.pathname.split('/');
    if (pathParts.length >= 4 && pathParts[1] === 'evaluation' && pathParts[2] === 'exam') {
      sessionKey = pathParts[3];
    }
  
    if (!sessionKey) {
      showToast('평가 키가 없습니다.');
      return;
    }
  
    console.log('sessionKey 읽음:', sessionKey);

    const studentInput = document.getElementById('student-number');
    const studentNameSpan = document.getElementById('student-name');
    const questionContainer = document.getElementById('question-container');
    const submitButton = document.getElementById('submit-button');
  
    let students = [];
    let answerSheet = [];
    let selectedStudent = null;
    let answers = [];
  
    const storageKey = `answer-cache-${sessionKey}`;
  
    function saveToLocalStorage() {
        const now = Date.now();
        localStorage.setItem(storageKey, JSON.stringify({ selectedStudent, answers, timestamp: now }));
      }
        
      function loadFromLocalStorage() {
        const data = localStorage.getItem(storageKey);
        if (data) {
          const parsed = JSON.parse(data);
          const now = Date.now();
          const elapsedSeconds = (now - parsed.timestamp) / 1000;
      
          if (elapsedSeconds > 7200) { // 2시간 초과
            console.log('로컬 저장된 답안이 만료되어 삭제합니다.');
            localStorage.removeItem(storageKey);
            return;
          }
      
          selectedStudent = parsed.selectedStudent;
          answers = parsed.answers || [];
          studentInput.value = selectedStudent;
          const student = students.find(s => s.number === selectedStudent);
          if (student) {
            studentNameSpan.textContent = student.name;
            submitButton.disabled = false;
          }
          studentInput.value = selectedStudent; // 입력창 값 고정
          studentInput.disabled = true; // 입력창 비활성화
          confirmButton.disabled = true; // 확인 버튼 비활성화
          studentNameSpan.textContent = student.name;
          submitButton.disabled = false; // 제출 버튼 활성화

          // ✨ 답변 복구 성공하면 알림
          showToast('이전 답안이 복구되었습니다.');
        }
      }
              
    async function loadEvaluationData() {
      try {
        const response = await fetch(`/evaluation/student/${sessionKey}`);
        if (!response.ok) throw new Error('평가 정보를 불러오지 못했습니다.');
        const data = await response.json();
        students = data.studentList;
        answerSheet = data.answerSheet;
  
        document.getElementById('exam-title').textContent = data.title;
        renderQuestions();
        loadFromLocalStorage();
      } catch (error) {
        console.error(error);
        showToast('서버 오류 발생: ' + error.message);
      }
    }
  
    function renderQuestions() {
      questionContainer.innerHTML = '';
      answerSheet.forEach((q, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'mb-6 p-4 border rounded bg-gray-100';
  
        const label = document.createElement('label');
        label.className = 'block font-medium mb-2';
        label.textContent = `문제 ${index + 1}`;
        wrapper.appendChild(label);
  
        let inputElement;
  
        if (q.format === 'select' && q.counts) {
          inputElement = document.createElement('select');
          inputElement.className = 'w-full p-2 border rounded';
          for (let i = 1; i <= q.counts; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            inputElement.appendChild(option);
          }
        } else if (q.format === 'input') {
          inputElement = document.createElement('input');
          inputElement.type = 'text';
          inputElement.className = 'w-full p-2 border rounded';
          inputElement.placeholder = '정답 입력';
        } else if (q.format === 'textarea') {
          inputElement = document.createElement('textarea');
          inputElement.className = 'w-full p-2 border rounded';
          inputElement.placeholder = '서술형 정답 입력';
          inputElement.rows = 4;
        }
  
        if (inputElement) {
          inputElement.value = answers[index] || '';
          inputElement.addEventListener('input', (e) => {
            answers[index] = e.target.value;
            saveToLocalStorage();
          });
          wrapper.appendChild(inputElement);
        }
  
        questionContainer.appendChild(wrapper);
      });
    }
  
    studentInput.addEventListener('input', (e) => {
      const num = parseInt(e.target.value, 10);
      const student = students.find(s => s.number === num);
      if (student) {
        selectedStudent = student.number;
        studentNameSpan.textContent = student.name;
        submitButton.disabled = false;
      } else {
        studentNameSpan.textContent = '반번호를 바르게 입력하세요';
        submitButton.disabled = true;
      }
      saveToLocalStorage();
    });

    const confirmButton = document.getElementById('confirm-button');

confirmButton.addEventListener('click', () => {
  const num = parseInt(studentInput.value, 10);
  const student = students.find(s => s.number === num);

  if (student) {
    selectedStudent = student.number;
    studentInput.value = selectedStudent; // 입력창 값 고정
    studentInput.disabled = true; // 입력창 비활성화
    confirmButton.disabled = true; // 확인 버튼 비활성화
    studentNameSpan.textContent = student.name;
    submitButton.disabled = false; // 제출 버튼 활성화
    saveToLocalStorage();
    showToast('학생 확인 완료!');
  } else {
    studentNameSpan.textContent = '반번호를 바르게 입력하세요';
    showToast('존재하지 않는 학생입니다.', 'error');
  }
});
 
    submitButton.addEventListener('click', async () => {
      if (!selectedStudent) {
        showToast('학생을 선택하세요.');
        return;
      }
      try {
        const payload = {
          student: selectedStudent,
          answer: answers
        };
        const response = await fetch(`/evaluation/student/${sessionKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          showToast('답안 제출 완료!');
          localStorage.removeItem(storageKey); // 제출 성공하면 캐시 삭제
        } else {
          const errorData = await response.json();
          showToast('제출 실패: ' + errorData.message);
        }
      } catch (error) {
        showToast('서버 오류: ' + error.message);
      }
    });
  
    loadEvaluationData();
  });
  
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = `
      fixed top-4 left-1/2 transform -translate-x-1/2
      px-4 py-2 rounded shadow-lg z-50
      ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} 
      text-white
    `;
    
    document.body.appendChild(toast);
  
    setTimeout(() => {
      toast.remove();
    }, 3000); // 3초 후 사라짐
  }
  