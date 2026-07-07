import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

function QuestionBuilder({ question, index, onChange, onRemove }) {
  function updateQuestion(field, value) {
    onChange(index, { ...question, [field]: value });
  }

  function updateAnswer(answerIndex, field, value) {
    const updated = question.answers.map((a, i) =>
      i === answerIndex ? { ...a, [field]: value } : a
    );
    onChange(index, { ...question, answers: updated });
  }

  function addAnswer() {
    onChange(index, {
      ...question,
      answers: [...question.answers, { answer_text: '', is_correct: false }],
    });
  }

  function removeAnswer(answerIndex) {
    onChange(index, {
      ...question,
      answers: question.answers.filter((_, i) => i !== answerIndex),
    });
  }

  function setCorrectAnswer(answerIndex) {
    const updated = question.answers.map((a, i) => ({
      ...a,
      is_correct: i === answerIndex,
    }));
    onChange(index, { ...question, answers: updated });
  }

  return (
    <div className="border border-gray-200 rounded-xl p-5 mb-4 bg-gradient-to-br from-gray-50 to-indigo-50/30">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">Question {index + 1}</h3>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="inline-flex items-center gap-1 text-red-500 text-sm font-medium hover:text-red-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Remove
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
        <input
          type="text"
          value={question.question_text}
          onChange={(e) => updateQuestion('question_text', e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
          placeholder="e.g. What is Laravel?"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
        <select
          value={question.type}
          onChange={(e) => {
            const newType = e.target.value;
            const updated = { ...question, type: newType };
            // Reset answers when changing type
            if (newType === 'true_false') {
              updated.correct_answer = 'true';
              delete updated.answers;
            } else {
              updated.answers = [
                { answer_text: '', is_correct: true },
                { answer_text: '', is_correct: false },
              ];
              delete updated.correct_answer;
            }
            onChange(index, updated);
          }}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
        >
          <option value="mcq">Multiple Choice</option>
          <option value="true_false">True / False</option>
        </select>
      </div>

      {question.type === 'true_false' ? (
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-3">Correct Answer</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`correct-tf-${index}`}
                checked={question.correct_answer === 'true'}
                onChange={() => updateQuestion('correct_answer', 'true')}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-gray-700">True</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`correct-tf-${index}`}
                checked={question.correct_answer === 'false'}
                onChange={() => updateQuestion('correct_answer', 'false')}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-gray-700">False</span>
            </label>
          </div>
        </div>
      ) : (
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Answers <span className="text-gray-400 font-normal">(click a radio button to mark correct)</span>
          </label>
          {question.answers.map((answer, answerIndex) => (
            <div key={answerIndex} className="flex items-center gap-2 mb-2">
              <input
                type="radio"
                name={`correct-${index}`}
                checked={answer.is_correct}
                onChange={() => setCorrectAnswer(answerIndex)}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={answer.answer_text}
                onChange={(e) => updateAnswer(answerIndex, 'answer_text', e.target.value)}
                required
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm"
                placeholder={`Answer ${answerIndex + 1}`}
              />
              {question.answers.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeAnswer(answerIndex)}
                  className="text-red-400 hover:text-red-600 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addAnswer}
            className="inline-flex items-center gap-1 text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors mt-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add answer option
          </button>
        </div>
      )}
    </div>
  );
}

export default function QuizForm() {
  const { lessonId, courseId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState([
    {
      question_text: '',
      type: 'mcq',
      answers: [
        { answer_text: '', is_correct: true },
        { answer_text: '', is_correct: false },
      ],
    },
  ]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function addQuestion() {
    setQuestions([
      ...questions,
      {
        question_text: '',
        type: 'mcq',
        answers: [
          { answer_text: '', is_correct: true },
          { answer_text: '', is_correct: false },
        ],
      },
    ]);
  }

  function updateQuestion(index, updated) {
    setQuestions(questions.map((q, i) => (i === index ? updated : q)));
  }

  function removeQuestion(index) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post(`/lessons/${lessonId}/quiz`, {
        title,
        passing_score: passingScore,
        questions,
      });
      navigate(`/courses/${courseId}`);
    } catch (err) {
      const msg = err.response?.data?.message
        || JSON.stringify(err.response?.data?.errors)
        || 'Something went wrong.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/20 px-4 py-8">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">E</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Quiz</h1>
          <p className="text-gray-500 mt-1">Add questions to test your students</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              placeholder="e.g. Laravel Basics Quiz"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passing Score (%)
            </label>
            <input
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
              min={1}
              max={100}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-4">Questions</h2>

          {questions.map((question, index) => (
            <QuestionBuilder
              key={index}
              question={question}
              index={index}
              onChange={updateQuestion}
              onRemove={removeQuestion}
            />
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 border-2 border-dashed border-indigo-300 py-3 rounded-xl hover:from-indigo-100 hover:to-purple-100 hover:border-indigo-400 mb-6 font-medium transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Question
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {loading ? 'Creating Quiz...' : 'Create Quiz'}
          </button>

          <div className="mt-6 text-center">
            <Link
              to={`/courses/${courseId}`}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Cancel and go back
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}