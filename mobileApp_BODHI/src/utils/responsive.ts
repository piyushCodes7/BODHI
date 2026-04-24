import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

// 1. GLOBAL RESPONSIVE SYSTEM
// Determine if device is tablet based on min dimension
const minDimension = Math.min(WINDOW_WIDTH, WINDOW_HEIGHT);
export const isTablet = minDimension >= 768;

// Keep them as getters to reflect orientation changes if the component rerenders 
// (or we could use useWindowDimensions hook inside components for pure reactivity,
// but for static styles this will provide the dimension at the time of calculation).
export const screenWidth = () => Dimensions.get('window').width;
export const screenHeight = () => Dimensions.get('window').height;

export const isLandscape = () => {
  const { width, height } = Dimensions.get('window');
  return width > height;
};

// Base guidelines for iPhone 13/14
const baseWidth = 390;
const baseHeight = 844;

export const responsiveWidth = (size: number) => {
  const { width } = Dimensions.get('window');
  return (width / baseWidth) * size;
};

export const responsiveHeight = (size: number) => {
  const { height } = Dimensions.get('window');
  return (height / baseHeight) * size;
};

export const responsiveFont = (size: number) => {
  const { width } = Dimensions.get('window');
  const scale = width / baseWidth;
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
};
