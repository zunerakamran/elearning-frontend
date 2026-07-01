import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    <div className="border rounded-lg p-4 mb-4 bg-gray-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">Question {index + 1}</h3>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-500 text-sm hover:underline"
        >
          Remove
        </button>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Question Text</label>
        <input
          type="text"
          value={question.question_text}
          onChange={(e) => updateQuestion('question_text', e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
          placeholder="e.g. What is Laravel?"
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Type</label>
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
          className="w-full border rounded px-3 py-2"
        >
          <option value="mcq">Multiple Choice</option>
          <option value="true_false">True / False</option>
        </select>
      </div>

      {question.type === 'true_false' ? (
        <div className="mb-2">
          <label className="block text-sm font-medium mb-2">Correct Answer</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-tf-${index}`}
                checked={question.correct_answer === 'true'}
                onChange={() => updateQuestion('correct_answer', 'true')}
                className="w-4 h-4"
              />
              <span>True</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-tf-${index}`}
                checked={question.correct_answer === 'false'}
                onChange={() => updateQuestion('correct_answer', 'false')}
                className="w-4 h-4"
              />
              <span>False</span>
            </label>
          </div>
        </div>
      ) : (
        <div className="mb-2">
          <label className="block text-sm font-medium mb-2">
            Answers <span className="text-gray-400 font-normal">(click a radio button to mark correct)</span>
          </label>
          {question.answers.map((answer, answerIndex) => (
            <div key={answerIndex} className="flex items-center gap-2 mb-2">
              <input
                type="radio"
                name={`correct-${index}`}
                checked={answer.is_correct}
                onChange={() => setCorrectAnswer(answerIndex)}
                className="w-4 h-4 text-green-600"
              />
              <input
                type="text"
                value={answer.answer_text}
                onChange={(e) => updateAnswer(answerIndex, 'answer_text', e.target.value)}
                required
                className="flex-1 border rounded px-3 py-1.5 text-sm"
                placeholder={`Answer ${answerIndex + 1}`}
              />
              {question.answers.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeAnswer(answerIndex)}
                  className="text-red-400 text-sm hover:text-red-600"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addAnswer}
            className="text-blue-600 text-sm hover:underline mt-1"
          >
            + Add answer option
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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Create Quiz</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Quiz Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="e.g. Laravel Basics Quiz"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Passing Score (%)
            </label>
            <input
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
              min={1}
              max={100}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <h2 className="text-lg font-semibold mb-3">Questions</h2>

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
            className="w-full border-2 border-dashed border-blue-300 text-blue-600 py-2 rounded hover:bg-blue-50 mb-6"
          >
            + Add Question
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating Quiz...' : 'Create Quiz'}
          </button>
        </form>
      </div>
    </div>
  );
}