'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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

interface AllMembersResponse {
  members: Member[];
  stats: {
    total: number;
    active: number;
    expiring: number;
    expired: number;
  };
}

export default function MembersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0
  });

  const ITEMS_PER_PAGE = 50; // Show more items per page since we have all data

  // Initialize from URL parameters
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    const urlSearch = searchParams.get('search');

    if (urlStatus && ['active', 'expiring', 'expired'].includes(urlStatus)) {
      setStatusFilter(urlStatus);
    }

    if (urlSearch) {
      setSearchTerm(urlSearch);
    }
  }, [searchParams]);

  // Fetch all members once
  const fetchAllMembers = async () => {
    try {
      setLoading(true);

      // Fetch all members in one request (increase limit as needed)
      const response = await fetch(`/api/members?limit=10000`);
      const data: AllMembersResponse = await response.json();

      if (data.members) {
        setAllMembers(data.members);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load all members on component mount
  useEffect(() => {
    fetchAllMembers();
  }, []);

  // Client-side filtering and searching
  const filteredMembers = useMemo(() => {
    let filtered = allMembers;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.membershipStatus === statusFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(member =>
        member.firstName.toLowerCase().includes(searchLower) ||
        member.lastName.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower) ||
        (member.phone && member.phone.includes(searchTerm))
      );
    }

    return filtered;
  }, [allMembers, statusFilter, searchTerm]);

  // Client-side pagination
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredMembers.slice(startIndex, endIndex);
  }, [filteredMembers, currentPage, ITEMS_PER_PAGE]);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  // Update URL when filters change
  const updateURL = (newStatusFilter: string, newSearchTerm: string) => {
    const params = new URLSearchParams();

    if (newStatusFilter !== 'all') {
      params.set('status', newStatusFilter);
    }

    if (newSearchTerm.trim()) {
      params.set('search', newSearchTerm);
    }

    const newURL = params.toString() ? `/members?${params.toString()}` : '/members';
    router.replace(newURL, { scroll: false });
  };

  // Handle filter changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    updateURL(statusFilter, searchTerm);
  }, [statusFilter, searchTerm]);

  const handleMemberUpdate = () => {
    // Refetch all data when a member is updated
    fetchAllMembers();
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
  };

  const handleSearchTermChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getActiveFilterName = () => {
    switch (statusFilter) {
      case 'active': return 'Aktivni članovi';
      case 'expiring': return 'Uskoro ističe';
      case 'expired': return 'Istekli članovi';
      default: return 'Svi članovi';
    }
  };

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const delta = 2; // Show 2 pages before and after current
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      if (totalPages > 1) rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Članovi</h1>
          {(statusFilter !== 'all' || searchTerm) && (
            <p className="text-sm text-gray-600 mt-1">
              {statusFilter !== 'all' && `Filter: ${getActiveFilterName()}`}
              {statusFilter !== 'all' && searchTerm && ' • '}
              {searchTerm && `Pretraga: "${searchTerm}"`}
              {filteredMembers.length !== allMembers.length && (
                <span className="ml-2 text-blue-600">
                  ({filteredMembers.length} od {allMembers.length})
                </span>
              )}
            </p>
          )}
        </div>
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
                onChange={(e) => handleSearchTermChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
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

      {/* Clear Filters Button */}
      {(statusFilter !== 'all' || searchTerm) && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-sm"
          >
            Ukloni sve filtere
          </Button>
        </div>
      )}

      {/* Members List */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p>⏳ Učitavanje članova...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Results info */}
          <div className="flex justify-between items-center text-sm text-gray-600">
            <p>
              Prikazano {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)} od {filteredMembers.length} članova
            </p>
            {totalPages > 1 && (
              <p>
                Strana {currentPage} od {totalPages}
              </p>
            )}
          </div>

          <MemberList members={paginatedMembers} onMemberUpdate={handleMemberUpdate} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <Button
                variant="ghost"
                onClick={() => goToPage(currentPage - 1)}
                disabled={!hasPrev}
                className="px-3 py-2"
              >
                ← Prethodna
              </Button>

              <div className="flex space-x-1">
                {getPaginationNumbers().map((page, index) => (
                  <div key={index}>
                    {page === '...' ? (
                      <span className="px-3 py-2 text-gray-500">...</span>
                    ) : (
                      <Button
                        variant={page === currentPage ? "primary" : "ghost"}
                        onClick={() => goToPage(page as number)}
                        className="px-3 py-2 min-w-[40px]"
                        size="sm"
                      >
                        {page}
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="ghost"
                onClick={() => goToPage(currentPage + 1)}
                disabled={!hasNext}
                className="px-3 py-2"
              >
                Sledeća →
              </Button>
            </div>
          )}

          {/* No results message */}
          {filteredMembers.length === 0 && !loading && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Nema članova koji odgovaraju kriterijumima pretrage.'
                    : 'Nema registrovanih članova.'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}