'use client'

import type { CSSProperties, MouseEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

type FounderDmLinkProps = {
  className?: string
  style?: CSSProperties
  showIcon?: boolean
  color?: string
  hoverColor?: string
  fontSize?: string
}

const DM_URL = 'https://twitter.com/messages/compose?recipient_id=sirberialo007'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function FounderDmLink({
  className,
  style,
  showIcon = false,
  color = 'rgba(255,255,255,0.45)',
  hoverColor = 'rgba(255,255,255,0.90)',
  fontSize = '15px',
}: FounderDmLinkProps) {
  const linkRef = useRef<HTMLAnchorElement | null>(null)
  const tooltipRef = useRef<HTMLSpanElement | null>(null)

  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isTappedOpen, setIsTappedOpen] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 })

  const showTooltip = isHovered || isFocused || isTappedOpen

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const media = window.matchMedia('(hover: none), (pointer: coarse)')
    const updateTouchMode = () => {
      setIsTouchDevice(media.matches)
    }

    updateTouchMode()
    media.addEventListener('change', updateTouchMode)
    return () => {
      media.removeEventListener('change', updateTouchMode)
    }
  }, [])

  useEffect(() => {
    if (!showTooltip) {
      return
    }

    const updatePosition = () => {
      const linkEl = linkRef.current
      const tooltipEl = tooltipRef.current
      if (!linkEl || !tooltipEl) {
        return
      }

      const rect = linkEl.getBoundingClientRect()
      const tooltipWidth = tooltipEl.offsetWidth || 128
      const tooltipHeight = tooltipEl.offsetHeight || 28
      const viewportWidth = window.innerWidth

      const centeredLeft = rect.left + rect.width / 2
      const minCenter = 8 + tooltipWidth / 2
      const maxCenter = viewportWidth - 8 - tooltipWidth / 2
      const left = clamp(centeredLeft, minCenter, maxCenter)
      const top = Math.max(8, rect.top - tooltipHeight - 8)

      setTooltipPos({ left, top })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showTooltip])

  useEffect(() => {
    if (!isTappedOpen) {
      return
    }

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!linkRef.current?.contains(event.target as Node)) {
        setIsTappedOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePress)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress)
    }
  }, [isTappedOpen])

  const currentColor = showTooltip ? hoverColor : color

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isTouchDevice) {
      return
    }

    if (!isTappedOpen) {
      event.preventDefault()
      setIsTappedOpen(true)
      return
    }

    setIsTappedOpen(false)
  }

  return (
    <>
      <a
        ref={linkRef}
        className={className}
        href={DM_URL}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onClick={handleClick}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: currentColor,
          fontSize,
          textDecoration: 'none',
          transition: 'color 150ms ease',
          ...style,
        }}
        aria-label="DM @sirberialo007 on X"
      >
        {showIcon && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        )}
        <span>@sirberialo007</span>
      </a>

      <span
        ref={tooltipRef}
        role="tooltip"
        style={{
          position: 'fixed',
          left: `${tooltipPos.left}px`,
          top: `${tooltipPos.top}px`,
          transform: 'translateX(-50%)',
          background: 'rgba(20,18,40,0.96)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.70)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          opacity: showTooltip ? 1 : 0,
          transition: 'opacity 150ms ease',
          zIndex: 200,
          maxWidth: 'calc(100vw - 16px)',
        }}
      >
        Open DMs on X →
      </span>
    </>
  )
}
