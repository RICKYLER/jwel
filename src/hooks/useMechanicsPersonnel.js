import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Custom hook to fetch mechanics personnel from Firestore
 * @returns {Array} mechanics - Array of { id, name, ... }
 */
export default function useMechanicsPersonnel() {
  const [mechanics, setMechanics] = useState([]);

  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        const q = query(
          collection(db, 'authorizedPersonnel'),
          where('role', '==', 'mechanics personnel')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMechanics(data);
      } catch {
        setMechanics([]);
      }
    };
    fetchMechanics();
  }, []);

  return mechanics;
}
