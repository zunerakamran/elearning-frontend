import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

function AnswerRow({ label, isStudentAnswer, isCorrectAnswer }) {
    let style = 'bg-white border-gray-200 text-gray-600';
    let badge = null;

    if (isStudentAnswer && isCorrectAnswer) {
        style = 'bg-green-500 border-green-600 text-white';
        badge = (
            <span className="ml-auto text-xs font-medium flex items-center gap-1 whitespace-nowrap">
                ✓ Student answer · Correct
            </span>
        );
    } else if (isStudentAnswer && !isCorrectAnswer) {
        style = 'bg-red-500 border-red-600 text-white';
        badge = (
            <span className="ml-auto text-xs font-medium whitespace-nowrap">
                ✗ Student answer · Wrong
            </span>
        );
    } else if (!isStudentAnswer && isCorrectAnswer) {
        style = 'bg-green-100 border-green-300 text-green-800';
        badge = (
            <span className="ml-auto text-xs font-medium text-green-700 whitespace-nowrap">
                Correct answer
            </span>
        );
    }

    return (
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 ${style}`}>
            <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center flex-shrink-0">
                {isStudentAnswer && (
                    <div className="w-2 h-2 rounded-full bg-current" />
                )}
            </div>
            <span className="text-sm font-medium flex-1">{label}</span>
            {badge}
        </div>
    );
}

export default function AttemptResultPage() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.get(`/quiz-attempts/${attemptId}`)
            .then((res) => setData(res.data))
            .catch(() => setError('Could not load attempt details.'))
            .finally(() => setLoading(false));
    }, [attemptId]);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Loading result...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <p className="text-red-500">{error}</p>
        </div>
    );

    const { attempt, quiz } = data;
    const details = attempt.answers || [];

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">

                {/* Back button */}
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-indigo-600 text-sm font-medium hover:text-indigo-700 mb-5"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Lesson
                </button>

                {/* Header card */}
                <div className="bg-white border border-gray-100 rounded-xl p-5 sm:p-6 mb-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                                {quiz.title}
                            </h1>
                            <p className="text-sm text-gray-500">
                                Student: <span className="font-medium text-gray-700">{attempt.user?.name}</span>
                            </p>
                            <p className="text-xs text-gray-400">{attempt.user?.email}</p>
                        </div>
                        <div className={`flex-shrink-0 text-center px-5 py-3 rounded-xl ${attempt.passed
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                            }`}>
                            <p className={`text-3xl font-bold ${attempt.passed ? 'text-green-600' : 'text-red-500'}`}>
                                {attempt.score}%
                            </p>
                            <p className={`text-xs font-medium mt-0.5 ${attempt.passed ? 'text-green-600' : 'text-red-500'}`}>
                                {attempt.passed ? '✓ Passed' : '✗ Failed'}
                            </p>
                        </div>
                    </div>

                    {/* Score stats */}
                    <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-100">
                        <div className="text-center">
                            <p className="text-xl sm:text-2xl font-bold text-green-600">
                                {details.filter(d => d.is_correct).length}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">Correct</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl sm:text-2xl font-bold text-red-500">
                                {details.filter(d => !d.is_correct).length}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">Incorrect</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl sm:text-2xl font-bold text-gray-600">
                                {quiz.questions?.length || details.length}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">Total</p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all ${attempt.passed ? 'bg-green-500' : 'bg-red-400'}`}
                                style={{ width: `${attempt.score}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>0%</span>
                            <span>Passing: {quiz.passing_score}%</span>
                            <span>100%</span>
                        </div>
                    </div>
                </div>

                {/* Question breakdown */}
                <div className="bg-white border border-gray-100 rounded-xl p-5 sm:p-6 shadow-sm">
                    <h2 className="text-base font-bold text-gray-900 mb-4">Question Breakdown</h2>
                    <div className="space-y-4">
                        {quiz.questions?.map((question, index) => {
                            const detail = details.find(d => d.question_id === question.id);
                            const isCorrect = detail?.is_correct;

                            return (
                                <div
                                    key={question.id}
                                    className={`rounded-xl border-2 p-4 ${isCorrect
                                        ? 'border-green-200 bg-green-50/40'
                                        : 'border-red-200 bg-red-50/40'
                                        }`}
                                >
                                    {/* Question header */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${isCorrect
                                            ? 'bg-green-500'
                                            : 'bg-red-500'
                                            }`}>
                                            {isCorrect ? '✓' : '✗'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-400 mb-0.5">Question {index + 1}</p>
                                            <p className="text-sm font-semibold text-gray-900 leading-snug">
                                                {question.question_text}
                                            </p>
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${isCorrect
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {isCorrect ? 'Correct' : 'Wrong'}
                                        </span>
                                    </div>

                                    {/* Answers */}
                                    <div className="space-y-2 ml-10">
                                        {question.type === 'true_false' ? (
                                            ['true', 'false'].map((value) => {
                                                const isStudentAnswer = detail?.submitted_answer === value;
                                                const isCorrectAnswer = question.correct_answer === value;
                                                return (
                                                    <AnswerRow
                                                        key={value}
                                                        label={value === 'true' ? 'True' : 'False'}
                                                        isStudentAnswer={isStudentAnswer}
                                                        isCorrectAnswer={isCorrectAnswer}
                                                    />
                                                );
                                            })
                                        ) : (
                                            question.answers?.map((answer) => {
                                                const isStudentAnswer = detail?.answer_id === answer.id
                                                    || detail?.submitted_answer_id === answer.id;
                                                const isCorrectAnswer = answer.is_correct
                                                    || detail?.correct_answer_id === answer.id;
                                                return (
                                                    <AnswerRow
                                                        key={answer.id}
                                                        label={answer.answer_text}
                                                        isStudentAnswer={isStudentAnswer}
                                                        isCorrectAnswer={isCorrectAnswer}
                                                    />
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Attempt metadata */}
                <div className="mt-4 text-center text-xs text-gray-400">
                    Attempted on {new Date(attempt.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    })}
                </div>
            </div>
        </div>
    );
}