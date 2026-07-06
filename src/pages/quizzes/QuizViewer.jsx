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

  if (quizState.loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading quiz...</p>
      </div>
    </div>
  );
  if (quizState.error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-red-600 font-medium">{quizState.error}</p>
      </div>
    </div>
  );

  // For students, wait for attempt check to complete before allowing quiz render
  if (user?.role === 'student' && !quizState.attemptCheckComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // If student has already attempted, show results immediately
  if (hasAttemptedRef.current || quizState.hasAttempted) {
    if (!quizState.result) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading results...</p>
          </div>
        </div>
      );
    }
    const quizToShow = quizState.quiz || quizDataRef.current;
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
              <p className="text-indigo-800 text-sm font-medium">You have already attempted this quiz. Only one attempt is allowed.</p>
            </div>
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-5xl">
              {quizState.result.passed ? (
                <div className="bg-green-100 text-green-600 rounded-full">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="bg-red-100 text-red-600 rounded-full">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {quizState.result.passed ? 'You Passed!' : 'Not Quite'}
            </h1>
            <p className="text-gray-500 mb-8">
              You scored {quizState.result.score}% — passing score is {quizState.result.passing_score}%
            </p>

            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <p className="text-3xl font-bold text-green-600">{quizState.result.correct}</p>
                </div>
                <p className="text-gray-500 text-sm font-medium">Correct</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <p className="text-3xl font-bold text-red-600">
                    {quizState.result.total - quizState.result.correct}
                  </p>
                </div>
                <p className="text-gray-500 text-sm font-medium">Incorrect</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <p className="text-3xl font-bold text-blue-600">{quizState.result.score}%</p>
                </div>
                <p className="text-gray-500 text-sm font-medium">Score</p>
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
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Lesson
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safety check: if hasAttempted is true, never show quiz questions
  if (quizState.hasAttempted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Only show quiz questions if showQuiz flag is true
  if (!quizState.showQuiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quizState.quiz) return null;

  // Show quiz questions
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{quizState.quiz.title}</h1>
              <p className="text-gray-500 text-sm">
                {quizState.quiz.questions.length} questions · Passing score: {quizState.quiz.passing_score}%
              </p>
            </div>
            <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
              Question {Object.keys(selectedAnswers).length + 1} of {quizState.quiz.questions.length}
            </div>
          </div>

          {quizState.quiz.questions.map((question, index) => (
            <div key={question.id} className="mb-8 pb-8 border-b border-gray-200 last:border-0">
              <p className="font-semibold text-gray-900 mb-4">
                <span className="text-indigo-600 mr-2">{index + 1}.</span>
                {question.question_text}
                <span className="ml-2 text-xs text-gray-400 capitalize bg-gray-100 px-2 py-1 rounded">{question.type === 'true_false' ? 'True/False' : 'Multiple Choice'}</span>
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex justify-center">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Lesson
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 text-sm font-semibold">{Object.keys(selectedAnswers).length}</span>
              </div>
              <span className="text-sm text-gray-500">of {quizState.quiz.questions.length} answered</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}