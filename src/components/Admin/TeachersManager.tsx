import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Mail, Key } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Teacher {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  subjects: Subject[];
}

interface Subject {
  id: string;
  name: string;
  color: string;
}

const TeachersManager: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    selectedSubjects: [] as string[]
  });

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, color')
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          teacher_subjects(
            subject:subjects(id, name, color)
          )
        `)
        .eq('role', 'teacher')
        .order('full_name');

      if (error) throw error;
      
      const teachersWithSubjects = (data || []).map(teacher => ({
        ...teacher,
        subjects: teacher.teacher_subjects?.map((ts: any) => ts.subject) || []
      }));
      
      setTeachers(teachersWithSubjects);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTeacher) {
        // Update teacher profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            email: formData.email,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTeacher.id);

        if (profileError) throw profileError;

        // Update teacher subjects
        await supabase
          .from('teacher_subjects')
          .delete()
          .eq('teacher_id', editingTeacher.id);

        if (formData.selectedSubjects.length > 0) {
          const { error: subjectsError } = await supabase
            .from('teacher_subjects')
            .insert(
              formData.selectedSubjects.map(subjectId => ({
                teacher_id: editingTeacher.id,
                subject_id: subjectId
              }))
            );

          if (subjectsError) throw subjectsError;
        }
      } else {
        // Create new teacher account
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true
        });

        if (authError) throw authError;

        // Create teacher profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            email: formData.email,
            full_name: formData.full_name,
            role: 'teacher'
          }]);

        if (profileError) throw profileError;

        // Add teacher subjects
        if (formData.selectedSubjects.length > 0) {
          const { error: subjectsError } = await supabase
            .from('teacher_subjects')
            .insert(
              formData.selectedSubjects.map(subjectId => ({
                teacher_id: authData.user.id,
                subject_id: subjectId
              }))
            );

          if (subjectsError) throw subjectsError;
        }
      }

      setFormData({ full_name: '', email: '', password: '', selectedSubjects: [] });
      setShowForm(false);
      setEditingTeacher(null);
      fetchTeachers();
    } catch (error) {
      console.error('Error saving teacher:', error);
      alert('Erro ao salvar professor. Verifique os dados e tente novamente.');
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      full_name: teacher.full_name,
      email: teacher.email,
      password: '',
      selectedSubjects: teacher.subjects.map(s => s.id)
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este professor? Esta ação também removerá o acesso ao sistema.')) return;

    try {
      // Delete teacher subjects first
      await supabase
        .from('teacher_subjects')
        .delete()
        .eq('teacher_id', id);

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (profileError) throw profileError;

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      if (authError) console.error('Error deleting auth user:', authError);

      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  };

  const resetForm = () => {
    setFormData({ full_name: '', email: '', password: '', selectedSubjects: [] });
    setShowForm(false);
    setEditingTeacher(null);
  };

  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        selectedSubjects: [...formData.selectedSubjects, subjectId]
      });
    } else {
      setFormData({
        ...formData,
        selectedSubjects: formData.selectedSubjects.filter(id => id !== subjectId)
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gerenciar Professores</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Professor
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingTeacher ? 'Editar Professor' : 'Novo Professor'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do professor"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@exemplo.com"
                />
              </div>
              
              {!editingTeacher && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Senha para acesso"
                    minLength={6}
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disciplinas que leciona
                </label>
                {subjects.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Nenhuma disciplina disponível. Crie disciplinas primeiro.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                    {subjects.map((subject) => (
                      <label key={subject.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.selectedSubjects.includes(subject.id)}
                          onChange={(e) => handleSubjectChange(subject.id, e.target.checked)}
                          className="mr-2"
                        />
                        <div 
                          className="px-2 py-1 rounded text-white text-sm"
                          style={{ backgroundColor: subject.color }}
                        >
                          {subject.name}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingTeacher ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        {teachers.length === 0 ? (
          <div className="p-12 text-center">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum professor encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Cadastre professores e vincule-os às disciplinas.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Professor
            </button>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Professor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Disciplinas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cadastrado em
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {teacher.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {teacher.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects.map((subject) => (
                          <span
                            key={subject.id}
                            className="px-2 py-1 text-xs font-medium text-white rounded"
                            style={{ backgroundColor: subject.color }}
                          >
                            {subject.name}
                          </span>
                        ))}
                        {teacher.subjects.length === 0 && (
                          <span className="text-sm text-gray-400">Nenhuma disciplina</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(teacher.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeachersManager;