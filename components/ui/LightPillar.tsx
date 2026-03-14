'use client'

import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

type Quality = 'low' | 'medium' | 'high'

type LightPillarProps = {
  topColor?: string
  bottomColor?: string
  intensity?: number
  rotationSpeed?: number
  glowAmount?: number
  pillarWidth?: number
  pillarHeight?: number
  noiseIntensity?: number
  pillarRotation?: number
  interactive?: boolean
  mixBlendMode?: React.CSSProperties['mixBlendMode']
  quality?: Quality
}

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uTopColor;
uniform vec3 uBottomColor;
uniform float uIntensity;
uniform float uGlowAmount;
uniform float uPillarWidth;
uniform float uPillarHeight;
uniform float uNoiseIntensity;
uniform float uRotation;
uniform vec2 uMouse;
uniform float uInteractive;

varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 78.233);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) +
         (c - a) * u.y * (1.0 - u.x) +
         (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = vUv;
  vec2 p = uv * 2.0 - 1.0;

  float c = cos(uRotation);
  float s = sin(uRotation);
  mat2 rot = mat2(c, -s, s, c);
  p = rot * p;

  vec2 mouseOffset = (uMouse - vec2(0.5)) * 0.3;
  if (uInteractive > 0.5) {
    p += mouseOffset;
  }

  float body = 1.0 - smoothstep(uPillarWidth, uPillarWidth + 0.06, abs(p.x));
  float heightMask = 1.0 - smoothstep(uPillarHeight, uPillarHeight + 0.25, abs(p.y));

  float n = noise(vec2(p.x * 8.0 + uTime * 0.25, p.y * 10.0 - uTime * 0.18));
  float shimmer = 0.75 + n * uNoiseIntensity;

  float glow = exp(-abs(p.x) / max(0.0001, uGlowAmount)) * 0.35;

  float beam = body * heightMask * shimmer;
  float alpha = clamp((beam + glow) * uIntensity, 0.0, 1.0);

  vec3 gradient = mix(uBottomColor, uTopColor, clamp(uv.y, 0.0, 1.0));
  vec3 col = gradient * (beam + glow * 0.7);

  gl_FragColor = vec4(col, alpha);
}
`

function qualityToPixelRatio(quality: Quality) {
  if (quality === 'low') return Math.min(window.devicePixelRatio || 1, 1)
  if (quality === 'high') return Math.min(window.devicePixelRatio || 1, 2)
  return Math.min(window.devicePixelRatio || 1, 1.5)
}

export default function LightPillar({
  topColor = '#9b6dff',
  bottomColor = '#3d1a6e',
  intensity = 1.0,
  rotationSpeed = 0.3,
  glowAmount = 0.003,
  pillarWidth = 3,
  pillarHeight = 0.4,
  noiseIntensity = 0.3,
  pillarRotation = 0,
  interactive = false,
  mixBlendMode = 'screen',
  quality = 'medium',
}: LightPillarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })

  const parsedColors = useMemo(() => {
    const top = new THREE.Color(topColor)
    const bottom = new THREE.Color(bottomColor)
    return { top, bottom }
  }, [topColor, bottomColor])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(qualityToPixelRatio(quality))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const uniforms = {
      uTime: { value: 0 },
      uTopColor: { value: parsedColors.top.clone() },
      uBottomColor: { value: parsedColors.bottom.clone() },
      uIntensity: { value: intensity },
      uGlowAmount: { value: Math.max(glowAmount * 80.0, 0.02) },
      uPillarWidth: { value: Math.max(0.02, pillarWidth * 0.01) },
      uPillarHeight: { value: Math.max(0.05, pillarHeight) },
      uNoiseIntensity: { value: Math.max(0.0, noiseIntensity) },
      uRotation: { value: pillarRotation },
      uMouse: { value: new THREE.Vector2(mouseRef.current.x, mouseRef.current.y) },
      uInteractive: { value: interactive ? 1.0 : 0.0 },
    }

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    })

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    scene.add(mesh)

    const onResize = () => {
      renderer.setPixelRatio(qualityToPixelRatio(quality))
      renderer.setSize(container.clientWidth, container.clientHeight)
    }

    const onMouseMove = (event: MouseEvent) => {
      if (!interactive) return
      const rect = container.getBoundingClientRect()
      mouseRef.current = {
        x: (event.clientX - rect.left) / rect.width,
        y: 1 - (event.clientY - rect.top) / rect.height,
      }
      uniforms.uMouse.value.x = mouseRef.current.x
      uniforms.uMouse.value.y = mouseRef.current.y
    }

    let rafId = 0
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = (now - start) * 0.001
      uniforms.uTime.value = elapsed * rotationSpeed
      uniforms.uRotation.value = pillarRotation + elapsed * rotationSpeed * 0.25
      renderer.render(scene, camera)
      rafId = requestAnimationFrame(tick)
    }

    window.addEventListener('resize', onResize)
    if (interactive) container.addEventListener('mousemove', onMouseMove)
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      if (interactive) container.removeEventListener('mousemove', onMouseMove)
      scene.remove(mesh)
      mesh.geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [glowAmount, intensity, interactive, parsedColors.bottom, parsedColors.top, pillarHeight, pillarRotation, pillarWidth, quality, rotationSpeed, noiseIntensity])

  return (
    <>
      <style>{``}</style>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          mixBlendMode,
          pointerEvents: interactive ? 'auto' : 'none',
        }}
      />
    </>
  )
}
