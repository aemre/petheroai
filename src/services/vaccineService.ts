import firestore from "@react-native-firebase/firestore";
import {VaccineRecord, VaccineFormData} from "../types/vaccine";

const COLLECTION_NAME = "vaccines";

export class VaccineService {
  static async createVaccine(
    userId: string,
    vaccineData: VaccineFormData
  ): Promise<string> {
    try {
      const now = new Date().toISOString();
      const vaccineRecord: Omit<VaccineRecord, "id"> = {
        userId,
        petName: vaccineData.petName,
        vaccineName: vaccineData.vaccineName,
        vaccineType: vaccineData.vaccineType,
        administeredDate: vaccineData.administeredDate.toISOString(),
        nextDueDate: vaccineData.nextDueDate?.toISOString() || null,
        veterinarianName: vaccineData.veterinarianName,
        clinicName: vaccineData.clinicName,
        batchNumber: vaccineData.batchNumber || null,
        notes: vaccineData.notes || null,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await firestore()
        .collection(COLLECTION_NAME)
        .add(vaccineRecord);
      console.log("Vaccine created with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating vaccine:", error);
      throw new Error("Failed to create vaccine record");
    }
  }

  static async updateVaccine(
    vaccineId: string,
    vaccineData: Partial<VaccineFormData>
  ): Promise<void> {
    try {
      const updateData: Partial<VaccineRecord> = {
        ...vaccineData,
        administeredDate: vaccineData.administeredDate?.toISOString(),
        nextDueDate: vaccineData.nextDueDate?.toISOString() || null,
        updatedAt: new Date().toISOString(),
      };

      // Remove undefined values, but keep null values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key as keyof VaccineRecord] === undefined) {
          delete updateData[key as keyof VaccineRecord];
        }
      });

      // Ensure optional fields are properly handled
      if (vaccineData.batchNumber !== undefined) {
        updateData.batchNumber = vaccineData.batchNumber || null;
      }
      if (vaccineData.notes !== undefined) {
        updateData.notes = vaccineData.notes || null;
      }

      await firestore()
        .collection(COLLECTION_NAME)
        .doc(vaccineId)
        .update(updateData);
      console.log("Vaccine updated:", vaccineId);
    } catch (error) {
      console.error("Error updating vaccine:", error);
      throw new Error("Failed to update vaccine record");
    }
  }

  static async deleteVaccine(vaccineId: string): Promise<void> {
    try {
      await firestore().collection(COLLECTION_NAME).doc(vaccineId).delete();
      console.log("Vaccine deleted:", vaccineId);
    } catch (error) {
      console.error("Error deleting vaccine:", error);
      throw new Error("Failed to delete vaccine record");
    }
  }

  static async getUserVaccines(userId: string): Promise<VaccineRecord[]> {
    try {
      // First try the optimized query with index
      try {
        const querySnapshot = await firestore()
          .collection(COLLECTION_NAME)
          .where("userId", "==", userId)
          .orderBy("administeredDate", "desc")
          .get();

        const vaccines: VaccineRecord[] = [];

        querySnapshot.forEach((doc) => {
          vaccines.push({
            id: doc.id,
            ...doc.data(),
          } as VaccineRecord);
        });

        console.log(
          `Retrieved ${vaccines.length} vaccine records for user (with index):`,
          userId
        );
        return vaccines;
      } catch (indexError) {
        console.log("Index not ready yet, falling back to simple query...");

        // Fallback: Simple query without orderBy (sort in memory)
        const querySnapshot = await firestore()
          .collection(COLLECTION_NAME)
          .where("userId", "==", userId)
          .get();

        const vaccines: VaccineRecord[] = [];

        querySnapshot.forEach((doc) => {
          vaccines.push({
            id: doc.id,
            ...doc.data(),
          } as VaccineRecord);
        });

        // Sort in memory by administeredDate (desc)
        vaccines.sort(
          (a, b) =>
            new Date(b.administeredDate).getTime() -
            new Date(a.administeredDate).getTime()
        );

        console.log(
          `Retrieved ${vaccines.length} vaccine records for user (fallback):`,
          userId
        );
        return vaccines;
      }
    } catch (error) {
      console.error("Error getting user vaccines:", error);
      throw new Error("Failed to retrieve vaccine records");
    }
  }

  static async getUpcomingVaccines(userId: string): Promise<VaccineRecord[]> {
    try {
      const allVaccines = await this.getUserVaccines(userId);
      const now = new Date();
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      return allVaccines.filter((vaccine) => {
        if (!vaccine.nextDueDate) return false;
        const dueDate = new Date(vaccine.nextDueDate);
        return dueDate >= now && dueDate <= thirtyDaysFromNow;
      });
    } catch (error) {
      console.error("Error getting upcoming vaccines:", error);
      throw new Error("Failed to retrieve upcoming vaccines");
    }
  }

  static async getVaccinesByPet(
    userId: string,
    petName: string
  ): Promise<VaccineRecord[]> {
    try {
      // First try the optimized query with index
      try {
        const querySnapshot = await firestore()
          .collection(COLLECTION_NAME)
          .where("userId", "==", userId)
          .where("petName", "==", petName)
          .orderBy("administeredDate", "desc")
          .get();

        const vaccines: VaccineRecord[] = [];

        querySnapshot.forEach((doc) => {
          vaccines.push({
            id: doc.id,
            ...doc.data(),
          } as VaccineRecord);
        });

        return vaccines;
      } catch (indexError) {
        console.log(
          "Index not ready yet, falling back to simple query for pet vaccines..."
        );

        // Fallback: Simple query without orderBy (sort in memory)
        const querySnapshot = await firestore()
          .collection(COLLECTION_NAME)
          .where("userId", "==", userId)
          .where("petName", "==", petName)
          .get();

        const vaccines: VaccineRecord[] = [];

        querySnapshot.forEach((doc) => {
          vaccines.push({
            id: doc.id,
            ...doc.data(),
          } as VaccineRecord);
        });

        // Sort in memory by administeredDate (desc)
        vaccines.sort(
          (a, b) =>
            new Date(b.administeredDate).getTime() -
            new Date(a.administeredDate).getTime()
        );

        return vaccines;
      }
    } catch (error) {
      console.error("Error getting vaccines by pet:", error);
      throw new Error("Failed to retrieve pet vaccine records");
    }
  }
}
