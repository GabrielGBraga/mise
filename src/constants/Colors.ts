import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const LightScheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#006C4C', // Deep Green
    onPrimary: '#FFFFFF',
    primaryContainer: '#89F8C7',
    onPrimaryContainer: '#002114',
    secondary: '#4C6358',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#CEE9DA',
    onSecondaryContainer: '#092017',
    tertiary: '#3E6373',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#E9E7EC', // Correct this manually if needed
    onTertiaryContainer: '#1F1F1F',
  },
};

export const DarkScheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#6CDDAF',
    onPrimary: '#003826',
    primaryContainer: '#005138',
    onPrimaryContainer: '#89F8C7',
    secondary: '#B3CCBE',
    onSecondary: '#1E352B',
    secondaryContainer: '#354B41',
    onSecondaryContainer: '#CEE9DA',
    tertiary: '#A6CCDF',
  },
};
