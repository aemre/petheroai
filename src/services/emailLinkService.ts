import auth from "@react-native-firebase/auth";
import {Linking} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export class EmailLinkService {
  private static STORAGE_KEY = "emailForSignIn";

  /**
   * Send email link for anonymous account linking
   */
  static async sendEmailLink(email: string): Promise<void> {
    try {
      const actionCodeSettings = {
        // Use localhost for development - Firebase accepts this
        url: "https://localhost/emaillink?mode=verify",
        // This must be true
        handleCodeInApp: true,
        iOS: {
          bundleId: "com.pethero.ai", // Your actual iOS bundle ID
        },
        android: {
          packageName: "com.petheroai", // Your actual Android package name
          installApp: true,
          minimumVersion: "12",
        },
      };

      await auth().sendSignInLinkToEmail(email, actionCodeSettings);

      // Save the email locally so you can complete sign in on the same device
      await AsyncStorage.setItem(this.STORAGE_KEY, email);

      console.log("Email link sent successfully");
    } catch (error) {
      console.error("Error sending email link:", error);
      throw error;
    }
  }

  /**
   * Complete the email link sign in process
   */
  static async completeEmailLinkSignIn(emailLink: string): Promise<void> {
    try {
      // Confirm the link is a sign-in with email link.
      if (auth().isSignInWithEmailLink(emailLink)) {
        // Get the email if available. This should be available if the user completes
        // the flow on the same device where they started it.
        let email = await AsyncStorage.getItem(this.STORAGE_KEY);

        if (!email) {
          // User opened the link on a different device. To prevent session fixation
          // attacks, ask the user to provide the associated email again.
          throw new Error(
            "Please provide your email address to complete the sign-in process."
          );
        }

        // The client SDK will parse the code from the link for you.
        const result = await auth().signInWithEmailLink(email, emailLink);

        // Clear email from storage.
        await AsyncStorage.removeItem(this.STORAGE_KEY);

        console.log("Email link sign in completed:", result.user.email);
      }
    } catch (error) {
      console.error("Error completing email link sign in:", error);
      throw error;
    }
  }

  /**
   * Link anonymous account with email using email link
   */
  static async linkAnonymousAccountWithEmail(email: string): Promise<void> {
    try {
      const user = auth().currentUser;

      if (!user || !user.isAnonymous) {
        throw new Error("No anonymous user found to link");
      }

      const actionCodeSettings = {
        url: "https://localhost/emaillink?mode=link",
        handleCodeInApp: true,
        iOS: {
          bundleId: "com.pethero.ai",
        },
        android: {
          packageName: "com.petheroai",
          installApp: true,
          minimumVersion: "12",
        },
      };

      // Send email link
      await auth().sendSignInLinkToEmail(email, actionCodeSettings);

      // Save email and user ID for linking
      await AsyncStorage.setItem(this.STORAGE_KEY, email);
      await AsyncStorage.setItem("anonymousUserId", user.uid);

      console.log("Email link sent for account linking");
    } catch (error) {
      console.error("Error sending email link for account linking:", error);
      throw error;
    }
  }

  /**
   * Handle deep link from email
   */
  static async handleEmailLink(url: string): Promise<boolean> {
    try {
      if (auth().isSignInWithEmailLink(url)) {
        const email = await AsyncStorage.getItem(this.STORAGE_KEY);
        const anonymousUserId = await AsyncStorage.getItem("anonymousUserId");

        if (!email) {
          throw new Error(
            "Email not found. Please try the linking process again."
          );
        }

        if (anonymousUserId) {
          // This is an account linking flow
          const credential = auth.EmailAuthProvider.credentialWithLink(
            email,
            url
          );
          const currentUser = auth().currentUser;

          if (currentUser && currentUser.isAnonymous) {
            await currentUser.linkWithCredential(credential);
            console.log("Anonymous account linked with email successfully");
          }
        } else {
          // This is a regular sign in
          await auth().signInWithEmailLink(email, url);
          console.log("Signed in with email link successfully");
        }

        // Clean up
        await AsyncStorage.removeItem(this.STORAGE_KEY);
        await AsyncStorage.removeItem("anonymousUserId");

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error handling email link:", error);
      throw error;
    }
  }

  /**
   * Check if user has pending email link
   */
  static async hasPendingEmailLink(): Promise<{email: string} | null> {
    try {
      const email = await AsyncStorage.getItem(this.STORAGE_KEY);
      return email ? {email} : null;
    } catch (error) {
      console.error("Error checking pending email link:", error);
      return null;
    }
  }
}
