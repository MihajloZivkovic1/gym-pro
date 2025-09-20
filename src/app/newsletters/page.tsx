"use client"
import React, { useState, useEffect } from 'react';
import {
  Mail,
  Calendar,
  Users,
  Send,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  ArrowLeft,
  Clock,
  Loader2
} from 'lucide-react';

interface Newsletter {
  id: string;
  type: 'CLOSURE' | 'MAINTENANCE' | 'EVENT' | 'GENERAL';
  title: string;
  message: string;
  startDate: string | null;
  endDate: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'DRAFT' | 'SENT' | 'SCHEDULED';
  recipientCount: number;
  createdAt: string;
  scheduledFor?: string | null;
  sentAt?: string | null;
}

interface Stats {
  totalMembers: number;
  sentThisMonth: number;
  scheduled: number;
}

const NotificationManager: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [stats, setStats] = useState<Stats>({ totalMembers: 0, sentThisMonth: 0, scheduled: 0 });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingNewsletter, setSendingNewsletter] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: 'GENERAL' as Newsletter['type'],
    title: '',
    message: '',
    startDate: '',
    endDate: '',
    priority: 'MEDIUM' as Newsletter['priority'],
    scheduleFor: 'now' as 'now' | 'later',
    scheduledDate: '',
    scheduledTime: ''
  });

  const notificationTypes = {
    CLOSURE: { label: 'Godisnji odmor', icon: AlertTriangle, color: 'text-red-600' },
    MAINTENANCE: { label: 'Održavanje', icon: Clock, color: 'text-orange-600' },
    EVENT: { label: 'Događaj', icon: Calendar, color: 'text-blue-600' },
    GENERAL: { label: 'Opšte obaveštenje', icon: Info, color: 'text-gray-600' }
  };

  const priorityColors = {
    LOW: 'bg-green-100 text-green-800 border-green-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    HIGH: 'bg-red-100 text-red-800 border-red-200'
  };

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-green-100 text-green-800',
    SCHEDULED: 'bg-blue-100 text-blue-800'
  };

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/newsletters');
      if (response.ok) {
        const data = await response.json();
        setNewsletters(data.newsletters);
        setStats(data.stats);
      } else {
        console.error('Failed to fetch newsletters');
      }
    } catch (error) {
      console.error('Error fetching newsletters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const handleSendNotification = async () => {
    if (!formData.title || !formData.message) {
      alert('Naslov i poruka su obavezni!');
      return;
    }

    try {
      setSending(true);
      const response = await fetch('/api/newsletters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        // Refresh newsletters list
        await fetchNewsletters();
        // Reset form
        setFormData({
          type: 'GENERAL',
          title: '',
          message: '',
          startDate: '',
          endDate: '',
          priority: 'MEDIUM',
          scheduleFor: 'now',
          scheduledDate: '',
          scheduledTime: ''
        });
        setIsCreating(false);
      } else {
        alert(data.error || 'Greška pri slanju obaveštenja');
      }
    } catch (error) {
      console.error('Error sending newsletter:', error);
      alert('Greška pri slanju obaveštenja');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS');
  };

  const getPriorityLabel = (priority: Newsletter['priority']) => {
    switch (priority) {
      case 'LOW': return 'Informacija';
      case 'MEDIUM': return 'Vazno obaveštenje';
      case 'HIGH': return 'Hitno obaveštenje';
      default: return priority;
    }
  };

  const getStatusLabel = (status: Newsletter['status']) => {
    switch (status) {
      case 'DRAFT': return 'Nacrt';
      case 'SENT': return 'Poslato';
      case 'SCHEDULED': return 'Zakazano';
      default: return status;
    }
  };

  if (isCreating) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setIsCreating(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={sending}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Novo obaveštenje</h1>
            </div>

            <div className="space-y-6">
              {/* Tip notifikacije */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tip obaveštenja
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(notificationTypes).map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => handleInputChange('type', type)}
                        className={`p-4 border-2 rounded-lg transition-all ${formData.type === type
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                        disabled={sending}
                      >
                        <Icon className={`w-5 h-5 mx-auto mb-2 ${config.color}`} />
                        <div className="text-sm font-medium">{config.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Naslov */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Naslov obaveštenja
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Unesite naslov..."
                  disabled={sending}
                />
              </div>

              {/* Poruka */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sadržaj poruke
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Unesite sadržaj obaveštenja..."
                  disabled={sending}
                />
              </div>

              {/* Datumi */}
              {(formData.type === 'CLOSURE' || formData.type === 'EVENT' || formData.type === 'MAINTENANCE') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Datum početka
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      disabled={sending}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Datum završetka
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      disabled={sending}
                    />
                  </div>
                </div>
              )}

              {/* Prioritet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioritet
                </label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {(['LOW', 'MEDIUM', 'HIGH'] as const).map((priority) => (
                    <button
                      key={priority}
                      onClick={() => handleInputChange('priority', priority)}
                      className={`flex-1 px-4 py-3 sm:py-2 rounded-lg border-2 transition-all text-center min-h-[44px] ${formData.priority === priority
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 active:bg-gray-50'
                        }`}
                      disabled={sending}
                    >
                      {getPriorityLabel(priority)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dugmad */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={sending}
                >
                  Otkaži
                </button>
                <button
                  onClick={handleSendNotification}
                  disabled={!formData.title || !formData.message || sending}
                  className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sending ? 'Šalje se...' : (formData.scheduleFor === 'now' ? 'Pošalji' : 'Zakaži')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Podsetnici i obaveštenja</h1>
                <p className="text-gray-600">Upravljajte komunikacijom sa članovima</p>
              </div>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Send className="w-4 h-4" />
              Novo obaveštenje
            </button>
          </div>

          {/* Statistike */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-100 p-4 rounded-lg animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{stats.totalMembers}</p>
                    <p className="text-blue-700 text-sm">Ukupno članova</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-900">{stats.sentThisMonth}</p>
                    <p className="text-green-700 text-sm">Poslato ovaj mesec</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold text-orange-900">{stats.scheduled}</p>
                    <p className="text-orange-700 text-sm">Zakazano</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lista obaveštenja */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Poslednja obaveštenja</h2>
          </div>

          {loading ? (
            <div className="divide-y divide-gray-200">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-3"></div>
                      <div className="flex gap-4">
                        <div className="h-3 w-20 bg-gray-200 rounded"></div>
                        <div className="h-3 w-20 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : newsletters.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nema obaveštenja za prikaz</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {newsletters.map((newsletter) => {
                const TypeIcon = notificationTypes[newsletter.type].icon;
                return (
                  <div key={newsletter.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <TypeIcon className={`w-5 h-5 ${notificationTypes[newsletter.type].color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{newsletter.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[newsletter.priority]}`}>
                              {getPriorityLabel(newsletter.priority)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[newsletter.status]}`}>
                              {getStatusLabel(newsletter.status)}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3">{newsletter.message}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>👥 {newsletter.recipientCount} prima</span>
                            <span>📅 {formatDate(newsletter.createdAt)}</span>
                            {newsletter.startDate && newsletter.endDate && (
                              <span>🗓️ {formatDate(newsletter.startDate)} - {formatDate(newsletter.endDate)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationManager;