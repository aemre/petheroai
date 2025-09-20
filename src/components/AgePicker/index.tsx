import {moderateVerticalScale} from "../../utils/normalize";
import React, {useState, useRef, useEffect} from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  LayoutChangeEvent,
  Dimensions,
  Text,
} from "react-native";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import {DEVICE_WIDTH} from "../../utils/dimensions";

// Fixed constants
const TICK_HEIGHT = 20; // Height of each tick mark
const DECIMAL_PLACES = 1; // Number of decimal places to show
const BUFFER_HEIGHT = 200; // Height of the buffer space on the top
const SCREEN_WIDTH = Dimensions.get("window").width;

type PickerType = "cm" | "lb" | "number";

interface AgePickerProps {
  initialHeight?: number;
  onChange?: (height: number) => void;
  type?: PickerType;
  min?: number;
  max?: number;
  useDecimals?: boolean;
}

// Configure haptic options
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const AgePicker = ({
  initialHeight = 170.0,
  onChange,
  type = "cm",
  min = 0,
  max = 250,
  useDecimals = true,
}: AgePickerProps) => {
  // Container height for calculations
  const [containerHeight, setContainerHeight] = useState(0);
  // Current height
  const [height, setHeight] = useState(initialHeight);
  // Reference to the scroll view
  const scrollRef = useRef<ScrollView>(null);
  // Flag for initialization
  const [isInitialized, setIsInitialized] = useState(false);
  const lastTick = useRef(Math.floor(initialHeight));

  // Get container height on layout
  const handleLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    setContainerHeight(height);
  };

  // Initialize scroll position after container height is known
  useEffect(() => {
    if (containerHeight > 0 && scrollRef.current && !isInitialized) {
      // Center of container
      const centerY = containerHeight / 2;

      // Position for the initialHeight, considering the buffer and half tick adjustment
      // The +TICK_HEIGHT/2 ensures we target the center of the tick, not its top edge
      const heightPosition =
        BUFFER_HEIGHT + (max - initialHeight) * TICK_HEIGHT + TICK_HEIGHT / 2;

      // Calculate scroll offset to align initialHeight at center
      const initialOffset = heightPosition - centerY;

      // Scroll to position
      scrollRef.current.scrollTo({
        y: initialOffset,
        animated: false,
      });

      setIsInitialized(true);
    }
  }, [containerHeight, initialHeight, isInitialized, max]);

  const triggerHapticFeedback = (isMajorTick: boolean) => {
    if (isMajorTick) {
      ReactNativeHapticFeedback.trigger("selection", hapticOptions);
    } else {
      ReactNativeHapticFeedback.trigger("impactLight", hapticOptions);
    }
  };

  // Update height based on scroll position
  const handleScroll = (event: any) => {
    // Only process if we have valid container height
    if (containerHeight === 0) {
      return;
    }

    const offsetY = event.nativeEvent.contentOffset.y;

    // Calculate center position in the scale
    const centerY = containerHeight / 2;
    const centerPositionInScale = offsetY + centerY;

    // Account for top buffer and half tick adjustment
    // The -TICK_HEIGHT/2 ensures we get the value at the center of the tick
    const adjustedPosition =
      centerPositionInScale - BUFFER_HEIGHT - TICK_HEIGHT / 2;

    // Convert position to height (each tick is TICK_HEIGHT tall)
    // Invert the calculation since taller height is at the top
    const calculatedHeight = max - adjustedPosition / TICK_HEIGHT;

    // Round based on useDecimals flag
    let finalHeight;
    if (useDecimals) {
      // Round to 1 decimal place
      finalHeight = Math.round(calculatedHeight * 10) / 10;
    } else {
      // Round to whole number
      finalHeight = Math.round(calculatedHeight);
    }

    // Ensure height is between min and max
    finalHeight = Math.min(max, Math.max(min, finalHeight));

    // Check every tick for smoother feedback
    const currentTick = Math.floor(finalHeight);
    if (currentTick !== lastTick.current) {
      const isMajorTick = currentTick % 10 === 0;
      triggerHapticFeedback(isMajorTick);
      lastTick.current = currentTick;
    }

    // Update height if changed
    if (finalHeight !== height) {
      setHeight(finalHeight);
      if (onChange) {
        onChange(finalHeight);
      }
    }
  };

  // Create tick marks from min to max (reversed order for vertical display)
  const renderTicks = () => {
    const ticks = [];

    for (let i = max; i >= min; i--) {
      const isLabeled = i % 5 === 0;
      const isMajor = i % 10 === 0;
      // Determine if this tick is above the current height
      const isAboveCurrent = i > height;

      ticks.push(
        <View key={i} style={[styles.tickContainer, {height: TICK_HEIGHT}]}>
          <View style={styles.tickMarkContainer}>
            <View
              style={[
                styles.tick,
                {
                  width: isMajor ? 20 : isLabeled ? 15 : 10,
                  opacity: isMajor ? 1 : isLabeled ? 0.8 : 0.5,
                },
              ]}
            />
          </View>
          {isLabeled && (
            <Text
              style={[
                styles.tickLabel,
                {
                  fontWeight: isMajor ? "bold" : "normal",
                  fontSize: isMajor
                    ? moderateVerticalScale(18)
                    : moderateVerticalScale(14),
                  color: isAboveCurrent ? "#8B5CF6" : "#8B5CF6",
                },
              ]}
            >
              {i}
            </Text>
          )}
        </View>
      );
    }

    return ticks;
  };

  const formatValue = (value: number) => {
    switch (type) {
      case "cm":
        return useDecimals
          ? `${value.toFixed(DECIMAL_PLACES)}`
          : `${Math.round(value)}`;
      case "lb":
        return useDecimals
          ? `${value.toFixed(DECIMAL_PLACES)}`
          : `${Math.round(value)}`;
      case "number":
        return Math.round(value).toString();
      default:
        return useDecimals
          ? value.toFixed(DECIMAL_PLACES)
          : Math.round(value).toString();
    }
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={styles.contentContainer}>
        {/* Display current height */}
        <View style={styles.heightBubble}>
          <Text style={styles.heightText}>{formatValue(height)}</Text>
        </View>

        {/* Scrollable scale */}
        <View style={styles.scaleContainer}>
          {/* Center indicator line */}
          <View style={styles.indicatorContainer} pointerEvents="none">
            <View style={styles.indicatorWrapper}>
              <View style={styles.circleIndicator} />
              <View style={styles.indicator} />
            </View>
          </View>

          <ScrollView
            ref={scrollRef}
            horizontal={false}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleScroll}
          >
            {/* Top buffer space */}
            <View style={{height: BUFFER_HEIGHT}} />

            {/* The scale with tick marks */}
            <View style={styles.scale}>{renderTicks()}</View>

            {/* Bottom buffer space */}
            <View style={{height: BUFFER_HEIGHT}} />
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: DEVICE_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    height: moderateVerticalScale(450),
  },
  contentContainer: {
    flexDirection: "row",
    height: "100%",
    width: "100%",
    justifyContent: "flex-end",
  },
  heightBubble: {
    width: moderateVerticalScale(172),
    backgroundColor: "#FFFFFF",
    borderRadius: moderateVerticalScale(36),
    paddingVertical: moderateVerticalScale(15),
    paddingHorizontal: moderateVerticalScale(20),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginRight: 10,
    minHeight: 80,
    alignSelf: "center",
    marginEnd: moderateVerticalScale(-45),
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  heightText: {
    fontFamily: "Inter-Regular",
    color: "#8B5CF6",
    fontSize: moderateVerticalScale(48),
    fontWeight: "600",
    fontStyle: "normal",
    lineHeight: moderateVerticalScale(48),
  },
  indicatorContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
    width: "100%",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  indicatorWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  circleIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#8B5CF6",
    marginRight: 1,
    marginLeft: moderateVerticalScale(40),
  },
  indicator: {
    height: 2,
    width: SCREEN_WIDTH,
    backgroundColor: "#8B5CF6",
    borderRadius: 1,
  },
  scaleContainer: {
    width: moderateVerticalScale(120),
    height: "100%",
    marginLeft: 0,
  },
  scale: {
    flexDirection: "column",
    width: moderateVerticalScale(140),
    paddingLeft: moderateVerticalScale(60),
  },
  tickContainer: {
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  tickMarkContainer: {
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tick: {
    height: 1,
    backgroundColor: "#B794F6",
  },
  tickLabel: {
    color: "#4A5568",
    height: moderateVerticalScale(25),
    width: moderateVerticalScale(50),
    textAlignVertical: "center",
    marginLeft: 12,
    fontFamily: "Inter-Regular",
    fontSize: moderateVerticalScale(18),
    fontWeight: "500",
    lineHeight: moderateVerticalScale(22),
  },
});

export default AgePicker;
