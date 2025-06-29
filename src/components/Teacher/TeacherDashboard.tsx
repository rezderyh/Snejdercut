import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Schedule {
  id: string;
  day_of_week: number;
  time_slot: string;
  class: { id: string; name: string };
  subject: { id: string; name: string; color: string };
}

interface Subject {
  id: string;
  name: string;
  color: string;
}

const DAYS = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 
  'Quinta-feira', 'Sexta-feira', 'Sábado'
];

const TeacherDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalSubjects: 0,
    weeklyHours: 0
  });

  useEffect(() => {
    if (profile) {
      fetchTeacherData();
    }
  }, [profile]);

  const fetchTeacherData = async () => {
    if (!profile) return;

    try {
      // Fetch teacher's subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('teacher_subjects')
        .select('subject:subjects(*)')
        .eq('teacher_id', profile.id);

      if (subjectsError) throw subjectsError;

      const teacherSubjects = subjectsData?.map(ts => ts.subject) || [];
      setSubjects(teacherSubjects);

      // Fetch teacher's schedules
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('schedules')
        .select(`
          *,
          class:classes(id, name),
          subject:subjects(id, name, color)
        `)
        .eq('teacher_id', profile.id)
        .order('day_of_week')
        .order('time_slot');

      if (schedulesError) throw schedulesError;

      setSchedules(schedulesData || []);

      // Calculate stats
      const uniqueClasses = new Set(schedulesData?.map(s => s.class_id) || []);
      setStats({
        totalClasses: uniqueClasses.size,
        totalSubjects: teacherSubjects.length,
        weeklyHours: schedulesData?.length || 0
      });

    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupSchedulesByDay = () => {
    const grouped: { [key: number]: Schedule[] } = {};
    
    schedules.forEach(schedule => {
      if (!grouped[schedule.day_of_week]) {
        grouped[schedule.day_of_week] = [];
      }
      grouped[schedule.day_of_week].push(schedule);
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const groupedSchedules = groupSchedulesByDay();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Painel do Professor - {profile?.full_name}
        </h1>
        <p className="text-gray-600">
          Visualize seus horários e disciplinas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Turmas</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalClasses}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Disciplinas</p>
              <p className="text-2xl font-bold text-green-900">{stats.totalSubjects}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Aulas/Semana</p>
              <p className="text-2xl font-bold text-purple-900">{stats.weeklyHours}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Minhas Disciplinas
        </h2>
        {subjects.length === 0 ? (
          <p className="text-gray-600">
            Você não está vinculado a nenhuma disciplina. Entre em contato com o administrador.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subjects.map(subject => (
              <div
                key={subject.id}
                className="px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: subject.color }}
              >
                {subject.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Meus Horários
        </h2>
        
        {schedules.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum horário encontrado
            </h3>
            <p className="text-gray-600">
              Seus horários ainda não foram definidos pelo administrador.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSchedules).map(([dayNum, daySchedules]) => {
              const day = parseInt(dayNum);
              if (day === 0 || day === 6) return null; // Skip weekends
              
              return (
                <div key={day} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    {DAYS[day]}
                  </h3>
                  
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {daySchedules.map(schedule => (
                      <div
                        key={schedule.id}
                        className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div 
                          className="inline-block px-3 py-1 rounded-md text-white font-medium mb-2"
                          style={{ backgroundColor: schedule.subject.color }}
                        >
                          {schedule.subject.name}
                        </div>
                        <p className="text-sm text-gray-600 flex items-center mb-1">
                          <Clock className="h-4 w-4 mr-1" />
                          {schedule.time_slot}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {schedule.class.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;