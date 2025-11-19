'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Calendar, ArrowRight, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface SwipeableCardsProps {
  expiringMemberships: any[];
  expiredMemberships: any[];
}

export function SwipeableCards({ expiringMemberships, expiredMemberships }: SwipeableCardsProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const totalCards = 2; // Expiring and Expired cards

  // Handle touch events for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentCard < totalCards - 1) {
      setCurrentCard(currentCard + 1);
    }
    if (isRightSwipe && currentCard > 0) {
      setCurrentCard(currentCard - 1);
    }
  };

  // Handle mouse events for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const distance = dragStart - e.clientX;
    const isLeftSwipe = distance > 100;
    const isRightSwipe = distance < -100;

    if (isLeftSwipe && currentCard < totalCards - 1) {
      setCurrentCard(currentCard + 1);
      setIsDragging(false);
    }
    if (isRightSwipe && currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsDragging(false);
    }
  }, [isDragging, dragStart, currentCard, totalCards]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle dot navigation
  const goToCard = (index: number) => {
    setCurrentCard(index);
  };

  // Arrow navigation
  const goToPrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
    }
  };

  const goToNext = () => {
    if (currentCard < totalCards - 1) {
      setCurrentCard(currentCard + 1);
    }
  };

  // Auto-slide effect (disabled by default for better UX)
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCurrentCard((prev) => (prev + 1) % totalCards);
  //   }, 20000); // Change every 20 seconds
  //   return () => clearInterval(interval);
  // }, []);

  const cards = [
    // Expiring Memberships Card
    {
      id: 'expiring',
      title: 'Uskoro ističe',
      subtitle: 'Članovi koji treba da obnove',
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-orange-500',
      borderColor: 'border-amber-200',
      count: expiringMemberships.length,
      content: (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {expiringMemberships.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                Nema članova kojima uskoro ističe članarina
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Odličan posao! 🎉
              </p>
            </div>
          ) : (
            expiringMemberships.map((membership: any) => (
              <div key={membership.id} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4 transition-all duration-200 hover:shadow-md hover:border-amber-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {membership.user.firstName.charAt(0)}{membership.user.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {membership.user.firstName} {membership.user.lastName}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Ističe: {new Date(membership.endDate).toLocaleDateString('sr-RS')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/members/${membership.user.id}`}>
                    <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-amber-500 hover:bg-amber-600 text-white">
                      Pogledaj
                    </Button>
                  </Link>
                </div>

                {/* Progress indicator */}
                <div className="mt-3">
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-1.5 rounded-full" suppressHydrationWarning={true}
                      style={{ width: `${Math.max(10, Math.min(90, ((new Date(membership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)) * 100))}%` }}>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
          }
        </div >
      )
    },
    // Expired Memberships Card
    {
      id: 'expired',
      title: 'Istekle članarine',
      subtitle: 'Članovi koji treba da obnove',
      icon: XCircle,
      gradient: 'from-red-500 to-pink-500',
      borderColor: 'border-red-200',
      count: expiredMemberships.length,
      content: (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {expiredMemberships.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                Nema skorih isteklih članarina
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Svi članovi su aktivni! ✨
              </p>
            </div>
          ) : (
            expiredMemberships.map((membership: any) => (
              <div key={membership.id} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4 transition-all duration-200 hover:shadow-md hover:border-red-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {membership.user.firstName.charAt(0)}{membership.user.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {membership.user.firstName} {membership.user.lastName}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        {membership.type === 'expired_membership' ? (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>
                              Istekla: {new Date(membership.endDate).toLocaleDateString('sr-RS')}
                            </span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Nema aktivnu članarinu</span>
                          </>
                        )}
                      </div>
                      {membership.plan && (
                        <div className="text-xs text-slate-400 mt-1">
                          Poslednji plan: {membership.plan.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <Link href={`/members/${membership.user.id}`}>
                    <Button size="sm" variant="primary" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-red-200 text-red-600 hover:bg-red-50">
                      Obnovi
                    </Button>
                  </Link>
                </div>

                {/* Days since expired indicator */}
                {membership.type === 'expired_membership' && (
                  <div className="mt-3">
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-red-400 to-pink-500 h-1.5 rounded-full" suppressHydrationWarning={true}
                        style={{
                          width: `${Math.max(10, Math.min(100, 100 - ((Date.now() - new Date(membership.endDate).getTime()) / (1000 * 60 * 60 * 24 * 30)) * 100))}%`
                        }}>
                      </div>
                    </div>
                    <div className="text-xs text-red-500 mt-1" suppressHydrationWarning={true}>
                      Istekla pre {Math.ceil((Date.now() - new Date(membership.endDate).getTime()) / (1000 * 60 * 60 * 24))} dana
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Quick action to view all expired members */}
          {expiredMemberships.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200">
              <Link href="/members?status=expired">
                <Button variant="ghost" size="sm" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                  <span>Prikaži sve istekle članarine</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="relative">
      {/* Navigation Arrows (Desktop) */}
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-0 right-0 justify-between pointer-events-none z-10">
        <button
          onClick={goToPrevious}
          disabled={currentCard === 0}
          className={`pointer-events-auto -ml-4 w-8 h-8 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center transition-all duration-200 ${currentCard === 0
            ? 'opacity-30 cursor-not-allowed'
            : 'hover:shadow-xl hover:scale-110 hover:bg-slate-50'
            }`}
        >
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </button>

        <button
          onClick={goToNext}
          disabled={currentCard === totalCards - 1}
          className={`pointer-events-auto -mr-4 w-8 h-8 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center transition-all duration-200 ${currentCard === totalCards - 1
            ? 'opacity-30 cursor-not-allowed'
            : 'hover:shadow-xl hover:scale-110 hover:bg-slate-50'
            }`}
        >
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Cards Container */}
      <div
        ref={carouselRef}
        className="overflow-hidden rounded-lg touch-pan-x select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentCard * 100}%)` }}
        >
          {cards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <div key={card.id} className="w-full flex-shrink-0">
                <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 bg-gradient-to-r ${card.gradient} rounded-lg relative`}>
                          <IconComponent className="w-5 h-5 text-white" />
                          {card.count > 0 && (
                            <div className="absolute -top-2 -right-2 bg-white text-xs font-bold text-slate-700 rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                              {card.count}
                            </div>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                            {card.title}
                          </CardTitle>
                          <p className="text-sm text-slate-600 mt-1">{card.subtitle}</p>
                        </div>
                      </div>

                      {/* Card indicator for mobile */}
                      <div className="md:hidden text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        {index + 1}/{totalCards}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {card.content}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots Navigation */}
      <div className="flex justify-center items-center gap-3 mt-6">
        {cards.map((card, index) => (
          <button
            key={index}
            onClick={() => goToCard(index)}
            className={`relative transition-all duration-200 transform ${currentCard === index
              ? 'scale-125'
              : 'hover:scale-110'
              }`}
            aria-label={`Go to ${card.title}`}
          >
            <div className={`w-4 h-4 rounded-full transition-all duration-200 ${currentCard === index
              ? `bg-gradient-to-r ${card.gradient} shadow-lg`
              : 'bg-slate-300 hover:bg-slate-400'
              }`} />
            {card.count > 0 && currentCard === index && (
              <div className="absolute -top-1 -right-1 bg-white text-xs font-bold text-slate-700 rounded-full w-3 h-3 flex items-center justify-center shadow-sm">
                {card.count}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Card Indicators */}
      <div className="flex justify-center items-center gap-4 mt-3">
        <div className="text-sm text-slate-600 text-center font-medium">
          {currentCard === 0 ? '⚠️ Uskoro ističe' : '❌ Istekle članarine'}
          <span className="mx-2 text-slate-400">•</span>
          <span className="text-slate-500">{currentCard + 1} od {totalCards}</span>
        </div>
      </div>

      {/* Swipe Instructions */}
      <div className="text-center mt-3">
        <p className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full inline-block">
          <span className="md:hidden">👈👉 Prevucite za navigaciju</span>
          <span className="hidden md:inline">👆 Kliknite na strelice ili tačke za navigaciju</span>
        </p>
      </div>
    </div>
  );
}