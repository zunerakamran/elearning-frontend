import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function QuizViewer() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quizState, setQuizState] = useState({
    quiz: null,
    result: null,
    hasAttempted: false,
    loading: true,
    error: null,
    attemptCheckComplete: false,
    showQuiz: false
  });
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const quizDataRef = useRef(null);
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // For students, check attempt status FIRST before fetching quiz
        if (user?.role === 'student') {
          const quizRes = await api.get(`/lessons/${lessonId}/quiz`);
          const data = quizRes.data;
          quizDataRef.current = data;

          try {
            const attemptRes = await api.get(`/quizzes/${data.id}/my-attempt`);
            if (attemptRes.data) {
              // Update ref synchronously to prevent intermediate renders
              hasAttemptedRef.current = true;
              // Set all data atomically including quiz
              setQuizState({
                quiz: data,
                result: attemptRes.data,
                hasAttempted: true,
                loading: false,
                error: null,
                attemptCheckComplete: true,
                showQuiz: false
              });
              return;
            }
          } catch (attemptErr) {
            // 404 means no attempt exists, which is normal
            if (attemptErr.response?.status !== 404) {
              console.error('Error fetching quiz attempt:', attemptErr);
            }
          }

          // Only set quiz after confirming no attempt exists
          setQuizState({
            quiz: data,
            result: null,
            hasAttempted: false,
            loading: false,
            error: null,
            attemptCheckComplete: true,
            showQuiz: true
          });
        } else {
          // For instructors, just fetch quiz
          const quizRes = await api.get(`/lessons/${lessonId}/quiz`);
          setQuizState({
            quiz: quizRes.data,
            result: null,
            hasAttempted: false,
            loading: false,
            error: null,
            attemptCheckComplete: true,
            showQuiz: true
          });
        }
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setQuizState({
          quiz: null,
          result: null,
          hasAttempted: false,
          loading: false,
          error: 'Quiz not found.',
          attemptCheckComplete: true,
          showQuiz: false
        });
      }
    };

    fetchData();
  }, [lessonId, user]);

  function selectAnswer(questionId, answerId) {
    setSelectedAnswers({ ...selectedAnswers, [questionId]: answerId });
  }

  function selectTrueFalseAnswer(questionId, value) {
    setSelectedAnswers({ ...selectedAnswers, [questionId]: value });
  }

  async function handleSubmit() {
    if (Object.keys(selectedAnswers).length < quizState.quiz.questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const answers = Object.entries(selectedAnswers).map(([questionId, value]) => {
        const question = quizState.quiz.questions.find((q) => q.id === parseInt(questionId));
        if (question.type === 'true_false') {
          return {
            question_id: parseInt(questionId),
            true_false_answer: value,
          };
        } else {
          return {
            question_id: parseInt(questionId),
            answer_id: parseInt(value),
          };
        }
      });

      const res = await api.post(`/quizzes/${quizState.quiz.id}/submit`, { answers });
      setQuizState(prev => ({ ...prev, result: res.data }));

      // Auto-mark lesson as complete if student passed
      if (res.data.passed && user?.role === 'student') {
        try {
          await api.post(`/lessons/${lessonId}/complete`);
        } catch (err) {
          console.error('Failed to mark lesson as complete:', err);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (quizState.loading) return <div className="p-8 text-center">Loading quiz...</div>;
  if (quizState.error) return <div className="p-8 text-center text-red-600">{quizState.error}</div>;

  // For students, wait for attempt check to complete before allowing quiz render
  if (user?.role === 'student' && !quizState.attemptCheckComplete) {
    return <div className="p-8 text-center">Loading quiz...</div>;
  }

  // If student has already attempted, show results immediately
  if (hasAttemptedRef.current || quizState.hasAttempted) {
    if (!quizState.result) {
      return <div className="p-8 text-center">Loading results...</div>;
    }
    const quizToShow = quizState.quiz || quizDataRef.current;
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-blue-800 text-sm">You have already attempted this quiz. Only one attempt is allowed.</p>
          </div>
          <div className="text-6xl mb-4">{quizState.result.passed ? '🎉' : '😔'}</div>
          <h1 className="text-3xl font-bold mb-2">
            {quizState.result.passed ? 'You Passed!' : 'Not Quite'}
          </h1>
          <p className="text-gray-500 mb-6">
            You scored {quizState.result.score}% — passing score is {quizState.result.passing_score}%
          </p>

          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">{quizState.result.correct}</p>
              <p className="text-gray-400 text-sm">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-red-500">
                {quizState.result.total - quizState.result.correct}
              </p>
              <p className="text-gray-400 text-sm">Incorrect</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">{quizState.result.score}%</p>
              <p className="text-gray-400 text-sm">Score</p>
            </div>
          </div>

          {/* Per-question breakdown */}
          <div className="text-left mb-8">
            <h2 className="font-semibold mb-3">Question Breakdown</h2>
            {quizToShow.questions.map((question, index) => {
              const detail = quizState.result.details.find(
                (d) => d.question_id === question.id
              );
              return (
                <div
                  key={question.id}
                  className={`p-4 rounded mb-3 ${
                    detail?.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <p className="font-medium mb-3">
                    {index + 1}. {question.question_text}
                    <span className="ml-2">
                      {detail?.is_correct ? '✓' : '✗'}
                    </span>
                  </p>
                  
                  {question.type === 'true_false' ? (
                    <div className="space-y-2 ml-4">
                      {['true', 'false'].map((value) => {
                        const isStudentAnswer = detail?.true_false_answer === value;
                        const isCorrect = question.correct_answer === value;
                        return (
                          <div
                            key={value}
                            className={`p-2 rounded border-2 ${
                              isStudentAnswer && isCorrect
                                ? 'bg-green-500 border-green-600 text-white'
                                : isStudentAnswer
                                ? 'bg-red-500 border-red-600 text-white'
                                : isCorrect
                                ? 'bg-green-400 border-green-500 text-white'
                                : 'bg-transparent border-gray-300'
                            }`}
                          >
                            <span className="text-sm">
                              {value === 'true' ? 'True' : 'False'}
                              {isStudentAnswer && ' (Your answer)'}
                              {isCorrect && !isStudentAnswer && ' (Correct)'}
                              {isStudentAnswer && isCorrect && ' ✓'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2 ml-4">
                      {question.answers.map((answer) => {
                        const isStudentAnswer = detail?.answer_id === answer.id;
                        const isCorrect = answer.is_correct;
                        console.log('Answer:', answer.answer_text, 'isStudentAnswer:', isStudentAnswer, 'isCorrect:', isCorrect, 'detail:', detail);
                        return (
                          <div
                            key={answer.id}
                            className={`p-2 rounded border-2 ${
                              isStudentAnswer && isCorrect
                                ? 'bg-green-500 border-green-600 text-white'
                                : isStudentAnswer
                                ? 'bg-red-500 border-red-600 text-white'
                                : isCorrect
                                ? 'bg-green-400 border-green-500 text-white'
                                : 'bg-transparent border-gray-300'
                            }`}
                            style={{
                              backgroundColor: isStudentAnswer && isCorrect ? '#22c55e' : isStudentAnswer ? '#ef4444' : isCorrect ? '#4ade80' : 'transparent',
                              borderColor: isStudentAnswer && isCorrect ? '#16a34a' : isStudentAnswer ? '#dc2626' : isCorrect ? '#22c55e' : '#d1d5db',
                              color: (isStudentAnswer || isCorrect) ? 'white' : 'black'
                            }}
                          >
                            <span className="text-sm">
                              {answer.answer_text}
                              {isStudentAnswer && ' (Your answer)'}
                              {isCorrect && !isStudentAnswer && ' (Correct)'}
                              {isStudentAnswer && isCorrect && ' ✓'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
            >
              Back to Lesson
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show results screen (if student has already attempted or just submitted)
  // This check must come before quiz questions to prevent intermediate render
  if (quizState.result) {
    const quizToShow = quizState.quiz || quizDataRef.current;
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          {quizState.hasAttempted && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-blue-800 text-sm">You have already attempted this quiz. Only one attempt is allowed.</p>
            </div>
          )}
          <div className="text-6xl mb-4">{quizState.result.passed ? '🎉' : '😔'}</div>
          <h1 className="text-3xl font-bold mb-2">
            {quizState.result.passed ? 'You Passed!' : 'Not Quite'}
          </h1>
          <p className="text-gray-500 mb-6">
            You scored {quizState.result.score}% — passing score is {quizState.result.passing_score}%
          </p>

          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">{quizState.result.correct}</p>
              <p className="text-gray-400 text-sm">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-red-500">
                {quizState.result.total - quizState.result.correct}
              </p>
              <p className="text-gray-400 text-sm">Incorrect</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">{quizState.result.score}%</p>
              <p className="text-gray-400 text-sm">Score</p>
            </div>
          </div>

          {/* Per-question breakdown */}
          <div className="text-left mb-8">
            <h2 className="font-semibold mb-3">Question Breakdown</h2>
            {quizToShow.questions.map((question, index) => {
              const detail = quizState.result.details.find(
                (d) => d.question_id === question.id
              );
              return (
                <div
                  key={question.id}
                  className={`p-4 rounded mb-3 ${
                    detail?.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <p className="font-medium mb-3">
                    {index + 1}. {question.question_text}
                    <span className="ml-2">
                      {detail?.is_correct ? '✓' : '✗'}
                    </span>
                  </p>
                  
                  {question.type === 'true_false' ? (
                    <div className="space-y-2 ml-4">
                      {['true', 'false'].map((value) => {
                        const isStudentAnswer = detail?.true_false_answer === value;
                        const isCorrect = question.correct_answer === value;
                        return (
                          <div
                            key={value}
                            className={`p-2 rounded border-2 ${
                              isStudentAnswer && isCorrect
                                ? 'bg-green-500 border-green-600 text-white'
                                : isStudentAnswer
                                ? 'bg-red-500 border-red-600 text-white'
                                : isCorrect
                                ? 'bg-green-400 border-green-500 text-white'
                                : 'bg-transparent border-gray-300'
                            }`}
                          >
                            <span className="text-sm">
                              {value === 'true' ? 'True' : 'False'}
                              {isStudentAnswer && ' (Your answer)'}
                              {isCorrect && !isStudentAnswer && ' (Correct)'}
                              {isStudentAnswer && isCorrect && ' ✓'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2 ml-4">
                      {question.answers.map((answer) => {
                        const isStudentAnswer = detail?.answer_id === answer.id;
                        const isCorrect = answer.is_correct;
                        console.log('Answer:', answer.answer_text, 'isStudentAnswer:', isStudentAnswer, 'isCorrect:', isCorrect, 'detail:', detail);
                        return (
                          <div
                            key={answer.id}
                            className={`p-2 rounded border-2 ${
                              isStudentAnswer && isCorrect
                                ? 'bg-green-500 border-green-600 text-white'
                                : isStudentAnswer
                                ? 'bg-red-500 border-red-600 text-white'
                                : isCorrect
                                ? 'bg-green-400 border-green-500 text-white'
                                : 'bg-transparent border-gray-300'
                            }`}
                            style={{
                              backgroundColor: isStudentAnswer && isCorrect ? '#22c55e' : isStudentAnswer ? '#ef4444' : isCorrect ? '#4ade80' : 'transparent',
                              borderColor: isStudentAnswer && isCorrect ? '#16a34a' : isStudentAnswer ? '#dc2626' : isCorrect ? '#22c55e' : '#d1d5db',
                              color: (isStudentAnswer || isCorrect) ? 'white' : 'black'
                            }}
                          >
                            <span className="text-sm">
                              {answer.answer_text}
                              {isStudentAnswer && ' (Your answer)'}
                              {isCorrect && !isStudentAnswer && ' (Correct)'}
                              {isStudentAnswer && isCorrect && ' ✓'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
            >
              Back to Lesson
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safety check: if hasAttempted is true, never show quiz questions
  if (quizState.hasAttempted) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // Only show quiz questions if showQuiz flag is true
  if (!quizState.showQuiz) {
    return <div className="p-8 text-center">Loading quiz...</div>;
  }

  if (!quizState.quiz) return null;

  // Show quiz questions
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 mb-4">
          <h1 className="text-2xl font-bold mb-1">{quizState.quiz.title}</h1>
          <p className="text-gray-400 text-sm mb-6">
            {quizState.quiz.questions.length} questions · Passing score: {quizState.quiz.passing_score}%
          </p>

          {quizState.quiz.questions.map((question, index) => (
            <div key={question.id} className="mb-8">
              <p className="font-medium mb-3">
                {index + 1}. {question.question_text}
                <span className="ml-2 text-xs text-gray-400 capitalize">({question.type === 'true_false' ? 'True/False' : 'Multiple Choice'})</span>
              </p>

              {question.type === 'true_false' ? (
                <div className="space-y-2">
                  {['true', 'false'].map((value) => (
                    <div
                      key={value}
                      className={`flex items-center gap-3 p-3 rounded border ${
                        user?.role === 'instructor' && question.correct_answer === value
                          ? 'border-green-500 bg-green-50'
                          : user?.role === 'instructor'
                          ? 'border-gray-200'
                          : selectedAnswers[question.id] === value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      {user?.role === 'instructor' ? (
                        <span className={`w-4 h-4 flex items-center justify-center ${
                          question.correct_answer === value ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {question.correct_answer === value ? '✓' : '○'}
                        </span>
                      ) : (
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={selectedAnswers[question.id] === value}
                          onChange={() => selectTrueFalseAnswer(question.id, value)}
                          className="w-4 h-4"
                        />
                      )}
                      <span className={user?.role === 'instructor' && question.correct_answer === value ? 'font-medium' : ''}>
                        {value === 'true' ? 'True' : 'False'}
                        {user?.role === 'instructor' && question.correct_answer === value && (
                          <span className="ml-2 text-xs text-green-600 font-medium">(Correct)</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {question.answers.map((answer) => (
                    <div
                      key={answer.id}
                      className={`flex items-center gap-3 p-3 rounded border ${
                        user?.role === 'instructor' && answer.is_correct
                          ? 'border-green-500 bg-green-50'
                          : user?.role === 'instructor'
                          ? 'border-gray-200'
                          : selectedAnswers[question.id] === answer.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      {user?.role === 'instructor' ? (
                        <span className={`w-4 h-4 flex items-center justify-center ${
                          answer.is_correct ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {answer.is_correct ? '✓' : '○'}
                        </span>
                      ) : (
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={selectedAnswers[question.id] === answer.id}
                          onChange={() => selectAnswer(question.id, answer.id)}
                          className="w-4 h-4"
                        />
                      )}
                      <span className={user?.role === 'instructor' && answer.is_correct ? 'font-medium' : ''}>
                        {answer.answer_text}
                        {user?.role === 'instructor' && answer.is_correct && (
                          <span className="ml-2 text-xs text-green-600 font-medium">(Correct)</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {user?.role === 'instructor' ? (
          <div className="bg-white rounded-lg shadow p-4 flex justify-center">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
            >
              Back to Lesson
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {Object.keys(selectedAnswers).length}/{quizState.quiz.questions.length} answered
            </span>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}