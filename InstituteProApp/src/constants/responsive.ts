import { responsiveHeight, responsiveWidth, responsiveFontSize } from 'react-native-responsive-dimensions';

export const rh = (percentage: number) => responsiveHeight(percentage);
export const rw = (percentage: number) => responsiveWidth(percentage);
export const rf = (fontSize: number) => responsiveFontSize(fontSize);
