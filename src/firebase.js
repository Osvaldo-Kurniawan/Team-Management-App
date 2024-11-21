// src/Firebase.js
import { initializeApp } from 'firebase/app';

import { 
  getAuth, 
  onAuthStateChanged,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  where, 
  query,  
  orderBy, 
  serverTimestamp,
  doc, 
  addDoc,
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc ,
  writeBatch
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getStorage,
  getDownloadURL 
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA4jvpU6zDzXqvVF0i6eOYTR5noEOkazN0",
  authDomain: "teammanagementbackend-91544.firebaseapp.com",
  projectId: "teammanagementbackend-91544",
  storageBucket: "teammanagementbackend-91544.appspot.com",
  messagingSenderId: "68958152151",
  appId: "1:68958152151:web:1faed9c9eea3013df1d792"
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

export const fetchData = async (collectionName) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

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

  const projectRef = doc(db, 'projects', projectId);
  batch.delete(projectRef);

  const taskQuery = query(collection(db, 'tasks'), where('projectId', '==', projectId));
  const taskSnapshot = await getDocs(taskQuery);

  for (const taskDoc of taskSnapshot.docs) {
    const taskRef = taskDoc.ref;
    batch.delete(taskRef);

    const commentQuery = query(collection(db, 'comments'), where('taskId', '==', taskDoc.id));
    const commentSnapshot = await getDocs(commentQuery);

    commentSnapshot.forEach((commentDoc) => {
      batch.delete(commentDoc.ref);
    });
  }

  await batch.commit();
};

export const addWorkingDays = (date, days) => {
  const result = new Date(date);
  let remainingDays = days;
  
  while (remainingDays > 0) {
    result.setDate(result.getDate() + 1);
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      remainingDays--;
    }
  }
  
  return result;
};

const calculateUserAvailability = async (userId, startDate) => {
  const tasksQuery = query(
    collection(db, 'tasks'),
    where('assignedTo', 'array-contains', userId),
    where('status', '!=', 'completed')
  );

  const tasksDocs = await getDocs(tasksQuery);
  const assignedTasks = tasksDocs.docs.map(doc => ({
    ...doc.data(),
    startDate: new Date(doc.data().startDate),
    deadline: new Date(doc.data().deadline),
    estimatedDuration: parseInt(doc.data().estimatedDuration)
  }));

  assignedTasks.sort((a, b) => a.startDate - b.startDate);

  let currentDate = new Date(startDate);
  let availableSlots = [];
  let previousEndDate = currentDate;

  for (const task of assignedTasks) {
    if (task.startDate > previousEndDate) {
      let workingDays = 0;
      let tempDate = new Date(previousEndDate);
      while (tempDate < task.startDate) {
        if (tempDate.getDay() !== 0 && tempDate.getDay() !== 6) {
          workingDays++;
        }
        tempDate.setDate(tempDate.getDate() + 1);
      }

      availableSlots.push({
        start: previousEndDate,
        end: task.startDate,
        duration: workingDays
      });
    }
    previousEndDate = new Date(Math.max(
      previousEndDate.getTime(),
      task.deadline.getTime()
    ));
  }

  availableSlots.push({
    start: previousEndDate,
    end: addWorkingDays(previousEndDate, 60),
    duration: 60
  });

  return availableSlots;
};

export const findBestTaskSlot = async (task, projectId) => {
  const membersQuery = query(
    collection(db, 'projectMembers'),
    where('projectId', '==', projectId)
  );
  const membersDocs = await getDocs(membersQuery);
  const projectMembers = membersDocs.docs.map(doc => ({
    ...doc.data(),
    userId: doc.data().userId
  }));

  const taskDuration = parseInt(task.estimatedDuration);
  const originalDeadline = new Date(task.deadline);
  let bestAssignment = null;
  let lowestWorkload = Infinity;

  const assignedWorkloads = {};
  projectMembers.forEach(member => {
    assignedWorkloads[member.userId] = 0;
  });

  for (const member of projectMembers) {
    const availableSlots = await calculateUserAvailability(
      member.userId,
      new Date()
    );

    for (const slot of availableSlots) {
      if (slot.duration >= taskDuration) {
        const proposedEndDate = addWorkingDays(slot.start, taskDuration);

        if (proposedEndDate <= originalDeadline) {
          const totalWorkload = (assignedWorkloads[member.userId] || 0) + taskDuration;

          if (totalWorkload < lowestWorkload) {
            lowestWorkload = totalWorkload;
            bestAssignment = {
              userId: member.userId,
              startDate: slot.start,
              endDate: proposedEndDate,
              workload: totalWorkload
            };
          }
        }
      }
    }
  }

  return bestAssignment;
};

