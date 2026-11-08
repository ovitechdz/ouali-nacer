// Measured with designlang: https://designlang.app
/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
    colors: {
        primary: {
            '50': 'hsl(161, 100%, 97%)',
            '100': 'hsl(161, 100%, 94%)',
            '200': 'hsl(161, 100%, 86%)',
            '300': 'hsl(161, 100%, 76%)',
            '400': 'hsl(161, 100%, 64%)',
            '500': 'hsl(161, 100%, 50%)',
            '600': 'hsl(161, 100%, 40%)',
            '700': 'hsl(161, 100%, 32%)',
            '800': 'hsl(161, 100%, 24%)',
            '900': 'hsl(161, 100%, 16%)',
            '950': 'hsl(161, 100%, 10%)',
            DEFAULT: '#00d492'
        },
        secondary: {
            '50': 'hsl(160, 100%, 97%)',
            '100': 'hsl(160, 100%, 94%)',
            '200': 'hsl(160, 100%, 86%)',
            '300': 'hsl(160, 100%, 76%)',
            '400': 'hsl(160, 100%, 64%)',
            '500': 'hsl(160, 100%, 50%)',
            '600': 'hsl(160, 100%, 40%)',
            '700': 'hsl(160, 100%, 32%)',
            '800': 'hsl(160, 100%, 24%)',
            '900': 'hsl(160, 100%, 16%)',
            '950': 'hsl(160, 100%, 10%)',
            DEFAULT: '#009966'
        },
        accent: {
            '50': 'hsl(176, 100%, 97%)',
            '100': 'hsl(176, 100%, 94%)',
            '200': 'hsl(176, 100%, 86%)',
            '300': 'hsl(176, 100%, 76%)',
            '400': 'hsl(176, 100%, 64%)',
            '500': 'hsl(176, 100%, 50%)',
            '600': 'hsl(176, 100%, 40%)',
            '700': 'hsl(176, 100%, 32%)',
            '800': 'hsl(176, 100%, 24%)',
            '900': 'hsl(176, 100%, 16%)',
            '950': 'hsl(176, 100%, 10%)',
            DEFAULT: '#00786f'
        },
        'neutral-50': '#e5e7eb',
        'neutral-100': '#6a7282',
        'neutral-200': '#ffffff',
        'neutral-300': '#4a5565',
        'neutral-400': '#99a1af',
        background: '#0b1220',
        foreground: '#ffffff'
    },
    fontFamily: {
        sans: [
            'Inter',
            'sans-serif'
        ]
    },
    fontSize: {
        '10': [
            '10px',
            {
                lineHeight: '15px'
            }
        ],
        '11': [
            '11px',
            {
                lineHeight: '16.5px'
            }
        ],
        '12': [
            '12px',
            {
                lineHeight: '16px'
            }
        ],
        '14': [
            '14px',
            {
                lineHeight: '20px',
                letterSpacing: '-0.35px'
            }
        ],
        '16': [
            '16px',
            {
                lineHeight: '24px'
            }
        ],
        '24': [
            '24px',
            {
                lineHeight: '32px'
            }
        ]
    },
    spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '10': '40px',
        '16': '64px'
    },
    borderRadius: {
        lg: '12px',
        xl: '24px'
    },
    boxShadow: {
        xs: 'rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.378 -0.0755699 0.0147714 / 0.4) 0px 10px 15px -3px, oklab(0.378 -0.0755699 0.0147714 / 0.4) 0px 4px 6px -4px',
        sm: 'rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0 0 0 / 0.5) 0px 25px 50px -12px'
    },
    transitionDuration: {
        '150': '0.15s'
    },
    transitionTimingFunction: {
        custom: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    container: {
        center: true,
        padding: '0px'
    },
    maxWidth: {
        container: '100%'
    }
},
  },
};
