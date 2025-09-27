import {moderateVerticalScale} from "../../utils/normalize";
import React, {useState, useRef, useEffect} from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  LayoutChangeEvent,
  Text,
} from "react-native";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import {theme} from "../../theme";

// Fixed constants
const TICK_WIDTH = 20; // Width of each tick mark
const DECIMAL_PLACES = 1; // Number of decimal places to show
const BUFFER_WIDTH = 200; // Width of the buffer space on the left

type PickerType = "kg" | "lb" | "number" | "";

interface WeightPickerProps {
  initialWeight?: number;
  onChange?: (weight: number) => void;
  type?: PickerType;
  min?: number;
  max?: number;
}

// Configure haptic options
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const WeightPicker = ({
  initialWeight = 60.8,
  onChange,
  type = "",
  min = 0,
  max = 150,
}: WeightPickerProps) => {
  // Container width for calculations
  const [containerWidth, setContainerWidth] = useState(0);
  // Current weight
  const [weight, setWeight] = useState(initialWeight);
  // Reference to the scroll view
  const scrollRef = useRef<ScrollView>(null);
  // Flag for initialization
  const [isInitialized, setIsInitialized] = useState(false);
  const lastTick = useRef(Math.floor(initialWeight));

  // Get container width on layout
  const handleLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setContainerWidth(width);
  };

  // Initialize scroll position after container width is known
  useEffect(() => {
    if (containerWidth > 0 && scrollRef.current && !isInitialized) {
      // Center of container
      const centerX = containerWidth / 2;

      // Position for the initialWeight, considering the buffer and half tick adjustment
      // The +TICK_WIDTH/2 ensures we target the center of the tick, not its left edge
      const weightPosition =
        BUFFER_WIDTH + initialWeight * TICK_WIDTH + TICK_WIDTH / 2;

      // Calculate scroll offset to align initialWeight at center
      const initialOffset = weightPosition - centerX;

      // Scroll to position
      scrollRef.current.scrollTo({
        x: initialOffset,
        animated: false,
      });

      setIsInitialized(true);
    }
  }, [containerWidth, initialWeight, isInitialized]);

  const triggerHapticFeedback = (isMajorTick: boolean) => {
    if (isMajorTick) {
      ReactNativeHapticFeedback.trigger("selection", hapticOptions);
    } else {
      ReactNativeHapticFeedback.trigger("impactLight", hapticOptions);
    }
  };

  // Update weight based on scroll position
  const handleScroll = (event: any) => {
    // Only process if we have valid container width
    if (containerWidth === 0) {
      return;
    }

    const offsetX = event.nativeEvent.contentOffset.x;

    // Calculate center position in the scale
    const centerX = containerWidth / 2;
    const centerPositionInScale = offsetX + centerX;

    // Account for left buffer and half tick adjustment
    // The -TICK_WIDTH/2 ensures we get the value at the center of the tick
    const adjustedPosition =
      centerPositionInScale - BUFFER_WIDTH - TICK_WIDTH / 2;

    // Convert position to weight (each tick is TICK_WIDTH wide)
    const calculatedWeight = adjustedPosition / TICK_WIDTH;

    // Round to 1 decimal place
    const roundedWeight = Math.round(calculatedWeight * 10) / 10;

    // Ensure weight is between min and max
    const finalWeight = Math.min(max, Math.max(min, roundedWeight));

    // Check every tick for smoother feedback
    const currentTick = Math.floor(finalWeight);
    if (currentTick !== lastTick.current) {
      const isMajorTick = currentTick % 10 === 0;
      triggerHapticFeedback(isMajorTick);
      lastTick.current = currentTick;
    }

    // Update weight if changed
    if (finalWeight !== weight) {
      setWeight(finalWeight);
      if (onChange) {
        onChange(finalWeight);
      }
    }
  };

  // Create tick marks from min to max
  const renderTicks = () => {
    const ticks = [];

    for (let i = min; i <= max; i++) {
      const isLabeled = i % 5 === 0;
      const isMajor = i % 10 === 0;

      ticks.push(
        <View key={i} style={[styles.tickContainer, {width: TICK_WIDTH}]}>
          <View
            style={[
              styles.tick,
              {
                height: isMajor ? 20 : isLabeled ? 15 : 10,
                opacity: isMajor ? 1 : isLabeled ? 0.8 : 0.5,
              },
            ]}
          />
          {isLabeled && (
            <Text
              style={[
                styles.tickLabel,
                {
                  fontWeight: isMajor ? "bold" : "normal",
                  color: theme.colors.primary[500],
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
      case "kg":
        return `${value.toFixed(DECIMAL_PLACES)} kg`;
      case "lb":
        return `${value.toFixed(DECIMAL_PLACES)} lb`;
      case "number":
        return Math.round(value).toString();
      default:
        return value.toFixed(DECIMAL_PLACES);
    }
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Display current weight */}
      <View style={styles.weightBubble}>
        <Text style={styles.weightText}>{formatValue(weight)}</Text>
      </View>

      {/* Scrollable scale */}
      <View style={styles.scaleContainer}>
        {/* Center indicator line */}
        <View style={styles.indicatorContainer} pointerEvents="none">
          <View style={styles.circleIndicator} />
          <View style={styles.indicator} />
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleScroll}
        >
          {/* Left buffer space */}
          <View style={{width: BUFFER_WIDTH}} />

          {/* The scale with tick marks */}
          <View style={styles.scale}>{renderTicks()}</View>

          {/* Right buffer space */}
          <View style={{width: BUFFER_WIDTH}} />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingBottom: moderateVerticalScale(40),
    width: "100%",
    height: moderateVerticalScale(220),
  },
  weightBubble: {
    width: moderateVerticalScale(220),
    backgroundColor: theme.colors.white,
    borderRadius: moderateVerticalScale(36),
    paddingVertical: moderateVerticalScale(15),
    paddingHorizontal: moderateVerticalScale(20),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginRight: 10,
    minHeight: 80,
    alignSelf: "center",
    borderWidth: 2,
    borderColor: theme.colors.gray[200],
  },
  weightText: {
    fontFamily: "Inter-Regular",
    color: theme.colors.primary[500],
    fontSize: moderateVerticalScale(48),
    fontWeight: "600",
    fontStyle: "normal",
    lineHeight: moderateVerticalScale(48),
  },
  indicatorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
    height: "100%",
    justifyContent: "flex-start",
    paddingTop: moderateVerticalScale(0),
  },
  circleIndicator: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary[500],
    marginBottom: 1,
  },
  indicator: {
    width: 2,
    height: moderateVerticalScale(45),
    backgroundColor: theme.colors.primary[500],
    borderRadius: 1,
  },
  scaleContainer: {
    height: moderateVerticalScale(120),
    width: "100%",
    marginTop: -20,
  },
  scale: {
    flexDirection: "row",
    alignItems: "flex-start",
    height: moderateVerticalScale(120),
    paddingTop: moderateVerticalScale(40),
    paddingBottom: moderateVerticalScale(20),
  },
  tickContainer: {
    alignItems: "center",
  },
  tick: {
    width: 1,
    backgroundColor: theme.colors.primary[300],
  },
  tickLabel: {
    fontSize: moderateVerticalScale(18),
    fontFamily: "Inter-Regular",
    color: theme.colors.gray[600],
    marginTop: moderateVerticalScale(5),
    width: moderateVerticalScale(50),
    textAlign: "center",
    fontWeight: "500",
    lineHeight: moderateVerticalScale(22),
    minHeight: moderateVerticalScale(25),
  },
});

export default WeightPicker;