export const autoAssignTasks = async (tasks, projectId) => {
  const assignedTasks = [];
  const unassignableTasks = [];

  for (const task of tasks) {
    const assignment = await findBestTaskSlot(task, projectId);

    if (assignment) {
      const taskData = {
        name: task.name,
        description: task.description,
        projectId,
        assignedTo: [assignment.userId],
        startDate: assignment.startDate.toISOString(),
        deadline: assignment.endDate.toISOString(),
        estimatedDuration: parseInt(task.estimatedDuration),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      assignedTasks.push({
        ...taskData,
        id: docRef.id
      });
    } else {
      unassignableTasks.push(task);
    }
  }

  return { assignedTasks, unassignableTasks };
};

// Fungsi baru untuk mengambil komentar berdasarkan taskId
export const fetchComments = async (taskId) => {
  const commentsQuery = query(
    collection(db, 'comments'),
    where('taskId', '==', taskId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(commentsQuery);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
  }));
};

// Fungsi baru untuk menambah komentar
export const addComment = async (taskId, content, userId) => {
  return await addDoc(collection(db, 'comments'), {
    taskId: taskId,
    content: content,
    createdAt: serverTimestamp(),
    userId: userId
  });
};

// Fungsi baru untuk mengambil pengguna yang membuat komentar
export const fetchCommentUsers = async (comments) => {
  const userIds = [...new Set(comments.map(comment => comment.userId))];
  const userDataPromises = userIds.map(userId => getDoc(doc(db, 'users', userId)));
  const userSnapshots = await Promise.all(userDataPromises);
  
  return userSnapshots.reduce((acc, snapshot) => {
    if (snapshot.exists()) {
      acc[snapshot.id] = snapshot.data();
    }
    return acc;
  }, {});
};

// Fungsi utilitas untuk format tanggal
export const formatCommentDate = (date) => {
  if (!date) return 'Unknown date';
  
  const now = new Date();
  const commentDate = new Date(date);
  
  if (
    commentDate.getDate() === now.getDate() &&
    commentDate.getMonth() === now.getMonth() &&
    commentDate.getFullYear() === now.getFullYear()
  ) {
    return commentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return commentDate.toLocaleDateString();
  }
};

export const fetchAllUsers = async () => {
  const usersCollection = await getDocs(collection(db, 'users'));
  return usersCollection.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const createProject = async (projectName, selectedMembers) => {
  try {
    // Create project document
    const projectRef = await addDoc(collection(db, 'projects'), {
      name: projectName,
      createdAt: new Date()
    });

    // Add project members
    const projectMembersRef = collection(db, 'projectMembers');
    await Promise.all(selectedMembers.map(memberId => 
      addDoc(projectMembersRef, {
        projectId: projectRef.id,
        userId: memberId,
        role: 'member',
        joinedAt: new Date()
      })
    ));

    return { 
      id: projectRef.id, 
      name: projectName,
      members: selectedMembers 
    };
  } catch (error) {
    console.error("Error adding project: ", error);
    throw error;
  }
};

export const fetchProjectMembers = async (projectId) => {
  const membersQuery = query(
    collection(db, 'projectMembers'),
    where('projectId', '==', projectId)
  );
  const membersDocs = await getDocs(membersQuery);
  
  if (membersDocs.empty) {
    return [];
  }

  const memberPromises = membersDocs.docs.map(async (memberDoc) => {
    const userId = memberDoc.data().userId;
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    }
    return null;
  });

  const members = await Promise.all(memberPromises);
  return members.filter(member => member !== null);
};

export const createTask = async (taskData) => {
  try {
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...taskData,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    
    return {
      id: docRef.id,
      ...taskData
    };
  } catch (error) {
    console.error("Error adding task: ", error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateDoc(doc(db, 'users', user.uid), {
      online: true
    });

    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const signupUser = async (userData) => {
  const { 
    email, 
    password, 
    username, 
    avatar 
  } = userData;

  try {
    // Create user authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Base user data
    const baseUserData = {
      username,
      email,
      avatarURL: '', 
      createdAt: new Date().toISOString(),
      online: true
    };

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), baseUserData);

    // Handle avatar upload if present
    if (avatar) {
      const avatarRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(avatarRef, avatar);
      const avatarURL = await getDownloadURL(avatarRef);

      // Update user document with avatar URL
      await setDoc(
        doc(db, 'users', user.uid), 
        { avatarURL }, 
        { merge: true }
      );

      return { 
        ...user, 
        avatarURL 
      };
    }

    return user;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const fetchUserProjects = async (currentUser, allProjects) => {
  if (!currentUser) return [];

  const membershipQuery = query(
    collection(db, 'projectMembers'),
    where('userId', '==', currentUser.uid)
  );
  
  const membershipDocs = await getDocs(membershipQuery);
  const projectIds = membershipDocs.docs.map(doc => doc.data().projectId);
  
  return allProjects.filter(project => 
    projectIds.includes(project.id)
  );
};

export const setUserOnlineStatus = async (user, status) => {
  if (user) {
    await updateDoc(doc(db, 'users', user.uid), {
      online: status
    });
  }
};