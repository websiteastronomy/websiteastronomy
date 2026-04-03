"use client";

import { useState, useEffect } from 'react';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '@/lib/db';
import { inputStyle, rowStyle } from './shared';

export default function QuizzesManager() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCollection('quizzes', (data) => setQuizzes(data));
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const container = document.getElementById('quiz-form-container');
      if (!container) return;
      
      const titleInput = container.querySelector('input[name="title"]') as HTMLInputElement;
      const descInput = container.querySelector('input[name="description"]') as HTMLInputElement;
      const diffSelect = container.querySelector('select[name="difficulty"]') as HTMLSelectElement;
      const jsonInput = container.querySelector('#quiz-questions-json') as HTMLTextAreaElement;
      
      if (!titleInput.value) {
        alert("Title is required.");
        setIsSaving(false);
        return;
      }

      let questions = [];
      try {
        questions = JSON.parse(jsonInput.value || '[]');
      } catch (e) {
        alert("Invalid JSON in questions data.");
        setIsSaving(false);
        return;
      }

      const data = {
        title: titleInput.value,
        description: descInput.value,
        difficulty: diffSelect.value,
        questions
      };

      if (editingQuiz?.id) {
        await updateDocument('quizzes', editingQuiz.id, data);
        alert("Updated successfully!");
      } else {
        await addDocument('quizzes', data);
        alert("Created successfully!");
      }
      setShowForm(false);
      setEditingQuiz(null);
    } catch (err) {
      console.error(err);
      alert("Operation failed. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this quiz?")) {
      await deleteDocument('quizzes', id);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>Quizzes Manager</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage quizzes for public and members.</p>
        </div>
        <button 
          className="btn-primary" 
          style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }} 
          onClick={() => { setShowForm(!showForm); setEditingQuiz(null); }}
        >
          {showForm ? 'Cancel' : '+ New Quiz'}
        </button>
      </div>

      {showForm && (
        <div id="quiz-form-container" style={{ padding: '1.5rem', background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gold)' }}>
            {editingQuiz ? 'Edit Quiz' : 'New Quiz'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
            <input name="title" placeholder="Quiz Title" defaultValue={editingQuiz?.title || ''} style={inputStyle} />
            <select name="difficulty" defaultValue={editingQuiz?.difficulty || 'Medium'} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <input name="description" placeholder="Description" defaultValue={editingQuiz?.description || ''} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
          </div>
          
          <div style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border-subtle)' }}>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>Questions Data (JSON Format)</h4>
            <textarea 
              id="quiz-questions-json"
              placeholder='[{"id": 1, "text": "Question?", "options": ["A", "B"], "correct": 0}]' 
              defaultValue={JSON.stringify(editingQuiz?.questions || [], null, 2)} 
              rows={8} 
              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.8rem' }} 
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Edit the raw JSON above to manage questions and options.</p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="btn-primary" 
              disabled={isSaving}
              style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', opacity: isSaving ? 0.7 : 1 }} 
              onClick={handleSave}
            >
              {isSaving ? 'Saving...' : (editingQuiz ? 'Save Changes' : 'Create Quiz')}
            </button>
            {editingQuiz && (
              <button className="btn-secondary" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem', background: 'transparent' }} onClick={() => { setEditingQuiz(null); setShowForm(false); }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {quizzes.map((quiz) => (
          <div key={quiz.id} style={{...rowStyle, padding: '1.2rem', alignItems: 'center'}}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: quiz.difficulty === 'Easy' ? '#22c55e' : quiz.difficulty === 'Medium' ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>{quiz.difficulty}</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', marginTop: '0.3rem', marginBottom: '0.3rem' }}>{quiz.title}</h4>
              <p style={{ fontSize: '0.8rem', color: "var(--text-secondary)", marginBottom: '0.4rem' }}>{quiz.description}</p>
              <span style={{ fontSize: '0.7rem', color: "var(--text-muted)" }}>{quiz?.questions?.length || 0} Questions</span>
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
              <button 
                onClick={() => { setEditingQuiz(quiz); setShowForm(true); window.scrollTo(0,0); }} 
                style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit' }}
              >
                Edit
              </button>
              <button 
                onClick={() => handleDelete(quiz.id)} 
                style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {quizzes.length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No quizzes found.</p>
        )}
      </div>
    </>
  );
}
