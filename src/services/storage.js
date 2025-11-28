import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "./firebase";

const storage = getStorage(app);

export const uploadFile = async (file, path) => {
    if (!file) return null;

    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    try {
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        return {
            name: file.name,
            type: file.type,
            url: url
        };
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};
