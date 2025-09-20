import {Dimensions} from "react-native";

const {width, height} = Dimensions.get("window");

export const DEVICE_WIDTH = width;
export const DEVICE_HEIGHT = height;

export const isTablet = width >= 768;
export const isSmallDevice = width < 375;
