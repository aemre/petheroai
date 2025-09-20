import React from "react";
import {createStackNavigator} from "@react-navigation/stack";
import {useSelector} from "react-redux";
import {RootState} from "../store/store";

import SplashScreen from "../screens/SplashScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import PetSpeciesScreen from "../screens/PetSpeciesScreen";
import PetNameScreen from "../screens/PetNameScreen";
import PetAgeScreen from "../screens/PetAgeScreen";
import PetWeightScreen from "../screens/PetWeightScreen";
import TabNavigator from "./TabNavigator";

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  PetSpecies: undefined;
  PetName: undefined;
  PetAge: undefined;
  PetWeight: undefined;
  MainApp: {showPurchaseModal?: boolean} | undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const {isAuthenticated, isLoading} = useSelector(
    (state: RootState) => state.auth
  );
  const {onboardingCompleted, onboardingStatusLoading} = useSelector(
    (state: RootState) => state.user
  );

  if (isLoading || onboardingStatusLoading) {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: {backgroundColor: "#fff"},
      }}
    >
      {isAuthenticated ? (
        <>
          {!onboardingCompleted ? (
            <>
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen name="PetSpecies" component={PetSpeciesScreen} />
              <Stack.Screen name="PetName" component={PetNameScreen} />
              <Stack.Screen name="PetAge" component={PetAgeScreen} />
              <Stack.Screen name="PetWeight" component={PetWeightScreen} />
            </>
          ) : (
            <Stack.Screen name="MainApp" component={TabNavigator} />
          )}
        </>
      ) : (
        <Stack.Screen name="Splash" component={SplashScreen} />
      )}
    </Stack.Navigator>
  );
}
