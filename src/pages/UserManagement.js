import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth, db, ref, set, onValue, remove, update, createUserWithEmailAndPassword } from '../services/firebase';
import '../assets/styles/UserManage.css';

function UserManagement() {
  const { currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [editUser, setEditUser] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) {
      setError('Access denied. Admin privileges required.');
      return;
    }

    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        const data = snapshot.val();
        const usersArray = data
          ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
          : [];
        setUsers(usersArray);
      },
      (err) => {
        setError(`Error fetching users: ${err.message}`);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  // Animate user count
  useEffect(() => {
    let start = displayedCount;
    const end = users.length;
    if (start === end) return;

    const duration = 500; // Animation duration in ms
    const increment = end > start ? 1 : -1;
    const steps = Math.abs(end - start);
    const stepTime = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setDisplayedCount(start + currentStep * increment);
      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayedCount(end);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [users.length, displayedCount]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      setError('Name, email, and password are required');
      return;
    }
    if (newUser.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
      const uid = userCredential.user.uid;

      const userRef = ref(db, `users/${uid}`);
      await set(userRef, {
        name: newUser.name,
        email: newUser.email,
        role: 'user',
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
      });

      setNewUser({ name: '', email: '', password: '' });
      setShowAddForm(false);
      setError('');
    } catch (err) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('This email is already in use');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/weak-password':
          setError('Password is too weak');
          break;
        default:
          setError(`Error adding user: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser.name.trim() || !editUser.email.trim()) {
      setError('Name and email are required');
      return;
    }

    setIsLoading(true);
    try {
      const userRef = ref(db, `users/${editUser.id}`);
      await update(userRef, {
        name: editUser.name,
        email: editUser.email,
        updatedAt: new Date().toISOString(),
      });
      setEditUser(null);
      setError('');
    } catch (err) {
      setError(`Error updating user: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    setIsLoading(true);
    try {
      const userRef = ref(db, `users/${id}`);
      await remove(userRef);
      setError('');
    } catch (err) {
      setError(`Error deleting user: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
    setError('');
    setNewUser({ name: '', email: '', password: '' });
  };

  if (!isAdmin) {
    return (
      <div className="container">
        <h1 className="title">Access Denied</h1>
        <p className="error-message">You do not have admin privileges to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="title">User Management</h1>
      <button className="add-button" onClick={toggleAddForm}>Add User</button>
      <p className="total-users">
        Total Users: <span className="count">{displayedCount}</span>
      </p>
      {error && <p className="error-message">{error}</p>}

      <div className="table-wrapper">
        <h2 className="table-title">Users</h2>
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} className={`user-row ${index % 2 === 0 ? 'row-even' : 'row-odd'}`}>
                {editUser && editUser.id === user.id ? (
                  <td colSpan="4">
                    <form className="edit-form" onSubmit={handleUpdateUser}>
                      <input
                        type="text"
                        value={editUser.name}
                        onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                        className="input"
                        disabled={isLoading}
                      />
                      <input
                        type="email"
                        value={editUser.email}
                        onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                        className="input"
                        disabled={isLoading}
                      />
                      <div className="action-buttons">
                        <button type="submit" className="button save-button" disabled={isLoading}>
                          {isLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditUser(null)}
                          className="button cancel-button"
                          disabled={isLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </td>
                ) : (
                  <>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td className="capitalize">{user.role || 'user'}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => setEditUser(user)}
                          className="button edit-button"
                          disabled={isLoading}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="button delete-button"
                          disabled={isLoading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddForm && (
        <div className="modal-overlay" onClick={toggleAddForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add New User</h2>
            <form className="modal-form" onSubmit={handleAddUser}>
              <input
                type="text"
                placeholder="Name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="input"
                disabled={isLoading}
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="input"
                disabled={isLoading}
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="input"
                disabled={isLoading}
              />
              <div className="modal-buttons">
                <button type="submit" className="button submit-button" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add User'}
                </button>
                <button
                  type="button"
                  className="button cancel-button"
                  onClick={toggleAddForm}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;