'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { MemberList } from '@/components/members/MemberList';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  membershipStatus: 'active' | 'expiring' | 'expired';
  activeMembership?: {
    id: string;
    plan: { name: string; price: number };
    endDate: string;
  };
}

interface PaginatedResponse {
  members: Member[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
  stats: {
    total: number;
    active: number;
    expiring: number;
    expired: number;
  };
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0
  });

  const ITEMS_PER_PAGE = 20;

  const fetchMembers = async (page: number = 1, reset: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/members?${params}`);
      const data: PaginatedResponse = await response.json();

      if (data.members) {
        if (reset || page === 1) {
          setMembers(data.members);
        } else {
          setMembers(prev => [...prev, ...data.members]);
        }

        setHasNext(data.pagination.hasNext);
        setCurrentPage(page);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (hasNext && !loadingMore) {
      fetchMembers(currentPage + 1);
    }
  };

  // Reset and fetch when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
    setMembers([]);
    const timer = setTimeout(() => {
      fetchMembers(1, true);
    }, searchTerm ? 300 : 0); // Debounce search

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000 && // Load when 1000px from bottom
        hasNext &&
        !loadingMore &&
        !loading
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasNext, loadingMore, loading, currentPage]);

  const handleMemberUpdate = () => {
    // Reset and refetch all data
    setCurrentPage(1);
    setMembers([]);
    fetchMembers(1, true);
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
      {loading && members.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p>⏳ Učitavanje članova...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <MemberList members={members} onMemberUpdate={handleMemberUpdate} />

          {/* Load More Indicator */}
          {loadingMore && (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-gray-500">⏳ Učitavanje dodatnih članova...</p>
              </CardContent>
            </Card>
          )}

          {/* Manual Load More Button (optional fallback) */}
          {hasNext && !loadingMore && !loading && (
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={loadMore}
                className="w-full md:w-auto"
              >
                Učitaj još članova
              </Button>
            </div>
          )}

          {/* End of list indicator */}
          {!hasNext && members.length > 0 && (
            <div className="text-center py-4">
              <p className="text-gray-500">✅ Svi članovi su učitani</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}