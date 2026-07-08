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
      setQuizState(prev => ({ ...prev, result: res.data, hasAttempted: true }));

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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading results...</p>
          </div>
        </div>
      );
    }
    const quizToShow = quizState.quiz || quizDataRef.current;
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
            {/* Banner */}
            <div className={`bg-gradient-to-r ${quizState.result.passed ? 'from-green-500 to-emerald-600' : 'from-orange-500 to-red-500'} px-8 py-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    {quizState.result.passed ? (
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-1">
                      {quizState.result.passed ? 'Congratulations! You Passed!' : 'Keep Practicing!'}
                    </h1>
                    <p className="text-white/90 text-sm">
                      You have completed this quiz. Only one attempt is allowed.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-5xl font-bold text-white">{quizState.result.score}%</p>
                  <p className="text-white/90 text-sm">Your Score</p>
                </div>
              </div>
            </div>

            {/* Score Info */}
            <div className="px-8 py-6 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">
                  Passing score: <span className="font-semibold">{quizState.result.passing_score}%</span>
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="p-8">
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-4xl font-bold text-green-600 mb-1">{quizState.result.correct}</p>
                  <p className="text-green-700 font-medium">Correct Answers</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border border-red-100 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-4xl font-bold text-red-600 mb-1">
                    {quizState.result.total - quizState.result.correct}
                  </p>
                  <p className="text-red-700 font-medium">Incorrect Answers</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-4xl font-bold text-blue-600 mb-1">{quizState.result.score}%</p>
                  <p className="text-blue-700 font-medium">Total Score</p>
                </div>
              </div>
            </div>
          </div>

          {/* Question Breakdown */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-indigo-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Question Breakdown
              </h2>
            </div>
            <div className="p-8 space-y-6">
              {quizToShow.questions.map((question, index) => {
                const detail = quizState.result.details.find(
                  (d) => d.question_id === question.id
                );
                const isCorrect = detail?.is_correct;
                return (
                  <div
                    key={question.id}
                    className="rounded-xl border-2 border-gray-200 overflow-hidden bg-white"
                  >
                    {/* Question Header */}
                    <div className="px-6 py-4 flex items-start gap-4 bg-gray-50">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCorrect 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                          : 'bg-gradient-to-br from-red-500 to-orange-500'
                      }`}>
                        {isCorrect ? (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-semibold text-gray-500">Question {index + 1}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isCorrect 
                              ? 'bg-green-500 text-white' 
                              : 'bg-red-500 text-white'
                          }`}>
                            {isCorrect ? 'CORRECT' : 'INCORRECT'}
                          </span>
                          <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-1 rounded">
                            {question.type === 'true_false' ? 'True/False' : 'Multiple Choice'}
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium">{question.question_text}</p>
                      </div>
                    </div>

                    {/* Answer Options */}
                    <div className="p-6 space-y-2">
                      {question.type === 'true_false' ? (
                        ['true', 'false'].map((value) => {
                          console.log('True/False detail:', detail);
                          const isStudentAnswer = detail?.submitted_answer === value || detail?.true_false_answer === value;
                          const isCorrectAnswer = detail?.correct_answer === value || question.correct_answer === value;
                          return (
                            <div
                              key={value}
                              className={`flex items-center gap-3 p-3 rounded border ${
                                isCorrectAnswer
                                  ? 'border-green-500 bg-green-50'
                                  : isStudentAnswer
                                  ? 'bg-red-500 border-red-600 text-white'
                                  : 'border-gray-200'
                              }`}
                            >
                              <span className={`w-4 h-4 flex items-center justify-center ${
                                isCorrectAnswer ? 'text-green-600' : isStudentAnswer ? 'text-white' : 'text-gray-400'
                              }`}>
                                {isCorrectAnswer || isStudentAnswer ? '✓' : '○'}
                              </span>
                              <span className={isCorrectAnswer ? 'font-medium' : ''}>
                                {value === 'true' ? 'True' : 'False'}
                                {isCorrectAnswer && (
                                  <span className="ml-2 text-xs text-green-600 font-medium">(Correct)</span>
                                )}
                                {isStudentAnswer && !isCorrectAnswer && (
                                  <span className="ml-2 text-xs font-medium">(Your answer)</span>
                                )}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        question.answers.map((answer) => {
                          const isStudentAnswer = detail?.answer_id === answer.id;
                          const isCorrectAnswer = detail?.correct_answer_id === answer.id;
                          return (
                            <div
                              key={answer.id}
                              className={`flex items-center gap-3 p-3 rounded border ${
                                isCorrectAnswer
                                  ? 'border-green-500 bg-green-50'
                                  : isStudentAnswer
                                  ? 'bg-red-500 border-red-600 text-white'
                                  : 'border-gray-200'
                              }`}
                            >
                              <span className={`w-4 h-4 flex items-center justify-center ${
                                isCorrectAnswer ? 'text-green-600' : isStudentAnswer ? 'text-white' : 'text-gray-400'
                              }`}>
                                {isCorrectAnswer || isStudentAnswer ? '✓' : '○'}
                              </span>
                              <span className={isCorrectAnswer ? 'font-medium' : ''}>
                                {answer.answer_text}
                                {isCorrectAnswer && (
                                  <span className="ml-2 text-xs text-green-600 font-medium">(Correct)</span>
                                )}
                                {isStudentAnswer && !isCorrectAnswer && (
                                  <span className="ml-2 text-xs font-medium">(Your answer)</span>
                                )}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Back Button */}
          <div className="flex justify-center mt-8">
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
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-800 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}