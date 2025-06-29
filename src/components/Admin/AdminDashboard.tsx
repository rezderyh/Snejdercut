import React, { useState } from 'react';
import { Users, BookOpen, Calendar, Settings, Plus, BarChart3 } from 'lucide-react';
import ClassesManager from './ClassesManager';
import SubjectsManager from './SubjectsManager';
import TeachersManager from './TeachersManager';
import ScheduleManager from './ScheduleManager';

type TabType = 'overview' | 'classes' | 'subjects' | 'teachers' | 'schedules';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview' as TabType, label: 'Visão Geral', icon: BarChart3 },
    { id: 'classes' as TabType, label: 'Turmas', icon: Users },
    { id: 'subjects' as TabType, label: 'Disciplinas', icon: BookOpen },
    { id: 'teachers' as TabType, label: 'Professores', icon: Users },
    { id: 'schedules' as TabType, label: 'Horários', icon: Calendar },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Visão Geral do Sistema</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-600">Turmas</p>
                    <p className="text-2xl font-bold text-blue-900">0</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-600">Disciplinas</p>
                    <p className="text-2xl font-bold text-green-900">0</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-600">Professores</p>
                    <p className="text-2xl font-bold text-purple-900">0</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-orange-600">Horários</p>
                    <p className="text-2xl font-bold text-orange-900">0</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bem-vindo ao Painel Administrativo
              </h3>
              <p className="text-gray-600 mb-6">
                Use as abas acima para gerenciar turmas, disciplinas, professores e horários da escola.
                Comece criando algumas disciplinas e turmas, depois adicione professores e configure os horários.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <h4 className="font-semibold text-blue-900 mb-2">1. Configure Disciplinas</h4>
                  <p className="text-sm text-blue-700">
                    Crie as disciplinas com cores e ícones personalizados
                  </p>
                </div>
                
                <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                  <h4 className="font-semibold text-green-900 mb-2">2. Adicione Turmas</h4>
                  <p className="text-sm text-green-700">
                    Crie as turmas que farão parte do sistema
                  </p>
                </div>
                
                <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                  <h4 className="font-semibold text-purple-900 mb-2">3. Cadastre Professores</h4>
                  <p className="text-sm text-purple-700">
                    Registre professores e vincule-os às disciplinas
                  </p>
                </div>
                
                <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                  <h4 className="font-semibold text-orange-900 mb-2">4. Monte os Horários</h4>
                  <p className="text-sm text-orange-700">
                    Configure os horários de cada turma
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'classes':
        return <ClassesManager />;
      case 'subjects':
        return <SubjectsManager />;
      case 'teachers':
        return <TeachersManager />;
      case 'schedules':
        return <ScheduleManager />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;