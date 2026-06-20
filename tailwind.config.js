/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      // ═══════════════════════════════════════════
      // BRAND TOKENS — FanCraft AI Security Lab
      // v1.0 | 2026-06-14
      // ═══════════════════════════════════════════

      colors: {
        // ═══ Primary: Sky Blue ═══
        'primary': {
          50:  '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        // ═══ Success: Emerald ═══
        'success': {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        // ═══ Accent: Violet ═══
        'accent': {
          50:  '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        // ═══ Warning: Amber ═══
        'warning': {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // ═══ Error: Red ═══
        'error': {
          50:  '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        // ═══ Neutral: Slate ═══
        'neutral': {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        // ═══ Background Semantics ═══
        'bg-root':     '#060B14',
        'bg-primary':  '#0A1120',
        'bg-secondary':'#0F1A2E',
        'bg-tertiary': '#162240',
        'bg-card':     '#0C1425',
        // ═══ Text Semantics ═══
        'text-primary':   '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-tertiary':  '#64748B',
        'text-disabled':  '#475569',
        // ═══ Border Semantics ═══
        'border-primary':   'rgba(56,189,248,0.15)',
        'border-secondary': 'rgba(148,163,184,0.08)',
        'border-tertiary':  'rgba(148,163,184,0.04)',
        // ═══ Brand IP: Shieldy Colors ═══
        'shieldy': {
          helmet:  '#0C4A6E',   // 头盔主体深蓝
          visor:   '#020617',   // 护目镜深色玻璃
          eye:     '#38BDF8',  // 扫描眼睛蓝
          'eye-alert': '#EF4444', // 警戒态红眼
          core:    '#34D399',  // 能量核心绿
          'core-teach': '#34D399', // 教学态核心
          'core-alert': '#F59E0B', // 警戒态核心橙
          'core-celebrate': '#FBBF24', // 庆祝态金色
          shoulder: '#7DD3FC', // 肩甲高光蓝
          aura:     '#A78BFA', // 辅助紫色光晕
          dark:     '#020617', // 整体暗部
        },
        // ═══ Brand Gradients (CSS vars for bg utilities) ═══
        'gradient-brand-start': '#38BDF8',
        'gradient-brand-mid':   '#0EA5E9',
        'gradient-brand-end':   '#0369A1',
        'gradient-text-start':  '#38BDF8',
        'gradient-text-mid1':   '#7DD3FC',
        'gradient-text-mid2':   '#8B5CF6',
        'gradient-text-end':    '#A78BFA',
        // ═══ Legacy compat ═══
        'dna-accent': '#F59E0B',
        'dna-accent-light': 'rgba(245,158,11,0.15)',
        'dna-text-secondary': '#94A3B8',
        'dna-text-muted': '#64748B',
        'dna-border': '#334155',
        // ═══ Cyber Theme Colors ═══
        'cyber-blue': '#38BDF8',
        'cyber-purple': '#8B5CF6',
        'cyber-cyan': '#22D3EE',
      },

      // ═══ Brand Gradient Utilities ═══
      backgroundImage: {
        'gradient-brand':    'linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #0369A1 100%)',
        'gradient-brand-lg':  'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 35%, #0284C7 65%, #0369A1 100%)',
        'gradient-text-hl':   'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 35%, #7DD3FC 50%, #8B5CF6 75%, #A78BFA 100%)',
        'gradient-shieldy':   'linear-gradient(135deg, #0C4A6E 0%, #075985 50%, #020617 100%)',
        'gradient-core-glow': 'radial-gradient(circle, #34D399 0%, rgba(52,211,153,0.3) 50%, transparent 100%)',
      },

      // ═══ Brand Box Shadows ═══ (merged — do not duplicate)
      boxShadow: {
        'sm':   '0 1px 2px 0 rgba(0,0,0,0.4)',
        'md':   '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3)',
        'lg':   '0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -4px rgba(0,0,0,0.3)',
        'glow-primary': '0 0 20px rgba(56,189,248,0.15)',
        'glow-success': '0 0 20px rgba(52,211,153,0.15)',
        'glow-accent':  '0 0 20px rgba(167,139,250,0.15)',
        'card': '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.25)',
        'card-hover': '0 2px 6px rgba(0,0,0,0.35), 0 8px 24px rgba(56,189,248,0.08)',
        // Brand-specific glows
        'glow-brand':    '0 0 30px rgba(14,165,233,0.3), 0 4px 12px rgba(0,0,0,0.35)',
        'glow-brand-lg': '0 0 50px rgba(14,165,233,0.45), 0 8px 24px rgba(0,0,0,0.45)',
        'glow-shieldy':  '0 0 24px rgba(56,189,248,0.4)',
        'glow-shieldy-core': '0 0 16px rgba(52,211,153,0.6)',
        'glow-shieldy-alert': '0 0 24px rgba(239,68,68,0.5)',
      },
      fontFamily: {
        'sans': ['Noto Sans SC', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'mono': ['JetBrains Mono', 'SF Mono', 'Cascadia Code', 'Consolas', 'monospace'],
        'display': ['Noto Sans SC', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.75rem', { lineHeight: '1.25' }],   // 12px
        'xs':  ['0.8125rem', { lineHeight: '1.5' }],  // 13px
        'sm':  ['0.875rem', { lineHeight: '1.5' }],   // 14px
        'md':  ['0.9375rem', { lineHeight: '1.5' }],  // 15px
        'lg':  ['1.0625rem', { lineHeight: '1.5' }],  // 17px
        'xl':  ['1.25rem', { lineHeight: '1.4' }],    // 20px
        '2xl': ['1.5rem', { lineHeight: '1.3' }],     // 24px
        '3xl': ['1.875rem', { lineHeight: '1.25' }],  // 30px
        '4xl': ['2.25rem', { lineHeight: '1.2' }],    // 36px
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
      },
      // ═══ Brand Letter Spacing ═══
      letterSpacing: {
        'brand':    '0.08em',  // FanCraft 品牌名
        'upper':    '0.15em',  // 全大写标签
        'caps':     '0.2em',   // SECURITY LAB 类全大写
        'tighter':  '0.02em',  // 英文正文
      },

      // ═══ Brand Animation Extensions ═══
      animation: {
        'fade-in':         'fadeIn 0.4s ease both',
        'fade-in-up':      'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':        'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
        'slide-right':     'slideInRight 0.3s ease both',
        'pulse-glow':      'pulse-glow 2s infinite ease-in-out',
        'shimmer':         'shimmer 1.8s infinite linear',
        'float':           'float 3s ease-in-out infinite',
        // Shieldy IP animations
        'shieldy-core':    'shieldy-core 2s infinite ease-in-out',
        'shieldy-scan':    'shieldy-scan 4s linear infinite',
        'shieldy-alert':   'shieldy-alert 0.8s infinite ease-in-out',
        'shieldy-celebrate': 'shieldy-celebrate 1.2s ease-out forwards',
        'ripple': 'ripple 0.7s ease-out forwards',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'translate(-50%, -50%) scale(0)', opacity: '0.6' },
          '100%': { transform: 'translate(-50%, -50%) scale(20)', opacity: '0' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        fadeInUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          'from': { opacity: '0', transform: 'translateX(16px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        // Shieldy keyframes
        'shieldy-core': {
          '0%, 100%': { opacity: '0.6', filter: 'drop-shadow(0 0 8px #34D399)' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 16px #34D399)' },
        },
        'shieldy-scan': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '20%': { opacity: '0.6' },
          '80%': { opacity: '0.6' },
          '100%': { transform: 'translateY(20px)', opacity: '0' },
        },
        'shieldy-alert': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 12px #EF4444)' },
          '50%': { opacity: '0.5', filter: 'drop-shadow(0 0 4px #EF4444)' },
        },
        'shieldy-celebrate': {
          '0%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 0px #FBBF24)' },
          '50%': { transform: 'scale(1.15)', filter: 'drop-shadow(0 0 24px #FBBF24)' },
          '100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 12px #34D399)' },
        },
      },
    },
  },
  plugins: [],
}
