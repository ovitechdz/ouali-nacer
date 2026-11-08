// React Theme — extracted from https://ovitech-mvp-4ip1.arcada.app
// Compatible with: Chakra UI, Stitches, Vanilla Extract, or any CSS-in-JS

/**
 * TypeScript type definition for this theme:
 *
 * interface Theme {
 *   colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    neutral50: string;
    neutral100: string;
    neutral200: string;
    neutral300: string;
    neutral400: string;
 *   };
 *   fonts: {
    body: string;
 *   };
 *   fontSizes: {
    '10': string;
    '11': string;
    '12': string;
    '14': string;
    '16': string;
    '24': string;
 *   };
 *   space: {
    '4': string;
    '8': string;
    '12': string;
    '16': string;
    '20': string;
    '24': string;
    '28': string;
    '32': string;
    '40': string;
    '64': string;
 *   };
 *   radii: {
    lg: string;
    xl: string;
 *   };
 *   shadows: {
    lg: string;
    xl: string;
 *   };
 *   states: {
 *     hover: { opacity: number };
 *     focus: { opacity: number };
 *     active: { opacity: number };
 *     disabled: { opacity: number };
 *   };
 * }
 */

export const theme = {
  "colors": {
    "primary": "#00d492",
    "secondary": "#009966",
    "accent": "#00786f",
    "background": "#0b1220",
    "foreground": "#ffffff",
    "neutral50": "#e5e7eb",
    "neutral100": "#6a7282",
    "neutral200": "#ffffff",
    "neutral300": "#4a5565",
    "neutral400": "#99a1af"
  },
  "fonts": {
    "body": "'Inter', sans-serif"
  },
  "fontSizes": {
    "10": "10px",
    "11": "11px",
    "12": "12px",
    "14": "14px",
    "16": "16px",
    "24": "24px"
  },
  "space": {
    "4": "4px",
    "8": "8px",
    "12": "12px",
    "16": "16px",
    "20": "20px",
    "24": "24px",
    "28": "28px",
    "32": "32px",
    "40": "40px",
    "64": "64px"
  },
  "radii": {
    "lg": "12px",
    "xl": "24px"
  },
  "shadows": {
    "lg": "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.378 -0.0755699 0.0147714 / 0.4) 0px 10px 15px -3px, oklab(0.378 -0.0755699 0.0147714 / 0.4) 0px 4px 6px -4px",
    "xl": "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0 0 0 / 0.5) 0px 25px 50px -12px"
  },
  "states": {
    "hover": {
      "opacity": 0.08
    },
    "focus": {
      "opacity": 0.12
    },
    "active": {
      "opacity": 0.16
    },
    "disabled": {
      "opacity": 0.38
    }
  }
};

// MUI v5 theme
export const muiTheme = {
  "palette": {
    "primary": {
      "main": "#00d492",
      "light": "hsl(161, 100%, 57%)",
      "dark": "hsl(161, 100%, 27%)"
    },
    "secondary": {
      "main": "#009966",
      "light": "hsl(160, 100%, 45%)",
      "dark": "hsl(160, 100%, 15%)"
    },
    "background": {
      "default": "#0b1220",
      "paper": "#070d18"
    },
    "text": {
      "primary": "#ffffff",
      "secondary": "#6a7282"
    }
  },
  "typography": {
    "fontFamily": "'Inter', sans-serif",
    "h2": {
      "fontSize": "24px",
      "fontWeight": "400",
      "lineHeight": "32px"
    },
    "body1": {
      "fontSize": "16px",
      "fontWeight": "400",
      "lineHeight": "24px"
    },
    "body2": {
      "fontSize": "10px",
      "fontWeight": "400",
      "lineHeight": "15px"
    }
  },
  "shape": {
    "borderRadius": 12
  },
  "shadows": [
    "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.378 -0.0755699 0.0147714 / 0.4) 0px 10px 15px -3px, oklab(0.378 -0.0755699 0.0147714 / 0.4) 0px 4px 6px -4px",
    "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0 0 0 / 0.5) 0px 25px 50px -12px"
  ]
};

export default theme;
