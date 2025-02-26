import React, { useState, useEffect } from "react";
import { 
  StyleSheet, Text, View, TouchableOpacity, useColorScheme 
} from "react-native";
import { Accelerometer } from "expo-sensors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";

import sittingAnimation from "./assets/sitting.json";
import walkingAnimation from "./assets/walking.json";

export default function App() {
  const systemTheme = useColorScheme(); // Detect system theme
  const [theme, setTheme] = useState<string>(systemTheme || "light");

  const [steps, setSteps] = useState<number>(0);
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [lastY, setLastY] = useState<number>(0);
  const [lastTimestamp, setLastTimestamp] = useState<number>(0);
  const [status, setStatus] = useState<string>("Sitting");

  // ✅ Load Theme from Storage
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem("theme");
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        setTheme(systemTheme || "light");
      }
    };
    loadTheme();
  }, []);

  // ✅ Toggle Theme & Save to AsyncStorage
  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    await AsyncStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    let subscription: any;

    const subscribe = async () => {
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (isAvailable) {
        subscription = Accelerometer.addListener(({ x, y, z }) => {
          const timestamp = new Date().getTime();
          const accelerationChange = Math.abs(y - lastY);

          const walkingThreshold = 0.3; 
          const runningThreshold = 1.2;

          if (accelerationChange < walkingThreshold) {
            setStatus("Sitting");
          } else if (accelerationChange >= walkingThreshold && accelerationChange < runningThreshold) {
            setStatus("Walking");
          } else {
            setStatus("Running");
          }

          if (accelerationChange > walkingThreshold && !isCounting && timestamp - lastTimestamp > 600) {
            setIsCounting(true);
            setLastY(y);
            setLastTimestamp(timestamp);
            setSteps((prevSteps) => prevSteps + 1);

            setTimeout(() => {
              setIsCounting(false);
            }, 1000);
          }
        });
      } else {
        console.log("Accelerometer is not available");
      }
    };

    subscribe();
    return () => subscription && subscription.remove();
  }, [lastY, lastTimestamp, isCounting]);

  // ✅ Reset Function
  const resetSteps = () => {
    setSteps(0);
    setLastY(0);
    setLastTimestamp(0);
    setIsCounting(false);
    setStatus("Sitting");
  };

  return (
    <View style={[styles.container, theme === "dark" ? styles.darkBackground : styles.lightBackground]}>
      <Text style={[styles.title, theme === "dark" ? styles.darkText : styles.lightText]}>
        Step Counter
      </Text>
      <Text style={[styles.stepCount, theme === "dark" ? styles.darkText : styles.lightText]}>
        Steps: {steps}
      </Text>

      {/* ✅ Show Different Animations Based on Status */}
      {status === "Sitting" && <LottieView source={sittingAnimation} autoPlay loop style={styles.animation} />}
      {status === "Walking" && <LottieView source={walkingAnimation} autoPlay loop style={styles.animation} />}

      <Text style={[styles.status, theme === "dark" ? styles.darkText : styles.lightText]}>
        Status: {status}
      </Text>

      <TouchableOpacity style={[styles.button, theme === "dark" ? styles.darkButton : styles.lightButton]} onPress={resetSteps}>
        <Text style={styles.buttonText}>Reset Steps</Text>
      </TouchableOpacity>

      {/* ✅ Theme Toggle Button */}
      <TouchableOpacity style={[styles.button, theme === "dark" ? styles.darkButton : styles.lightButton]} onPress={toggleTheme}>
        <Text style={styles.buttonText}>Switch to {theme === "light" ? "Dark" : "Light"} Mode</Text>
      </TouchableOpacity>
    </View>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  stepCount: {
    fontSize: 20,
    marginBottom: 10,
  },
  status: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: "600",
  },
  animation: {
    width: 200,
    height: 200,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    color: "white",
  },

  // ✅ Light Theme Styles
  lightBackground: {
    backgroundColor: "#f5f5f5",
  },
  lightText: {
    color: "#000",
  },
  lightButton: {
    backgroundColor: "#007bff",
  },

  // ✅ Dark Theme Styles
  darkBackground: {
    backgroundColor: "#121212",
  },
  darkText: {
    color: "#fff",
  },
  darkButton: {
    backgroundColor: "#444",
  },
});

