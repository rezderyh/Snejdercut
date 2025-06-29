import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Teacher {
  id: string;
  full_name: string;
}

interface Schedule {
  id: string;
  day_of_week: number;
  time_slot: string;
  subject: Subject;
  teacher: Teacher | null;
}

interface Class {
  id: string;
  name: string;
  description: string | null;
}

const DAYS = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 
  'Quinta-feira', 'Sexta-feira', 'Sábado'
];

const ScheduleView: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSchedules(selectedClass);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name');

      if (error) throw error;
      setClasses(data || []);
      
      if (data && data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          subject:subjects(*),
          teacher:profiles(*)
        `)
        .eq('class_id', classId)
        .order('day_of_week')
        .order('time_slot');

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
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

  const getIconComponent = (iconName: string) => {
    // Map icon names to actual components - you can extend this
    const iconMap: { [key: string]: React.ReactNode } = {
      'calendar': <Calendar className="h-5 w-5" />,
      'clock': <Clock className="h-5 w-5" />,
      'user': <User className="h-5 w-5" />,
    };
    
    return iconMap[iconName] || <Calendar className="h-5 w-5" />;
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
            Quadro de Horários
          </h1>
          
          {classes.length > 0 && (
            <div className="w-full sm:w-auto">
              <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Turma:
              </label>
              <select
                id="class-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {classes.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma turma encontrada
            </h3>
            <p className="text-gray-600">
              Entre em contato com o administrador para criar turmas e horários.
            </p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum horário encontrado
            </h3>
            <p className="text-gray-600">
              Os horários para esta turma ainda não foram definidos.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedSchedules).map(([dayNum, daySchedules]) => {
              const day = parseInt(dayNum);
              if (day === 0 || day === 6) return null; // Skip weekends
              
              return (
                <div key={day} className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    {DAYS[day]}
                  </h2>
                  
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {daySchedules.map(schedule => (
                      <div
                        key={schedule.id}
                        className={`p-4 rounded-lg shadow-sm border-l-4 bg-white hover:shadow-md transition-shadow`}
                        style={{ 
                          borderLeftColor: schedule.subject.color,
                          backgroundColor: `${schedule.subject.color}10`
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: `${schedule.subject.color}20` }}
                            >
                              {getIconComponent(schedule.subject.icon)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {schedule.subject.name}
                              </h3>
                              <p className="text-sm text-gray-600 flex items-center mt-1">
                                <Clock className="h-4 w-4 mr-1" />
                                {schedule.time_slot}
                              </p>
                              {schedule.teacher && (
                                <p className="text-sm text-gray-500 flex items-center mt-1">
                                  <User className="h-4 w-4 mr-1" />
                                  {schedule.teacher.full_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {daySchedules.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      Nenhum horário definido para este dia
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleView;