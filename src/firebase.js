import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, updateDoc, deleteDoc, getDocs, writeBatch, where, query} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDdc6Os8Y3vBCTO-HGlmTZJtoW9c8fHyZI",
  authDomain: "teammanagementbackend.firebaseapp.com",
  projectId: "teammanagementbackend",
  storageBucket: "teammanagementbackend.appspot.com",
  messagingSenderId: "598169755135",
  appId: "1:598169755135:web:477187053f9e199521dbca"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// Fetch data from a specific Firestore collection
export const fetchData = async (collectionName) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Update a document in a specific Firestore collection
export const updateDocument = async (collectionName, docId, data) => {
  await updateDoc(doc(db, collectionName, docId), data);
};

// Delete a document from a specific Firestore collection
export const deleteDocument = async (collectionName, docId) => {
  await deleteDoc(doc(db, collectionName, docId));
};

// Fetch user details from Firestore
export const fetchUserDetails = async (userIds) => {
  const usersCollection = collection(db, 'users');
  const userDocs = await Promise.all(userIds.map(userId => getDoc(doc(usersCollection, userId))));
  
  return userDocs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const deleteProjectAndTasks = async (projectId) => {
  const batch = writeBatch(db);

  // Delete the project document
  const projectRef = doc(db, 'projects', projectId);
  batch.delete(projectRef);

  // Query for all tasks associated with the project
  const taskQuery = query(collection(db, 'tasks'), where('projectId', '==', projectId));
  const taskSnapshot = await getDocs(taskQuery);

  for (const taskDoc of taskSnapshot.docs) {
    // Delete each task document
    const taskRef = taskDoc.ref;
    batch.delete(taskRef);

    // Query for all comments associated with the task
    const commentQuery = query(collection(db, 'comments'), where('taskId', '==', taskDoc.id));
    const commentSnapshot = await getDocs(commentQuery);

    // Delete each comment document
    commentSnapshot.forEach((commentDoc) => {
      batch.delete(commentDoc.ref);
    });
  }

  // Commit the batch operation
  await batch.commit();
};
