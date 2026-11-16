'use client'

import { ArrowLeft, CircleUserRound, Ellipsis, Languages, LogOut, Settings, SidebarCloseIcon, TabletIcon, Ticket, User } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { careDeskConfig } from '../../config/config';
import { useLabels } from '../labels-context';
import { DASHBOARD_PATH } from '../routes';
import type { SidebarProps } from '../types';

const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  ru: 'Русский',
  kk: 'Қазақша',
};

const localeName = (code: string) => LOCALE_NAMES[code] ?? code.toUpperCase();


export default function Sidebar({
  open,
  view,
  operatorName,
  onClose,
  onNavigate,
  onSignOut,
}: SidebarProps) {
  const { labels, locale } = useLabels();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!langOpen) return;
    const handler = ((event: MouseEvent) => {
      if (!langRef.current?.contains(event.target as Node)) {
        setLangOpen(false)
      }
    })
    document.addEventListener('mousedown', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
    }
  }, [langOpen])

  useEffect(() => {
    if (!menuOpen) return;
    const handler = ((event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    })
    document.addEventListener('mousedown', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
    }
  }, [menuOpen])

  const navLink =
    'flex w-full cursor-pointer flex-row items-center gap-2 rounded-lg p-2 text-left text-[14px] transition-colors duration-200';
  const navActive = 'bg-brand font-semibold text-white';
  const { logoUrl } = careDeskConfig.branding;
  const otherLocales = careDeskConfig.locales.length > 1;
  const navInactive = 'text-gray-700 hover:bg-gray-100';

  return (
    <nav
      aria-label={labels.navSidebarAria}
      className={`hidden flex-shrink-0 flex-col overflow-hidden bg-white transition-[width] duration-300 ease-in-out lg:sticky lg:top-0 lg:flex lg:h-screen ${open ? 'w-[270px] border-r border-gray-200' : 'w-0'
        }`}
    >
      <div className="flex w-[270px] flex-1 flex-col gap-1 px-3 py-4">
        <div className="flex flex-row items-center justify-between mb-4 px-2 mt-2">
          <div className="flex flex-row items-center gap-1">
            <a
              href={`/${locale}`}
              title={labels.navBackToPortal}
              aria-label={labels.navBackToPortal}
              className='p-2 cursor-pointer text-gray-700 hover:bg-gray-100 transition-colors duration-200 rounded-lg'
            >
              <ArrowLeft size={16} />
            </a>
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={careDeskConfig.name}
                width={150}
                height={50}
                priority
              />
            ) : (
              <span className="truncate text-[15px] font-semibold text-gray-900">{careDeskConfig.name}</span>
            )}
          </div>
          <button
            type='button'
            aria-label={labels.navCloseSidebar}
            onClick={onClose}
            className='p-2 cursor-pointer hover:bg-gray-100 transition-colors duration-200 rounded-lg'>
            <SidebarCloseIcon size={16} />
          </button>
        </div>


        <button
          type='button'
          onClick={() => onNavigate('tickets')}
          className={`${navLink} ${view === 'tickets' ? navActive : navInactive}`}
        >
          <Ticket size={16} className="flex-shrink-0" />
          <span>{labels.navTickets}</span>
        </button>

        <button
          type='button'
          onClick={() => onNavigate('overview')}
          className={`${navLink} ${view === 'overview' ? navActive : navInactive}`}
        >
          <TabletIcon size={16} className="flex-shrink-0" />
          <span>{labels.navOverview}</span>
        </button>

        <button
          type='button'
          onClick={() => onNavigate('settings')}
          className={`${navLink} ${view === 'settings' ? navActive : navInactive}`}
        >
          <Settings size={16} className="flex-shrink-0" />
          <span>{labels.navSettings}</span>
        </button>
      </div>


      <div className='flex w-[270px] flex-col gap-1 px-3 py-4'>

        <div
          className="flex flex-row items-center gap-2 rounded-lg p-2 text-[14px] font-medium"
        >
          <CircleUserRound size={24} className="flex-shrink-0" />
          <span className="min-w-0 flex-1 truncate" title={operatorName}>{operatorName}</span>
          <div ref={menuRef} className='relative'>
            <button
              type='button'
              onClick={() => setMenuOpen(v => !v)}
              className="flex flex-row cursor-pointer items-center gap-2 rounded-lg p-2 text-[14px] transition-colors duration-200 hover:bg-gray-100"
            >
              <Ellipsis size={16} />
            </button>
            {menuOpen && (
              <div className='flex w-max absolute z-50 bg-white rounded-lg shadow-md animate-fade-in right-0 bottom-full mb-2 border-[#626764]-400 flex-col p-4'>
                <button
                  type='button'
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigate('account');
                  }}
                  className='w-full cursor-pointer p-2 rounded-lg text-left text-[14px] transition-colors duration-200 hover:bg-gray-100'
                >
                  <span className='flex flex-row gap-2'><User size={16} />{labels.navProfile}</span>
                </button>

                {onSignOut && (
                  <button
                    type='button'
                    onClick={onSignOut}
                    className='w-full cursor-pointer p-2 rounded-lg text-left text-[14px] transition-colors duration-200 hover:bg-gray-100'
                  >
                    <span className='flex flex-row gap-2 text-[#e92c2c]'><LogOut size={16} /> {labels.navSignOut}</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
        {otherLocales && (
          <div ref={langRef} className='relative'>
            <button
              type='button'
              onClick={() => setLangOpen(v => !v)}
              className='flex flex-row gap-2 cursor-pointer rounded-lg bg-white text-black p-2 text-[14px] transition-colors duration-200 hover:bg-gray-100'>
              <Languages size={16} />
              <span>{localeName(locale)}</span>
            </button>
            {langOpen && (
              <div className='flex w-max absolute z-50 bg-white rounded-lg shadow-md animate-fade-in bottom-full mb-2 border-[#626764]-400 flex-col p-4'>
                {careDeskConfig.locales.map((l) => (
                  <a
                    key={l}
                    href={`/${l}${DASHBOARD_PATH}`}
                    aria-current={l === locale ? 'true' : undefined}
                    className={`cursor-pointer p-2 rounded-lg text-[14px] transition-colors duration-200 hover:bg-gray-100 ${l === locale ? 'font-semibold' : ''}`}
                  >
                    <span className='flex gap-2'>{localeName(l)}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
