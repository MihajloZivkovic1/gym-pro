'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { MemberList } from '@/components/members/MemberList';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchMembers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/members?${params}`);
      const data = await response.json();

      if (data.members) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [searchTerm, statusFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const stats = {
    total: members.length,
    active: members.filter((m: any) => m.membershipStatus === 'active').length,
    expiring: members.filter((m: any) => m.membershipStatus === 'expiring').length,
    expired: members.filter((m: any) => m.membershipStatus === 'expired').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Članovi</h1>
        <Link href="/members/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Dodaj člana
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Pretraži članove..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Svi članovi</option>
              <option value="active">Aktivni</option>
              <option value="expiring">Uskoro ističe</option>
              <option value="expired">Istekli</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-600 text-sm">Ukupno</p>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-green-600 text-sm">Aktivni</p>
          <p className="text-2xl font-bold text-green-900">{stats.active}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-yellow-600 text-sm">Uskoro ističe</p>
          <p className="text-2xl font-bold text-yellow-900">{stats.expiring}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-600 text-sm">Istekli</p>
          <p className="text-2xl font-bold text-red-900">{stats.expired}</p>
        </div>
      </div>

      {/* Members List */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p>⏳ Učitavanje članova...</p>
          </CardContent>
        </Card>
      ) : (
        <MemberList members={members} onMemberUpdate={fetchMembers} />
      )}
    </div>
  );
}